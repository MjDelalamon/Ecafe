  import { FontAwesome } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
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
import { checkMobileExists } from "./functions/checkMobileExists";

  export default function Register() {
    const [lastName, setLastName] = useState<string>("");
    const [firstName, setFirstName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [mobile, setMobile] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [gender, setGender] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    // Inside your Register component, add these states:
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const router = useRouter();

    const handleContinue = async () => {
      // ✅ Check if all fields are filled
      if (
        !lastName ||
        !firstName ||
        !email ||
        !mobile ||
        !password ||
        !gender ||
        !confirmPassword
      ) {
        Alert.alert("Error", "Please fill all fields");
        return;
      }

      // ✅ Check if passwords match
      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }

      // ✅ Validate mobile number (must be 11 digits and start with 09)
      const mobileTrimmed = mobile.trim();
      const mobileRegex = /^09\d{9}$/;

      if (!mobileRegex.test(mobileTrimmed)) {
        Alert.alert("Error", "Please enter a valid 11-digit mobile number starting with 09.");
        return;
      }

      setLoading(true);

      try {
        // ✅ Check if mobile already exists in Firestore
        const exists = await checkMobileExists(mobileTrimmed);
        if (exists) {
          setLoading(false);
          Alert.alert("Error", "This mobile number is already registered.");
          return;
        }

        const fullName = `${firstName} ${lastName}`;

        const result = await addUserToFirestore(
          fullName,
          email,
          mobileTrimmed,
          password,
          0,
          0,
          "Inactive",
          "Bronze",
          gender
        );

        if (result.success) {
          Alert.alert(
            "Verify Your Email",
            "A verification email has been sent. Please check your spam message to verify your email."
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
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fdfcf9" }}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.innerContainer}>
        <Image
          source={require("../assets/images/logo.png")}
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
        <View style={styles.passwordContainer}>
  <TextInput
    style={styles.inputPassword}
    placeholder="Password"
    value={password}
    onChangeText={setPassword}
    secureTextEntry={!showPassword}
    placeholderTextColor="#9c8b7a"
  />
  <TouchableOpacity
    style={styles.eyeIcon}
    onPress={() => setShowPassword(!showPassword)}
  >
    <FontAwesome name={showPassword ? "eye" : "eye-slash"} size={20} color="#5d2510ff" />
  </TouchableOpacity>
</View>

<View style={styles.passwordContainer}>
  <TextInput
    style={styles.inputPassword}
    placeholder="Confirm Password"
    value={confirmPassword}
    onChangeText={setConfirmPassword}
    secureTextEntry={!showConfirmPassword}
    placeholderTextColor="#9c8b7a"
  />
  <TouchableOpacity
    style={styles.eyeIcon}
    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
  >
    <FontAwesome name={showConfirmPassword ? "eye" : "eye-slash"} size={20} color="#5d2510ff" />
  </TouchableOpacity>
</View>


        {confirmPassword.length > 0 && password !== confirmPassword && (
          <Text style={styles.mismatchText}>Passwords do not match</Text>
        )}

        <View style={styles.pickerContainer}>
          <Picker selectedValue={gender} onValueChange={setGender} style={styles.picker}>
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
          </Picker>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => setShowTerms(true)}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonBack} onPress={Back}>
          <Text style={styles.buttonTextBack}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Modal */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#795548" />
            <Text style={styles.loadingText}>Registering...</Text>
          </View>
        </View>
      </Modal>

      {/* Terms Modal */}
      <Modal visible={showTerms} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.termsBox}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowTerms(false)}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.termsTitle}>Terms and Conditions</Text>
            <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={true}>
              <Text style={styles.termsText}>
                1. By creating an account, you agree to provide accurate information. {"\n\n"}
                2. Wallet balances, rewards, and transactions are managed within the system. {"\n\n"}
                3. Admin reserves the right to suspend accounts violating policies. {"\n\n"}
                4. Promotions, rewards, and offers may change without prior notice. {"\n\n"}
                5. By using this app, you agree to the collection of necessary data for transactions. {"\n\n"}
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => {
                setShowTerms(false);
                handleContinue();
              }}
            >
              <Text style={styles.acceptText}>Accept & Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.declineButton} onPress={() => setShowTerms(false)}>
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
  }

  const styles = StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 40,
      backgroundColor: "#fdfcf9",
    },
    innerContainer: {
      width: "90%",
      maxWidth: 400,
      backgroundColor: "#fff",
      borderRadius: 15,
      padding: 20,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
    },
    logo: {
      width: 100,
      height: 100,
      alignSelf: "center",
      marginBottom: 10,
      borderRadius: 60,
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 20,
      color: "#4e342e",
      textAlign: "center",
    },
    input: {
      width: "100%",
      borderWidth: 1,
      borderColor: "#5d2510ff",
      padding: 10,
      marginBottom: 12,
      borderRadius: 10,
      backgroundColor: "#fff",
      fontSize: 15,
      color: "#3e2723",
    },
    pickerContainer: {
      width: "100%",
      borderWidth: 1,
      borderColor: "#5d2510ff",
      borderRadius: 10,
      backgroundColor: "#fff",
      marginBottom: 15,
    },
    picker: {
      width: "100%",
      color: "#3e2723",
    },
    button: {
      backgroundColor: "#5d2510ff",
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 5,
    },
    buttonBack: {
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 8,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    buttonTextBack: {
      color: "#795548",
      fontSize: 16,
      fontWeight: "bold",
    },
    mismatchText: {
      color: "#d32f2f",
      marginBottom: 8,
      marginLeft: 4,
      fontSize: 13,
      fontWeight: "600",
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
      backgroundColor: "#fff",
      padding: 25,
      borderRadius: 15,
      alignItems: "center",
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      fontWeight: "600",
      color: "#4e342e",
    },
    termsBox: {
      backgroundColor: "#fff",
      padding: 20,
      borderRadius: 15,
      width: "85%",
      elevation: 5,
    },
    termsTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#4e342e",
      marginBottom: 10,
      textAlign: "center",
    },
    termsText: {
      fontSize: 14,
      color: "#3e2723",
      lineHeight: 20,
    },
    acceptButton: {
      backgroundColor: "#5d2510ff",
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
    closeButton: {
      position: "absolute",
      right: 10,
      top: 10,
    },
    closeText: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#795548",
    },
    passwordContainer: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#5d2510ff",
  borderRadius: 10,
  marginBottom: 12,
  backgroundColor: "#fff",
},
inputPassword: {
  flex: 1,
  padding: 10,
  fontSize: 15,
  color: "#3e2723",
},
eyeIcon: {
  paddingHorizontal: 10,
  color: "#5d2510ff",
},

  });
