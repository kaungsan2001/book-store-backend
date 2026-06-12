import { Router } from "express";
import routesV1 from "./api/v1.route";

const router = Router();

router.use("/api/v1", routesV1);

export default router;
