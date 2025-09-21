import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

type FirestoreResult =
  | {
      success: true;
      id: string;
      customerNumber: string;
      fullName: string;
      email: string;
      mobile: string;
      wallet: number;
      points: number;
      tier: string;
      status: string;
      createdAt: Date;
    }
  | { success: false; error: unknown };

export const addUserToFirestore = async (
  fullName: string,
  email: string,
  mobile: string,
  points = 0,
  wallet = 0,
  status = "Active",
  tier = "Bronze"
): Promise<FirestoreResult> => {
  try {
    // 🔹 Generate sequential customerNumber
    const snapshot = await getDocs(collection(db, "customers"));
    const count = snapshot.size + 1;
    const customerNumber = count.toString().padStart(4, "0");

    const newCustomer = {
      customerNumber,
      fullName,
      email,
      mobile,
      points,
      wallet,
      status,
      tier,
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, "customers"), newCustomer);

    return { success: true, id: docRef.id, ...newCustomer };
  } catch (error) {
    console.error("Error adding customer:", error);
    return { success: false, error };
  }
};
