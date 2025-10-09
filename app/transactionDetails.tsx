import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../Firebase/firebaseConfig";

export default function TransactionDetails() {
  const router = useRouter();
  const { email, id } = useLocalSearchParams<{ email: string; id: string }>();
  const [transaction, setTransaction] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!email || !id) return;

      try {
        const ref = doc(db, "customers", email, "transactions", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setTransaction(data);

          // ✅ Items stored as array field
          if (Array.isArray(data.items)) {
            setItems(data.items);
          } else {
            setItems([]);
          }
        }
      } catch (err) {
        console.error("Error fetching transaction:", err);
      }
    };

    fetchTransaction();
  }, [email, id]);

  if (!transaction) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>Transaction Details</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>Summary</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.label}>Order ID</Text>
          <Text style={styles.value}>{transaction.orderId || id}</Text>

          <Text style={styles.label}>Payment Method</Text>
          <Text style={styles.value}>
            {transaction.paymentMethod || "Unknown"}
          </Text>

          <Text style={styles.label}>Type</Text>
          <Text style={styles.value}>{transaction.type || "Transaction"}</Text>

          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{transaction.status || "N/A"}</Text>

          <Text style={styles.label}>Amount</Text>
          <Text style={[styles.value, styles.amount]}>
            ₱
            {transaction.amount ??
              items.reduce((sum, i) => sum + (i.price || 0), 0)}
          </Text>
        </View>
      </View>

      <Text style={styles.subHeader}>Ordered Items</Text>
      {items.length > 0 ? (
        items.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemName}>
                {item.name && item.name.trim() !== ""
                  ? item.name
                  : `Item ${index + 1}`}
              </Text>
              <Text style={styles.itemQty}>Qty: {item.qty}</Text>
            </View>
            <Text style={styles.itemPrice}>₱{item.price}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.noItems}>No items found.</Text>
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back to Transactions</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f5f2", padding: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f5f2",
  },
  loadingText: { fontSize: 18, color: "#6b4f4f", fontWeight: "500" },
  header: {
    fontSize: 26,
    fontWeight: "700",
    color: "#4b2e05",
    marginBottom: 18,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fffaf5",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    backgroundColor: "#4b2e05",
    paddingVertical: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: "center",
  },
  cardHeaderText: { fontSize: 16, fontWeight: "700", color: "#fff0dcff" },
  cardContent: { padding: 15 },
  label: {
    fontSize: 14,
    color: "#7b5e57",
    fontWeight: "600",
    marginTop: 8,
  },
  value: { fontSize: 16, color: "#3e2723", fontWeight: "500" },
  amount: { color: "#b23b3b", fontSize: 17, fontWeight: "700", marginTop: 3 },
  subHeader: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4b2e05",
    marginBottom: 12,
    textAlign: "center",
  },
  itemCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  itemLeft: { flexDirection: "column" },
  itemName: { fontSize: 16, fontWeight: "600", color: "#3e2723" },
  itemQty: { fontSize: 14, color: "#8d6e63" },
  itemPrice: { fontSize: 16, fontWeight: "700", color: "#3e2723" },
  noItems: {
    textAlign: "center",
    fontSize: 14,
    color: "#8d6e63",
    marginVertical: 10,
  },
  backButton: {
    marginTop: 25,
    alignSelf: "center",
    backgroundColor: "#4b2e05",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  backButtonText: { color: "#fffaf5", fontWeight: "600", fontSize: 15 },
});
