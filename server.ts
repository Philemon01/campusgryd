import express from "express";
import path from "path";
import cors from "cors";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { parseTimetable } from "./src/services/server/timetableParser";
import { syncToGoogleCalendar, deleteFromGoogleCalendar } from "./src/services/server/calendarService";
import { handleCampusChat, parseCampusIntent } from "./src/services/server/chatService";
import cron from "node-cron";
import admin from "firebase-admin";

// Initialize Firebase Admin
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    let serviceAccount;
    const config = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    
    if (config.startsWith('{')) {
      serviceAccount = JSON.parse(config);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin initialized successfully.");
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT is set but does not appear to be a JSON string");
    }
  } catch (error: any) {
    console.error("Firebase Admin init error:", error.message);
  }
}

const upload = multer({ storage: multer.memoryStorage() });

const app = express();

app.use(cors());
app.use(express.json());

// Daily Briefing Cron (7:00 AM) - only start if not in a serverless function, e.g., on Cloud Run
if (!process.env.VERCEL) {
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
}

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Chat Intent API
app.post("/api/chat/intent", async (req, res) => {
  console.log("POST /api/chat/intent");
  try {
    const { message, locations } = req.body;
    const result = await parseCampusIntent(message, locations);
    res.json(result);
  } catch (error: any) {
    console.error("Intent error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Chat Response API
app.post("/api/chat/response", async (req, res) => {
  console.log("POST /api/chat/response");
  try {
    const { message, context, locations } = req.body;
    const result = await handleCampusChat(message, context, locations);
    res.json({ text: result });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Timetable Parsing API
app.post("/api/timetable/parse", upload.single("file"), async (req, res) => {
  console.log("POST /api/timetable/parse - Start");
  try {
    if (!req.file) {
      console.error("No file uploaded in request");
      return res.status(400).json({ error: "No file uploaded" });
    }
    console.log(`File received: ${req.file.originalname} (${req.file.mimetype}, ${req.file.size} bytes)`);
    const result = await parseTimetable(req.file.buffer, req.file.mimetype);
    console.log("Parsing successful");
    res.json(result);
  } catch (error: any) {
    console.error("Critical parsing error:", error);
    res.status(500).json({ error: error.message || "Internal server error during parsing" });
  }
});

// Google Calendar Sync API
app.post("/api/calendar/sync", async (req, res) => {
  console.log("POST /api/calendar/sync");
  try {
    const { accessToken, slots } = req.body;
    if (!accessToken || !slots) {
      return res.status(400).json({ error: "Missing accessToken or slots" });
    }
    const result = await syncToGoogleCalendar(accessToken, slots);
    res.json({ success: true, count: result.length, events: result });
  } catch (error: any) {
    console.error("Sync error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Google Calendar Delete API
app.post("/api/calendar/delete", async (req, res) => {
  console.log("POST /api/calendar/delete");
  try {
    const { accessToken, eventIds } = req.body;
    if (!accessToken || !eventIds) {
      return res.status(400).json({ error: "Missing accessToken or eventIds" });
    }
    const results = await deleteFromGoogleCalendar(accessToken, eventIds);
    res.json({ success: true, results });
  } catch (error: any) {
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API 404 Handler - ensure all unmatched /api routes return JSON 404
app.all("/api/*all", (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled Server Error:", err);
  res.status(err.status || 500).json({ 
    error: err.message || "Internal server error",
    details: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
});

// Start listening if NOT running in serverless environment (Vercel)
const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  async function startServer() {
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

    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  startServer();
}

export default app;
