// services/userService.ts
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../Firebase/firebaseConfig";

type FirestoreResult =
  | {
      success: true;
      id: string; // same as email
      
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
  password: string,
  points = 0,
  wallet = 0,
  status = "Inactive", // start as Inactive until email verified
  tier = "Bronze"
): Promise<FirestoreResult> => {
  try {
    // 🔹 Check if email already exists in Auth
    const existingUser = await getDoc(doc(db, "customers", email));
    if (existingUser.exists()) {
      return { success: false, error: "Email already registered" };
    }

    // 🔹 Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // 🔹 Send email verification
    if (userCredential.user) {
      await sendEmailVerification(userCredential.user);
    }

    // 🔹 Generate customerNumber
    const snapshot = await getDoc(doc(db, "customers", email));
    

    const newCustomer = {
      
      fullName,
      email,
      mobile,
      points,
      wallet,
      status,
      tier,
      createdAt: new Date(),
    };

    // 🔹 Store in Firestore with email as ID
    await setDoc(doc(db, "customers", email), newCustomer);

    return { success: true, id: email, ...newCustomer };
  } catch (error) {
    console.error("Error adding customer:", error);
    return { success: false, error };
  }
};
