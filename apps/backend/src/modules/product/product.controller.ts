import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/apiResponse";
import { productService } from "./product.service";
import type { CreateProductInput, ProductListQuery, UpdateProductInput } from "./product.validation";

export const productController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await productService.createProduct(req.body as CreateProductInput);
    successResponse(res, data, 201);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await productService.getProducts(req.validated?.query as ProductListQuery);
    successResponse(res, result.data, 200, result.meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await productService.getProductById(String(req.params.id));
    successResponse(res, data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await productService.updateProduct(String(req.params.id), req.body as UpdateProductInput);
    successResponse(res, data);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await productService.deleteProduct(String(req.params.id));
    successResponse(res, null, 204);
  })
};
