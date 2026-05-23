"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uploadMiddleware_1 = __importDefault(require("../middleware/uploadMiddleware"));
const bookingController_1 = require("../controllers/bookingController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get("/share/:shareId", bookingController_1.getSharedItinerary);
router.use(authMiddleware_1.protect);
router.get("/", bookingController_1.getUserItineraries);
router.get("/:id", bookingController_1.getItineraryById);
router.post("/upload", uploadMiddleware_1.default.single("document"), bookingController_1.uploadBookingDocument);
router.post("/:id/share", bookingController_1.createShareLink);
router.delete("/:id", bookingController_1.deleteItineraryById);
exports.default = router;
