import { Router } from "express";
import authRoutes from "../../modules/auth/auth.route";
import userRoutes from "../../modules/user/user.route";
import articleRoutes from "../../modules/article/article.route";
const router = Router();

router.use("/auth", authRoutes);

router.use("/users", userRoutes);
router.use("/articles", articleRoutes);

export default router;
