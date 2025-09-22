import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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
import { auth, db } from "../Firebase/firebaseConfig"; // import Firebase Auth and Firestore

export default function LandingScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      // 🔹 Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 🔹 Get the signed-in user's email from userCredential
      const userEmail = userCredential.user.email;
      if (!userEmail) {
        Alert.alert("Error", "Unable to retrieve user email");
        return;
      }

      // 🔹 Fetch Firestore document using userEmail as ID
      const userDocRef = doc(db, "customers", userEmail);
      const userSnapshot = await getDoc(userDocRef);

      if (!userSnapshot.exists()) {
        Alert.alert("Error", "User data not found in Firestore");
        return;
      }

      const userData = userSnapshot.data();

      // 🔹 Navigate to QrTest with Firestore ID (email) and points
      router.replace({
        pathname: "/QrTest",
        params: {
          qrValue: userEmail,
          points: userData.points.toString(),
          mobile: userData.mobile, // pass mobile if exists
        },
      });
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    }
  };

  const handleRegister = () => {
    router.push("/Register"); // navigate to Register page
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
    marginBottom: 30,
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
});
