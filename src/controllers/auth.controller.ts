import { Request, Response } from "express";
import User from "../models/user.model";
import { generateTokens } from "../utils/generateTokens";
import { redis, storeRefreshToken } from "../utils/redis";
import { setCookies } from "../utils/cookies";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists!" });
    }
    const user = await User.create({ name, email, password });

    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    await storeRefreshToken(user._id.toString(), refreshToken);

    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error: any) {
    console.log("Error in register user controller ", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    await storeRefreshToken(user._id.toString(), refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.status(200).json({
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error: any) {
    console.log("Error in login user controller ", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies["refresh-token"];
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET as string
      );
      await redis.del(`refresh_token:${(decoded as JwtPayload).userId}`);
    }

    res.clearCookie("access-token");
    res.clearCookie("refresh-token");
    res.json({ message: "Logged out successfully." });
  } catch (error: any) {
    console.log("Error in logout user controller ", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies["refresh-token"];

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh Token not found." });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    );
    const storedToken = await redis.get(
      `refresh_token:${(decoded as JwtPayload).userId}`
    );

    if (storedToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token." });
    }

    const accessToken = jwt.sign(
      { userId: (decoded as JwtPayload).userId },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );

    res.cookie("access-token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, //15 minutes
    });

    res.json({ message: "Token refreshed successfully" });
  } catch (error: any) {
    console.log("Error in refresh token controller", error.message);
    res.status(500).json({ message: "Something went wrong." });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    res.json(req.user);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
