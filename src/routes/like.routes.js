import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleCommentLike,
    toggleBlogLike,
    getLikedBlogs
} from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJWT);


router.route("/toggle/c/:commentId").post(toggleCommentLike)
router.route("/toggle/b/:blogId").post(toggleBlogLike)
router.route("/blogs").get(getLikedBlogs)
export default router

