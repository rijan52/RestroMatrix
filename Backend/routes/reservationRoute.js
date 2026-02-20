import express from "express";
import {
  createReservation,
  deleteReservation,
  listReservations,
  updateReservationStatus
} from "../controllers/reservationController.js";

const reservationRouter = express.Router();

reservationRouter.post("/create", createReservation);
reservationRouter.get("/list", listReservations);
reservationRouter.post("/status", updateReservationStatus);
reservationRouter.post("/delete", deleteReservation);

export default reservationRouter;
