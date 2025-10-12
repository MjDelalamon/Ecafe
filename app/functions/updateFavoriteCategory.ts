import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "../../Firebase/firebaseConfig"; // adjust path kung nasa ibang folder

// Function para ma-detect ang pinaka madalas na inorder na category
export async function updateFavoriteCategory(customerEmail: string): Promise<void> {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("customerEmail", "==", customerEmail));
    const querySnapshot = await getDocs(q);

    const categoryCount: Record<string, number> = {};

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const category = data.category;
      if (category) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    });

    // Kunin ang pinaka-frequent na category
    let favoriteCategory: string | null = null;
    let maxCount = 0;
    for (const [category, count] of Object.entries(categoryCount)) {
      if (count > maxCount) {
        favoriteCategory = category;
        maxCount = count;
      }
    }

    // Update sa customer document
    if (favoriteCategory) {
      const customerDoc = doc(db, "customers", customerEmail);
      await updateDoc(customerDoc, { favoriteCategory });
      console.log("✅ Favorite category updated:", favoriteCategory);
    } else {
      console.log("⚠️ No favorite category found.");
    }
  } catch (error) {
    console.error("❌ Error updating favorite category:", error);
  }
}
