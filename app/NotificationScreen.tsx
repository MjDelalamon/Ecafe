import { useLocalSearchParams } from "expo-router";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../Firebase/firebaseConfig";

export default function NotificationScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState("");
  const [openFeedbackModal, setOpenFeedbackModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // ============================
  //   FETCH CUSTOMER & LIVE NOTIFICATIONS
  // ============================
  useEffect(() => {
    const customerRef = doc(db, "customers", email);

    const fetchCustomerInfo = async () => {
      try {
        const snap = await getDoc(customerRef);
        if (!snap.exists()) {
          Alert.alert("Error", "Customer not found.");
          setLoading(false);
          return;
        }
        setCustomer(snap.data());
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Unable to fetch customer.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerInfo();

    // Live notifications listener
    const notifRef = collection(db, "customers", email, "notifications");
    const notifQuery = query(notifRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
      const notifData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notifData);
    });

    return () => unsubscribe();
  }, [email]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading customer data...</Text>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.center}>
        <Text>No customer found.</Text>
      </View>
    );
  }

  // ============================
  //        SEND FEEDBACK
  // ============================
  const sendFeedback = async () => {
    if (!feedbackText.trim()) {
      return Alert.alert("Error", "Feedback cannot be empty.");
    }

    try {
      // Add feedback to CustomerAssistance collection
      const feedbackRef = collection(db, "CustomerAssistance");
      await addDoc(feedbackRef, {
        customerId: email,
        type: "NewFeedback",
        message: feedbackText,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      const notifRefs = collection(db, "customers", email, "notifications");
      await addDoc(notifRefs, {
        customerId: email,
        type: "NewFeedback",
        title:"You sent a message",
        message: feedbackText,
        isRead: true,
        createdAt: serverTimestamp(),
      });

      // Clear feedback input & close modal
      setFeedbackText("");
      setOpenFeedbackModal(false);

      Alert.alert("Success", "Feedback sent!");
      
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unable to send feedback.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>Hi! {customer.fullName}</Text>
        <Text style={styles.email}>Any concerns? Please message us here:</Text>

        <TouchableOpacity
          style={styles.feedbackBtn}
          onPress={() => setOpenFeedbackModal(true)}
        >
          <Text style={styles.btnText}>Send Message here</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Messages / Replies</Text>
        {notifications.length > 0 ? (
          notifications.map((notif, i) => (
            <View key={i} style={styles.notifItem}>
              <Text style={styles.notifTitle}>{notif.title}</Text>
              <Text style={styles.notifDesc}>{notif.message}</Text>
              {notif.createdAt?.toDate && (
                <Text style={styles.notifTime}>
                  {notif.createdAt.toDate().toLocaleString()}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={{ marginTop: 5, color: "#777" }}>No messages yet.</Text>
        )}
      </View>

      {/* FEEDBACK MODAL */}
      <Modal visible={openFeedbackModal} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Send Feedback</Text>
            <TextInput
              style={styles.input}
              multiline
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="Enter your feedback..."
            />

            <View style={styles.row}>
              <TouchableOpacity style={styles.sendBtn} onPress={sendFeedback}>
                <Text style={styles.white}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setOpenFeedbackModal(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ============================
//           STYLES
// ============================
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fdfcf9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },

  name: { fontSize: 22, fontWeight: "bold", color: "#3e2723" },
  email: { color: "#777", marginBottom: 15 },

  feedbackBtn: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  btnText: { color: "white", textAlign: "center", fontWeight: "bold" },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#3e2723",
  },

  notifItem: {
    backgroundColor: "#f4f4f4",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  notifTitle: { fontWeight: "bold", marginBottom: 4, color: "#722205ff" },
  notifDesc: { color: "#555" },
  notifTime: { color: "#999", fontSize: 12, marginTop: 4 },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalCard: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },

  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#3e2723" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 15,
  },

  row: { flexDirection: "row", justifyContent: "space-between" },

  sendBtn: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 10,
    width: "48%",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    width: "48%",
    alignItems: "center",
  },
  white: { color: "white", fontWeight: "bold" },
});
