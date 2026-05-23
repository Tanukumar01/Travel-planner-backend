import { Response } from "express";
import Booking from "../models/Booking";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { processTravelDocument } from "../services/aiItineraryService";
import {
    deleteCloudinaryAsset,
    uploadBufferToCloudinary,
} from "../services/cloudinaryUploadService";

export const uploadBookingDocument = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user?.id) {
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

        const cloudinaryFile = await uploadBufferToCloudinary({
            buffer: req.file.buffer,
            fileType: req.file.mimetype,
            originalName: req.file.originalname,
        });

        const processedDocument = await processTravelDocument({
            fileBuffer: req.file.buffer,
            fileType: req.file.mimetype,
            originalName: req.file.originalname,
        });

        const booking = await Booking.create({
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
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to upload and process the document",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getUserItineraries = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const bookings = await Booking.find({ userId: req.user?.id }).sort({
            createdAt: -1,
        });

        res.status(200).json({
            success: true,
            data: bookings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch itinerary history",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getItineraryById = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            userId: req.user?.id,
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
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch the itinerary",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const deleteItineraryById = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            userId: req.user?.id,
        });

        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Document not found",
            });
            return;
        }

        await deleteCloudinaryAsset({
            publicId: booking.cloudinaryPublicId,
            resourceType: booking.cloudinaryResourceType,
        });

        await booking.deleteOne();

        res.status(200).json({
            success: true,
            message: "Document and itinerary deleted",
            data: {
                id: req.params.id,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete the document",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const createShareLink = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            userId: req.user?.id,
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
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create share link",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getSharedItinerary = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const booking = await Booking.findOne({
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
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch shared itinerary",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
