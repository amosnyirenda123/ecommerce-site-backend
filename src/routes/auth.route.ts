import express from "express";
import {
  getUserProfile,
  login,
  logout,
  refreshToken,
  register,
} from "../controllers/auth.controller";
import {
  protectedRoute,
  validateLoginRequest,
  validateRegisterRequest,
} from "../middleware/auth.middleware";

const router = express.Router();

router.post("/register", validateRegisterRequest, register);
router.post("/login", validateLoginRequest, login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/me", protectedRoute, getUserProfile);

export default router;
