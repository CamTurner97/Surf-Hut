import { Router, type IRouter } from "express";
import { GetBeachReportResponse } from "@workspace/api-zod";

import { logger } from "../lib/logger";
import {
  getBeachById,
  getOrFetchSurfReport,
} from "../lib/surf-reports-service";

const router: IRouter = Router();

router.get("/beaches/:beachId/report", async (req, res, next) => {
  const { beachId } = req.params;
  try {
    const beach = await getBeachById(beachId);
    if (!beach) {
      res.status(404).json({
        error: "not_found",
        message: `Beach "${beachId}" does not exist`,
      });
      return;
    }

    const { report, cached } = await getOrFetchSurfReport(beach);
    const payload = GetBeachReportResponse.parse({
      ...report,
      fetchedAt: report.fetchedAt.toISOString(),
      cached,
    });
    res.json(payload);
  } catch (err) {
    logger.error({ err, beachId }, "Failed to build surf report");
    next(err);
  }
});

export default router;
