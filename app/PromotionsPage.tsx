import { useLocalSearchParams } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
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
  startDate?: string;
  price: number;
}

export default function PromotionsPage() {
  const { email } = useLocalSearchParams<{ email: string }>();

  const [promos, setPromos] = useState<PromotionType[]>([]);
  const [userTier, setUserTier] = useState<string | null>(null);
  
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

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

  // 🔹 Fetch Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      if (!email) return;

      const userRef = doc(db, "customers", email);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const tier = userSnap.data().tier;
      setUserTier(tier);

      const promoSnap = await getDocs(collection(db, "promotions"));
      const now = new Date();
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

      
    };

    fetchData();
  }, [email]);

  // 🔹 Handle Promo Claim
  // 🔹 Handle Promo Avail (QR only)
const handleAvail = (promo: PromotionType) => {
  if (!email) return;

  const now = new Date();
  if (promo.endDate && new Date(promo.endDate) < now) {
    Alert.alert("Promo expired", "This promo can no longer be availed.");
    return;
  }

  // 🔹 Generate QR only (no Firestore write)
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

        {promos.length === 0 ? (
          <Text style={styles.noPromo}>
            No promotions available for your tier.
          </Text>
        ) : (
          promos.map((promo) => {
            const now = new Date();
            const startDate = promo.startDate ? new Date( promo.startDate) : null;
            const endDate = promo.endDate ? new Date(promo.endDate) : null;

            const isExpired = endDate && endDate < now;
            const isComingSoon = startDate && startDate > now;
            const nearExpiry =
              endDate && getDaysUntilEnd(promo.endDate)?.includes("Ends");

            return (
              <View
                key={promo.id}
                style={[
                  styles.promoCard,
                  isComingSoon && { backgroundColor: "#fff3e0", borderColor: "#ffb74d" },
                  nearExpiry && { backgroundColor: "#ffecec", borderColor: "#ef5350" },
                  isExpired && { backgroundColor: "#eeeeee", borderColor: "#bdbdbd" },
                ]}
              >
                {promo.image && (
                  <Image source={{ uri: promo.image }} style={styles.image} />
                )}
                <View style={{ paddingHorizontal: 5 }}>
                  <Text style={styles.promoTitle}>{promo.title}</Text>
                  <Text style={styles.promoDescription}>
                    {promo.description}
                  </Text>
                  <Text style={styles.priceTag}>₱{promo.price}.00</Text>

                  {/* 🔹 Coming Soon Indicator */}
                  {isComingSoon && promo.startDate && (
                    <Text style={[styles.infoText, { color: "#ef6c00", fontWeight: "600" }]}>
                      {getDaysUntilStart(promo.startDate)}
                    </Text>
                  )}

                  {/* 🔹 Near Expiry Indicator */}
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
                      (isExpired || isComingSoon) && { backgroundColor: "#ccc" },
                    ]}
                    onPress={() => handleAvail(promo)}

                  >
                    <Text style={styles.buyButtonText}>
  {isExpired ? "Expired" : isComingSoon ? "Coming Soon" : "Avail Promo"}
</Text>

                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* 🔹 Purchased Promos */}
       

        
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
              Please show this QR code to the staff to confirm your promo
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
  container: { padding: 20 },
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
  infoText: {
    fontSize: 13,
    color: "#8d6e63",
    marginTop: 4,
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
  closeText: { color: "#fff", fontWeight: "bold" },
});
