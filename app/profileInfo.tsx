import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../Firebase/firebaseConfig";

export default function ProfileInfo() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      if (!email) return;
      try {
        const userRef = doc(db, "customers", email);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setUser(snap.data());
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [email]);

  const openSocialMedia = (url: string) => {
    Linking.openURL(url).catch(() => {
      alert("Unable to open link.");
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#795548" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>User not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Ionicons
        name="person-circle-outline"
        size={80}
        color="#795548"
        style={{ alignSelf: "center" }}
      />

      <View style={styles.infoBox}>
        <Text style={styles.label}>Full Name:</Text>
        <Text style={styles.value}>{user.fullName}</Text>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user.email}</Text>
        <Text style={styles.label}>Mobile:</Text>
        <Text style={styles.value}>{user.mobile}</Text>
        {user.gender && (
          <>
            <Text style={styles.label}>Gender:</Text>
            <Text style={styles.value}>{user.gender}</Text>
          </>
        )}
        <Text style={styles.label}>Tier:</Text>
        <Text style={styles.value}>{user.tier}</Text>
        <Text style={styles.label}>Points:</Text>
        <Text style={styles.value}>{user.points}</Text>
        <Text style={styles.label}>Wallet:</Text>
        <Text style={styles.value}>{user.wallet}</Text>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{user.status}</Text>
        <Text style={styles.label}>Created At:</Text>
        <Text style={styles.value}>
          {user.createdAt?.seconds
            ? new Date(user.createdAt.seconds * 1000).toLocaleString()
            : user.createdAt?.toString() || "N/A"}
        </Text>
      </View>

      {/* 🌐 Social Media Integration Section */}
      <View style={styles.socialContainer}>
        <Text style={styles.socialTitle}>Connect with us on social media</Text>
        <View style={styles.socialIcons}>
          <TouchableOpacity
            onPress={() => openSocialMedia("https://www.facebook.com/D.EsperanzaCafe")}
          >
            <Ionicons name="logo-facebook" size={36} color="#3b5998" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openSocialMedia("https://www.instagram.com/d.esperanzacafe/")}
          >
            <Ionicons name="logo-instagram" size={36} color="#C13584" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openSocialMedia("https://www.tiktok.com/@YourCafePage")}
          >
            <Ionicons name="logo-tiktok" size={36} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#fdfcf9",
    flexGrow: 1,
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fdfcf9",
  },
  infoBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    width: "100%",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  label: {
    fontWeight: "bold",
    color: "#6d4c41",
    marginTop: 10,
  },
  value: {
    color: "#3e2723",
    fontSize: 15,
    marginBottom: 2,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: "#795548",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 10,
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  /* 🌐 Social Media Section Styles */
  socialContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 15,
    width: "100%",
    marginBottom: 20,
    alignItems: "center",
    elevation: 2,
  },
  socialTitle: {
    color: "#5d4037",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
  },
  socialIcons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "60%",
  },
});
