import { useLocalSearchParams } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
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
  specificCustomerId?: string;
  image?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  price: number;
  promoType?: "global" | "personalized";
  personalizedOption?: "category" | "specific";
}

export default function PromotionsPage() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [promos, setPromos] = useState<PromotionType[]>([]);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [favoriteCategory, setFavoriteCategory] = useState<string | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  const animatedValues = useRef<Animated.Value[]>([]);

  // 🔹 Helpers
  const getDaysUntilStart = (startDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Starting today!";
    if (diffDays === 1) return "Starts tomorrow!";
    return `Starts in ${diffDays} days`;
  };

  const getDaysUntilEnd = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Expired";
    if (diffDays === 1) return "Ends tomorrow!";
    if (diffDays <= 3) return `Ends in ${diffDays} days`;
    return null;
  };

  // 🔹 Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!email) return;

      const userRef = doc(db, "customers", email);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      const userData = userSnap.data();
      setUserTier(userData.tier);
      setFavoriteCategory(userData.favoriteCategory || null);

      const promoSnap = await getDocs(collection(db, "promotions"));
      const now = new Date();

      const filteredPromos = promoSnap.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() as PromotionType) }))
        .filter((promo) => {
          const startDate = promo.startDate ? new Date(promo.startDate) : null;
          const endDate = promo.endDate ? new Date(promo.endDate) : null;
          const notExpired = !endDate || endDate >= now;

          let matchesUser = false;
          if (promo.promoType === "global") {
            matchesUser =
              !promo.applicableTiers || promo.applicableTiers.length === 0 || promo.applicableTiers.includes(userData.tier);
          } else if (promo.promoType === "personalized") {
            if (promo.personalizedOption === "category") {
              matchesUser =
                (!promo.applicableTiers || promo.applicableTiers.includes(userData.tier)) &&
                promo.category === userData.favoriteCategory;
            } else if (promo.personalizedOption === "specific") {
              matchesUser = promo.specificCustomerId?.toLowerCase() === email.toLowerCase();
            }
          }
          return matchesUser && notExpired;
        });

      setPromos(filteredPromos);
      animatedValues.current = filteredPromos.map(() => new Animated.Value(0));

      filteredPromos.forEach((_, index) => {
        Animated.timing(animatedValues.current[index], {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.bounce,
        }).start();
      });
    };

    fetchData();
  }, [email]);

  const handleAvail = (promo: PromotionType) => {
    if (!email) return;
    const now = new Date();
    if (promo.endDate && new Date(promo.endDate) < now) {
      Alert.alert("Promo expired", "This promo can no longer be availed.");
      return;
    }
    const qrCodeValue = JSON.stringify({ type: "PROMO", promoId: promo.id, email });
    setSelectedQR(qrCodeValue);
    setSelectedTitle(promo.title);
    setQrModalVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f9f9f9" }}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Available Promotions</Text>
        {userTier && (
          <Text style={styles.subHeader}>
            Your Tier: <Text style={styles.highlight}>{userTier}</Text>
          </Text>
        )}

        {promos.length === 0 ? (
          <Text style={styles.noPromo}>No promotions available for you.</Text>
        ) : (
          promos.map((promo, index) => {
            const now = new Date();
            const startDate = promo.startDate ? new Date(promo.startDate) : null;
            const endDate = promo.endDate ? new Date(promo.endDate) : null;
            const isExpired = endDate && endDate < now;
            const isComingSoon = startDate && startDate > now;
            const nearExpiry = endDate && getDaysUntilEnd(promo.endDate)?.includes("Ends");

            const animValue = animatedValues.current[index];
            const animatedStyle = animValue
              ? {
                  opacity: animValue,
                  transform: [
                    {
                      scale: animValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.85, 1],
                      }),
                    },
                  ],
                }
              : {};

            return (
              <Animated.View
                key={promo.id}
                style={[
                  styles.promoCard,
                  {
                    backgroundColor: "#ffffff",
                    borderColor: "#cccccc",
                    opacity: isComingSoon ? 0.4 : 1, // dim Coming Soon
                  },
                  nearExpiry && { backgroundColor: "#fff4f4", borderColor: "#ff6b6b" },
                  isExpired && { backgroundColor: "#eeeeee", borderColor: "#bdbdbd", opacity: 0.6 },
                  animatedStyle,
                ]}
              >
                {promo.promoType === "personalized" && (
                  <View style={styles.personalizedBadge}>
                    <Text style={styles.personalizedText}>Just For You</Text>
                  </View>
                )}
                {promo.image && <Image source={{ uri: promo.image }} style={styles.image} />}
                <View style={{ paddingHorizontal: 10 }}>
                  <Text style={styles.promoTitle}>{promo.title}</Text>
                  <Text style={styles.promoDescription}>{promo.description}</Text>
                  <Text style={styles.priceTag}>₱{promo.price.toFixed(2)}</Text>

                  {isComingSoon && promo.startDate && (
                    <Text style={[styles.infoText, { color: "#999", fontStyle: "italic" }]}>
                      {getDaysUntilStart(promo.startDate)}
                    </Text>
                  )}

                  {promo.endDate && getDaysUntilEnd(promo.endDate) && (
                    <Text
                      style={[
                        styles.infoText,
                        getDaysUntilEnd(promo.endDate)?.includes("End") && {
                          color: "#c62828",
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {getDaysUntilEnd(promo.endDate)}
                    </Text>
                  )}

                  <TouchableOpacity
                    disabled={isExpired || isComingSoon}
                    style={[
                      styles.buyButton,
                      { backgroundColor: isComingSoon || isExpired ? "#ccc" : "#5c3a21" },
                    ]}
                    onPress={() => handleAvail(promo)}
                  >
                    <Text style={styles.buyButtonText}>
                      {isExpired ? "Expired" : isComingSoon ? "Coming Soon" : "Avail Promo"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={qrModalVisible}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { opacity: qrModalVisible ? 1 : 0 }]}>
            <Text style={styles.modalTitle}>{selectedTitle}</Text>
            {selectedQR && <QRCode value={selectedQR} size={220} />}
            <Text style={styles.instructions}>
              Please show this QR code to the staff to confirm your promo purchase.
            </Text>
            <TouchableOpacity onPress={() => setQrModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 10 },
  subHeader: { fontSize: 16, color: "#555", marginBottom: 20 },
  highlight: { fontWeight: "bold", color: "#333" },
  noPromo: { textAlign: "center", fontSize: 16, color: "#888", marginTop: 30 },
  promoCard: {
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    position: "relative",
  },
  personalizedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#252530ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 1,
  },
  personalizedText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  image: { width: "100%", height: 160, borderTopLeftRadius: 16, borderTopRightRadius: 16, marginBottom: 12 },
  promoTitle: { fontSize: 20, fontWeight: "700", color: "#333" },
  promoDescription: { fontSize: 15, color: "#555", marginTop: 4 },
  priceTag: { fontSize: 17, fontWeight: "bold", color: "#333", marginTop: 6 },
  infoText: { fontSize: 13, color: "#888", marginTop: 4 },
  buyButton: { paddingVertical: 10, borderRadius: 12, marginTop: 12, alignItems: "center" },
  buyButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 25, alignItems: "center", width: "80%" },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15, color: "#333" },
  instructions: { fontSize: 14, color: "#555", marginTop: 15, textAlign: "center", lineHeight: 22 },
  closeButton: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: "#333" },
  closeText: { color: "#fff", fontWeight: "bold" },
});
