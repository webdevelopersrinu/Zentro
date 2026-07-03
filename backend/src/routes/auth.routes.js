import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signToken } from "../utils/token.js";

const router = Router();

// POST /api/auth/signup  { username, password }
// Creates a new account with a UNIQUE username, returns a login token.
router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "username and password required" });

    const exists = await User.findOne({ username: username.toLowerCase() });
    if (exists) return res.status(409).json({ error: "Username already taken" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash });

    return res.status(201).json({
      token: signToken(user),
      user: { id: user._id, username: user.username },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/login  { username, password }
// Checks credentials, returns a login token.
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: (username || "").toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    return res.json({
      token: signToken(user),
      user: { id: user._id, username: user.username },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
