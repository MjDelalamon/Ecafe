import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from "../Firebase/firebaseConfig";

export default function WalletScreen() {
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const userEmail = auth.currentUser?.email;

  // ✅ Real-time wallet updates
  useEffect(() => {
    if (!userEmail) return;

    const userDocRef = doc(db, "customers", userEmail);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWalletBalance(data.wallet || 0);
      }
    });

    // cleanup listener on unmount
    return () => unsubscribe();
  }, [userEmail]);

  // Function to add money to wallet

  const Buy = async () => {
    router.push({ pathname: "/menuList", params: { qrValue: userEmail } });
  };

  const LogsHistory = async () => {
    if (!userEmail) return;
    router.push({
      pathname: "/LogsHistory",
      params: { email: userEmail },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>⬅</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <MaterialIcons name="contactless" size={28} color="#4e342e" />
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.walletLabel}>WALLET BALANCE</Text>
        <Text style={styles.balanceText}>₱ {walletBalance.toFixed(2)}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridItem} onPress={Buy}>
          <FontAwesome5 name="shopping-basket" size={32} color="#4e342e" />
          <Text style={styles.gridTitle}>Buy at DEsperanza Cafe</Text>
          <Text style={styles.gridDesc}>
            Use your PAY balance to scan and go!
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => router.push("/LoadWalletPage")}
        >
          <MaterialIcons
            name="account-balance-wallet"
            size={32}
            color="#6d4c41"
          />
          <Text style={styles.gridTitle}>Load Wallet</Text>
          <Text style={styles.gridDesc}>Request wallet loading via QR</Text>
        </TouchableOpacity>
      </View>

      {/* Manage Transactions */}
      <TouchableOpacity style={styles.manageButton} onPress={LogsHistory}>
        <MaterialIcons name="receipt-long" size={22} color="#4e342e" />
        <Text style={styles.manageText}> Transactions</Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backArrow: {
    fontSize: 20,
    color: "#4e342e",
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4e342e",
  },
  balanceCard: {
    backgroundColor: "#2e7d32",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  walletLabel: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 6,
    fontWeight: "600",
  },
  balanceText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  gridItem: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    color: "#3e2723",
    textAlign: "center",
  },
  gridDesc: {
    fontSize: 12,
    color: "#6d4c41",
    marginTop: 4,
    textAlign: "center",
  },
  manageButton: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  manageText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4e342e",
    marginLeft: 8,
  },
});
