import mongoose, { Document, Schema } from "mongoose";

type ExtractionData = {
    documentType: string;
    probableDestination: string;
    travelDates: string[];
    providers: string[];
    confirmationCodes: string[];
    importantNotes: string[];
    rawSummary: string;
};

type ItineraryDay = {
    day: number;
    title: string;
    location: string;
    agenda: string[];
    notes: string[];
};

type ItineraryPlan = {
    title: string;
    summary: string;
    travelWindow: string;
    destinations: string[];
    checklist: string[];
    days: ItineraryDay[];
};

export interface IBooking extends Document {
    userId: string;
    documentName: string;
    fileUrl: string;
    fileType: string;
    cloudinaryPublicId?: string;
    cloudinaryResourceType?: string;
    status: "generated" | "failed";
    extractedText: string;
    extractedData: ExtractionData;
    itinerary: ItineraryPlan;
    shareId: string;
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        documentName: {
            type: String,
            required: true,
        },
        fileUrl: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
            required: true,
        },
        cloudinaryPublicId: {
            type: String,
            default: "",
        },
        cloudinaryResourceType: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["generated", "failed"],
            required: true,
        },
        extractedText: {
            type: String,
            default: "",
        },
        extractedData: {
            type: Schema.Types.Mixed,
            required: true,
        },
        itinerary: {
            type: Schema.Types.Mixed,
            required: true,
        },
        shareId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

const Booking = mongoose.model<IBooking>("Booking", bookingSchema);

export default Booking;
