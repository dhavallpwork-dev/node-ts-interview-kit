import express from "express";
import { authenticate } from "./auth.js";
import { ordersRouter } from "./routes/orders.js";
import { slotsRouter } from "./routes/slots.js";
import { seed } from "./seed.js";
import { Store } from "./store.js";

export function createApp(store: Store = seed(new Store())) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use(authenticate);
  app.use("/orders", ordersRouter(store));
  app.use("/slots", slotsRouter(store));

  return app;
}
