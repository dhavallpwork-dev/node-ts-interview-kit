import request from "supertest";
import { createApp } from "../src/app.js";
import { seed } from "../src/seed.js";
import { Store } from "../src/store.js";

export function setup() {
  const store = seed(new Store());
  const app = createApp(store);
  const as = (token: string) => ({
    get: (url: string) => request(app).get(url).set("Authorization", `Bearer ${token}`),
    post: (url: string) => request(app).post(url).set("Authorization", `Bearer ${token}`),
  });
  return { store, app, as };
}

export const ITEM = { sku: "SKU-X", quantity: 2, unitPriceCents: 500 };
