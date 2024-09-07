import { check } from "express-validator";
import { handleValidationErrors } from "./errors.middleware";
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/user.model";
import { UserType } from "../types";

declare global {
  namespace Express {
    interface Request {
      user: UserType;
    }
  }
}

export const validateRegisterRequest = [
  check("name", "name is required").isString(),
  check("email", "Email is required").isEmail(),
  check("password", "Password with 6 or more characters required").isLength({
    min: 6,
  }),
  handleValidationErrors,
];

export const validateLoginRequest = [
  check("email", "Email is required").isEmail(),
  check("password", "Password with 6 or more characters required").isLength({
    min: 6,
  }),
  handleValidationErrors,
];

export const protectedRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.cookies["access-token"];
    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized, no access token" });
    }
    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET as string
    );
    const user = await User.findById((decoded as JwtPayload).userId).select(
      "-password"
    );
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in protectedRoute");
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const adminRoute = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Unauthorized - Admin Only" });
  }
};
