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
exports.getCurrentUser = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const generateToken_1 = __importDefault(require("../utils/generateToken"));
const buildAuthPayload = (user) => ({
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    token: (0, generateToken_1.default)(user._id.toString()),
});
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                message: "Name, email, and password are required",
            });
            return;
        }
        const existingUser = yield User_1.default.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: "User already exists",
            });
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield User_1.default.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
        });
        res.status(201).json({
            success: true,
            message: "Account created successfully",
            data: buildAuthPayload(user),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
            return;
        }
        const user = yield User_1.default.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
            return;
        }
        const isPasswordMatched = yield bcryptjs_1.default.compare(password, user.password);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Login failed",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.login = login;
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const user = yield User_1.default.findById(userId).select("-password");
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch user profile",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getCurrentUser = getCurrentUser;
