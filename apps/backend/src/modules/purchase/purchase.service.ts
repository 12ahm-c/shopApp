import mongoose from "mongoose";
import { Purchase } from "./purchase.model";
import { Product } from "../product/product.model";
import { Supplier } from "../supplier/supplier.model";
import { serializePurchase } from "../../utils/serializer";
import { getNextPurchaseNumber } from "../../utils/counter.util";
import { AppError } from "../../utils/AppError";
import type { CreatePurchaseInput, PurchaseListQuery } from "./purchase.validation";

export const purchaseService = {
  async createPurchase(input: CreatePurchaseInput, userId: string, userName: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const purchaseNumber = await getNextPurchaseNumber();

      const items = [];
      let totalAmount = 0;

      for (const item of input.items) {
        let product;
        let itemTotal = 0;

        if (item.productId) {
          product = await Product.findById(item.productId).session(session);
          if (!product) {
            throw new AppError(404, "NOT_FOUND", `Product not found: ${item.productId}`);
          }
          product.quantity += item.quantity;
          await product.save({ session });
          itemTotal = item.quantity * item.unitPrice;
        } else {
          let newProduct = await Product.findOne({ name: item.name }).session(session);
          if (newProduct) {
            newProduct.quantity += item.quantity;
            if (item.unitPrice > 0) newProduct.costPrice = item.unitPrice;
            await newProduct.save({ session });
            product = newProduct;
          } else {
            newProduct = new Product({
              name: item.name,
              price: item.unitPrice || 0,
              costPrice: item.unitPrice || 0,
              quantity: item.quantity,
              category: "Achats",
              alertThreshold: 5
            });
            await newProduct.save({ session });
            product = newProduct;
          }
          itemTotal = item.quantity * item.unitPrice;
        }

        items.push({
          productId: product._id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: itemTotal
        });

        totalAmount += itemTotal;
      }

      let supplierId: mongoose.Types.ObjectId | undefined;
      let supplierName: string | undefined;

      if (input.supplierId) {
        const supplier = await Supplier.findById(input.supplierId).session(session);
        if (!supplier) {
          throw new AppError(404, "NOT_FOUND", "Supplier not found");
        }
        supplierId = supplier._id;
        supplierName = supplier.name;
      }

      const purchase = new Purchase({
        purchaseNumber,
        supplierId,
        supplierName,
        items,
        totalAmount,
        notes: input.notes || ""
      });

      await purchase.save({ session });

      await session.commitTransaction();

      return serializePurchase(purchase);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async listPurchases(query: PurchaseListQuery) {
    const { page, limit, from, to, supplierId, search } = query;
    const filter: Record<string, unknown> = {};

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = toDate;
      }
      filter.createdAt = dateFilter;
    }

    if (supplierId) {
      filter.supplierId = new mongoose.Types.ObjectId(supplierId);
    }

    if (search) {
      filter.$or = [
        { purchaseNumber: { $regex: search, $options: "i" } },
        { supplierName: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;
    const [purchases, total] = await Promise.all([
      Purchase.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Purchase.countDocuments(filter)
    ]);

    return {
      data: purchases.map((p) => ({
        _id: p._id.toString(),
        purchaseNumber: p.purchaseNumber,
        supplierId: p.supplierId?.toString() ?? null,
        supplierName: p.supplierName ?? null,
        items: p.items.map((item) => ({
          productId: item.productId.toString(),
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        })),
        totalAmount: p.totalAmount,
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getPurchaseById(id: string) {
    const purchase = await Purchase.findById(id).lean();
    if (!purchase) {
      throw new AppError(404, "NOT_FOUND", "Purchase not found");
    }

    return {
      _id: purchase._id.toString(),
      purchaseNumber: purchase.purchaseNumber,
      supplierId: purchase.supplierId?.toString() ?? null,
      supplierName: purchase.supplierName ?? null,
      items: purchase.items.map((item) => ({
        productId: item.productId.toString(),
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      })),
      totalAmount: purchase.totalAmount,
      notes: purchase.notes,
      createdAt: purchase.createdAt.toISOString(),
      updatedAt: purchase.updatedAt.toISOString()
    };
  }
};
