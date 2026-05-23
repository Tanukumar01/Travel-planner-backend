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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT || 5001);
const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((o) => o.trim().replace(/\/$/, ""))
    : [];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) {
            return callback(null, true);
        }
        const isExplicitlyAllowed = allowedOrigins.includes(origin);
        const isVercelPreview = origin.endsWith(".vercel.app");
        const isLocal = origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");
        if (isExplicitlyAllowed || isVercelPreview || isLocal) {
            callback(null, true);
        }
        else {
            callback(null, false);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    optionsSuccessStatus: 200,
}));
app.use(express_1.default.json({ limit: "2mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes_1.default);
app.use("/api/bookings", bookingRoutes_1.default);
app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Travel itinerary API is running",
        environment: {
            MONGO_URL: !!process.env.MONGO_URL,
            JWT_SECRET: !!process.env.JWT_SECRET,
            OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
            CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
            CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
            CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
        }
    });
});
app.get("/", (_req, res) => {
    res.send("Travel itinerary server is running");
});
// For Vercel Serverless environment, we initialize the database connection
// but do not run app.listen().
// In local development, we run both.
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, db_1.default)();
        // Only start listening if not running on Vercel serverless environment
        if (!process.env.VERCEL) {
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
            });
        }
    }
    catch (error) {
        console.error("Server startup failed", error);
        if (!process.env.VERCEL) {
            process.exit(1);
        }
    }
});
void startServer();
exports.default = app;
