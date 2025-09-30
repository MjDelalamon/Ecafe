import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../Firebase/firebaseConfig";

type Transaction = {
  id: string;
  item: string;
  amount: number;
  type: string;
  date: any;
};

export default function PointsHistory() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [history, setHistory] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!email) {
        setHistory([]);
        return;
      }
      try {
        const q = query(
          collection(db, "customers", email, "transactions"),
          orderBy("date", "desc")
        );
        const snap = await getDocs(q);
        const transactions: Transaction[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
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
            item: d.item ?? "Item",
            amount:
              typeof d.amount === "number" ? d.amount : Number(d.amount ?? 0),
            type: d.type ?? "Transaction",
            date: dateStr,
          };
        });
        setHistory(transactions);
      } catch (err) {
        console.error("Error fetching history:", err);
        setHistory([]);
      }
    };
    fetchHistory();
  }, [email]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Points & Wallet History</Text>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <View>
              <Text style={styles.description}>{item.item}</Text>
              <Text style={styles.type}>{item.type}</Text>
              <Text style={styles.date}>{item.date ?? "No date"}</Text>
            </View>
            <Text style={[styles.amount, { color: "red" }]}>
              - {item.amount}
            </Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>⬅ Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdfcf9",
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#4e342e",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  description: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3e2723",
  },
  type: {
    fontSize: 14,
    color: "#6d4c41",
    marginBottom: 3,
  },
  date: {
    fontSize: 13,
    color: "#8d6e63",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    marginTop: 20,
    padding: 10,
    alignSelf: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6d4c41",
  },
});
