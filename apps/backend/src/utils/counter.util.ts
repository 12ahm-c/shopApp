import mongoose, { Schema, type Model } from "mongoose";

interface ICounter {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter: Model<ICounter> =
  mongoose.models.Counter ||
  mongoose.model<ICounter>("Counter", counterSchema);

const INVOICE_COUNTER_KEY = "invoiceNumber";

export const getNextInvoiceNumber = async (): Promise<number> => {
  const result = await Counter.findByIdAndUpdate(
    INVOICE_COUNTER_KEY,
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true }
  );
  return result!.seq;
};
