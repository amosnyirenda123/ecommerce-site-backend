import express from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getFeaturedProducts,
  getProductsByCategory,
  getRecommendedProducts,
  toggleFeaturedProduct,
} from "../controllers/product.controller";
import { adminRoute, protectedRoute } from "../middleware/auth.middleware";
import { validateCreateProductRequest } from "../middleware/product.middleware";

const router = express.Router();

router.get("/", protectedRoute, adminRoute, getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/recommendations", getRecommendedProducts);
router.post(
  "/",
  protectedRoute,
  adminRoute,
  validateCreateProductRequest,
  createProduct
);
router.patch("/:productId", protectedRoute, adminRoute, toggleFeaturedProduct);
router.delete("/:productId", protectedRoute, adminRoute, deleteProduct);

export default router;
