import { useRouter } from "expo-router";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../Firebase/firebaseConfig";

export default function LoadWalletPage() {
  const [referenceNo, setReferenceNo] = useState("");
  const router = useRouter();
  const userEmail = auth.currentUser?.email;

  // ✅ Show QR fullscreen tip
  const showQRInfo = () => {
    Alert.alert(
      "Save QR",
      "You can take a screenshot of the QR code to save it on your device."
    );
  };

  // ✅ Submit wallet request
  const handleSubmit = async () => {
    if (!referenceNo) {
      Alert.alert("Error", "Please enter your Reference Number.");
      return;
    }

    try {
      await addDoc(collection(db, "walletRequests"), {
        email: userEmail,
        referenceNo,
        status: "pending",
        createdAt: Timestamp.now(),
      });

      Alert.alert("Success", "Wallet load request submitted!");
      router.back();
    } catch (error) {
      console.error("Error submitting request:", error);
      Alert.alert("Error", "Failed to submit request.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Load Wallet via QR</Text>

      {/* QR Image */}
      <View style={styles.qrContainer}>
        <TouchableOpacity onPress={showQRInfo}>
          <Image
            source={require("../assets/images/qrgcash.png")}
            style={{ width: 220, height: 220, resizeMode: "contain" }}
          />
        </TouchableOpacity>
        <Text style={styles.tip}>📸 Tap the QR to learn how to save it</Text>
      </View>

      {/* Notes */}
      <Text style={styles.note}>
        1. Scan the QR using your GCash{"\n"}
        2. Complete the payment.{"\n"}
        3. Enter your Reference Number below for admin verification.
        {"\n"}4. Admin will review and update your wallet balance.
      </Text>

      <Text style={styles.note}>
        Tip: It’s better to load your wallet over the counter.
      </Text>

      {/* Reference No. Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter Reference No."
        value={referenceNo}
        onChangeText={setReferenceNo}
      />

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit Request</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fdfcf9" },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4e342e",
    marginBottom: 20,
    textAlign: "center",
  },
  qrContainer: { alignItems: "center", marginBottom: 20 },
  tip: {
    marginTop: 8,
    fontSize: 13,
    color: "#555",
    fontStyle: "italic",
  },
  note: { fontSize: 14, color: "#6d4c41", marginVertical: 20, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: "#2e7d32",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
