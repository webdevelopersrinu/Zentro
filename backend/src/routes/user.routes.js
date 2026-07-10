import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validateQuery } from "../middleware/validate.js";
import * as controller from "../controllers/user.controller.js";
import { searchQuerySchema } from "../validators/user.validators.js";

const router = Router();

router.use(requireAuth);
router.get("/search", validateQuery(searchQuerySchema), controller.search);

export default router;
