import { useLocalSearchParams } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { db } from "../Firebase/firebaseConfig";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  subtotal: number;
};

type Order = {
  id: string;
  items: OrderItem[];
  subtotal: number;
  status: string;
  placedAt: string;
};

export default function Orders() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!email) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, "orders"),
          where("customerId", "==", email)
        );
        const snap = await getDocs(q);

        const fetchedOrders: Order[] = snap.docs.map((docSnap) => {
          const d = docSnap.data() as any;
          return {
            id: docSnap.id,
            items: d.items || [],
            subtotal: d.subtotal || 0,
            status: d.status || "Pending",
            placedAt: d.placedAt || "",
          };
        });

        setOrders(fetchedOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [email]);

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Orders</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6d4c41" />
      ) : orders.length === 0 ? (
        <Text style={styles.noOrders}>No orders found</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.orderCard}
              onPress={() => openOrderDetails(item)}
            >
              <Text style={styles.itemTitle}>Order ID: {item.id}</Text>
              <Text style={styles.status}>
                Status:{" "}
                <Text
                  style={{
                    color:
                      item.status === "Completed"
                        ? "#388e3c"
                        : item.status === "Canceled"
                        ? "#d32f2f"
                        : "#f9a825",
                    fontWeight: "bold",
                  }}
                >
                  {item.status}
                </Text>
              </Text>
              <Text style={styles.date}>
                Date: {new Date(item.placedAt).toLocaleString()}
              </Text>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>₱{item.subtotal}</Text>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* ✅ Modal for Order Details */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <Text style={styles.modalTitle}>Order Details</Text>
                <Text style={styles.modalLabel}>Order ID:</Text>
                <Text style={styles.modalText}>{selectedOrder.id}</Text>

                <Text style={styles.modalLabel}>Date Placed:</Text>
                <Text style={styles.modalText}>
                  {new Date(selectedOrder.placedAt).toLocaleString()}
                </Text>

                <Text style={styles.modalLabel}>Status:</Text>
                <Text style={styles.modalText}>{selectedOrder.status}</Text>

                <View style={styles.modalDivider} />

                <Text style={styles.modalLabel}>Items:</Text>
                {selectedOrder.items.map((i) => (
                  <View key={i.id} style={styles.modalItemRow}>
                    <Text style={styles.modalItemName}>
                      {i.name} × {i.qty}
                    </Text>
                    <Text style={styles.modalItemPrice}>{selectedOrder.subtotal} pts.</Text>
                  </View>
                ))}

                <View style={styles.modalDivider} />

                <View style={styles.modalTotalRow}>
                  <Text style={styles.modalTotalLabel}>Total:</Text>
                  <Text style={styles.modalTotalValue}>
                    {selectedOrder.subtotal} pts.
                  </Text>
                </View>

                <Pressable style={styles.closeButton} onPress={closeModal}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 🪶 Styling (matches your beige-brown cafe aesthetic)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#fdfaf6",
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4e342e",
    textAlign: "center",
    marginBottom: 20,
  },
  noOrders: {
    textAlign: "center",
    fontSize: 16,
    color: "#8d6e63",
    marginTop: 30,
  },
  orderCard: {
    backgroundColor: "#fffaf4ff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: "#8d5937ff",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3e2723",
    marginBottom: 5,
  },
  status: {
    fontSize: 14,
    color: "#6d4c41",
  },
  date: {
    fontSize: 13,
    color: "#8d6e63",
    marginBottom: 5,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 6,
  },
  totalLabel: {
    fontWeight: "bold",
    color: "#4e342e",
  },
  totalValue: {
    fontWeight: "bold",
    color: "#6d4c41",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fffdf9",
    borderRadius: 20,
    width: "85%",
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4e342e",
    textAlign: "center",
    marginBottom: 15,
  },
  modalLabel: {
    fontWeight: "bold",
    color: "#6d4c41",
    marginTop: 8,
  },
  modalText: {
    color: "#5d4037",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#e0c9a6",
    marginVertical: 10,
  },
  modalItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 3,
  },
  modalItemName: {
    color: "#4e342e",
  },
  modalItemPrice: {
    color: "#5d4037",
  },
  modalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  modalTotalLabel: {
    fontWeight: "bold",
    color: "#3e2723",
  },
  modalTotalValue: {
    fontWeight: "bold",
    color: "#795548",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#6d4c41",
    paddingVertical: 10,
    borderRadius: 12,
  },
  closeButtonText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
