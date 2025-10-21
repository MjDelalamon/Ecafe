import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../Firebase/firebaseConfig";

export default function PromoDetailsPage() {
  const { email, promoId } = useLocalSearchParams<{ email: string; promoId: string }>();
  const [promo, setPromo] = useState<any>(null);

  useEffect(() => {
    const fetchPromo = async () => {
      if (!email || !promoId) return;
      const promoRef = doc(db, `customers/${email}/claimedPromos/${promoId}`);
      const promoSnap = await getDoc(promoRef);
      if (promoSnap.exists()) {
        setPromo(promoSnap.data());
      }
    };
    fetchPromo();
  }, [email, promoId]);

  if (!promo) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Loading promo details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{promo.title}</Text>
      <Text style={styles.description}>{promo.description}</Text>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Price:</Text>
        <Text style={styles.value}>₱{promo.price}</Text>

        <Text style={styles.label}>Status:</Text>
        <Text style={[styles.value, { color: promo.isUsed ? "red" : "green" }]}>
          {promo.isUsed ? "Used" : "Not Used"}
        </Text>

        <Text style={styles.label}>Claimed At:</Text>
        <Text style={styles.value}>
          {new Date(promo.claimedAt).toLocaleString()}
        </Text>

        {promo.endDate && (
          <>
            <Text style={styles.label}>Expires On:</Text>
            <Text style={styles.value}>
              {new Date(promo.endDate).toLocaleDateString()}
            </Text>
          </>
        )}
      </View>

      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flex: 1 },
  header: { fontSize: 24, fontWeight: "bold", color: "#3e2723", marginBottom: 10 },
  description: { fontSize: 16, color: "#5d4037", marginBottom: 20 },
  infoBox: {
    backgroundColor: "#fff8e1",
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: "#f5d27b",
  },
  label: { fontWeight: "bold", color: "#4e342e", marginTop: 10 },
  value: { color: "#5d4037", marginTop: 4 },
  backButton: {
    marginTop: 30,
    backgroundColor: "#795548",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  backText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loading: { color: "#6d4c41", fontSize: 16 },
});
