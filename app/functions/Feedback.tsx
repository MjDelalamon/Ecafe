import { Ionicons } from "@expo/vector-icons";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { db } from "../../Firebase/firebaseConfig";

type FeedbackProps = {
  visible: boolean;
  email: string;
  orderId: string;
  onClose: () => void;
};

export default function Feedback({ visible, email, orderId, onClose }: FeedbackProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [thankVisible, setThankVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const submitFeedback = async () => {
    if (rating < 1) {
      alert("Please select at least 1 star.");
      return;
    }
    try {
      await addDoc(collection(db, "feedbacks"), {
        orderId,
        customerId: email,
        rating,
        comment,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "orders", orderId), { feedbackGiven: true });
      setThankVisible(true);
      setTimeout(() => {
        setThankVisible(false);
        setRating(0);
        setComment("");
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      alert("Failed to submit feedback");
    }
  };

  const skipFeedback = async () => {
    try {
      await updateDoc(doc(db, "orders", orderId), { feedbackSkipped: true });
      onClose();
    } catch (err) {
      console.error("Error skipping feedback:", err);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalBox, { opacity: fadeAnim }]}>
            <Text style={styles.modalTitle}>How was your Experience?</Text>
            <View style={{ flexDirection: "row", marginVertical: 12 }}>
              {[1, 2, 3, 4, 5].map((num) => (
                <Pressable key={num} onPress={() => setRating(num)}>
                  <Ionicons
                    name={num <= rating ? "star" : "star-outline"}
                    size={36}
                    color={num <= rating ? "#f9a825" : "#d7ccc8"}
                    style={{ marginHorizontal: 6 }}
                  />
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Optional comment"
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <View style={{ flexDirection: "row", marginTop: 12 }}>
              <TouchableOpacity style={[styles.closeButton, { marginRight: 12 }]} onPress={skipFeedback}>
                <Text style={styles.closeText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.payButton} onPress={submitFeedback}>
                <Text style={styles.payText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Thank you */}
      <Modal visible={thankVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Thank you for your feedback!</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    width: "85%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#4e342e" },
  input: {
    borderWidth: 1,
    borderColor: "#d7ccc8",
    borderRadius: 12,
    padding: 10,
    width: "100%",
    textAlignVertical: "top",
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
    color: "#4e342e",
  },
  payButton: {
    backgroundColor: "#6d4c41",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    flex: 1,
  },
  payText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  closeButton: { paddingVertical: 8, paddingHorizontal: 20 },
  closeText: { color: "#6d4c41", fontWeight: "600" },
});
