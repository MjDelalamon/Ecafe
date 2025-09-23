import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../Firebase/firebaseConfig"; // Firebase config

export default function LandingScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("⚠ Please enter both email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const userEmail = userCredential.user.email;
      if (!userEmail) {
        setError("⚠ Unable to retrieve user email");
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, "customers", userEmail);
      const userSnapshot = await getDoc(userDocRef);

      if (!userSnapshot.exists()) {
        setError("⚠ User data not found in database");
        setLoading(false);
        return;
      }

      const userData = userSnapshot.data();

      setLoading(false);

      router.replace({
        pathname: "/QrTest",
        params: {
          qrValue: userEmail,
          points: userData.points.toString(),
          mobile: userData.mobile,
        },
      });
    } catch (err: any) {
      setError(`⚠ Invald email or password`);
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push("/Register");
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo.jpg")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>Login with your email and password</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#9c8b7a"
      />

      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#9c8b7a"
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerText}>Register</Text>
      </TouchableOpacity>

      {/* 🔹 Loading Modal */}
      <Modal transparent={true} animationType="fade" visible={loading}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#795548" />
            <Text style={styles.loadingText}>Logging in...</Text>
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
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fdfcf9",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#4e342e",
  },
  subtitle: {
    fontSize: 18,
    color: "#6d4c41",
    marginBottom: 20,
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
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
  registerButton: {
    marginTop: 15,
  },
  registerText: {
    color: "#795548",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    width: "70%",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
    color: "#4e342e",
  },
});
