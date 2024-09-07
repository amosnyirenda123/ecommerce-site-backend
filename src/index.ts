import express from "express";
import cookieParser from "cookie-parser";
import "dotenv/config";

import authRoutes from "./routes/auth.route";
import productRoutes from "./routes/product.route";
import cartRoutes from "./routes/cart.route";
import couponRoutes from "./routes/coupon.route";
import orderRoutes from "./routes/order.route";
import analyticsRoutes from "./routes/analytics.route";
import { connectDB } from "./db/db";

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/analytics", analyticsRoutes);

app.listen(PORT, () => {
  connectDB();
  console.log(`Server started on port http://localhost:${PORT}`);
});
