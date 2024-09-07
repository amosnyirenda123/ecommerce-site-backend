import express from "express";
import { adminRoute, protectedRoute } from "../middleware/auth.middleware";
import { getAnalytics } from "../controllers/analytics.controller";

const router = express.Router();

router.get("/", protectedRoute, adminRoute, getAnalytics);

export default router;
