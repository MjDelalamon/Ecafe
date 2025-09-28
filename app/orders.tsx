import { useLocalSearchParams } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { db } from "../Firebase/firebaseConfig";

type Order = {
  id: string;
  item: string;
  amount: number;
  status: string;
  date: string;
  paymentMethod: string;
};

export default function Orders() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!email) {
        setOrders([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const q = query(
          collection(db, "orders"),
          where("customerEmail", "==", email)
        );
        const snap = await getDocs(q);

        const data: Order[] = snap.docs.map((docSnap) => {
          const d = docSnap.data() as any;

          // item can be string or object; handle both
          const itemName =
            typeof d.item === "string"
              ? d.item
              : d.item?.name ?? d.item?.title ?? "Item";

          // convert Firestore timestamp to readable string (if present)
          let dateStr = "";
          if (d.date) {
            try {
              const ts: any = d.date;
              const dateObj =
                typeof ts?.toDate === "function" ? ts.toDate() : new Date(ts);
              dateStr = dateObj.toLocaleString();
            } catch {
              dateStr = String(d.date);
            }
          }

          return {
            id: docSnap.id,
            item: itemName,
            amount:
              typeof d.amount === "number" ? d.amount : Number(d.amount ?? 0),
            status: d.status ?? "Pending",
            date: dateStr,
            paymentMethod: d.paymentMethod ?? "",
          } as Order;
        });

        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [email]);

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
            <View style={styles.orderCard}>
              <Text style={styles.itemName}>{item.item}</Text>
              <Text>₱{item.amount}</Text>
              <Text>Status: {item.status}</Text>
              <Text>Payment: {item.paymentMethod}</Text>
              <Text>Date: {item.date}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#fdfcf9",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4e342e",
    marginBottom: 15,
  },
  noOrders: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    color: "#8d6e63",
  },
  orderCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#3e2723",
  },
});
