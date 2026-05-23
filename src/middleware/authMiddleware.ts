import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = {
    id: string;
};

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
    };
}

export const protect = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
            success: false,
            message: "Authorization token is required",
        });
        return;
    }

    const token = authHeader.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        res.status(500).json({
            success: false,
            message: "JWT_SECRET is missing from the environment",
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
        req.user = {
            id: decoded.id,
        };
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
