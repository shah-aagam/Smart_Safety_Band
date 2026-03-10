import mongoose from "mongoose";
export const generateSosId = async () => {
  const last = await mongoose.model("SOS").findOne().sort({ createdAt: -1 });

  if (!last) return "SOS_0001";

  const num = parseInt(last.sosId.split("_")[1]);
  const next = String(num + 1).padStart(4, "0");

  return `SOS_${next}`;
};

export const generateDeviceId = () => {
  const rand = Math.floor(100 + Math.random() * 900);
  return `A9G_${rand}`;
};

export const generateHeartbeat = () => {
  const heartbeat = Math.floor(40 + Math.random() * 120);

  let status = "NORMAL";
  if (heartbeat > 110) status = "HIGH";
  else if (heartbeat < 60) status = "LOW";

  return { heartbeat, status };
};

export const generateAccuracy = () => {
  return Math.floor(60 + Math.random() * 50);
};
