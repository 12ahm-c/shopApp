import { Types } from "mongoose";
import mongoose from "mongoose";
import { Customer, type CustomerDocument } from "./customer.model";
import { AppError } from "../../utils/AppError";
import { serializeCustomer } from "../../utils/serializer";
import { User } from "../user/user.model";
import { notificationService } from "../notification/notification.service";
import type { CreateCustomerInput, CustomerListQuery, DebtInput } from "./customer.validation";
import type { AuthUser } from "../../types";

const ensureObjectId = (id: string): void => {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, "NOT_FOUND", "Customer does not exist");
};

const duplicateError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === 11000;

const hasSalesReferences = async (customerId: string): Promise<boolean> => {
  try {
    const collection = mongoose.connection.collection("sales");
    const count = await collection.countDocuments({ customerId: new Types.ObjectId(customerId) });
    return count > 0;
  } catch {
    return false;
  }
};

export const customerService = {
  async createCustomer(input: CreateCustomerInput) {
    const doc: Record<string, unknown> = { name: input.name };
    if (input.phone) doc.phone = input.phone;

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

      const customer = await Customer.create(doc);
      return serializeCustomer(customer);
    } catch (error) {
      if (duplicateError(error)) {
        throw new AppError(409, "DUPLICATE", "Phone already used by another customer");
      }
      throw error;
    }
  },

  async getCustomers(query: CustomerListQuery) {
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
    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
      Customer.countDocuments(filter)
    ]);

    return {
      data: customers.map((c) => serializeCustomer(c)),
      meta: { page: query.page, limit: query.limit, total }
    };
  },

  async getCustomerById(id: string) {
    ensureObjectId(id);
    const customer = await Customer.findById(id);
    if (!customer) throw new AppError(404, "NOT_FOUND", "Customer does not exist");
    return {
      customer: serializeCustomer(customer),
      recentSales: []
    };
  },

  async updateDebt(id: string, input: DebtInput, user: AuthUser) {
    ensureObjectId(id);
    const customer = await Customer.findById(id);
    if (!customer) throw new AppError(404, "NOT_FOUND", "Customer does not exist");

    if (input.type === "decrease" && input.amount > customer.totalDebt) {
      throw new AppError(422, "VALIDATION_ERROR", "Decrease amount > current debt");
    }

    const newTotalDebt =
      input.type === "increase"
        ? customer.totalDebt + input.amount
        : customer.totalDebt - input.amount;

    const transaction = {
      date: new Date(),
      amount: input.amount,
      type: input.type,
      note: input.note,
      newTotalDebt
    };

    customer.totalDebt = newTotalDebt;
    customer.transactions.push(transaction);
    await customer.save();

    const notifiedIds = new Set<string>();
    const admins = await User.find({ role: "admin" }).lean();
    for (const admin of admins) {
      notifiedIds.add(admin._id.toString());
      await notificationService.createNotification(
        admin._id.toString(),
        "debt_updated",
        `Dette mise à jour : ${customer.name}`,
        `${customer.name} - ${input.type === "increase" ? "Augmentation" : "Diminution"} de ${input.amount} MRU. Nouvelle dette: ${newTotalDebt} MRU.`,
        { customerId: customer._id.toString(), amount: input.amount, type: input.type, newTotalDebt }
      );
    }
    if (!notifiedIds.has(user.userId)) {
      await notificationService.createNotification(
        user.userId,
        "debt_updated",
        `Dette mise à jour : ${customer.name}`,
        `${customer.name} - ${input.type === "increase" ? "Augmentation" : "Diminution"} de ${input.amount} MRU. Nouvelle dette: ${newTotalDebt} MRU.`,
        { customerId: customer._id.toString(), amount: input.amount, type: input.type, newTotalDebt }
      );
    }

    return {
      customer: serializeCustomer(customer),
      transaction: {
        date: transaction.date.toISOString(),
        amount: transaction.amount,
        type: transaction.type,
        note: transaction.note ?? null,
        newTotalDebt: transaction.newTotalDebt
      }
    };
  },

  async deleteCustomer(id: string) {
    ensureObjectId(id);
    if (await hasSalesReferences(id)) {
      throw new AppError(409, "INVALID_STATE", "Customer has existing sales");
    }
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) throw new AppError(404, "NOT_FOUND", "Customer does not exist");
  }
};
