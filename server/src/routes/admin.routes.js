import { Router } from "express";
import AdminController from "../controllers/admin.controller.js";
import AssignmentsController from "../controllers/assignments.controller.js";
import ReviewsController from "../controllers/reviews.controller.js";
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
  "/assignments/manual",
  authGuard,
  adminGuard,
  AdminController.manualAssign
);
router.get(
  "/assignments/:id",
  authGuard,
  AssignmentsController.getAssignment
);
router.get(
  "/assignments/:id/template",
  authGuard,
  AssignmentsController.downloadTemplate
);
router.post(
  "/assignments/:id/submission",
  authGuard,
  AssignmentsController.submit
);
router.get(
  "/assignments/:id/submission",
  authGuard,
  AssignmentsController.downloadSubmission
);
router.patch(
  "/assignments/:id/lock",
  authGuard,
  adminGuard,
  AssignmentsController.lock
);
router.delete(
  "/assignments/:id",
  authGuard,
  adminGuard,
  AssignmentsController.remove
);
router.get(
  "/ideas/:ideaId/submissions/archive",
  authGuard,
  adminGuard,
  AssignmentsController.downloadArchive
);
router.get(
  "/ideas/:ideaId/assignments",
  authGuard,
  adminGuard,
  AssignmentsController.listForIdea
);
router.post(
  "/ideas/:ideaId/final-summary",
  authGuard,
  adminGuard,
  AssignmentsController.uploadFinalSummary
);
router.get(
  "/ideas/:ideaId/final-summary",
  authGuard,
  adminGuard,
  AssignmentsController.getFinalSummaryMeta
);
router.get(
  "/ideas/:ideaId/final-summary/file",
  authGuard,
  adminGuard,
  AssignmentsController.downloadFinalSummary
);
router.get(
  "/ideas/:ideaId/reviews",
  authGuard,
  adminGuard,
  ReviewsController.listForIdea
);
router.get(
  "/review-criteria",
  authGuard,
  adminGuard,
  ReviewsController.getCriteria
);

export default router;
