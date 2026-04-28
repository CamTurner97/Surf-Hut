import { Router, type IRouter } from "express";
import healthRouter from "./health";
import beachesRouter from "./beaches";

const router: IRouter = Router();

router.use(healthRouter);
router.use(beachesRouter);

export default router;
