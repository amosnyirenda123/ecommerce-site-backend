import { Request, Response } from "express";
import Coupon from "../models/coupon.model";

export const getCoupon = async (req: Request, res: Response) => {
  try {
    const coupon = await Coupon.findOne({
      userId: req.user._id,
      isActive: true,
    });
    res.json(coupon || null);
  } catch (error: any) {
    console.log("Error in getCoupon controller", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const validateCoupon = async (req: Request, res: Response) => {
  const { code } = req.body;
  try {
    const coupon = await Coupon.findOne({
      code: code,
      userId: req.user._id,
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found." });
    }

    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(404).json({ message: "Coupon expired" });
    }
    res.json({
      message: "Coupon is valid",
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (error: any) {
    console.log("Error in validateCoupon controller", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};
