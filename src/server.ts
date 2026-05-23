import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import bookingRoutes from "./routes/bookingRoutes";

dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT || 5001);

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((o) => o.trim().replace(/\/$/, ""))
    : [];

app.use(
    cors({
        origin: (
            origin: string | undefined,
            callback: (err: Error | null, allow?: boolean) => void
        ) => {
            // Allow requests with no origin (like mobile apps, curl, etc.)
            if (!origin) {
                return callback(null, true);
            }
            
            const isExplicitlyAllowed = allowedOrigins.includes(origin);
            const isVercelPreview = origin.endsWith(".vercel.app");
            const isLocal = origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");
            
            if (isExplicitlyAllowed || isVercelPreview || isLocal) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
        optionsSuccessStatus: 200,
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

// For Vercel Serverless environment, we initialize the database connection
// but do not run app.listen().
// In local development, we run both.
const startServer = async (): Promise<void> => {
    try {
        await connectDB();
        
        // Only start listening if not running on Vercel serverless environment
        if (!process.env.VERCEL) {
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
            });
        }
    } catch (error) {
        console.error("Server startup failed", error);
        if (!process.env.VERCEL) {
            process.exit(1);
        }
    }
};

void startServer();

export default app;

