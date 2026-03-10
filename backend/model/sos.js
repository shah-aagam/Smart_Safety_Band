import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: true,
  },
  long: {
    type: Number,
    required: true,
  },
  accuracy: {
    type: Number,
    min: 60,
    required: true,
  },
});

const sosSchema = new mongoose.Schema(
  {
    sosId: {
      type: String,
      unique: true,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    deviceId: {
      type: String,
      required: true,
    },
    heartbeat: {
      type: Number,
      required: true,
    },
    heartbeatStatus: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH"],
      required: true,
    },
    location: {
      type: locationSchema,
      required: true,
    },
    networkMode: {
      type: String,
      enum: ["DATA", "VOICE"],
      default: "DATA",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "RESOLVED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

export default mongoose.model("SOS", sosSchema);
