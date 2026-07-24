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

/**
 * Generate invoice number in format DDMMYYXXXX
 * DD = day, MM = month, YY = year, XXXX = daily sequence
 * Example: 14102512 = 14/10/2025, invoice #12 that day
 */
export const getNextInvoiceNumber = async (): Promise<number> => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const datePrefix = `${day}${month}${year}`;

  const counterKey = `invoice_${datePrefix}`;

  const result = await Counter.findByIdAndUpdate(
    counterKey,
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true }
  );

  const seq = result!.seq;
  const invoiceNumber = parseInt(`${datePrefix}${String(seq).padStart(2, '0')}`, 10);

  return invoiceNumber;
};

/**
 * Generate purchase number in format PXXX
 * XXX = sequential number (001, 002, ...)
 * Example: P001, P002, P015
 */
export const getNextPurchaseNumber = async (): Promise<string> => {
  const result = await Counter.findByIdAndUpdate(
    "purchase_global",
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true }
  );

  const seq = result!.seq;
  return `P${String(seq).padStart(3, '0')}`;
};
