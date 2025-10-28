import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../Firebase/firebaseConfig";

type Log = {
  id: string;
  amount: number;
  date: string;
  method: string;
  referenceNo: string;
};

export default function LogsHistory() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!email) return;
      try {
        const ref = doc(db, "customers", email);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          const logsArray = (data?.logs || []) as Log[];

          // sort by date (desc)
          const sorted = logsArray.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          setLogs(sorted);
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    };
    fetchLogs();
  }, [email]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Transaction Logs</Text>

      <FlatList
        data={logs}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <View>
              <Text style={styles.method}>{item.method}</Text>
              <Text style={styles.date}>{item.date}</Text>
               <Text style={styles.date} >Ref No.{item.referenceNo}</Text>
              
            </View>
            <Text style={styles.amount}>+ ₱{item.amount}</Text>
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
  logItem: {
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
  method: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3e2723",
  },
  date: {
    fontSize: 13,
    color: "#8d6e63",
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "green",
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
