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
exports.deleteCloudinaryAsset = exports.uploadBufferToCloudinary = void 0;
const stream_1 = require("stream");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const getUploadFolder = () => process.env.CLOUDINARY_UPLOAD_FOLDER || "travel-docs/bookings";
const assertCloudinaryConfig = () => {
    if (!process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET) {
        throw new Error("Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env.");
    }
};
const uploadBufferToCloudinary = (_a) => __awaiter(void 0, [_a], void 0, function* ({ buffer, fileType, originalName, }) {
    assertCloudinaryConfig();
    const safeName = originalName
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80);
    const resourceType = fileType.startsWith("image/") ? "image" : "raw";
    const result = yield new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.uploader.upload_stream({
            folder: getUploadFolder(),
            public_id: `${Date.now()}-${safeName}`,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
        }, (error, response) => {
            if (error || !response) {
                reject(error !== null && error !== void 0 ? error : new Error("Cloudinary upload failed"));
                return;
            }
            resolve(response);
        });
        stream_1.Readable.from(buffer).pipe(uploadStream);
    });
    return {
        secureUrl: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        bytes: result.bytes,
    };
});
exports.uploadBufferToCloudinary = uploadBufferToCloudinary;
const deleteCloudinaryAsset = (_a) => __awaiter(void 0, [_a], void 0, function* ({ publicId, resourceType, }) {
    if (!publicId) {
        return;
    }
    assertCloudinaryConfig();
    yield cloudinary_1.default.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: resourceType || "raw",
    });
});
exports.deleteCloudinaryAsset = deleteCloudinaryAsset;
