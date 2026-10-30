import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";

import { HttpError, parseChatBody, parseCreateLifeBody, parseFactBody } from "./schema.ts";
import { createLifeStore, type LifeStore } from "./store.ts";

const wrap =
  (handler: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };

export function createApp(store: LifeStore = createLifeStore()) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "256kb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/lives", (req, res) => {
    const input = parseCreateLifeBody(req.body);
    res.status(201).json(store.create(input));
  });

  app.get("/lives/:id", (req, res) => {
    const pack = store.get(req.params.id);
    if (!pack) throw new HttpError(404, "没有这位生命");
    res.json(pack);
  });

  app.post(
    "/lives/:id/chat",
    wrap(async (req, res) => {
      const { message } = parseChatBody(req.body);
      const result = await store.chat(req.params.id, message);
      res.json(result);
    }),
  );

  app.get("/lives/:id/memory", (req, res) => {
    res.json(store.memory(req.params.id));
  });

  app.post("/lives/:id/memory/facts", (req, res) => {
    const { text, salience } = parseFactBody(req.body);
    res.status(201).json(store.addFact(req.params.id, text, salience));
  });

  app.delete("/lives/:id/memory", (req, res) => {
    res.json(store.clearMemory(req.params.id));
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "没有这条路径" });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    if (err instanceof SyntaxError) {
      res.status(400).json({ error: "无法解析 JSON" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "服务出错了" });
  });

  return app;
}
