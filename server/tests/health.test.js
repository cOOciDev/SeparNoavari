import request from "supertest";
import app from "../src/app.js";

test.skip("GET /api/health responds with ok", async () => {
  const res = await request(app).get("/api/health");
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("ok", true);
});
