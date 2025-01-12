import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getFollowers,
    toggleFollowership,
    getFollowing
} from "../controllers/followership.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/followers/:userId?").get(getFollowers)
router.route("/following/:userId").get(getFollowing)
router.route("/f/:userIdToFollow").post(toggleFollowership)



export default router;