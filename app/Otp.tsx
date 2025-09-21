import { useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function OTPVerification() {
  const router = useRouter();
  const [otp, setOtp] = useState("");

  const handleVerify = () => {
    if (otp.length === 6) {
      console.log("OTP entered:", otp);
      // 🔐 Later: verify with Firebase here
      // router.replace("/home");
    } else {
      alert("Please enter the 6-digit OTP code.");
    }
  };

  const Back = () => {
    router.replace("/landingPage");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OTP Verification</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code we sent to your mobile number
      </Text>

      <TextInput
        style={styles.input}
        placeholder="------"
        placeholderTextColor="#aaa"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
        textAlign="center"
      />

      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>Verify </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={Back}>
        <Text style={styles.buttonText}>Back </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => alert("Resend OTP clicked")}
      >
        <Text style={styles.linkText}>Resend Code</Text>
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
    backgroundColor: "#fdfcf9", // light cream
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#4e342e", // coffee brown
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: "#6d4c41",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  input: {
    width: "70%",
    borderWidth: 2,
    borderColor: "#6d4c41",
    borderRadius: 10,
    padding: 15,
    fontSize: 22,
    letterSpacing: 10,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#6d4c41",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: "center",
    width: "70%",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkButton: {
    marginTop: 10,
  },
  linkText: {
    color: "#2196F3",
    fontSize: 16,
  },
});
