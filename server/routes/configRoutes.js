import express from "express";
import { getPublicConfig } from "../controllers/configController.js";

const configRouter = express.Router();

configRouter.get("/", getPublicConfig);

export default configRouter;
