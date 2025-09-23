import { Picker } from "@react-native-picker/picker"; // ✅ import Picker
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../Firebase/firebaseConfig";

type MenuItem = {
  id: string;
  name: string;
  price: string;
  category: string;
  description: string;
  availability: boolean;
};

export default function MenuList() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const menuRef = collection(db, "menu");
        const snapshot = await getDocs(menuRef);
        const items: MenuItem[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<MenuItem, "id">),
        }));
        setMenuItems(items);
        setFilteredItems(items);

        // unique categories
        const uniqueCats = Array.from(
          new Set(items.map((item) => item.category))
        );
        setCategories(["All", ...uniqueCats]);
      } catch (error) {
        console.error("Error fetching menu:", error);
      }
    };

    fetchMenu();
  }, []);

  // filter logic
  useEffect(() => {
    let filtered = [...menuItems];

    if (activeCategory !== "All") {
      filtered = filtered.filter((item) => item.category === activeCategory);
    }

    if (showAvailableOnly) {
      filtered = filtered.filter((item) => item.availability);
    }

    setFilteredItems(filtered);
  }, [activeCategory, showAvailableOnly, menuItems]);

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const renderItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleSelectItem(item)}
      disabled={!item.availability}
    >
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>₱ {item.price}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text
          style={[
            styles.availability,
            { color: item.availability ? "green" : "red" },
          ]}
        >
          {item.availability ? "Available" : "Not Available"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Dropdown for category filter */}
      <View style={styles.dropdownContainer}>
        <Text style={styles.filterLabel}>Category:</Text>
        <Picker
          selectedValue={activeCategory}
          onValueChange={(value) => setActiveCategory(value)}
          style={styles.dropdown}
        >
          {categories.map((cat) => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>
      </View>

      {/* Availability toggle */}
      <TouchableOpacity
        style={[styles.filterButton, showAvailableOnly && styles.filterActive]}
        onPress={() => setShowAvailableOnly(!showAvailableOnly)}
      >
        <Text
          style={[
            styles.filterText,
            showAvailableOnly && styles.filterTextActive,
          ]}
        >
          Available Only
        </Text>
      </TouchableOpacity>

      {/* Menu List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Payment Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedItem && (
              <>
                <Text style={styles.modalTitle}>{selectedItem.name}</Text>
                <Text style={styles.modalPrice}>₱ {selectedItem.price}</Text>
                <Text style={styles.modalDesc}>{selectedItem.description}</Text>

                <View style={styles.paymentOptions}>
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => alert("Pay with Points")}
                  >
                    <Text style={styles.payText}>Pay with Points</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => alert("Pay with Wallet")}
                  >
                    <Text style={styles.payText}>Pay with Wallet</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowModal(false)}
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
    backgroundColor: "#fdfcf9",
    padding: 16,
  },
  dropdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#4e342e",
    borderRadius: 12,
    backgroundColor: "#fdfcf9",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginRight: 8,
    color: "#4e342e",
  },
  dropdown: {
    flex: 1,
    color: "#4e342e",
    fontSize: 15,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#ddddddff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: "bold", color: "#3e2723" },
  price: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4e342e",
    marginVertical: 4,
  },
  category: { fontSize: 14, color: "#6d4c41" },
  description: { fontSize: 12, color: "#888", marginVertical: 4 },
  availability: { fontSize: 12, fontWeight: "600" },
  filterButton: {
    backgroundColor: "#eee",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  filterActive: { backgroundColor: "#4e342e" },
  filterText: { fontSize: 13, color: "#4e342e", fontWeight: "500" },
  filterTextActive: { color: "#fff", fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3e2723",
    marginBottom: 8,
  },
  modalPrice: { fontSize: 18, color: "#4e342e", marginBottom: 8 },
  modalDesc: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  paymentOptions: { flexDirection: "row", justifyContent: "space-between" },
  payButton: {
    backgroundColor: "#4e342e",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  payText: { color: "#fff", fontWeight: "600" },
  closeButton: { marginTop: 20 },
  closeText: { color: "#4e342e", fontWeight: "600", fontSize: 14 },
});
