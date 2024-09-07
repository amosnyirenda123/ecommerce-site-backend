import { Request, Response } from "express";
import { UserType } from "../types";
import Product from "../models/product.model";

export const getCartProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ _id: { $in: req.user.cartItems } });

    // add quantity for each product
    const cartItems = products.map((product) => {
      const item = req.user.cartItems.find(
        (cartItem) => cartItem._id === product._id
      );
      return { ...product.toJSON(), quantity: item?.quantity };
    });

    res.json(cartItems);
  } catch (error: any) {
    console.log("Error in getCartProducts controller", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};
export const addToCart = async (req: Request, res: Response) => {
  const { productId } = req.body;
  try {
    const user: UserType = req.user;
    const existingItem = user.cartItems.find((item) => item._id === productId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cartItems.push(productId);
    }

    await user.save();
    res.json(user.cartItems);
  } catch (error: any) {
    console.log("Error in addToCart controller", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};
export const removeAllFromCart = async (req: Request, res: Response) => {
  const { productId } = req.body;
  try {
    const user: UserType = req.user;
    if (!productId) {
      user.cartItems = [];
    } else {
      user.cartItems = user.cartItems.filter((item) => item._id !== productId);
    }

    await user.save();
    res.json(user.cartItems);
  } catch (error: any) {
    console.log("Error in removeAllFromCart controller", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};
export const updateQuantity = async (req: Request, res: Response) => {
  const { id: productId } = req.params;
  const { quantity } = req.body;
  const user: UserType = req.user;

  try {
    const existingItem = user.cartItems.find((item) => item._id === productId);
    if (existingItem) {
      if (quantity === 0) {
        user.cartItems = user.cartItems.filter(
          (item) => item._id !== productId
        );
        await user.save();
        return res.json(user.cartItems);
      }
      existingItem.quantity = quantity;
      await user.save();
      res.json(user.cartItems);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error: any) {
    console.log("Error in updateQuantity controller", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};
