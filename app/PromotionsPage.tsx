import { router, useLocalSearchParams } from "expo-router";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { db } from "../Firebase/firebaseConfig";

// 🔹 Interface for Promotion
interface PromotionType {
  id: string;
  title: string;
  description: string;
  applicableTiers?: string[];
  image?: string;
  endDate?: string;
  createdAt?: string;
  price: number;
}

export default function PromotionsPage() {
  const { email } = useLocalSearchParams<{ email: string }>();

  const [promos, setPromos] = useState<PromotionType[]>([]);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [claimedPromos, setClaimedPromos] = useState<any[]>([]);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  // 🔹 Fetch Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      if (!email) return;

      const userRef = doc(db, "customers", email);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const tier = userSnap.data().tier;
      setUserTier(tier);

      // 🔸 Fetch available promos
      const promoSnap = await getDocs(collection(db, "promotions"));
      const now = new Date();

      // 🔸 Get user's favorite category
      const favoriteCategory = userSnap.data().favoriteCategory;

      const allPromos = promoSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p: any) => {
          const matchesTier = p.applicableTiers?.includes(tier);
          const matchesCategory = !p.category || p.category === favoriteCategory;
          const notExpired = !p.endDate || new Date(p.endDate) >= now;
          return matchesTier && matchesCategory && notExpired;
        }) as PromotionType[];

      setPromos(allPromos);

      // 🔸 Fetch claimed promos
      const claimedSnap = await getDocs(
        collection(db, `customers/${email}/claimedPromos`)
      );
      const claimedList = claimedSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClaimedPromos(claimedList);
    };

    fetchData();
  }, [email]);

  // 🔹 Handle Promo Claim
  const handleClaim = async (promo: PromotionType) => {
    if (!email) return;

    const now = new Date();
    if (promo.endDate && new Date(promo.endDate) < now) {
      Alert.alert("Promo expired", "This promo can no longer be claimed.");
      return;
    }

    // ✅ Create a record in Firestore before showing QR
    const promoRef = doc(db, `customers/${email}/claimedPromos/${promo.id}`);
    await setDoc(promoRef, {
      title: promo.title,
      description: promo.description,
      price: promo.price,
      promoType: promo.promoType || "global",
      startDate: promo.startDate,
      endDate: promo.endDate,
      isUsed: false, // Staff will mark as used later
      claimedAt: new Date().toISOString(),
    });

    // ✅ Then generate QR
    const qrCodeValue = JSON.stringify({
      type: "PROMO",
      promoId: promo.id,
      email: email,
    });

    setSelectedQR(qrCodeValue);
    setSelectedTitle(promo.title);
    setQrModalVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fdfcf9" }}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Available Promotions</Text>

        {userTier && (
          <Text style={styles.subHeader}>
            Your Tier: <Text style={styles.highlight}>{userTier}</Text>
          </Text>
        )}

        {/* 🔹 Available Promos */}
        {promos.length === 0 ? (
          <Text style={styles.noPromo}>
            No promotions available for your tier.
          </Text>
        ) : (
          promos.map((promo) => {
            const now = new Date();
            const isExpired =
              promo.endDate && new Date(promo.endDate) < now;

            return (
              <View key={promo.id} style={styles.promoCard}>
                {promo.image && (
                  <Image source={{ uri: promo.image }} style={styles.image} />
                )}
                <View style={{ paddingHorizontal: 5 }}>
                  <Text style={styles.promoTitle}>{promo.title}</Text>
                  <Text style={styles.promoDescription}>
                    {promo.description}
                  </Text>
                  <Text style={styles.priceTag}>₱{promo.price}</Text>

                  {promo.endDate && (
                    <Text style={styles.expiryText}>
                      Expires on:{" "}
                      {new Date(promo.endDate).toLocaleDateString()}
                    </Text>
                  )}

                  <TouchableOpacity
                    disabled={isExpired}
                    style={[
                      styles.buyButton,
                      isExpired && { backgroundColor: "#ccc" },
                    ]}
                    onPress={() => handleClaim(promo)}
                  >
                    <Text style={styles.buyButtonText}>
                      {isExpired ? "Expired" : "Buy"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* 🔹 Purchased Promos */}
        <Text style={[styles.header, { marginTop: 20 }]}>
          Your Purchased Promos
        </Text>

        {claimedPromos.length === 0 ? (
          <Text style={styles.noPromo}>
            You haven’t purchased any promos yet.
          </Text>
        ) : (
          claimedPromos.map((promo) => (
            <TouchableOpacity
              key={promo.id}
              style={styles.promoCard}
              onPress={() =>
                router.push({
                  pathname: "/PromoDetailsPage",
                  params: { email: email, promoId: promo.id },
                })
              }
            >
              <Text style={styles.promoTitle}>{promo.title}</Text>
              <Text style={styles.promoDescription} numberOfLines={2}>
                {promo.description}
              </Text>
              <Text style={styles.priceTag}>₱{promo.price}</Text>
              {promo.endDate && (
                <Text style={styles.expiryText}>
                  Expires on:{" "}
                  {new Date(promo.endDate).toLocaleDateString()}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 🔹 QR Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={qrModalVisible}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedTitle}</Text>
            {selectedQR && <QRCode value={selectedQR} size={220} />}
            <Text style={styles.instructions}>
              📱 Please show this QR code to the staff to confirm your promo
              purchase.
            </Text>
            <TouchableOpacity
              onPress={() => setQrModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4e342e",
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 16,
    color: "#6d4c41",
    marginBottom: 20,
  },
  highlight: {
    fontWeight: "bold",
    color: "#795548",
  },
  noPromo: {
    textAlign: "center",
    fontSize: 16,
    color: "#8d6e63",
    marginTop: 30,
  },
  promoCard: {
    backgroundColor: "#fff8e1",
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f5d27b",
  },
  image: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    marginBottom: 10,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3e2723",
  },
  promoDescription: {
    fontSize: 14,
    color: "#5d4037",
    marginTop: 4,
  },
  priceTag: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6d4c41",
    marginTop: 6,
  },
  expiryText: {
    fontSize: 12,
    color: "#8d6e63",
    marginTop: 5,
  },
  buyButton: {
    backgroundColor: "#795548",
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    alignItems: "center",
  },
  buyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    alignItems: "center",
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#3e2723",
  },
  instructions: {
    fontSize: 14,
    color: "#5d4037",
    marginTop: 15,
    textAlign: "center",
    lineHeight: 20,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#795548",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
