import express from "express";
import path from "path";
import cors from "cors";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { parseTimetable } from "./src/services/server/timetableParser";
import { syncToGoogleCalendar } from "./src/services/server/calendarService";
import cron from "node-cron";
import admin from "firebase-admin";

// Initialize Firebase Admin
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    let serviceAccount;
    const config = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    
    if (config.startsWith('{')) {
      serviceAccount = JSON.parse(config);
    } else {
      // Handle the case where they might have passed only the private key
      // or the string is malformed. If it looks like a private key, we can't
      // easily initialize without the other fields.
      throw new Error("FIREBASE_SERVICE_ACCOUNT does not start with '{'. It must be a full JSON object string.");
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized successfully.");
  } catch (error: any) {
    console.error("Firebase Admin init error:", error.message);
    if (process.env.FIREBASE_SERVICE_ACCOUNT.startsWith('MII')) {
      console.warn("TIP: You seem to have passed only the private key string. You MUST pass the ENTIRE content of the service account JSON file.");
    }
  }
}

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Daily Briefing Cron (7:00 AM)
  cron.schedule("0 7 * * *", async () => {
    console.log("Running Daily Briefing Cron...");
    if (!admin.apps.length) return;
    
    const db = admin.firestore();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    try {
      const syncsSnapshot = await db.collection('user_syncs').get();
      for (const syncDoc of syncsSnapshot.docs) {
        const { userId, timetableId } = syncDoc.data();
        
        const slotsSnapshot = await db.collection('timetables').doc(timetableId)
          .collection('slots').where('day', '==', today).get();
        
        if (!slotsSnapshot.empty) {
          const classes = slotsSnapshot.docs.map(d => d.data().courseCode).join(", ");
          await db.collection('notifications').add({
            userId,
            title: "Today's Briefing",
            message: `Good morning! You have ${slotsSnapshot.size} classes today: ${classes}. Stay focused!`,
            type: "briefing",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            read: false
          });
        }
      }
    } catch (error) {
      console.error("Cron Error:", error);
    }
  });

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Timetable Parsing API
  app.post("/api/timetable/parse", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const result = await parseTimetable(req.file.buffer, req.file.mimetype);
      res.json(result);
    } catch (error: any) {
      console.error("Parsing error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Google Calendar Sync API
  app.post("/api/calendar/sync", async (req, res) => {
    try {
      const { accessToken, slots } = req.body;
      if (!accessToken || !slots) {
        return res.status(400).json({ error: "Missing accessToken or slots" });
      }
      const result = await syncToGoogleCalendar(accessToken, slots);
      res.json({ success: true, count: result.length });
    } catch (error: any) {
      console.error("Sync error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
