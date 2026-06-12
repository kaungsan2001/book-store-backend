import { Router } from "express";
import uploadImage from "../../middlewares/uploadImage.middleware";
import { getUserById, uploadAvatar } from "./user.controller";
import { auth } from "../../middlewares/auth.middleware";
const router = Router();
// prefix: /api/v1/users

router.get("/:id", getUserById);

router.patch(
  "/avatar/upload",
  auth,
  uploadImage.single("avatar"),
  uploadAvatar,
);
export default router;
