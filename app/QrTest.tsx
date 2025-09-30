import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { db } from "../Firebase/firebaseConfig";

export default function QrTest() {
  const { qrValue, mobile } = useLocalSearchParams<{
    qrValue: string;
    mobile: string;
  }>();

  const router = useRouter();
  const [points, setPoints] = useState(0);

  // ✅ Fetch customer balance
  const fetchCustomerData = useCallback(async () => {
    if (!qrValue) return;
    try {
      const customerRef = doc(db, "customers", qrValue);
      const snap = await getDoc(customerRef);
      if (snap.exists()) {
        const data = snap.data();
        setPoints(data.points || 0);
      }
    } catch (err) {
      console.error("Error fetching customer data:", err);
    }
  }, [qrValue]);

  // ✅ Auto-refresh when screen focused
  useFocusEffect(
    useCallback(() => {
      fetchCustomerData();
    }, [fetchCustomerData])
  );

  const handleWallet = () => {
    router.push("/Wallet");
  };

  const handleBack = () => {
    router.push("/landingPage");
  };

  const handleBrowse = () => {
    router.push({
      pathname: "/menuList",
      params: { email: qrValue },
    });
  };

  const handleHistory = () => {
    router.push({
      pathname: "/pointsHistory",
      params: { email: qrValue },
    });
  };

  const handleOrders = () => {
    router.push({
      pathname: "/orders",
      params: { email: qrValue },
    });
  };

  return (
    <View style={styles.container}>
      {/* QR Code Section */}
      <View style={styles.qrContainer}>
        {qrValue ? (
          <QRCode value={qrValue} size={180} />
        ) : (
          <Text style={styles.error}>No QR code found</Text>
        )}
        <Text style={styles.barcodeText}>{mobile}</Text>
        <View style={styles.pointsBox}>
          <Text style={[styles.pointsLabel, { marginTop: 10 }]}>
            Rewards Balance
          </Text>
          <Text style={styles.pointsValue}>{points.toFixed(2)} Pts.</Text>
        </View>
        <Text style={styles.scanHint}>
          Please scan your barcode before payment to earn points. Earn 1% of
          your total purchase in points.
        </Text>
      </View>

      {/* Rewards Balance */}

      {/* Action Buttons */}
      <ScrollView style={{ flex: 1, width: "100%" }}>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridItem} onPress={handleWallet}>
            <MaterialIcons
              name="account-balance-wallet"
              size={32}
              color="#4e342e"
            />
            <Text style={styles.gridText}>Open Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={handleBrowse}>
            <FontAwesome5 name="store" size={28} color="#795548" />
            <Text style={styles.gridText}>Browse</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={handleHistory}>
            <MaterialIcons name="history" size={32} color="#6d4c41" />
            <Text style={styles.gridText}>View History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={handleOrders}>
            <MaterialIcons name="receipt-long" size={32} color="#6d4c41" />
            <Text style={styles.gridText}>Orders</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>⬅ Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdfcf9",
    padding: 15,
    alignItems: "center",
  },
  qrContainer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  barcodeText: {
    marginTop: 8,
    fontSize: 16,
    letterSpacing: 2,
    fontWeight: "600",
    color: "#4e342e",
  },
  scanHint: {
    fontSize: 12,
    color: "#6d4c41",
    marginTop: 4,
  },
  pointsBox: {
    alignItems: "center",
    marginBottom: 20,
  },
  pointsLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4e342e",
  },
  pointsValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#795548",
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  gridItem: {
    width: "47%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  gridText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: "#3e2723",
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: "#6d4c41",
    fontWeight: "bold",
  },
  error: {
    fontSize: 16,
    color: "red",
  },
});
