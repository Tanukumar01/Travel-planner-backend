import express from "express";
import upload from "../middleware/uploadMiddleware";
import {
    createShareLink,
    deleteItineraryById,
    getItineraryById,
    getSharedItinerary,
    getUserItineraries,
    uploadBookingDocument,
} from "../controllers/bookingController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/share/:shareId", getSharedItinerary);

router.use(protect);
router.get("/", getUserItineraries);
router.get("/:id", getItineraryById);
router.post("/upload", upload.single("document"), uploadBookingDocument);
router.post("/:id/share", createShareLink);
router.delete("/:id", deleteItineraryById);

export default router;
