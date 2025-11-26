import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function NewComerModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Hello User ! </Text>
            <Text style={styles.Instruction}>Instruction </Text>

            <Text style={styles.sectionTitle}>🔔 Bell Icon</Text>
            <Text style={styles.desc}>For notifications</Text>

            <Text style={styles.sectionTitle}>📱 QR</Text>
            <Text style={styles.desc}>Present this to staff to earn points</Text>

            <Text style={styles.sectionTitle}>⭐ Points Balance</Text>
            <Text style={styles.desc}>Your current points</Text>

            <Text style={styles.sectionTitle}>🏆 Tier Level</Text>
            <Text style={styles.desc}>
              Bronze (0–99), Silver (100–299), Gold (300+)
            </Text>

            <Text style={styles.sectionTitle}>📌 Navigations</Text>

            <Text style={styles.desc}>• Open Wallet – load funds and pay</Text>
            <Text style={styles.desc}>• Redeem Reward – view rewards</Text>
            <Text style={styles.desc}>• View History – see transactions</Text>
            <Text style={styles.desc}>• Orders – your placed orders</Text>
            <Text style={styles.desc}>• Profile – your information</Text>
            <Text style={styles.desc}>• Promotions – exclusive promos</Text>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    maxHeight: "90%",
  },
  Instruction:{
    fontSize: 22,
    fontWeight: "bold",
    
    marginBottom: 15,
    color: "#722205",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#722205",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    color: "#722205",
  },
  desc: {
    fontSize: 14,
    marginTop: 3,
    color: "#333",
  },
  closeBtn: {
    backgroundColor: "#722205",
    padding: 15,
    marginTop: 25,
    borderRadius: 12,
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
