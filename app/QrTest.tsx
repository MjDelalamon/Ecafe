import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";

import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { db } from "../Firebase/firebaseConfig";

export default function QrTest() {
  const { qrValue, mobile } = useLocalSearchParams<{
    qrValue: string;
    mobile: string;
  }>();

  const router = useRouter();
  const [points, setPoints] = useState(0);
  const [tier, setTier] = useState("Bronze");
  const [promoModalVisible, setPromoModalVisible] = useState(true);

  const [nextTierInfo, setNextTierInfo] = useState({
    next: null,
    remaining: 0,
    progress: 0,
  });
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  // ✅ Determine Tier Based on Total Spent
  const determineTier = (spent: number) => {
    if (spent >= 15000) return "Gold";
    if (spent >= 5000) return "Silver";
    return "Bronze";
  };

  useFocusEffect(
  useCallback(() => {
    const fetchPromos = async () => {
      if (!qrValue) return;

      try {
        // 🔹 Get customer's tier
        const userRef = doc(db, "customers", qrValue);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;

        const tier = userSnap.data().tier;

        // 🔹 Get all promotions
        const promoSnap = await getDocs(collection(db, "promotions"));
        const now = new Date();

        // 🔹 Filter promos for this tier
        const availablePromos = promoSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (p: any) =>
              p.applicableTiers?.includes(tier) &&
              (!p.endDate || new Date(p.endDate) >= now)
          );

        // ✅ Only show alert if promos exist
        if (availablePromos.length > 0) {
          const promoNames = availablePromos
            .map((p: any) => `• ${p.title}`)
            .join("\n");

          Alert.alert(
            "🎉 New Promotions Available!",
            `Check your Promotions page to see the latest offers for your tier`,
          );
        }
      } catch (error) {
        console.error("Error checking promos:", error);
      }
    };

    fetchPromos();
  }, [qrValue])
);


  // ✅ Get Next Tier Info based on Total Spent
  const getNextTierInfo = (spent: number) => {
    if (spent < 5000)
      return { next: "Silver", remaining: 5000 - spent, progress: (spent / 5000) * 100 };
    if (spent < 15000)
      return { next: "Gold", remaining: 15000 - spent, progress: ((spent - 5000) / 10000) * 100 };
    return { next: null, remaining: 0, progress: 100 };
  };

  // ✅ Fetch customer data (with auto tier update)
  const fetchCustomerData = useCallback(async () => {
    if (!qrValue) return;
    try {
      const customerRef = doc(db, "customers", qrValue);
      // Set status to "Active" when user is in the app
      await updateDoc(customerRef, { status: "Active" });

      const snap = await getDoc(customerRef);
      if (snap.exists()) {
        const data = snap.data();
        setUserInfo(data); // Save user info for profile modal

        // Display points
        const pts = data.points || 0;
        setPoints(pts);

        // Tier and progress based on totalSpent
        const spent = data.totalSpent || 0;
        const newTier = determineTier(spent);
        setTier(newTier);
        setNextTierInfo(getNextTierInfo(spent));

        // Automatically update tier in Firestore if changed
        if (data.tier !== newTier) {
          await updateDoc(customerRef, { tier: newTier });
          console.log("Tier updated in Firestore to:", newTier);
        }
      }
    } catch (err) {
      console.error("Error fetching customer data:", err);
    }
  }, [qrValue]);

  // ✅ Auto-refresh when screen focused
  useFocusEffect(
    useCallback(() => {
      fetchCustomerData();
    }, [fetchCustomerData])
  );

  // 🔹 Navigation Handlers
  const handleWallet = () => router.push("/Wallet");
  const handleProfile = () =>
    router.push({ pathname: "/profileInfo", params: { email: qrValue } });
  const handleBack = async () => {
    if (qrValue) {
      const customerRef = doc(db, "customers", qrValue);
      await updateDoc(customerRef, { status: "Inactive" });
    }
    router.push("/landingPage");
  };
  const handleBrowse = () =>
    router.push({ pathname: "/RewardsCatalog", params: { email: qrValue } });
  const handleHistory = () =>
    router.push({ pathname: "/pointsHistory", params: { email: qrValue } });
  const handleOrders = () =>
    router.push({ pathname: "/orders", params: { email: qrValue } });

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        {qrValue ? (
          <QRCode value={qrValue} size={180} />
        ) : (
          <Text style={styles.error}>No QR code found</Text>
        )}
        <Text style={styles.barcodeText}>{mobile}</Text>

        <View style={styles.pointsBox}>
          <Text style={styles.pointsValue}>{points.toFixed(2)} Pts.</Text>
          <Text style={styles.tierText}>Tier: {tier}</Text>

          {nextTierInfo.next ? (
            <>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${nextTierInfo.progress}%` },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.nextTierText}>
  ₱{nextTierInfo.remaining.toFixed(0)} more in purchases to reach{" "}
  <Text style={{ fontWeight: "bold", color: "#795548" }}>
    {nextTierInfo.next}
  </Text>
</Text>
            </>
          ) : (
            <Text style={styles.maxTierText}>
              You’ve reached the highest tier — Gold! 🏆
            </Text>
          )}
        </View>

        <Text style={styles.scanHint}>
          Please scan your barcode before payment to earn points. Earn 1% of
          your total purchase in points.
        </Text>
      </View>

      <ScrollView style={{ flex: 1, width: "100%" }}>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridItem} onPress={handleWallet}>
            <MaterialIcons
              name="account-balance-wallet"
              size={32}
              color="#4e342e"
            />
            <Text style={styles.gridText}>Open Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={handleBrowse}>
            <FontAwesome5 name="store" size={28} color="#795548" />
            <Text style={styles.gridText}>Redeem reward</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={handleHistory}>
            <MaterialIcons name="history" size={32} color="#6d4c41" />
            <Text style={styles.gridText}>View History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={handleOrders}>
            <MaterialIcons name="receipt-long" size={32} color="#6d4c41" />
            <Text style={styles.gridText}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={handleProfile}>
            <Ionicons name="person-circle-outline" size={32} color="#795548" />
            <Text style={styles.gridText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
  style={styles.gridItem}
  onPress={() => router.push({ pathname: "/PromotionsPage", params: { email: qrValue } })}
>
  <FontAwesome5 name="gift" size={28} color="#795548" />
  <Text style={styles.gridText}>Promotions</Text>
</TouchableOpacity>

        </View>
      </ScrollView>

      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>⬅ Log out</Text>
      </TouchableOpacity>

      {/* Profile Modal */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileModalBox}>
            <TouchableOpacity
              style={styles.profileModalClose}
              onPress={() => setProfileModalVisible(false)}
            >
              <Text style={{ fontSize: 22, color: "#795548" }}>×</Text>
            </TouchableOpacity>
            <Ionicons
              name="person-circle-outline"
              size={64}
              color="#795548"
              style={{ alignSelf: "center" }}
            />
            <Text style={styles.profileTitle}>Profile Info</Text>
            {userInfo && (
              <>
                <Text style={styles.profileLabel}>Email:</Text>
                <Text style={styles.profileValue}>{userInfo.email}</Text>
                <Text style={styles.profileLabel}>Mobile:</Text>
                <Text style={styles.profileValue}>{userInfo.mobile}</Text>
                <Text style={styles.profileLabel}>Tier:</Text>
                <Text style={styles.profileValue}>{userInfo.tier}</Text>
                {userInfo.gender && (
                  <>
                    <Text style={styles.profileLabel}>Gender:</Text>
                    <Text style={styles.profileValue}>{userInfo.gender}</Text>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Promotions Modal */}
      <Modal
        visible={promoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPromoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileModalBox}>
            <TouchableOpacity
              style={styles.profileModalClose}
              onPress={() => setPromoModalVisible(false)}
            >
              <Text style={{ fontSize: 22, color: "#795548" }}>×</Text>
            </TouchableOpacity>
            <Text style={styles.profileTitle}>Promotions</Text>
            <Text style={{ color: "#3e2723", marginTop: 8 }}>
              - Welcome Promo: 50 points on first purchase{"\n"}- Weekend Bonus:
              Double points on Saturdays{"\n"}- Redeemable vouchers available in
              Rewards Catalog
            </Text>
            <TouchableOpacity
              style={[styles.backButton, { alignSelf: "center", marginTop: 12 }]}
              onPress={() => setPromoModalVisible(false)}
            >
              <Text style={styles.backButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ✅ Styles same as original
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fdfcf9", padding: 15, alignItems: "center" },
  qrContainer: {
    alignItems: "center",
    marginTop: 0,
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  barcodeText: { marginTop: 8, fontSize: 16, letterSpacing: 2, fontWeight: "600", color: "#4e342e" },
  pointsBox: { alignItems: "center", marginBottom: 20 },
  pointsValue: { fontSize: 30, fontWeight: "bold", color: "#161413ff", marginTop: 4 },
  tierText: { marginTop: 6, fontSize: 16, fontWeight: "bold", color: "#8d6e63" },
  nextTierText: { marginTop: 8, fontSize: 13, color: "#5d4037" },
  progressBarContainer: { width: 250, marginTop: 8, borderRadius: 10, overflow: "hidden" },
  progressBar: { width: "100%", height: 7, backgroundColor: "#d7ccc8", borderRadius: 10 },
  progressFill: { height: "100%", backgroundColor: "#45a350ff", borderRadius: 10 },
  maxTierText: { color: "#388e3c", marginTop: 8, fontWeight: "600" },
  scanHint: { fontSize: 12, color: "#6d4c41", marginTop: 4, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", width: "100%", marginTop: 10 },
  gridItem: {
    width: "47%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  gridText: { marginTop: 8, fontSize: 14, fontWeight: "600", textAlign: "center", color: "#3e2723" },
  backButton: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 20 },
  backButtonText: { fontSize: 16, color: "#6d4c41", fontWeight: "bold" },
  error: { fontSize: 16, color: "red" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center" },
  profileModalBox: { backgroundColor: "#fff", padding: 28, borderRadius: 18, width: "80%", alignItems: "flex-start", position: "relative" },
  profileModalClose: { position: "absolute", top: 10, right: 12, zIndex: 2 },
  profileTitle: { fontSize: 22, fontWeight: "bold", color: "#795548", alignSelf: "center", marginBottom: 10, marginTop: 10 },
  profileLabel: { fontSize: 15, color: "#6d4c41", fontWeight: "bold", marginTop: 8 },
  profileValue: { fontSize: 15, color: "#3e2723", marginBottom: 2 },
});
