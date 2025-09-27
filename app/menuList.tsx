import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
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

  // Alert function
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

  /// 💳 Place order
  const handlePlaceOrder = async (method: "wallet" | "points" | "mixed") => {
    if (!email || !selectedItem) {
      showAlert("Missing customer or item data", "error");
      return;
    }

    try {
      setLoadingModalVisible(true);
      await addDoc(collection(db, "orders"), {
        customerEmail: email,
        item: selectedItem.name,
        category: selectedItem.category,
        amount: selectedItem.price,
        paymentMethod: method,
        status: "Pending",
        date: serverTimestamp(),
      });

      setModalVisible(false);
      showAlert(
        `Order placed for ${selectedItem.name}. Waiting for admin confirmation.`,
        "success"
      );
    } catch (err) {
      console.error("Error placing order:", err);
      showAlert("Failed to place order", "error");
    } finally {
      setLoadingModalVisible(false);
    }
  };

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
      {/* 🔎 Search Bar */}
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

      {/* 🪟 Modal for Payment */}
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

                <Text style={styles.balanceText}>
                  Wallet: ₱{wallet} | Points: {points}
                </Text>

                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => handlePlaceOrder("wallet")}
                  >
                    <Text style={styles.payText}>Pay with Wallet</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => handlePlaceOrder("points")}
                  >
                    <Text style={styles.payText}>Pay with Points</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => handlePlaceOrder("mixed")}
                  >
                    <Text style={styles.payText}>Pay with Wallet + Points</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fdfcf9" },
  searchBar: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  image: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  cardContent: { flex: 1, justifyContent: "center" },
  itemName: { fontSize: 16, fontWeight: "bold", color: "#4e342e" },
  itemDesc: { fontSize: 14, color: "#6d4c41", marginVertical: 4 },
  itemPrice: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    color: "#795548",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: "85%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#4e342e" },
  modalDesc: { fontSize: 14, color: "#6d4c41", textAlign: "center" },
  modalPrice: { fontSize: 18, fontWeight: "bold", color: "#795548" },
  balanceText: { fontSize: 14, color: "#4e342e", marginBottom: 12 },
  buttonGroup: { width: "100%" },
  payButton: {
    backgroundColor: "#6d4c41",
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: "center",
  },
  payText: { color: "#fff", fontWeight: "bold" },
  closeButton: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 16 },
  closeText: { color: "#6d4c41", fontWeight: "bold" },
  unavailableCard: { opacity: 0.5, backgroundColor: "#eee" },
  unavailableText: { color: "red", fontWeight: "bold", marginTop: 4 },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
  },
  dropdown: { height: 50, width: "100%" },

  // Loading Modal
  loadingBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },

  // Alert Modal
  alertBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  successBox: { borderLeftWidth: 6, borderLeftColor: "green" },
  errorBox: { borderLeftWidth: 6, borderLeftColor: "red" },
  alertText: { fontSize: 16, textAlign: "center", marginBottom: 10 },
  alertButton: {
    backgroundColor: "#6d4c41",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  alertButtonText: { color: "#fff", fontWeight: "bold" },
});
