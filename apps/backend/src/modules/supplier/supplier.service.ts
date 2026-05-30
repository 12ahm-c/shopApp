import { Types } from "mongoose";
import { Supplier } from "./supplier.model";
import { AppError } from "../../utils/AppError";
import { serializeSupplier } from "../../utils/serializer";
import type { CreateSupplierInput, SupplierDebtInput, SupplierListQuery, UpdateSupplierInput } from "./supplier.validation";

const ensureObjectId = (id: string): void => {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, "NOT_FOUND", "Supplier does not exist");
};

const duplicateError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === 11000;

export const supplierService = {
  async createSupplier(input: CreateSupplierInput) {
    const doc: Record<string, unknown> = { name: input.name };
    if (input.phone) doc.phone = input.phone;
    if (input.address) doc.address = input.address;

    try {
      if (input.initialDebt > 0) {
        doc.totalDebt = input.initialDebt;
        doc.transactions = [
          {
            date: new Date(),
            amount: input.initialDebt,
            type: "increase",
            note: "Initial debt",
            newTotalDebt: input.initialDebt
          }
        ];
      }

      const supplier = await Supplier.create(doc);
      return serializeSupplier(supplier);
    } catch (error) {
      if (duplicateError(error)) {
        throw new AppError(409, "DUPLICATE", "Phone already used by another supplier");
      }
      throw error;
    }
  },

  async getSuppliers(query: SupplierListQuery) {
    const filter: Record<string, unknown> = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        ...(Types.ObjectId.isValid(query.search) ? [{ _id: new Types.ObjectId(query.search) }] : [])
      ];
    }
    if (query.hasDebt) {
      filter.totalDebt = { $gt: 0 };
    }

    const skip = (query.page - 1) * query.limit;
    const [suppliers, total] = await Promise.all([
      Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
      Supplier.countDocuments(filter)
    ]);

    return {
      data: suppliers.map((s) => serializeSupplier(s)),
      meta: { page: query.page, limit: query.limit, total }
    };
  },

  async getSupplierById(id: string) {
    ensureObjectId(id);
    const supplier = await Supplier.findById(id);
    if (!supplier) throw new AppError(404, "NOT_FOUND", "Supplier does not exist");
    return {
      supplier: serializeSupplier(supplier),
      recentPurchases: []
    };
  },

  async updateSupplier(id: string, input: UpdateSupplierInput) {
    ensureObjectId(id);
    try {
      const supplier = await Supplier.findByIdAndUpdate(id, { $set: input }, { returnDocument: "after", runValidators: true });
      if (!supplier) throw new AppError(404, "NOT_FOUND", "Supplier does not exist");
      return serializeSupplier(supplier);
    } catch (error) {
      if (duplicateError(error)) {
        throw new AppError(409, "DUPLICATE", "Phone already used by another supplier");
      }
      throw error;
    }
  },

  async updateDebt(id: string, input: SupplierDebtInput) {
    ensureObjectId(id);
    const supplier = await Supplier.findById(id);
    if (!supplier) throw new AppError(404, "NOT_FOUND", "Supplier does not exist");

    if (input.type === "decrease" && input.amount > supplier.totalDebt) {
      throw new AppError(422, "VALIDATION_ERROR", "Decrease amount > current debt");
    }

    const newTotalDebt =
      input.type === "increase"
        ? supplier.totalDebt + input.amount
        : supplier.totalDebt - input.amount;

    const transaction = {
      date: new Date(),
      amount: input.amount,
      type: input.type,
      note: input.note,
      newTotalDebt
    };

    supplier.totalDebt = newTotalDebt;
    supplier.transactions.push(transaction);
    await supplier.save();

    return {
      supplier: serializeSupplier(supplier),
      transaction: {
        date: transaction.date.toISOString(),
        amount: transaction.amount,
        type: transaction.type,
        note: transaction.note ?? null,
        newTotalDebt: transaction.newTotalDebt
      }
    };
  },

  async deleteSupplier(id: string) {
    ensureObjectId(id);
    const supplier = await Supplier.findById(id);
    if (!supplier) throw new AppError(404, "NOT_FOUND", "Supplier does not exist");
    if (supplier.totalDebt > 0) {
      throw new AppError(409, "INVALID_STATE", "Supplier has outstanding debt");
    }
    await Supplier.findByIdAndDelete(id);
  }
};
