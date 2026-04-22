import request from "supertest";
import app from "../server.js";
import driverModel from "../models/driverModel.js";

jest.mock("../models/driverModel.js");

describe("Driver Controller (Without Auth)", () => {

  /* ---------------- GET ALL DRIVERS ---------------- */

  describe("GET /api/driver", () => {

    test("returns driver list successfully", async () => {
      driverModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([
          { name: "Driver1" },
          { name: "Driver2" }
        ])
      });

      const res = await request(app).get("/api/driver");

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

  });

  /* ---------------- GET DRIVER BY ID ---------------- */

  describe("GET /api/driver/:id", () => {

    test("fails if driver not found", async () => {
      driverModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app).get("/api/driver/123");

      expect(res.body.success).toBe(false);
    });

  });

  /* ---------------- UPDATE DRIVER ---------------- */

  describe("PUT /api/driver/:id", () => {

    test("fails if driver not found", async () => {
      driverModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app)
        .put("/api/driver/123")
        .send({ name: "Updated Name" });

      expect(res.body.success).toBe(false);
    });

  });

  /* ---------------- UPDATE LOCATION ---------------- */

  describe("PUT /api/driver/location/:id", () => {

    test("fails if latitude or longitude missing", async () => {
      const res = await request(app)
        .put("/api/driver/location/123")
        .send({});

      expect(res.body.success).toBe(false);
    });

  });

  /* ---------------- DELETE DRIVER ---------------- */

  describe("DELETE /api/driver/:id", () => {

    test("fails if driver not found", async () => {
      driverModel.findByIdAndDelete.mockResolvedValue(null);

      const res = await request(app)
        .delete("/api/driver/123");

      expect(res.body.success).toBe(false);
    });

  });

});