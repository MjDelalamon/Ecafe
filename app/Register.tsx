import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { addUserToFirestore } from "../services/userService";

export default function Register() {
  const [lastName, setLastName] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");

  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleContinue = async () => {
    if (!lastName || !firstName || !email || !mobile) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const fullName = `${firstName} ${lastName}`;

      const result = await addUserToFirestore(
        fullName,
        email,
        mobile,
        0,
        0,
        "Active",
        "Bronze"
      );

      if (result.success) {
        console.log("✅ User stored in Firestore:", result.id);

        // 🔹 Pass qrValue (Firestore doc ID) to QrTest
        router.replace({
          pathname: "/QrTest",
          params: {
            qrValue: result.id, // ✅ use Firestore ID
            points: "0",
          },
        });
      } else {
        Alert.alert("Error", "Failed to register user.");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const Back = () => {
    router.replace("/landingPage");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        placeholderTextColor="#9c8b7a"
      />
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        placeholderTextColor="#9c8b7a"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholderTextColor="#9c8b7a"
      />
      <TextInput
        style={styles.input}
        placeholder="Mobile Number"
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
        placeholderTextColor="#9c8b7a"
      />

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={Back}>
        <Text style={styles.buttonText}>Back </Text>
      </TouchableOpacity>

      {/* 🔹 Loading Modal */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#795548" />
            <Text style={styles.loadingText}>Registering...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fdfcf9",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#4e342e",
    textAlign: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d7ccc8",
    padding: 12,
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#3e2723",
  },
  button: {
    backgroundColor: "#795548",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 15,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#4e342e",
  },
});
