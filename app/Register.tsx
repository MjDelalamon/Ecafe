import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
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
  const [showTerms, setShowTerms] = useState(false);

  const router = useRouter();

  const handleContinue = async () => {
    if (!lastName || !firstName || !email || !mobile || !password) {
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
        password,
        0,
        0,
        "Inactive",
        "Bronze"
      );

      if (result.success) {
        Alert.alert(
          "Verify Your Email",
          "A verification email has been sent. Please verify your email before logging in."
        );

        router.replace({
          pathname: "/landingPage",
          params: {
            qrValue: result.id,
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

      {/* Register Button → show terms modal */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowTerms(true)}
      >
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonBack} onPress={Back}>
        <Text style={styles.buttonTextBack}> Back </Text>
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

      {/* Terms & Conditions Modal */}
      <Modal visible={showTerms} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.termsBox}>
            {/* Close Button (X) */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTerms(false)}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>

            <Text style={styles.termsTitle}>Terms and Conditions</Text>
            <View style={{ maxHeight: 300 }}>
              <ScrollView showsVerticalScrollIndicator={true}>
                <Text style={styles.termsText}>
                  1. By creating an account, you agree to provide accurate
                  information. {"\n\n"}
                  2. Wallet balances, rewards, and transactions are managed
                  within the system. {"\n\n"}
                  3. Admin reserves the right to suspend accounts violating
                  policies. {"\n\n"}
                  4. Promotions, rewards, and offers may change without prior
                  notice. {"\n\n"}
                  5. By using this app, you agree to the collection of necessary
                  data for transactions. {"\n\n"}
                </Text>
              </ScrollView>
            </View>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => {
                setShowTerms(false);
                handleContinue(); // tuloy register kapag accepted
              }}
            >
              <Text style={styles.acceptText}>Accept & Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => setShowTerms(false)}
            >
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
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
  buttonBack: {
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
  buttonTextBack: {
    color: "#795548",
    fontSize: 18,
    fontWeight: "bold",
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
  termsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4e342e",
    marginBottom: 10,
    textAlign: "center",
  },
  termsBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    width: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  termsText: {
    fontSize: 14,
    color: "#3e2723",
    lineHeight: 20,
  },
  acceptButton: {
    backgroundColor: "#795548",
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
  },
  acceptText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  declineButton: {
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#795548",
  },
  declineText: {
    color: "#795548",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  closeButton: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 1,
  },
  closeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#795548",
  },
});
