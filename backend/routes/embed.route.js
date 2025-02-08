import express from "express";
import {
  getEmbedUrl,
  getLatestMovies,
  getLatestEpisodes,
} from "../controllers/embedController.js";

const router = express.Router();

router.route("/embed").get(getEmbedUrl);
router.route("/latest/movies/:page").get(getLatestMovies);
router.route("/latest/episodes/:page").get(getLatestEpisodes);

export default router;
