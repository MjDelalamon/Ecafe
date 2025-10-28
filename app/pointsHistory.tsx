import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
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
  rawDate: Date;
};

export default function PointsHistory() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [history, setHistory] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<
    "All" | "Points" | "Wallet" | "Cash" | "E-Wallet" | "Mix-Payment"
  >("All");
  const [sortOrder, setSortOrder] = useState<"Newest" | "Oldest">("Newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!email) return setHistory([]);

      setLoading(true);
      try {
        const q = query(
          collection(db, "customers", email, "transactions"),
          orderBy("date", "desc")
        );
        const snap = await getDocs(q);

        const transactions: Transaction[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          let dateStr = "";
          let dateObj = new Date();

          if (d.date) {
            try {
              const ts: any = d.date;
              dateObj =
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
            rawDate: dateObj,
          };
        });

        setHistory(transactions);
      } catch (err) {
        console.error("Error fetching history:", err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [email]);

  // 🔹 Filter + Sort Logic
  const filteredHistory = history
    .filter((item) => {
      const method = (item.paymentMethod || "").toLowerCase();

      if (filter === "Points") return method.includes("points");
      if (filter === "Wallet") return method.includes("wallet");
      if (filter === "Cash") return method.includes("cash") || method.includes("counter");
      if (filter === "E-Wallet")
        return method.includes("e-wallet") || method.includes("ewallet");
      if (filter === "Mix-Payment")
        return (
          method.includes("points + wallet") ||
          method.includes("points + cash") ||
          method.includes("mix") ||
          method.includes("mixed")
        );

      return true;
    })
    .sort((a, b) => {
      const dateA = a.rawDate?.getTime?.() || 0;
      const dateB = b.rawDate?.getTime?.() || 0;
      return sortOrder === "Newest" ? dateB - dateA : dateA - dateB;
    });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Transaction History</Text>

      {/* 🔸 Filter + Sort Bar */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterGroup}
        >
          {["All", "Points", "Wallet", "Cash", "E-Wallet", "Mix-Payment"].map(
            (option) => (
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
            )
          )}
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
        </ScrollView>
      </View>

      {/* 🔸 Transaction List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#6d4c41"
          style={{ marginTop: 30 }}
        />
      ) : filteredHistory.length === 0 ? (
        <Text style={styles.noData}>No transactions found</Text>
      ) : (
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
              <View style={{ flex: 1 }}>
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
              <Text style={styles.amount}>
                {item.paymentMethod.toLowerCase().includes("points")
                  ? `${item.type.toLowerCase().includes("points") ? "- " : "+ "}${item.amount} pts`
                  : `- ₱${item.amount}`}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>⬅ Back</Text>
      </TouchableOpacity>
    </View>
  );
}

// 🪶 Café-themed design
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdfaf6",
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
    color: "#4e342e",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#fff8f3",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#f1e0c6",
  },
  filterGroup: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0c9a6",
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
  noData: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    color: "#8d6e63",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    backgroundColor: "#fffdfb",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#3e2723",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: "#f1e0c6",
  },
  description: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3e2723",
    width: 160,
  },
  type: {
    fontSize: 14,
    color: "#5d4037",
  },
  date: {
    fontSize: 12,
    color: "#a1887f",
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4e342e",
    marginLeft: 10,
  },
  backButton: {
    marginTop: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#6d4c41",
    borderRadius: 10,
    alignSelf: "center",
    shadowColor: "#3e2723",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
