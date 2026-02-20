import express from "express";
import { listMenu } from "../controllers/menuController.js";

const menuRouter = express.Router();

menuRouter.get("/", listMenu);

export default menuRouter;
