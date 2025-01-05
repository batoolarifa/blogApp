import {Router} from "express";
import {publishBlog} from "../controllers/blog.controller.js";

const router = Router();

router.route("/publish").post(publishBlog)

export default router