import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { db } from "../Firebase/firebaseConfig";
import Feedback from "./functions/Feedback";
import NewComerModal from "./functions/NewComerModal";

export default function QrTest() {
  const { qrValue, mobile } = useLocalSearchParams<{ qrValue: string; mobile: string }>();
  const router = useRouter();

  const [points, setPoints] = useState(0);
  const [tier, setTier] = useState("Bronze");
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [nextTierInfo, setNextTierInfo] = useState({ next: null, remaining: 0, progress: 0 });
  const [userInfo, setUserInfo] = useState<any>(null);
  const [promoAlertShown, setPromoAlertShown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newComerModalVisible, setNewComerModalVisible] = useState(false);

  // ==============================
  // 🔔 Notification Listener
  // ==============================
  useEffect(() => {
    if (!qrValue) return;

    const notifRef = collection(db, "customers", qrValue, "notifications");
    const qUnread = query(notifRef, where("isRead", "==", false));

    const unsubscribe = onSnapshot(qUnread, (snap) => {
      setUnreadCount(snap.size);
    });

    return () => unsubscribe();
  }, [qrValue]);

  const openNotifications = async () => {
    router.push({
      pathname: "/NotificationScreen",
      params: { email: qrValue },
    });

    const notifRef = collection(db, "customers", qrValue, "notifications");
    const notifSnap = await getDocs(notifRef);
    const batch = writeBatch(db);

    notifSnap.docs.forEach((docSnap) => {
      if (!docSnap.data().isRead) {
        batch.update(doc(db, "customers", qrValue, "notifications", docSnap.id), { isRead: true });
      }
    });

    await batch.commit();
    setUnreadCount(0);
  };

  const determineTier = (points: number) => {
    if (points >= 300) return "Gold";
    if (points >= 100) return "Silver";
    return "Bronze";
  };

  const getNextTierInfo = (points: number) => {
    if (points < 100)
      return { next: "Silver", remaining: 100 - points, progress: (points / 100) * 100 };
    if (points < 300)
      return { next: "Gold", remaining: 300 - points, progress: ((points - 100) / 200) * 100 };
    return { next: null, remaining: 0, progress: 100 };
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Silver":
        return "#7d7d7dff";
      case "Gold":
        return "#ffd900ff";
      default:
        return "#722205ff";
    }
  };

  // ==============================
  // 🔄 Real-time User Listener
  // ==============================
  useEffect(() => {
    if (!qrValue) return;

    const customerRef = doc(db, "customers", qrValue);
    const transactionsRef = collection(db, "customers", qrValue, "transactions");

    const unsubscribeCustomer = onSnapshot(customerRef, async (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();
      setUserInfo(data || {});
      const totalPoints = data?.points || 0;
      setPoints(totalPoints);

      // 🔥 NEWCOMER CHECK → Show onboarding modal if true
      if (data?.newComer === true) {
        setNewComerModalVisible(true);

        // 🔥 Update Firestore so it shows only ONCE
        await updateDoc(customerRef, { newComer: false }).catch(console.error);
      }

      const transSnap = await getDocs(transactionsRef);
      let totalPointsEarned = 0;
      transSnap.forEach((doc) => {
        totalPointsEarned += doc.data()?.pointsEarned || 0;
      });

      const newTier = determineTier(totalPointsEarned);
      setTier(newTier);
      setNextTierInfo(getNextTierInfo(totalPointsEarned));

      if (data?.tier !== newTier) {
        await updateDoc(customerRef, { tier: newTier }).catch(console.error);
      }

      const totalTransactions = transSnap.size;
      const now = new Date().getTime();
      const lastPrompt = data?.lastFeedbackPrompt?.toMillis?.() || 0;
      const skippedRecently = now - lastPrompt < 24 * 60 * 60 * 1000;

      if (totalTransactions >= 5 && !data?.feedbackGiven && !skippedRecently) {
        setFeedbackVisible(true);
      }

      if (!promoAlertShown) {
        const promoSnap = await getDocs(collection(db, "promotions"));
        const availablePromos = promoSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (p: any) =>
              p?.applicableTiers?.includes(newTier) &&
              (!p?.endDate || new Date(p.endDate) >= new Date())
          );
        if (availablePromos.length > 0) {
          alert("🎉 New Promotions Available! Check your Promotions page.");
          setPromoAlertShown(true);
        }
      }
    });

    updateDoc(customerRef, { status: "Active" }).catch(console.error);

    return () => {
      updateDoc(customerRef, { status: "Inactive" }).catch(console.error);
      unsubscribeCustomer();
    };
  }, [qrValue, promoAlertShown]);

  const routerPush = (path: string) => router.push({ pathname: path, params: { email: qrValue } });

  // ==============================
  // UI RENDER
  // ==============================
  return (
    <View style={styles.container}>

      {/* 🔔 Notification Bell */}
      <TouchableOpacity style={styles.notifIcon} onPress={openNotifications}>
        <Ionicons name="notifications-outline" size={28} color="#722205ff" />
        {unreadCount > 0 && (
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.qrContainer}>
        {qrValue ? <QRCode value={qrValue} size={180} /> : <Text>No QR code</Text>}
        <Text style={styles.barcodeText}>{mobile || "No Mobile"}</Text>

        <View style={styles.pointsBox}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.pointsValue}>{points?.toFixed(2) || 0} Pts</Text>

            {/* ❓ Question mark → Opens NewComer Modal */}
            <TouchableOpacity onPress={() => setNewComerModalVisible(true)} style={{ marginLeft: 5 }}>
              <FontAwesome5 name="question-circle" size={15} color="#722205ff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.tierText}>
            Tier: <Text style={{ color: getTierColor(tier) }}>{tier}</Text>
          </Text>

          {nextTierInfo?.next ? (
            <>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${nextTierInfo.progress || 0}%`,
                        backgroundColor: getTierColor(tier),
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.nextTierText}>
                {nextTierInfo.remaining?.toFixed(2)} pts to reach{" "}
                <Text style={{ fontWeight: "bold", color: getTierColor(nextTierInfo.next) }}>
                  {nextTierInfo.next}
                </Text>
              </Text>
            </>
          ) : (
            <Text style={styles.maxTierText}>You’ve reached Gold! 🏆</Text>
          )}
        </View>

        <Text style={styles.scanHint}>Get 2% back! Have the staff scan these points.</Text>
      </View>

      {/* ⭐ FEEDBACK MODAL */}
      <Feedback
        visible={feedbackVisible}
        email={qrValue || ""}
        orderId={userInfo?.latestTransactionId || ""}
        onClose={() => setFeedbackVisible(false)}
      />

      {/* 🆕 NEWCOMER ONBOARDING MODAL */}
      <NewComerModal
        visible={newComerModalVisible}
        onClose={() => setNewComerModalVisible(false)}
      />

      <ScrollView style={{ flex: 1, width: "100%" }}>
        <View style={styles.grid}>
          {[
            { path: "/Wallet", icon: MaterialIcons, iconName: "account-balance-wallet", label: "Open Wallet" },
            { path: "/RewardsCatalog", icon: FontAwesome5, iconName: "store", label: "Redeem Reward" },
            { path: "/pointsHistory", icon: MaterialIcons, iconName: "history", label: "View History" },
            { path: "/orders", icon: MaterialIcons, iconName: "receipt-long", label: "Orders" },
            { path: "/profileInfo", icon: Ionicons, iconName: "person-circle-outline", label: "Profile" },
            { path: "/PromotionsPage", icon: FontAwesome5, iconName: "gift", label: "Promotions" },
          ].map((item, idx) => {
            const IconComp = item.icon;
            return (
              <TouchableOpacity key={idx} style={styles.gridItem} onPress={() => routerPush(item.path)}>
                <IconComp name={item.iconName} size={28} color="#722205ff" />
                <Text style={styles.gridText}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ==============================
// STYLES
// ==============================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fdfcf9", padding: 15, alignItems: "center" },

  notifIcon: { position: "absolute", top: 20, right: 20, zIndex: 10 },
  notifBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  notifBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },

  qrContainer: {
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    elevation: 5,
    width: "100%",
  },
  barcodeText: { marginTop: 8, fontSize: 16, letterSpacing: 2, fontWeight: "600", color: "#4e342e" },

  pointsBox: { alignItems: "center", marginBottom: 20 },
  pointsValue: { fontSize: 30, fontWeight: "bold", color: "#161413ff", marginTop: 4 },
  tierText: { marginTop: 6, fontSize: 16, fontWeight: "bold", color: "black" },
  nextTierText: { marginTop: 8, fontSize: 13, color: "#722205ff" },

  progressBarContainer: { width: 250, marginTop: 8, borderRadius: 10, overflow: "hidden" },
  progressBar: { width: "100%", height: 7, backgroundColor: "#fff4efff", borderRadius: 10 },
  progressFill: { height: "100%", borderRadius: 10 },

  maxTierText: { color: "#388e3c", marginTop: 8, fontWeight: "600" },
  scanHint: { fontSize: 12, color: "#722205ff", marginTop: 4, textAlign: "center" },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", width: "100%", marginTop: 10 },
  gridItem: {
    width: "47%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 8,
    elevation: 3,
  },
  gridText: { marginTop: 8, fontSize: 14, fontWeight: "600", textAlign: "center", color: "#3e2723" },
});
