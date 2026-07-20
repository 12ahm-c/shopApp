import mongoose, { Types } from "mongoose";
import { Sale, type SaleDocument } from "./sale.model";
import { Product } from "../product/product.model";
import { User } from "../user/user.model";
import { getNextInvoiceNumber } from "../../utils/counter.util";
import { serializeSale } from "../../utils/serializer";
import { AppError } from "../../utils/AppError";
import { notificationService } from "../notification/notification.service";
import { emitStockAlert } from "../../socket/notification.socket";
import type { CreateSaleInput, SaleListQuery } from "./sale.validation";
import type { AuthUser } from "../../types";

const ensureObjectId = (id: string): void => {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, "NOT_FOUND", "Sale does not exist");
};

const logActivity = async (
  userId: string,
  userName: string,
  action: "sale" | "delete_invoice",
  details: string,
  amount?: number
): Promise<void> => {
  const collection = mongoose.connection.collection("activity_logs");
  await collection.insertOne({
    userId: new Types.ObjectId(userId),
    userName,
    action,
    details,
    amount: amount ?? null,
    timestamp: new Date()
  });
};

export const saleService = {
  async createSale(input: CreateSaleInput, user: AuthUser) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const stockUpdates: { productId: string; oldQuantity: number; newQuantity: number }[] = [];

      for (const item of input.items) {
        const product = await Product.findById(item.productId).session(session);
        if (!product) {
          throw new AppError(404, "NOT_FOUND", `Product ${item.productId} does not exist`);
        }
        if (product.quantity < item.quantity) {
          throw new AppError(422, "INSUFFICIENT_STOCK", `Insufficient stock for ${product.name}`);
        }
      }

      for (const item of input.items) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.productId, quantity: { $gte: item.quantity } },
          { $inc: { quantity: -item.quantity } },
          { returnDocument: "after", session }
        );

        if (!updated) {
          throw new AppError(422, "INSUFFICIENT_STOCK", `Insufficient stock for product ${item.productId}`);
        }

        stockUpdates.push({
          productId: item.productId,
          oldQuantity: updated.quantity + item.quantity,
          newQuantity: updated.quantity
        });
      }

      const invoiceNumber = await getNextInvoiceNumber();

      const userDoc = await User.findById(user.userId).session(session).lean();
      if (!userDoc) throw new AppError(404, "NOT_FOUND", "User not found");

      const itemsData = input.items.map((item) => {
        const total = item.quantity * item.unitPrice;
        return {
          productId: item.productId,
          name: "",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: 0,
          total
        };
      });

      const productNames = await Product.find({
        _id: { $in: input.items.map((i) => i.productId) }
      })
        .select("name costPrice")
        .lean();

      const productMap = new Map(productNames.map((p) => [p._id.toString(), p]));
      for (const item of itemsData) {
        const product = productMap.get(item.productId);
        item.name = product?.name ?? "Unknown";
        item.costPrice = product?.costPrice ?? 0;
      }

      const totalAmount = itemsData.reduce((sum, item) => sum + item.total, 0);

      const [sale] = await Sale.create(
        [
          {
            invoiceNumber,
            employeeId: new Types.ObjectId(user.userId),
            employeeName: userDoc.name,
            customerId: input.customerId ? new Types.ObjectId(input.customerId) : undefined,
            customerName: input.customerName ?? "Walk-in",
            items: itemsData,
            totalAmount,
            paymentMethod: input.paymentMethod,
            isDeleted: false
          }
        ],
        { session }
      );

      const details = `Vente #${invoiceNumber} - ${totalAmount} MRU`;
      await logActivity(user.userId, userDoc.name, "sale", details, totalAmount);

      await session.commitTransaction();

      const lowStockProducts = await Product.find({
        _id: { $in: input.items.map((i) => i.productId) },
        $expr: { $lte: ["$quantity", "$alertThreshold"] }
      }).lean();

      if (lowStockProducts.length > 0) {
        const notifiedIds = new Set<string>();
        const admins = await User.find({ role: "admin" }).lean();
        for (const admin of admins) {
          notifiedIds.add(admin._id.toString());
          for (const prod of lowStockProducts) {
            const notif = await notificationService.createNotification(
              admin._id.toString(),
              "low_stock",
              `Stock faible : ${prod.name}`,
              `Il reste ${prod.quantity} unités de ${prod.name}. Seuil: ${prod.alertThreshold}.`,
              { productId: prod._id.toString() }
            );
            emitStockAlert(notif);
          }
        }
        if (!notifiedIds.has(user.userId)) {
          for (const prod of lowStockProducts) {
            const notif = await notificationService.createNotification(
              user.userId,
              "low_stock",
              `Stock faible : ${prod.name}`,
              `Il reste ${prod.quantity} unités de ${prod.name}. Seuil: ${prod.alertThreshold}.`,
              { productId: prod._id.toString() }
            );
            emitStockAlert(notif);
          }
        }
      }

      return {
        sale: serializeSale(sale),
        stockUpdates
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async listSales(query: SaleListQuery, user: AuthUser) {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (user.role !== "admin") {
      filter.employeeId = new Types.ObjectId(user.userId);
    } else if (query.employeeId) {
      filter.employeeId = new Types.ObjectId(query.employeeId);
    }

    if (query.from || query.to) {
      const dateFilter: Record<string, Date> = {};
      if (query.from) dateFilter.$gte = new Date(query.from);
      if (query.to) dateFilter.$lte = new Date(query.to);
      filter.createdAt = dateFilter;
    }

    if (query.customerId) {
      filter.customerId = new Types.ObjectId(query.customerId);
    }

    if (query.paymentMethod) {
      filter.paymentMethod = query.paymentMethod;
    }

    const skip = (query.page - 1) * query.limit;
    const [sales, total] = await Promise.all([
      Sale.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
      Sale.countDocuments(filter)
    ]);

    return {
      data: sales.map((s) => serializeSale(s)),
      meta: { page: query.page, limit: query.limit, total }
    };
  },

  async getSaleById(id: string, user: AuthUser) {
    ensureObjectId(id);
    const sale = await Sale.findById(id);
    if (!sale) throw new AppError(404, "NOT_FOUND", "Sale does not exist");

    if (user.role !== "admin" && sale.employeeId.toString() !== user.userId) {
      throw new AppError(404, "NOT_FOUND", "Sale does not exist");
    }

    return serializeSale(sale);
  },

  async getPublicSaleById(id: string) {
    ensureObjectId(id);
    const sale = await Sale.findById(id);
    if (!sale || sale.isDeleted) throw new AppError(404, "NOT_FOUND", "Sale does not exist");
    return serializeSale(sale);
  },

  async cancelSale(id: string, user: AuthUser) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      ensureObjectId(id);

      const sale = await Sale.findById(id).session(session);
      if (!sale) throw new AppError(404, "NOT_FOUND", "Sale does not exist");
      if (sale.isDeleted) throw new AppError(409, "INVALID_STATE", "Sale already deleted");

      const restoredStock: { productId: string; oldQuantity: number; newQuantity: number }[] = [];

      for (const item of sale.items) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.productId },
          { $inc: { quantity: item.quantity } },
          { returnDocument: "after", session }
        );

        if (updated) {
          restoredStock.push({
            productId: item.productId,
            oldQuantity: updated.quantity - item.quantity,
            newQuantity: updated.quantity
          });
        }
      }

      sale.isDeleted = true;
      await sale.save({ session });

      const userDoc = await User.findById(user.userId).session(session).lean();
      const userName = userDoc?.name ?? "Unknown";
      const details = `Annulation facture #${sale.invoiceNumber}`;
      await logActivity(user.userId, userName, "delete_invoice", details, sale.totalAmount);

      await session.commitTransaction();

      const admins = await User.find({ role: "admin" }).lean();
      const notifiedIds = new Set<string>();
      for (const admin of admins) {
        notifiedIds.add(admin._id.toString());
        await notificationService.createNotification(
          admin._id.toString(),
          "invoice_deleted",
          "Facture annulée",
          `Facture #${sale.invoiceNumber} de ${sale.totalAmount} MRU a été annulée par ${userName}.`,
          { saleId: sale._id.toString(), invoiceNumber: sale.invoiceNumber }
        );
      }
      if (!notifiedIds.has(user.userId)) {
        await notificationService.createNotification(
          user.userId,
          "invoice_deleted",
          "Facture annulée",
          `Facture #${sale.invoiceNumber} de ${sale.totalAmount} MRU a été annulée.`,
          { saleId: sale._id.toString(), invoiceNumber: sale.invoiceNumber }
        );
      }

      return {
        deletedSale: serializeSale(sale),
        restoredStock
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
};
