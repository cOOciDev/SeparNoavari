import { Router } from "express";
import JudgesController from "../controllers/judges.controller.js";
import ReviewsController from "../controllers/reviews.controller.js";
import { authGuard } from "../middleware/authGuard.js";
import { judgeGuard } from "../middleware/judgeGuard.js";

const router = Router();

router.get("/ideas", authGuard, judgeGuard, JudgesController.getAssignedIdeas);
router.get("/reviews", authGuard, judgeGuard, ReviewsController.listMine);
router.post("/reviews", authGuard, judgeGuard, ReviewsController.submit);

export default router;
