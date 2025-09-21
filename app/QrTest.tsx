import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function QrTest() {
  // ✅ accept qrValue instead of mobile
  const { qrValue, points } = useLocalSearchParams<{
    qrValue: string;
    points: string;
  }>();

  const router = useRouter();
  const displayPoints = points ? parseFloat(points) : 0;

  const handleWallet = () => {
    router.push("/Wallet");
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
        <Text style={styles.barcodeText}>{qrValue}</Text>
        <Text style={styles.scanHint}>
          SCAN YOUR BARCODE BEFORE PAYMENT TO EARN POINTS
        </Text>
      </View>

      {/* Rewards Balance */}
      <View style={styles.pointsBox}>
        <Text style={styles.pointsLabel}>Rewards Balance</Text>
        <Text style={styles.pointsValue}>{displayPoints.toFixed(2)} Pts.</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridItem} onPress={handleWallet}>
          <MaterialIcons
            name="account-balance-wallet"
            size={32}
            color="#4e342e"
          />
          <Text style={styles.gridText}>Open Wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem}>
          <MaterialIcons name="receipt" size={32} color="#6d4c41" />
          <Text style={styles.gridText}>Pay Bills</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem}>
          <FontAwesome5 name="store" size={28} color="#795548" />
          <Text style={styles.gridText}>Browse</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem}>
          <MaterialIcons name="smartphone" size={32} color="#a1887f" />
          <Text style={styles.gridText}>Add e-Money</Text>
        </TouchableOpacity>
      </View>

      {/* Back Button */}
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
