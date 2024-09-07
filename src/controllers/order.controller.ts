import { Request, Response } from "express";
import Coupon from "../models/coupon.model";
import { createNewCoupon, createStripeCoupon, stripe } from "../utils/stripe";
import Order from "../models/order.model";

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { products, couponCode } = req.body;

    // checking if products is array, also checking length
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty products array" });
    }

    let totalAmount = 0;

    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100);
      totalAmount += amount * product.quantity;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            // stripe wants image in array
            images: [product.image],
          },
          unit_amount: amount,
        },
        quantity: product.quantity || 1,
      };
    });

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });
      if (coupon) {
        totalAmount -= Math.round(
          (totalAmount * coupon.discountPercentage) / 100
        );
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: coupon
        ? [
            {
              coupon: await createStripeCoupon(coupon.discountPercentage),
            },
          ]
        : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    if (totalAmount >= 20000) {
      await createNewCoupon(req.user._id);
    }
    res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error: any) {
    console.error("Error processing checkout:", error);
    res
      .status(500)
      .json({ message: "Error processing checkout", error: error.message });
  }
};

export const checkoutSuccess = async (req: Request, res: Response) => {
  const { sessionId } = req.body;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Could not retrieve session" });
    }

    if (session.payment_status === "paid") {
      if (session?.metadata?.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          {
            isActive: false,
          }
        );
      }
      const metadata = session?.metadata;
      if (
        metadata &&
        metadata.products &&
        metadata.userId &&
        session.amount_total
      ) {
        const products = JSON.parse(metadata.products);

        if (Array.isArray(products)) {
          const newOrder = new Order({
            userId: metadata.userId,
            products: products.map((product) => ({
              productId: product.id,
              quantity: product.quantity,
              price: product.price,
            })),
            totalAmount: session.amount_total / 100, // convert from cents to dollars
            stripeSessionId: sessionId,
          });

          await newOrder.save();

          return res.status(200).json({
            success: true,
            message:
              "Payment successful, order created, and coupon deactivated if used.",
            orderId: newOrder._id,
          });
        } else {
          return res
            .status(400)
            .json({ message: "Invalid products format in metadata" });
        }
      } else {
        return res
          .status(400)
          .json({ message: "Session metadata is incomplete" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "Payment not successful, order not created." });
    }
  } catch (error: any) {
    console.error("Error processing successful checkout:", error);
    return res.status(500).json({
      message: "Error processing successful checkout",
      error: error.message,
    });
  }
};
