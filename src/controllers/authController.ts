import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import generateToken from "../utils/generateToken";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

const buildAuthPayload = (user: {
    _id: { toString(): string };
    name: string;
    email: string;
}) => ({
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    token: generateToken(user._id.toString()),
});

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password } = req.body as {
            name?: string;
            email?: string;
            password?: string;
        };

        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                message: "Name, email, and password are required",
            });
            return;
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: "User already exists",
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
        });

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            data: buildAuthPayload(user),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body as {
            email?: string;
            password?: string;
        };

        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
            return;
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
            return;
        }

        const isPasswordMatched = await bcrypt.compare(password, user.password);
        if (!isPasswordMatched) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: buildAuthPayload(user),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Login failed",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getCurrentUser = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.id;
        const user = await User.findById(userId).select("-password");

        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch user profile",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
