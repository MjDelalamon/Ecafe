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
  orderId: string;
  paymentMethod: string;
  amount: number;
  type: string;
  date: string;
  rawDate: Date; // ✅ added for sorting
};

export default function PointsHistory() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [history, setHistory] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"All" | "Points" | "Wallet">("All");
  const [sortOrder, setSortOrder] = useState<"Newest" | "Oldest">("Newest");

  useEffect(() => {
    const fetchHistory = async () => {
      if (!email) return setHistory([]);

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
            orderId: d.orderId ?? docSnap.id,
            paymentMethod: d.paymentMethod ?? "Unknown",
            amount:
              typeof d.amount === "number" ? d.amount : Number(d.amount ?? 0),
            type: d.type ?? "Transaction",
            date: dateStr,
            rawDate:
              d.date && typeof d.date.toDate === "function"
                ? d.date.toDate()
                : new Date(d.date ?? Date.now()), // ✅ real Date object
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

  // 🔹 Filter + Sort Logic
  const filteredHistory = history
    .filter((item) => {
      const method = (item.paymentMethod || "").trim().toLowerCase();

      if (filter === "Points") return method.includes("points");
      if (filter === "Wallet") return method.includes("wallet");
      return true;
    })
    .sort((a, b) => {
      const dateA = a.rawDate?.getTime?.() || 0;
      const dateB = b.rawDate?.getTime?.() || 0;
      return sortOrder === "Newest" ? dateB - dateA : dateA - dateB;
    });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Points & Wallet History</Text>

      {/* 🔸 Filter + Sort Bar */}
      <View style={styles.filterContainer}>
        <View style={styles.filterGroup}>
          {["All", "Points", "Wallet"].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.filterButton,
                filter === option && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(option as any)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === option && styles.filterTextActive,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() =>
            setSortOrder(sortOrder === "Newest" ? "Oldest" : "Newest")
          }
        >
          <Text style={styles.sortText}>
            {sortOrder === "Newest" ? "⬇ Newest" : "⬆ Oldest"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🔸 Transaction List */}
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.historyItem}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/transactionDetails",
                params: { email, id: item.id },
              })
            }
          >
            <View>
              <Text
                style={styles.description}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Order: {item.orderId}
              </Text>
              <Text style={styles.type}>
                Payment: {item.paymentMethod} ({item.type})
              </Text>
              <Text style={styles.date}>{item.date ?? "No date"}</Text>
            </View>
            <Text style={styles.amount}>- ₱{item.amount}</Text>
          </TouchableOpacity>
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
    backgroundColor: "#fffdfb",
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
    color: "#4b2e05",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#fffdfbff",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterGroup: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#fff8f3",
    borderWidth: 1,
    borderColor: "#d7ccc8",
  },
  filterButtonActive: {
    backgroundColor: "#6d4c41",
    borderColor: "#5d4037",
  },
  filterText: {
    color: "#4b2e05",
    fontWeight: "600",
    fontSize: 14,
  },
  filterTextActive: {
    color: "#fbe9e7",
  },
  sortButton: {
    backgroundColor: "#efebe9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d7ccc8",
  },
  sortText: {
    color: "#4b2e05",
    fontWeight: "600",
    fontSize: 14,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    backgroundColor: "#fffdfbff",
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#5d4037",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "#d7ccc8",
  },
  description: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3e2723",
    width: 150,
    overflow: "hidden",
  },
  type: {
    fontSize: 14,
    color: "#433530",
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: "#a1887f",
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#54433cff",
  },
  backButton: {
    marginTop: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#6d4c41",
    borderRadius: 10,
    alignSelf: "center",
    shadowColor: "#3e2723",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fbe9e7",
  },
});
