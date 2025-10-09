import { Ionicons } from "@expo/vector-icons";
import { addDoc, collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Animated,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../Firebase/firebaseConfig";

interface RewardsPromotionsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function RewardsPromotionsModal({
  visible,
  onClose,
}: RewardsPromotionsModalProps) {
  const [promoName, setPromoName] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [value, setValue] = useState("");
  const [promotions, setPromotions] = useState<any[]>([]);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      fetchPromotions();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const fetchPromotions = async () => {
    const querySnapshot = await getDocs(collection(db, "promotions"));
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setPromotions(data);
  };

  const handleAddPromo = async () => {
    if (!promoName || !value) return;
    await addDoc(collection(db, "promotions"), {
      promoName,
      discountType,
      value,
    });
    setPromoName("");
    setValue("");
    fetchPromotions();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={styles.title}>🎁 Exclusive Café Offers</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#b26a3d" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Enjoy special rewards and discounts crafted just for you.
          </Text>

          {/* Promo Form */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Promo Name (e.g. 10% Off on Coffee)"
              placeholderTextColor="#b8a18d"
              value={promoName}
              onChangeText={setPromoName}
            />
            <TextInput
              style={styles.input}
              placeholder="Value (e.g. 10)"
              placeholderTextColor="#b8a18d"
              keyboardType="numeric"
              value={value}
              onChangeText={setValue}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddPromo}>
              <Text style={styles.addButtonText}>Add Promotion</Text>
            </TouchableOpacity>
          </View>

          {/* Promotions List */}
          <Text style={styles.sectionTitle}>✨ Current Promotions</Text>
          <FlatList
            data={promotions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.promoCard}>
                <View style={styles.promoInfo}>
                  <Text style={styles.promoName}>{item.promoName}</Text>
                  <Text style={styles.promoDetails}>
                    {item.discountType === "percentage"
                      ? `${item.value}% Off`
                      : `₱${item.value} Discount`}
                  </Text>
                </View>
                <Ionicons name="gift" size={24} color="#b26a3d" />
              </View>
            )}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(44, 30, 30, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fffdf9",
    width: "90%",
    maxHeight: "85%",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#f0e2d0",
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#3e2723",
  },
  subtitle: {
    color: "#6d4c41",
    marginTop: 10,
    fontSize: 14,
  },
  form: {
    marginTop: 20,
    marginBottom: 10,
    gap: 10,
  },
  input: {
    backgroundColor: "#fffaf4",
    borderWidth: 1,
    borderColor: "#e0c7a5",
    borderRadius: 12,
    padding: 12,
    color: "#3e2723",
  },
  addButton: {
    backgroundColor: "#b26a3d",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#3e2723",
    marginTop: 10,
    marginBottom: 10,
  },
  promoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fffaf4",
    padding: 15,
    borderRadius: 12,
    marginVertical: 6,
    borderLeftWidth: 5,
    borderLeftColor: "#b26a3d",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  promoInfo: {
    flex: 1,
  },
  promoName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3e2723",
  },
  promoDetails: {
    fontSize: 14,
    color: "#6d4c41",
  },
});
