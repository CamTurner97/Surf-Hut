import { Router, type IRouter } from "express";
import { ListBeachesResponse } from "@workspace/api-zod";
import { beachesTable, db, surfReportsTable } from "@workspace/db";
import { asc, eq } from "drizzle-orm";

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
        latestScore: surfReportsTable.score,
        latestScoreLabel: surfReportsTable.scoreLabel,
        latestReportFetchedAt: surfReportsTable.fetchedAt,
      })
      .from(beachesTable)
      .leftJoin(
        surfReportsTable,
        eq(surfReportsTable.beachId, beachesTable.id),
      )
      .orderBy(asc(beachesTable.region), asc(beachesTable.name));

    const beaches = rows.map((r) => ({
      id: r.id,
      name: r.name,
      region: r.region,
      latitude: r.latitude,
      longitude: r.longitude,
      facingDirection: r.facingDirection,
      description: r.description,
      heroImageUrl: r.heroImageUrl,
      latestScore: r.latestScore,
      latestScoreLabel: r.latestScoreLabel,
      latestReportFetchedAt:
        r.latestReportFetchedAt?.toISOString() ?? null,
    }));

    const data = ListBeachesResponse.parse({
      beaches,
      count: beaches.length,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
