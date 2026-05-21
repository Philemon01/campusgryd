import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 1. Firebase Configuration from firebase-applet-config.json
const firebaseConfig = {
  projectId: "rsu-campus-map",
  appId: "1:3400622244:web:8b751e4a41bf4a23d38631",
  apiKey: "AIzaSyBuUBEcoNvEAUY-hXaEc0V70720YhX5n_Y",
  authDomain: "rsu-campus-map.firebaseapp.com",
  storageBucket: "rsu-campus-map.firebasestorage.app",
  messagingSenderId: "3400622244",
  measurementId: "G-D2FPLF88B9"
};

// 2. Initialize Firebase Core Services
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

/**
 * Programmatically structures and writes a new timetable document into the
 * "timetables" collection adhering strictly to the JSON Schema.
 * 
 * @param {Object} params
 * @param {string} params.timetableId - Unique document ID (e.g. randomly gen UUID or custom hash).
 * @param {string} params.imageUrl - Uploaded timetable direct URL in Firebase Cloud Storage.
 * @param {boolean} params.isPublished - Visibility status on the campus map dashboard.
 * @param {Object} params.extractedData - Output of the OCR timetable parser.
 * @param {string} params.extractedData.title - Extracted/assigned timetable title.
 * @param {Array<Object>} params.extractedData.schedule - Array of extracted lecture slots.
 */
export async function createTimetableDocument({
  timetableId,
  imageUrl,
  isPublished,
  extractedData
}) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("UNAUTHENTICATED: A user must be logged in via Google to publish a timetable.");
  }

  // Define doc reference in the 'timetables' collection
  const docRef = doc(db, "timetables", timetableId);

  // Structure payload matching dbSchema.json perfectly
  const timetablePayload = {
    timetableId: timetableId,
    ownerId: currentUser.uid,
    ownerEmail: currentUser.email || "unknown@rsu.edu.ng",
    imageUrl: imageUrl,
    isPublished: isPublished,
    createdAt: serverTimestamp(), // Enforces temporal integrity in firestore.rules
    updatedAt: serverTimestamp(),
    extractedData: {
      title: extractedData.title,
      schedule: extractedData.schedule.map(slot => ({
        day: slot.day,        // e.g. "Monday"
        time: slot.time,      // e.g. "08:00 - 10:00"
        course: slot.course,  // e.g. "MTH 101"
        venue: slot.venue     // e.g. "Civil Engineering Lecture Hall"
      }))
    }
  };

  try {
    await setDoc(docRef, timetablePayload);
    console.log(`Timetable (id: ${timetableId}) written successfully to Firestore.`);
    return { success: true, docId: timetableId };
  } catch (error) {
    // Structural error logging to aid AI diagnostics during local permission errors
    const errorDetails = {
      error: error instanceof Error ? error.message : String(error),
      operationType: "write",
      path: `timetables/${timetableId}`,
      authInfo: {
        userId: currentUser.uid,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified
      }
    };
    console.error("Firestore Write Failed:", JSON.stringify(errorDetails));
    throw new Error(`DATABASE_WRITE_ERROR: ${error.message}`);
  }
}
