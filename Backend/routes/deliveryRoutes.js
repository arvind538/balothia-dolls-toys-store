import express from "express";
import {
    checkPincode,
    listPincodes,
    addPincode,
    togglePincode,
} from "../controllers/deliveryController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/check/:pincode", checkPincode);
router.route("/admin").get(protect, adminOnly, listPincodes).post(protect, adminOnly, addPincode);
router.patch("/admin/:id", protect, adminOnly, togglePincode);

export default router;