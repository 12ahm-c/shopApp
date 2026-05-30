import { Types } from "mongoose";
import mongoose from "mongoose";
import { Product, type ProductDocument } from "./product.model";
import { AppError } from "../../utils/AppError";
import { serializeProduct } from "../../utils/serializer";
import type { CreateProductInput, ProductListQuery, UpdateProductInput } from "./product.validation";

const ensureObjectId = (id: string): void => {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, "NOT_FOUND", "Product does not exist");
};

const duplicateError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === 11000;

const hasSalesReferences = async (productId: string): Promise<boolean> => {
  try {
    const collection = mongoose.connection.collection("sales");
    const count = await collection.countDocuments({ "items.productId": new Types.ObjectId(productId) });
    return count > 0;
  } catch {
    return false;
  }
};

export const productService = {
  async createProduct(input: CreateProductInput) {
    try {
      const product = await Product.create(input);
      return serializeProduct(product);
    } catch (error) {
      if (duplicateError(error)) {
        throw new AppError(409, "DUPLICATE", "Product name already exists");
      }
      throw error;
    }
  },

  async getProducts(query: ProductListQuery) {
    const filter: Record<string, unknown> = {};

    if (query.search) {
      filter.name = { $regex: query.search, $options: "i" };
    }
    if (query.category) {
      filter.category = query.category;
    }
    if (query.lowStock) {
      filter.$expr = { $lte: ["$quantity", "$alertThreshold"] };
    }

    const skip = (query.page - 1) * query.limit;
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
      Product.countDocuments(filter)
    ]);

    return {
      data: products.map((p) => serializeProduct(p)),
      meta: { page: query.page, limit: query.limit, total }
    };
  },

  async getProductById(id: string) {
    ensureObjectId(id);
    const product = await Product.findById(id);
    if (!product) throw new AppError(404, "NOT_FOUND", "Product does not exist");
    return serializeProduct(product);
  },

  async updateProduct(id: string, input: UpdateProductInput) {
    ensureObjectId(id);
    try {
      const product = await Product.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true });
      if (!product) throw new AppError(404, "NOT_FOUND", "Product does not exist");
      return serializeProduct(product);
    } catch (error) {
      if (duplicateError(error)) {
        throw new AppError(409, "DUPLICATE", "Product name already exists");
      }
      throw error;
    }
  },

  async deleteProduct(id: string) {
    ensureObjectId(id);
    if (await hasSalesReferences(id)) {
      throw new AppError(409, "INVALID_STATE", "Product has existing sales");
    }
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw new AppError(404, "NOT_FOUND", "Product does not exist");
  }
};
