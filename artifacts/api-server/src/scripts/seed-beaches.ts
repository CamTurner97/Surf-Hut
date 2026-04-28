import { db, beachesTable } from "@workspace/db";
import { sql } from "drizzle-orm";

import { SYDNEY_BEACHES } from "../lib/beaches-data";
import { logger } from "../lib/logger";

async function main() {
  logger.info({ count: SYDNEY_BEACHES.length }, "Seeding beaches");

  await db
    .insert(beachesTable)
    .values(
      SYDNEY_BEACHES.map((b) => ({
        id: b.id,
        name: b.name,
        region: b.region,
        latitude: b.latitude,
        longitude: b.longitude,
        facingDirection: b.facingDirection,
        description: b.description,
        heroImageUrl: b.heroImageUrl,
      })),
    )
    .onConflictDoUpdate({
      target: beachesTable.id,
      set: {
        name: sql`excluded.name`,
        region: sql`excluded.region`,
        latitude: sql`excluded.latitude`,
        longitude: sql`excluded.longitude`,
        facingDirection: sql`excluded.facing_direction`,
        description: sql`excluded.description`,
        heroImageUrl: sql`excluded.hero_image_url`,
        updatedAt: sql`now()`,
      },
    });

  const total = await db.$count(beachesTable);
  logger.info({ total }, "Seed complete");
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, "Seed failed");
  process.exit(1);
});
