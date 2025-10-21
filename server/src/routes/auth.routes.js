import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";
import { authGuard } from "../middleware/authGuard.js";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", authGuard, AuthController.logout);
router.get("/me", AuthController.me);

export default router;
