import express from "express";
import { protectedRoute } from "../middleware/auth.middleware";
import {
  checkoutSuccess,
  createCheckoutSession,
} from "../controllers/order.controller";

const router = express.Router();

router.post("/create-checkout-session", protectedRoute, createCheckoutSession);
router.post("/checkout-success", protectedRoute, checkoutSuccess);

export default router;
