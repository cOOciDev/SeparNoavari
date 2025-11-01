import { Router } from "express";
import JudgesController from "../controllers/judges.controller.js";
import ReviewsController from "../controllers/reviews.controller.js";
import AssignmentsController from "../controllers/assignments.controller.js";
import { authGuard } from "../middleware/authGuard.js";
import { judgeGuard } from "../middleware/judgeGuard.js";

const router = Router();

router.get("/ideas", authGuard, judgeGuard, JudgesController.getAssignedIdeas);
router.get("/reviews", authGuard, judgeGuard, ReviewsController.listMine);
router.post("/reviews", authGuard, judgeGuard, ReviewsController.submit);
router.get(
  "/review-criteria",
  authGuard,
  judgeGuard,
  ReviewsController.getCriteria
);
router.get(
  "/assignments",
  authGuard,
  judgeGuard,
  AssignmentsController.listMine
);
router.get(
  "/assignments/:id",
  authGuard,
  judgeGuard,
  AssignmentsController.getAssignment
);
router.post(
  "/assignments/:id/submission",
  authGuard,
  judgeGuard,
  AssignmentsController.submit
);
router.get(
  "/assignments/:id/submission",
  authGuard,
  judgeGuard,
  AssignmentsController.downloadSubmission
);

export default router;
