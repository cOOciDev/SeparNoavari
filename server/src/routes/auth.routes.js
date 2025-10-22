import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";

const router = Router();

router.use((_, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/me", AuthController.me);

export default router;
