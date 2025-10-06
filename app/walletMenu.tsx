import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../Firebase/firebaseConfig";

type MenuItem = {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  image?: string;
  availability: boolean;
};

export default function MenuList() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingModalVisible, setLoadingModalVisible] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error">("success");

  const [search, setSearch] = useState("");
  const [wallet, setWallet] = useState(0);
  const [points, setPoints] = useState(0);

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { email } = useLocalSearchParams<{ email: string }>();

  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // 🔄 Fetch menu
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "menu"));
        const items: MenuItem[] = [];
        const categorySet = new Set<string>();

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            name: data.name,
            description: data.description,
            price: Number(data.price),
            image: data.image,
            availability: data.availability ?? true,
            category: data.category || "Uncategorized",
          });
          categorySet.add(data.category || "Uncategorized");
        });

        setMenuItems(items);
        setFilteredItems(items);
        setCategories(["All", ...Array.from(categorySet)]);
      } catch (error) {
        console.error("Error fetching menu:", error);
        showAlert("Failed to fetch menu", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // 🔄 Fetch customer wallet & points
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!email) return;
      try {
        const customerRef = doc(db, "customers", email);
        const customerSnap = await getDoc(customerRef);
        if (customerSnap.exists()) {
          const data = customerSnap.data();
          setWallet(data.wallet || 0);
          setPoints(data.points || 0);
        }
      } catch (err) {
        console.error("Error fetching customer:", err);
        showAlert("Failed to fetch customer info", "error");
      }
    };

    fetchCustomer();
  }, [email]);

  // 🔔 Alert function
  const showAlert = (message: string, type: "success" | "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  // 🔎 Search filter
  const handleSearch = (text: string) => {
    setSearch(text);
    applyFilters(text, selectedCategory);
  };

  const applyFilters = (searchText: string, category: string) => {
    let items = menuItems;

    if (category !== "All") {
      items = items.filter((item) => item.category === category);
    }

    if (searchText.trim() !== "") {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredItems(items);
  };

  const openModal = (item: MenuItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  // 💳 Place order with wallet deduction + reward points
  const handlePlaceOrder = async (method: "wallet" | "points") => {
    if (!email || !selectedItem) {
      showAlert("Missing customer or item data", "error");
      return;
    }

    try {
      setLoadingModalVisible(true);
      const customerRef = doc(db, "customers", email);
      const customerSnap = await getDoc(customerRef);

      if (!customerSnap.exists()) {
        showAlert("Customer not found", "error");
        return;
      }

      const customerData = customerSnap.data();
      let newWallet = customerData.wallet || 0;
      let newPoints = customerData.points || 0;

      if (method === "wallet") {
        if (newWallet < selectedItem.price) {
          showAlert("Insufficient wallet balance", "error");
          return;
        }

        // 💰 Deduct from wallet
        newWallet -= selectedItem.price;

        // 🎁 Add reward points (+1 point per ₱100)
        const rewardPoints = Math.floor(selectedItem.price / 100);
        newPoints += rewardPoints;

        // 🧾 Add order record
        await addDoc(collection(db, "orders"), {
          customerEmail: email,
          item: selectedItem.name,
          category: selectedItem.category,
          amount: selectedItem.price,
          paymentMethod: "wallet",
          status: "Pending",
          date: serverTimestamp(),
        });

        // 🧭 Update Firestore
        await updateDoc(customerRef, { wallet: newWallet, points: newPoints });

        setWallet(newWallet);
        setPoints(newPoints);

        showAlert(
          `₱${selectedItem.price} deducted from wallet. You earned ${rewardPoints} point(s)! 🎉`,
          "success"
        );
      } else if (method === "points") {
        showAlert("Points redemption not yet implemented.", "error");
      }

      setModalVisible(false);
    } catch (err) {
      console.error("Error placing order:", err);
      showAlert("Failed to place order", "error");
    } finally {
      setLoadingModalVisible(false);
    }
  };

  // 🌀 Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6d4c41" />
        <Text>Loading menu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🏠 Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>⬅</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu</Text>
        <MaterialIcons name="contactless" size={28} color="#4e342e" />
      </View>

      {/* 🔍 Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search menu..."
        value={search}
        onChangeText={handleSearch}
      />

      {/* 🔽 Category Filter */}
      <View style={styles.dropdownContainer}>
        <Picker
          selectedValue={selectedCategory}
          onValueChange={(value) => {
            setSelectedCategory(value);
            applyFilters(search, value);
          }}
          style={styles.dropdown}
        >
          {categories.map((cat) => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>
      </View>

      {/* 📋 Menu List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.availability && styles.unavailableCard]}
            onPress={() => item.availability && openModal(item)}
            disabled={!item.availability}
          >
            {item.image && (
              <Image source={{ uri: item.image }} style={styles.image} />
            )}
            <View style={styles.cardContent}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc}>{item.description}</Text>
              <Text style={styles.itemPrice}>₱{item.price}</Text>
              {!item.availability && (
                <Text style={styles.unavailableText}>Unavailable</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* 🪙 Modal for Payment */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selectedItem && (
              <>
                <Text style={styles.modalTitle}>{selectedItem.name}</Text>
                <Text style={styles.modalDesc}>{selectedItem.description}</Text>
                <Text style={styles.modalPrice}>₱{selectedItem.price}</Text>

                <Text style={styles.balanceText}>Wallet: ₱{wallet}</Text>

                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => handlePlaceOrder("wallet")}
                  >
                    <Text style={styles.payText}>Pay via Wallet</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 🔄 Loading Modal */}
      <Modal transparent={true} visible={loadingModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#6d4c41" />
            <Text style={{ marginTop: 10, color: "#4e342e" }}>
              Processing...
            </Text>
          </View>
        </View>
      </Modal>

      {/* ✅❌ Custom Alert Modal */}
      <Modal transparent={true} visible={alertVisible}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.alertBox,
              alertType === "success" ? styles.successBox : styles.errorBox,
            ]}
          >
            <Text style={styles.alertText}>{alertMessage}</Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setAlertVisible(false)}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: "#fdfcf9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  backArrow: { fontSize: 22, color: "#795548", fontWeight: "bold" },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4e342e",
    flex: 1,
    textAlign: "center",
  },
  searchBar: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  image: { width: 90, height: 90, borderRadius: 12, marginRight: 14 },
  cardContent: { flex: 1, justifyContent: "center" },
  itemName: { fontSize: 17, fontWeight: "bold", color: "#4e342e" },
  itemDesc: { fontSize: 14, color: "#6d4c41", marginVertical: 6 },
  itemPrice: { fontSize: 15, fontWeight: "600", color: "#795548" },
  unavailableCard: { opacity: 0.6, backgroundColor: "#f5f5f5" },
  unavailableText: { color: "red", fontWeight: "bold", marginTop: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    width: "85%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#4e342e" },
  modalDesc: {
    fontSize: 15,
    color: "#6d4c41",
    textAlign: "center",
    marginTop: 6,
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#795548",
    marginTop: 10,
  },
  balanceText: { fontSize: 14, color: "#4e342e", marginBottom: 4 },
  buttonGroup: { width: "100%", marginTop: 10 },
  payButton: {
    backgroundColor: "#6d4c41",
    paddingVertical: 12,
    borderRadius: 25,
    marginVertical: 6,
    alignItems: "center",
  },
  payText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  closeButton: { marginTop: 10 },
  closeText: { color: "#6d4c41", fontWeight: "600" },
  loadingBox: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  alertBox: {
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 16,
    width: "80%",
    alignItems: "center",
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 14,
  },
  dropdown: { height: 50, width: "100%" },
  successBox: { borderLeftWidth: 6, borderLeftColor: "green" },
  errorBox: { borderLeftWidth: 6, borderLeftColor: "red" },
  alertText: { fontSize: 16, textAlign: "center", marginBottom: 12 },
  alertButton: {
    backgroundColor: "#6d4c41",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 25,
  },
  alertButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
