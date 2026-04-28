import { Router, type IRouter } from "express";
import { ListBeachesResponse } from "@workspace/api-zod";

import { SYDNEY_BEACHES } from "../lib/beaches-data";

const router: IRouter = Router();

router.get("/beaches", (_req, res) => {
  const data = ListBeachesResponse.parse({
    beaches: SYDNEY_BEACHES,
    count: SYDNEY_BEACHES.length,
  });
  res.json(data);
});

export default router;
