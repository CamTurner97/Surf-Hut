import { beachesTable, db } from "@workspace/db";

import { logger } from "../lib/logger";
import {
  getOrFetchSurfReport,
  type BeachLocation,
} from "../lib/surf-reports-service";
import type { FacingDirection } from "../lib/surf-score";

const CONCURRENCY = 4;

async function runPool<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];
  const runners = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) return;
      await worker(item);
    }
  });
  await Promise.all(runners);
}

async function main() {
  const rows = await db
    .select({
      id: beachesTable.id,
      latitude: beachesTable.latitude,
      longitude: beachesTable.longitude,
      facingDirection: beachesTable.facingDirection,
    })
    .from(beachesTable);

  const beaches: BeachLocation[] = rows.map((r) => ({
    id: r.id,
    latitude: r.latitude,
    longitude: r.longitude,
    facingDirection: r.facingDirection as FacingDirection,
  }));

  logger.info({ count: beaches.length }, "Warming surf reports");
  let success = 0;
  let failed = 0;

  await runPool(beaches, async (beach) => {
    try {
      const { report, cached } = await getOrFetchSurfReport(beach);
      logger.info(
        {
          beachId: beach.id,
          score: report.score,
          label: report.scoreLabel,
          cached,
        },
        "warmed",
      );
      success += 1;
    } catch (err) {
      logger.error({ err, beachId: beach.id }, "warm failed");
      failed += 1;
    }
  });

  logger.info({ success, failed }, "Warm complete");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  logger.error({ err }, "Warm script crashed");
  process.exit(1);
});
