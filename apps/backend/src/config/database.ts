import mongoose from "mongoose";
import { env } from "./env";

const ATLAS_PROTOCOL = "mongodb+srv:";

export const validateAtlasUri = (mongodbUri: string): void => {
  let parsed: URL;

  try {
    parsed = new URL(mongodbUri);
  } catch {
    throw new Error("MONGODB_URI must be a valid MongoDB Atlas connection string");
  }

  if (parsed.protocol !== ATLAS_PROTOCOL) {
    throw new Error("MONGODB_URI must use MongoDB Atlas (mongodb+srv) only");
  }
};

export const connectDatabase = async (): Promise<void> => {
  const mongodbUri = env.mongodbUri();
  validateAtlasUri(mongodbUri);
  await mongoose.connect(mongodbUri);
};
