import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import roomRoutes from "./room.routes.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true, pid: process.pid }));

// OAuth endpoints get a much tighter budget than the rest of the API.
router.use("/auth", authLimiter, authRoutes);
router.use("/users", userRoutes);
router.use("/rooms", roomRoutes);

export default router;
