import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
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
  const [instructions, setInstructions] = useState("");

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error">("success");

  const [helpModalVisible, setHelpModalVisible] = useState(false);

  const [search, setSearch] = useState("");
  const [wallet, setWallet] = useState(0);
  const [points, setPoints] = useState(0);

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { email } = useLocalSearchParams<{ email: string }>();

  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

 




const toggleHelpModal = () => setHelpModalVisible(!helpModalVisible);
  





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
 /// 💳 Place order
const handlePlaceOrder = async (method: "wallet" | "points" | "mixed") => {
  if (!email || !selectedItem) {
    showAlert("Missing customer or item data", "error");
    return;
  }

  try {
    setLoadingModalVisible(true);

    // For now qty = 1 (extend UI later to accept quantity)
    const qty = 1;
    const subtotal = selectedItem.price * qty;

    const orderId = `ORD-${Date.now()}`;

    const orderPayload = {
      customerId: email,
      id: orderId,
      subtotal,
      status: "Pending",
      placedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
      items: [
        {
          name: selectedItem.name,
          price: selectedItem.price,
          qty,
          category: selectedItem.category,
        },
      ],
      instructions: instructions.trim() || "No instructions provided",

      // 🟩 default feedback flags
      feedbackGiven: false,
      feedbackSkipped: false,
    };

    await addDoc(collection(db, "orders"), orderPayload);

    setModalVisible(false);
    setInstructions("");

    showAlert(
      `Order placed for ${selectedItem.name}. Waiting for Staff confirmation.`,
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
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#722205ff" />
        </Pressable>
        <Text style={styles.headerTitle}>Available Reward Items</Text>
        <Pressable onPress={toggleHelpModal}>
          <FontAwesome5 name="question-circle" size={20} color="#722205ff" />
        </Pressable>
      </View>

      <Modal
  visible={helpModalVisible}
  transparent
  animationType="fade"
  onRequestClose={toggleHelpModal}
>
  <View style={styles.modalOverlay}>
    <View style={styles.helpModalContent}>
      <Text style={styles.modalTitle}>Order Guidelines</Text>

      <Text style={styles.modalText}>
        Orders can only be processed when you are physically present in the
        store. To avoid delays or cancellations, please make sure you are at the
        branch before placing your order.
      </Text>

      <Text style={styles.modalText}>
        If your order remains unclaimed for more than{" "}
        <Text style={{ fontWeight: "bold" }}>1 hour</Text>, our staff will
        automatically cancel it in the system.
      </Text>

      <Text style={styles.modalText}>
        You can redeem your reward using{" "}
        <Text style={{ fontWeight: "bold" }}>cash or wallet balance</Text> if
        your points are not enough to complete the transaction.
      </Text>

      <TouchableOpacity onPress={toggleHelpModal} style={styles.closeGuideButton}>
        <Text style={styles.closeGuideButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

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
              <Text style={styles.itemPrice}>{item.price} pts.</Text>
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
                <Text style={styles.modalPrice}>{selectedItem.price} pts.</Text>

                <Text style={styles.balanceText}>Points: {points}</Text>

                <TextInput
  style={styles.input}
  placeholder="Add special instructions (optional)"
  value={instructions}
  onChangeText={setInstructions}
  multiline
  numberOfLines={3}
/>


                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => handlePlaceOrder("points")}
                  >
                    <Text style={styles.payText}>Place Order</Text>
                  </TouchableOpacity>
                  <Text style={{ marginTop: 10, color: "#4e342e" }}>
Note: For first time customers, please make sure to read the order processing guide before placing your order.         </Text>
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
  container: {
    flex: 1,
    padding: 18,
    backgroundColor: "#fdfcf9",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 22,
    color: "#795548",
    fontWeight: "bold",
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4e342e",
    flex: 1,
    textAlign: "center",
  },

  // Search bar
  searchBar: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },

  // Cards
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
  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 14,
  },
  cardContent: { flex: 1, justifyContent: "center" },
  itemName: { fontSize: 17, fontWeight: "bold", color: "#4e342e" },
  itemDesc: { fontSize: 14, color: "#6d4c41", marginVertical: 6 },
  itemPrice: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
    color: "#795548",
  },

  input: {
  borderWidth: 1,
  borderColor: "#d7ccc8",
  borderRadius: 12,
  padding: 10,
  width: "100%",
  textAlignVertical: "top",
  marginTop: 12,
  marginBottom: 12,
  backgroundColor: "#f9f9f9",
  color: "#4e342e",
},


  // Modals
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
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
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
    color: "brown",
    marginTop: 10,
  },
  balanceText: { fontSize: 14, color: "#4e342e", marginBottom: 14 },

  // Buttons
  buttonGroup: { width: "100%" },
  payButton: {
    backgroundColor: "#28A745",
    paddingVertical: 12,
    borderRadius: 25,
    marginVertical: 8,
    alignItems: "center",
  },
  payText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  closeButton: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 20,  borderRadius: 20,color: "#fff" },
  closeText: { color: "#421202ff", fontWeight: "bold",fontSize: 16 },

  // Unavailable State
  unavailableCard: { opacity: 0.6, backgroundColor: "#f5f5f5" },
  unavailableText: { color: "red", fontWeight: "bold", marginTop: 6 },

  // Dropdown
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 14,
  },
  dropdown: { height: 50, width: "100%" },

  // Loading Modal
  loadingBox: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },

  // Alert Modal
  alertBox: {
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 16,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  successBox: { borderLeftWidth: 6, borderLeftColor: "green" },
  errorBox: { borderLeftWidth: 6, borderLeftColor: "red" },
  alertText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
    color: "#4e342e",
  },
  alertButton: {
    backgroundColor: "#6d4c41",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 6,
  },
  alertButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
   
  helpModalContent: { backgroundColor: "#fffdf9", borderRadius: 20, width: "80%", padding: 20, alignItems: "center" },
  
  modalText: { fontSize: 14, color: "#5d4037", textAlign: "center" },
  helpModalContent: {
  backgroundColor: "#fffdf9",
  borderRadius: 20,
  width: "85%",
  padding: 24,
  alignItems: "center",
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
},



closeGuideButton: {
  marginTop: 16,
  backgroundColor: "#722205ff",
  paddingVertical: 10,
  paddingHorizontal: 30,
  borderRadius: 25,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 2 },
},

closeGuideButtonText: {
  color: "white",
  fontWeight: "600",
  fontSize: 16,
},

  
});
