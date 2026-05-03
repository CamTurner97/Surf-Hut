import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { join } from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const app: Express = express();

// Self-hosted static assets (Leaflet, etc.) served at /api/static
app.use("/api/static", express.static(join(__dirname, "../public")));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
