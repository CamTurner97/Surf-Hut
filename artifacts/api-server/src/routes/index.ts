import { Router, type IRouter } from "express";
import healthRouter from "./health";
import beachesRouter from "./beaches";
import beachReportRouter from "./beach-report";

const router: IRouter = Router();

router.use(healthRouter);
router.use(beachesRouter);
router.use(beachReportRouter);

export default router;
