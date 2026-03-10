import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import SOS from "./model/sos.js";
import {
  generateSosId,
  generateDeviceId,
  generateHeartbeat,
  generateAccuracy,
} from "./config/utils.js";

dotenv.config();

const app = express();
const port = 3000;


console.log("======================================");
console.log("Starting SOS Alert Server...");
console.log("Environment:", process.env.NODE_ENV || "development");
console.log("======================================");


await connectDB();


const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://sos-ui.web.app"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS blocked"));
    },
  })
);


app.use(express.json());


app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const time = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${time}ms)`
    );
  });

  next();
});


app.get("/", (req, res) => {
  res.send("<h1>Hi</h1>");
});


app.post("/api/location", async (req, res) => {
  try {
    console.log("Incoming SOS request:", req.body);

    const { userName, lat, long } = req.body;

    if (!userName || !lat || !long) {
      console.warn("Invalid SOS payload");
      return res.status(400).json({
        error: "userName, lat, long are required",
      });
    }

    const sosId = await generateSosId();
    const deviceId = generateDeviceId();
    const { heartbeat, status } = generateHeartbeat();

    const sos = await SOS.create({
      sosId,
      userName,
      deviceId,
      heartbeat,
      heartbeatStatus: status,
      location: {
        lat,
        long,
        source: "GPS",
        accuracy: generateAccuracy(),
      },
      networkMode: "DATA",
      status: "ACTIVE",
    });

    console.log(" SOS CREATED");
    console.log(" SOS ID:", sos.sosId);
    console.log(" Device:", sos.deviceId);
    console.log(" Heartbeat:", sos.heartbeat, sos.heartbeatStatus);
    console.log(" Location:", lat, long);

    res.status(201).json({
      message: "SOS created successfully",
      sos,
    });
  } catch (error) {
    console.error(" SOS creation failed:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/alerts", async (req, res) => {
  try {
    console.log(" Fetching all alerts");

    const alerts = await SOS.find()
      .sort({ createdAt: -1 })
      .lean();

    console.log(` Total alerts fetched: ${alerts.length}`);

    res.status(200).json({
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error(" Fetch alerts failed:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/alerts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(" Fetching alert:", id);

    let alert;

    if (id.startsWith("SOS_")) {
      alert = await SOS.findOne({ sosId: id });
    } else {
      alert = await SOS.findById(id);
    }

    if (!alert) {
      console.warn(" Alert not found:", id);
      return res.status(404).json({ error: "Alert not found" });
    }

    console.log(" Alert found:", alert.sosId);
    res.status(200).json(alert);
  } catch (error) {
    console.error(" Fetch alert failed:", error.message);
    res.status(500).json({ error: "Invalid alert ID" });
  }
});


app.listen(port, () => {
  console.log("======================================");
  console.log(`Server running at http://localhost:${port}`);
  console.log("======================================");
});
