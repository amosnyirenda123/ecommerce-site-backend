import Redis from "ioredis";
import Product from "../models/product.model";

export const redis = new Redis(process.env.UPSTASH_REDIS_URL as string);

export const storeRefreshToken = async (
  userId: string,
  refreshToken: string
) => {
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60 // 7 days
  );
};

export const updateFeaturedProductCache = async () => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("feature_products", JSON.stringify(featuredProducts));
  } catch (error: any) {
    console.log("error in update cache function");
  }
};
