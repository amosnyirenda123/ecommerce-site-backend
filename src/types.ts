import { Document } from "mongoose";

export type CartItemType = {
  _id: string;
  quantity: number;
  product: string;
};

export interface UserType extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  cartItems: CartItemType[];
  role: string;
}

export type ProductType = {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isFeatured: boolean;
};

export type CouponType = {
  code: string;
  discountPercentage: number;
  expirationDate: Date;
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderProductType = {
  productId: string;
  quantity: number;
  price: number;
};

export type OrderType = {
  userId: string;
  products: OrderProductType[];
  totalAmount: number;
  stripeSessionId: string;
};
