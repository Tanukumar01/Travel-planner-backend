"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSharedItinerary = exports.createShareLink = exports.deleteItineraryById = exports.getItineraryById = exports.getUserItineraries = exports.uploadBookingDocument = void 0;
const Booking_1 = __importDefault(require("../models/Booking"));
const aiItineraryService_1 = require("../services/aiItineraryService");
const cloudinaryUploadService_1 = require("../services/cloudinaryUploadService");
const uploadBookingDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
            return;
        }
        const cloudinaryFile = yield (0, cloudinaryUploadService_1.uploadBufferToCloudinary)({
            buffer: req.file.buffer,
            fileType: req.file.mimetype,
            originalName: req.file.originalname,
        });
        const processedDocument = yield (0, aiItineraryService_1.processTravelDocument)({
            fileBuffer: req.file.buffer,
            fileType: req.file.mimetype,
            originalName: req.file.originalname,
        });
        const booking = yield Booking_1.default.create({
            userId: req.user.id,
            documentName: req.file.originalname,
            fileUrl: cloudinaryFile.secureUrl,
            fileType: req.file.mimetype,
            cloudinaryPublicId: cloudinaryFile.publicId,
            cloudinaryResourceType: cloudinaryFile.resourceType,
            status: "generated",
            extractedText: processedDocument.extractedText,
            extractedData: processedDocument.extractedData,
            itinerary: processedDocument.itinerary,
            shareId: processedDocument.shareId,
        });
        res.status(201).json({
            success: true,
            message: "Travel document uploaded and itinerary generated",
            data: booking,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to upload and process the document",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.uploadBookingDocument = uploadBookingDocument;
const getUserItineraries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const bookings = yield Booking_1.default.find({ userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id }).sort({
            createdAt: -1,
        });
        res.status(200).json({
            success: true,
            data: bookings,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch itinerary history",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getUserItineraries = getUserItineraries;
const getItineraryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const booking = yield Booking_1.default.findOne({
            _id: req.params.id,
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
        });
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Itinerary not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: booking,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch the itinerary",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getItineraryById = getItineraryById;
const deleteItineraryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const booking = yield Booking_1.default.findOne({
            _id: req.params.id,
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
        });
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Document not found",
            });
            return;
        }
        yield (0, cloudinaryUploadService_1.deleteCloudinaryAsset)({
            publicId: booking.cloudinaryPublicId,
            resourceType: booking.cloudinaryResourceType,
        });
        yield booking.deleteOne();
        res.status(200).json({
            success: true,
            message: "Document and itinerary deleted",
            data: {
                id: req.params.id,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete the document",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.deleteItineraryById = deleteItineraryById;
const createShareLink = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const booking = yield Booking_1.default.findOne({
            _id: req.params.id,
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
        });
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Itinerary not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                shareId: booking.shareId,
                shareUrl: `${req.protocol}://${req.get("host")}/api/bookings/share/${booking.shareId}`,
                appShareUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/share/${booking.shareId}`,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create share link",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.createShareLink = createShareLink;
const getSharedItinerary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const booking = yield Booking_1.default.findOne({
            shareId: req.params.shareId,
        });
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Shared itinerary not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: booking,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch shared itinerary",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getSharedItinerary = getSharedItinerary;
