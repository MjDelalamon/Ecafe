import { useLocalSearchParams } from "expo-router";
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
  Alert,
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
  price: number;
  image?: string;
};

export default function MenuList() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [wallet, setWallet] = useState(0);
  const [points, setPoints] = useState(0);

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { email } = useLocalSearchParams<{ email: string }>();
  console.log("Received email in MenuList:", email);

  // 🔄 Fetch menu
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "menu"));
        const items: MenuItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            name: data.name,
            description: data.description,
            price: data.price,
            image: data.image,
          });
        });
        setMenuItems(items);
        setFilteredItems(items);
      } catch (error) {
        console.error("Error fetching menu:", error);
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
      }
    };

    fetchCustomer();
  }, [email]);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (text.trim() === "") {
      setFilteredItems(menuItems);
    } else {
      setFilteredItems(
        menuItems.filter((item) =>
          item.name.toLowerCase().includes(text.toLowerCase())
        )
      );
    }
  };

  // 🛒 Open modal with item
  const openModal = (item: MenuItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  // 💳 Handle payment
  const handlePayment = async (method: "wallet" | "points" | "mixed") => {
    if (!email || !selectedItem) {
      Alert.alert("Error", "Missing customer or item data");
      return;
    }

    try {
      const customerRef = doc(db, "customers", email);
      let newWallet = wallet;
      let newPoints = points;

      if (method === "wallet") {
        newWallet -= selectedItem.price;
      } else if (method === "points") {
        newPoints -= selectedItem.price;
      } else if (method === "mixed") {
        let remaining = selectedItem.price;
        if (wallet >= remaining) {
          newWallet -= remaining;
          remaining = 0;
        } else {
          remaining -= wallet;
          newWallet = 0;
          newPoints -= remaining;
          remaining = 0;
        }
      }

      // update in Firestore
      await updateDoc(customerRef, { wallet: newWallet, points: newPoints });

      // log transaction
      await addDoc(collection(db, "customers", email, "transactions"), {
        type:
          method === "wallet"
            ? "Wallet Payment"
            : method === "points"
            ? "Points Payment"
            : "Mixed Payment",
        item: selectedItem.name,
        amount: selectedItem.price,
        date: serverTimestamp(),
      });

      setWallet(newWallet);
      setPoints(newPoints);
      setModalVisible(false);

      Alert.alert("Success", `Paid ₱${selectedItem.price} using ${method}.`);
    } catch (err) {
      console.error("Payment error:", err);
      Alert.alert("Error", "Failed to process payment");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
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

      {/* 📋 Menu List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
            {item.image && (
              <Image source={{ uri: item.image }} style={styles.image} />
            )}
            <View style={styles.cardContent}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc}>{item.description}</Text>
              <Text style={styles.itemPrice}>₱{item.price}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* 🪟 Modal for Payments */}
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
                    style={[
                      styles.payButton,
                      wallet < selectedItem.price && styles.disabledButton,
                    ]}
                    disabled={wallet < selectedItem.price}
                    onPress={() => handlePayment("wallet")}
                  >
                    <Text style={styles.payText}>Pay with Wallet</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.payButton,
                      points < selectedItem.price && styles.disabledButton,
                    ]}
                    disabled={points < selectedItem.price}
                    onPress={() => handlePayment("points")}
                  >
                    <Text style={styles.payText}>Pay with Points</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.payButton,
                      wallet + points < selectedItem.price &&
                        styles.disabledButton,
                    ]}
                    disabled={wallet + points < selectedItem.price}
                    onPress={() => handlePayment("mixed")}
                  >
                    <Text style={styles.payText}>Pay with Wallet + Points</Text>
                  </TouchableOpacity>
                </View>

                {wallet + points < selectedItem.price && (
                  <Text style={styles.notice}>
                    ⚠ Insufficient balance for this item
                  </Text>
                )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fdfcf9",
  },
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
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4e342e",
  },
  itemDesc: {
    fontSize: 14,
    color: "#6d4c41",
    marginVertical: 4,
  },
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4e342e",
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 14,
    color: "#6d4c41",
    textAlign: "center",
    marginBottom: 8,
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#795548",
    marginBottom: 10,
  },
  balanceText: {
    fontSize: 14,
    color: "#4e342e",
    marginBottom: 12,
  },
  buttonGroup: {
    width: "100%",
  },
  payButton: {
    backgroundColor: "#6d4c41",
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  payText: {
    color: "#fff",
    fontWeight: "bold",
  },
  notice: {
    color: "red",
    fontSize: 13,
    marginTop: 8,
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeText: {
    color: "#6d4c41",
    fontWeight: "bold",
  },
});
