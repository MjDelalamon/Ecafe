import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { db } from "../Firebase/firebaseConfig";
import Feedback from "./functions/Feedback";

export default function QrTest() {
  const { qrValue, mobile } = useLocalSearchParams<{
    qrValue: string;
    mobile: string;
  }>();

  const router = useRouter();
  const [points, setPoints] = useState(0);
  const [tier, setTier] = useState("Bronze");
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  const [nextTierInfo, setNextTierInfo] = useState({
    next: null,
    remaining: 0,
    progress: 0,
  });
  const [userInfo, setUserInfo] = useState<any>(null);
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // ✅ Determine Tier Based on PointsEarned
  const determineTier = (points: number) => {
    if (points >= 300) return "Gold";
    if (points >= 100) return "Silver";
    return "Bronze";
  };

  // ✅ Progress + Remaining Points per Tier
  const getNextTierInfo = (points: number) => {
    if (points < 100)
      return {
        next: "Silver",
        remaining: 100 - points,
        progress: (points / 100) * 100,
      };
    if (points < 300)
      return {
        next: "Gold",
        remaining: 300 - points,
        progress: ((points - 100) / 200) * 100,
      };
    return { next: null, remaining: 0, progress: 100 };
  };

  // ✅ Dynamic Progress Bar Color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Silver":
        return "#7d7d7dff";
      case "Gold":
        return "#ffd900ff";
      default:
        return "#cd7f32"; // Bronze
    }
  };

  const toggleHelpModal = () => setHelpModalVisible(!helpModalVisible);

  const [promoAlertShown, setPromoAlertShown] = useState(false);

useFocusEffect(
  useCallback(() => {
    const fetchPromos = async () => {
      if (!qrValue || promoAlertShown) return; // ✅ Stop if already shown

      try {
        const userRef = doc(db, "customers", qrValue);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;

        const tier = userSnap.data().tier;
        const promoSnap = await getDocs(collection(db, "promotions"));
        const now = new Date();

        const availablePromos = promoSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (p: any) =>
              p.applicableTiers?.includes(tier) &&
              (!p.endDate || new Date(p.endDate) >= now)
          );

        if (availablePromos.length > 0) {
          alert(
            "🎉 New Promotions Available!\nCheck your Promotions page to see the latest offers for your tier"
          );
          setPromoAlertShown(true); // ✅ Mark as shown
        }
      } catch (error) {
        console.error("Error checking promos:", error);
      }
    };

    fetchPromos();
  }, [qrValue, promoAlertShown])
);


  const fetchCustomerData = useCallback(async () => {
  if (!qrValue) return;
  try {
    const customerRef = doc(db, "customers", qrValue);
    
    await updateDoc(customerRef, { status: "Active" });

    const snap = await getDoc(customerRef);
    if (!snap.exists()) return;
    const data = snap.data();
    setUserInfo(data);
    setPoints(data.points || 0);

    // ✅ Check if customer has any transactions
    const transRef = collection(db, "customers", qrValue, "transactions");
    const transSnap = await getDocs(transRef);

    const hasTransactions = !transSnap.empty; // 🔹 Check if collection has documents

    let totalPointsEarned = 0;
    transSnap.forEach((doc) => {
      const tData = doc.data();
      totalPointsEarned += tData.pointsEarned || 0;
    });

    const newTier = determineTier(totalPointsEarned);
    setTier(newTier);
    setNextTierInfo(getNextTierInfo(totalPointsEarned));

    if (data.tier !== newTier) {
      await updateDoc(customerRef, { tier: newTier });
      console.log("Tier updated to:", newTier);
    }

    // ✅ Feedback condition: only show if has transactions
    // ✅ Feedback condition: show only if there are 5 or more transactions
const totalTransactions = transSnap.size; // count the number of docs in the "transactions" collection

if (totalTransactions >= 5) {
  const now = new Date().getTime();
  const lastPrompt = data.lastFeedbackPrompt?.toMillis?.() || 0;
  const skippedRecently = now - lastPrompt < 24 * 60 * 60 * 1000; // 24 hours

  if (!data.feedbackGiven && !skippedRecently) {
    console.log("🟢 Showing feedback modal — user reached 5+ transactions");
    setFeedbackVisible(true);
  }
} else {
  console.log(`⏸ Not enough transactions yet (${totalTransactions}/5) — feedback not shown.`);
}


  } catch (err) {
    console.error("Error fetching customer data:", err);
  }
}, [qrValue]);


 


  useFocusEffect(
    useCallback(() => {
      fetchCustomerData();
    }, [fetchCustomerData])
  );

  const routerPush = (path: string) =>
    router.push({ pathname: path, params: { email: qrValue } });

  const handleBack = async () => {
    if (qrValue)
      await updateDoc(doc(db, "customers", qrValue), { status: "Inactive" });
    router.push("/landingPage");
  };

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        {qrValue ? <QRCode value={qrValue} size={180} /> : <Text style={styles.error}>No QR code found</Text>}
        <Text style={styles.barcodeText}>{mobile}</Text>

        {/* ✅ Points + Tier + Progress Bar with Help */}
        <View style={styles.pointsBox}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.pointsValue}>{points.toFixed(2)} Pts</Text>
            <TouchableOpacity onPress={toggleHelpModal} style={{ marginLeft: 5 }}>
              <FontAwesome5 name="question-circle" size={15} color="#722205ff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.tierText}>Tier: {tier}</Text>

          {nextTierInfo.next ? (
            <>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${nextTierInfo.progress}%`, backgroundColor: getTierColor(tier) },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.nextTierText}>
                {nextTierInfo.remaining} more points to reach{" "}
                <Text style={{ fontWeight: "bold", color: getTierColor(nextTierInfo.next) }}>
                  {nextTierInfo.next}
                </Text>
              </Text>
            </>
          ) : (
            <Text style={styles.maxTierText}>You’ve reached the highest tier — Gold! 🏆</Text>
          )}
        </View>

        <Text style={styles.scanHint}>
          Get 5% back! Have the staff scan these points to earn rewards.
        </Text>
      </View>

      {/* 🔹 Help Modal */}
      <Modal
        visible={helpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={toggleHelpModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.helpModalContent}>
            <Text style={styles.modalTitle}>Tier Info</Text>
            <Text style={styles.modalText}>
  

  🟤 <Text style={{ fontWeight: "bold" }}>Bronze (0–99 points)</Text>{"\n"}
  - You’re just starting out! Keep making purchases to earn points.{"\n"}
  - Once you reach 100 points, you’ll level up to Silver.{"\n\n"}

  ⚪ <Text style={{ fontWeight: "bold" }}>Silver (100–299 points)</Text>{"\n"}
  - Great job! You now get access to exclusive offers.{"\n"}
  - Keep collecting points—reach 300 to unlock Gold tier rewards.{"\n\n"}

  🟡 <Text style={{ fontWeight: "bold" }}>Gold (300 points and above)</Text>{"\n"}
  - Congratulations! You’ve reached the highest tier.{"\n"}
  - Enjoy premium perks,and special promotions.{"\n\n"}

  Keep Purchaising and collecting points to unlock more rewards and enjoy the benefits of your tier!
</Text>


            <TouchableOpacity style={styles.closeButton} onPress={toggleHelpModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Feedback
  visible={feedbackVisible}
  email={qrValue || ""}
  orderId={userInfo?.latestTransactionId || ""} // ensure you have latest transaction ID
  onClose={() => setFeedbackVisible(false)}
/>


      {/* 🔹 Navigation Buttons */}
      <ScrollView style={{ flex: 1, width: "100%" }}>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridItem} onPress={() => routerPush("/Wallet")}>
            <MaterialIcons name="account-balance-wallet" size={32} color="#722205ff" />
            <Text style={styles.gridText}>Open Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => routerPush("/RewardsCatalog")}>
            <FontAwesome5 name="store" size={28} color="#722205ff" />
            <Text style={styles.gridText}>Redeem Reward</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => routerPush("/pointsHistory")}>
            <MaterialIcons name="history" size={32} color="#722205ff" />
            <Text style={styles.gridText}>View History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => routerPush("/orders")}>
            <MaterialIcons name="receipt-long" size={32} color="#722205ff" />
            <Text style={styles.gridText}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => routerPush("/profileInfo")}>
            <Ionicons name="person-circle-outline" size={32} color="#722205ff" />
            <Text style={styles.gridText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => routerPush("/PromotionsPage")}>
            <FontAwesome5 name="gift" size={28} color="#722205ff" />
            <Text style={styles.gridText}>Promotions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      
    </View> 
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fdfcf9", padding: 15, alignItems: "center" },
  qrContainer: { alignItems: "center", marginBottom: 20, backgroundColor: "#fff", padding: 20, borderRadius: 16, elevation: 5, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 3 }, shadowRadius: 5 },
  barcodeText: { marginTop: 8, fontSize: 16, letterSpacing: 2, fontWeight: "600", color: "#4e342e" },
  pointsBox: { alignItems: "center", marginBottom: 20 },
  pointsValue: { fontSize: 30, fontWeight: "bold", color: "#161413ff", marginTop: 4 },
  tierText: { marginTop: 6, fontSize: 16, fontWeight: "bold", color: "#722205ff" },
  nextTierText: { marginTop: 8, fontSize: 13, color: "#722205ff" },
  progressBarContainer: { width: 250, marginTop: 8, borderRadius: 10, overflow: "hidden" },
  progressBar: { width: "100%", height: 7, backgroundColor: "#fff4efff", borderRadius: 10 },
  progressFill: { height: "100%", borderRadius: 10 },
  maxTierText: { color: "#388e3c", marginTop: 8, fontWeight: "600" },
  scanHint: { fontSize: 12, color: "#722205ff", marginTop: 4, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", width: "100%", marginTop: 10 },
  gridItem: { width: "47%", backgroundColor: "#fff", padding: 20, borderRadius: 12, alignItems: "center", marginVertical: 8, elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  gridText: { marginTop: 8, fontSize: 14, fontWeight: "600", textAlign: "center", color: "#3e2723" },
  backButton: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 20 },
  backButtonText: { fontSize: 16, color: "#6d4c41", fontWeight: "bold" },
  error: { fontSize: 16, color: "red" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  helpModalContent: { backgroundColor: "#fffdf9", borderRadius: 20, width: "80%", padding: 20, alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#4e342e" },
  modalText: { fontSize: 14, color: "#5d4037", textAlign: "center" },
  closeButton: { marginTop: 20, backgroundColor: "#722205ff", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10 },
  closeButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
