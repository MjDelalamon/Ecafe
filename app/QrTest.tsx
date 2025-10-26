

import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
  const [nextTierInfo, setNextTierInfo] = useState({
    next: null,
    remaining: 0,
    progress: 0,
  });
  const [userInfo, setUserInfo] = useState<any>(null);

  // ✅ Determine Tier Based on PointsEarned
  const determineTier = (points: number) => {
    if (points >= 600) return "Platinum";
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
    if (points < 600)
      return {
        next: "Platinum",
        remaining: 600 - points,
        progress: ((points - 300) / 300) * 100,
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
      case "Platinum":
        return "#00bcd4";
      default:
        return "#cd7f32"; // Bronze
    }
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

          alert(
            `"🎉 New Promotions Available!",
            Check your Promotions page to see the latest offers for your tier`,
          );
        }
      } catch (error) {
        console.error("Error checking promos:", error);
      }
    };

    fetchPromos();
  }, [qrValue])
);





  // ✅ Fetch Customer Data
  const fetchCustomerData = useCallback(async () => {
    if (!qrValue) return;
    try {
      const customerRef = doc(db, "customers", qrValue);
      await updateDoc(customerRef, { status: "Active" });

      const snap = await getDoc(customerRef);
      if (!snap.exists()) return;
      const data = snap.data();
      setUserInfo(data);

      // 🟢 Display current points directly from customer field
      setPoints(data.points || 0);

      // 🧮 Compute total pointsEarned for tier calculation
      const transRef = collection(db, "customers", qrValue, "transactions");
      const transSnap = await getDocs(transRef);

      let totalPointsEarned = 0;
      transSnap.forEach((doc) => {
        const tData = doc.data();
        totalPointsEarned += tData.pointsEarned || 0;
      });

      // 🏅 Tier and progress based on total pointsEarned
      const newTier = determineTier(totalPointsEarned);
      setTier(newTier);
      setNextTierInfo(getNextTierInfo(totalPointsEarned));

      // 🔄 Update tier in Firestore if changed
      if (data.tier !== newTier) {
        await updateDoc(customerRef, { tier: newTier });
        console.log("Tier updated to:", newTier);
      }
    } catch (err) {
      console.error("Error fetching customer data:", err);
    }
  }, [qrValue]);

  // 🔄 Refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchCustomerData();
    }, [fetchCustomerData])
  );

  // 🔹 Navigation
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
        {qrValue ? (
          <QRCode value={qrValue} size={180} />
        ) : (
          <Text style={styles.error}>No QR code found</Text>
        )}
        <Text style={styles.barcodeText}>{mobile}</Text>

        {/* ✅ Points + Tier + Progress Bar */}
        <View style={styles.pointsBox}>
          <Text style={styles.pointsValue}>{points.toFixed(2)} Pts</Text>
          <Text style={styles.tierText}>Tier: {tier}</Text>

          {nextTierInfo.next ? (
            <>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${nextTierInfo.progress}%`,
                        backgroundColor: getTierColor(tier),
                      },
                    ]}
                  />
                </View>
              </View>

              <Text style={styles.nextTierText}>
                {nextTierInfo.remaining} more points to reach{" "}
                <Text
                  style={{
                    fontWeight: "bold",
                    color: getTierColor(nextTierInfo.next),
                  }}
                >
                  {nextTierInfo.next}
                </Text>
              </Text>
            </>
          ) : (
            <Text style={styles.maxTierText}>
              You’ve reached the highest tier — Platinum! 🏆
            </Text>
          )}
        </View>

        <Text style={styles.scanHint}>
          Earn points with every transaction! Your loyalty determines your tier.
        </Text>
      </View>

      {/* 🔹 Navigation Buttons */}
      <ScrollView style={{ flex: 1, width: "100%" }}>
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => routerPush("/Wallet")}
          >
            <MaterialIcons
              name="account-balance-wallet"
              size={32}
              color="#4e342e"
            />
            <Text style={styles.gridText}>Open Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => routerPush("/RewardsCatalog")}
          >
            <FontAwesome5 name="store" size={28} color="#795548" />
            <Text style={styles.gridText}>Redeem Reward</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => routerPush("/pointsHistory")}
          >
            <MaterialIcons name="history" size={32} color="#6d4c41" />
            <Text style={styles.gridText}>View History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => routerPush("/orders")}
          >
            <MaterialIcons name="receipt-long" size={32} color="#6d4c41" />
            <Text style={styles.gridText}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => routerPush("/profileInfo")}
          >
            <Ionicons name="person-circle-outline" size={32} color="#795548" />
            <Text style={styles.gridText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => routerPush("/PromotionsPage")}
          >
            <FontAwesome5 name="gift" size={28} color="#795548" />
            <Text style={styles.gridText}>Promotions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>⬅ Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdfcf9",
    padding: 15,
    alignItems: "center",
  },
  qrContainer: {
    alignItems: "center",
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
  barcodeText: {
    marginTop: 8,
    fontSize: 16,
    letterSpacing: 2,
    fontWeight: "600",
    color: "#4e342e",
  },
  pointsBox: {
    alignItems: "center",
    marginBottom: 20,
  },
  pointsValue: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#161413ff",
    marginTop: 4,
  },
  tierText: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "bold",
    color: "#8d6e63",
  },
  nextTierText: {
    marginTop: 8,
    fontSize: 13,
    color: "#5d4037",
  },
  progressBarContainer: {
    width: 250,
    marginTop: 8,
    borderRadius: 10,
    overflow: "hidden",
  },
  progressBar: {
    width: "100%",
    height: 7,
    backgroundColor: "#d7ccc8",
    borderRadius: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  maxTierText: {
    color: "#388e3c",
    marginTop: 8,
    fontWeight: "600",
  },
  scanHint: {
    fontSize: 12,
    color: "#6d4c41",
    marginTop: 4,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
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
  gridText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: "#3e2723",
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: "#6d4c41",
    fontWeight: "bold",
  },
  error: {
    fontSize: 16,
    color: "red",
  },
});
