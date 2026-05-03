import { Router, type IRouter } from "express";
import healthRouter from "./health";
import beachesRouter from "./beaches";
import beachReportRouter from "./beach-report";
import imagesRouter from "./images";
import mapRouter from "./map";

const router: IRouter = Router();

router.use(healthRouter);
router.use(imagesRouter);
router.use(mapRouter);
router.use(beachesRouter);
router.use(beachReportRouter);

export default router;
