import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import bookingRoutes from "./routes/bookingRoutes";

dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT || 5001);

app.use(
    cors({
        origin: process.env.CLIENT_URL || true,
    })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Travel itinerary API is running",
    });
});

app.get("/", (_req: Request, res: Response) => {
    res.send("Travel itinerary server is running");
});

const startServer = async (): Promise<void> => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed", error);
        process.exit(1);
    }
};

void startServer();
