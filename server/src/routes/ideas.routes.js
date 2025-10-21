import { Router } from "express";
import IdeasController from "../controllers/ideas.controller.js";
import { authGuard } from "../middleware/authGuard.js";
import { ideaUpload } from "../middleware/upload.js";

const router = Router();

router.post("/", authGuard, ideaUpload, IdeasController.create);
router.get("/mine", authGuard, IdeasController.listMine);
router.get("/:id", authGuard, IdeasController.getById);
router.get("/:id/files/:fileId", authGuard, IdeasController.downloadFile);
router.get("/:id/archive", authGuard, IdeasController.downloadArchive);

export default router;
