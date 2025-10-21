import { Router } from "express";
import AdminController from "../controllers/admin.controller.js";
import { authGuard } from "../middleware/authGuard.js";
import { adminGuard } from "../middleware/adminGuard.js";

const router = Router();

router.get("/overview", authGuard, adminGuard, AdminController.getOverview);
router.get("/ideas", authGuard, adminGuard, AdminController.listIdeas);
router.get("/users", authGuard, adminGuard, AdminController.listUsers);
router.put(
  "/users/:id/role",
  authGuard,
  adminGuard,
  AdminController.updateUserRole
);
router.post("/judges", authGuard, adminGuard, AdminController.createJudge);
router.get("/judges", authGuard, adminGuard, AdminController.listJudges);
router.get(
  "/assignments",
  authGuard,
  adminGuard,
  AdminController.listAssignments
);
router.post(
  "/assignments/bulk",
  authGuard,
  adminGuard,
  AdminController.bulkAssign
);

export default router;
