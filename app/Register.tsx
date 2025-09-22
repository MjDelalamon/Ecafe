import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleContinue = async () => {
    if (!lastName || !firstName || !email || !mobile || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const fullName = `${firstName} ${lastName}`;

      // 🔹 addUserToFirestore now stores password and uses email as document ID
      const result = await addUserToFirestore(
        fullName,
        email,
        mobile,
        password,
        0,
        0,
        "Inactive", // inactive until email verified
        "Bronze"
      );

      if (result.success) {
        Alert.alert(
          "Verify Your Email",
          "A verification email has been sent. Please verify your email before logging in."
        );

        // 🔹 Navigate to QrTest with qrValue = email
        router.replace({
          pathname: "/landingPage",
          params: {
            qrValue: result.id, // Firestore doc ID (can be email)
            points: "0",
          },
        });
      } else {
        Alert.alert("Error", `Failed to register user: ${result.error}`);
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
      <Image
        source={require("../assets/images/logo.jpg")}
        style={styles.logo}
        resizeMode="contain"
      />
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
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#9c8b7a"
      />

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={Back}>
        <Text style={styles.buttonText}>Back </Text>
      </TouchableOpacity>

      {/* Loading Modal */}
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
    fontSize: 20,
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
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    marginLeft: "30%",
    borderRadius: 60,
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
