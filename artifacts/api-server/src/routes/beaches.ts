import { Router, type IRouter } from "express";
import { ListBeachesResponse } from "@workspace/api-zod";
import { db, beachesTable } from "@workspace/db";
import { asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/beaches", async (_req, res, next) => {
  try {
    const rows = await db
      .select({
        id: beachesTable.id,
        name: beachesTable.name,
        region: beachesTable.region,
        latitude: beachesTable.latitude,
        longitude: beachesTable.longitude,
        facingDirection: beachesTable.facingDirection,
        description: beachesTable.description,
        heroImageUrl: beachesTable.heroImageUrl,
      })
      .from(beachesTable)
      .orderBy(asc(beachesTable.region), asc(beachesTable.name));

    const data = ListBeachesResponse.parse({
      beaches: rows,
      count: rows.length,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
