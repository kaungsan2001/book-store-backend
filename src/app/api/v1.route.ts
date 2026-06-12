import { Router } from "express";
import authRoutes from "../../modules/auth/auth.route";
import userRoutes from "../../modules/user/user.route";
import articleRoutes from "../../modules/article/article.route";
import productRoutes from "../../modules/product/product.route";
const router = Router();

router.use("/auth", authRoutes);

router.use("/users", userRoutes);
router.use("/articles", articleRoutes);
router.use("/products", productRoutes);

export default router;
