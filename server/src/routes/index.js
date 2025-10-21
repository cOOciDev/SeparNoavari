import { Router } from "express";
import authRoutes from "./auth.routes.js";
import ideasRoutes from "./ideas.routes.js";
import adminRoutes from "./admin.routes.js";
import judgesRoutes from "./judges.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/ideas", ideasRoutes);
router.use("/admin", adminRoutes);
router.use("/judge", judgesRoutes);

export default router;
