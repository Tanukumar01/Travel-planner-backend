import { Readable } from "stream";
import type { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary";

type CloudinaryUploadResult = {
    secureUrl: string;
    publicId: string;
    resourceType: string;
    format: string;
    bytes: number;
};

const getUploadFolder = (): string =>
    process.env.CLOUDINARY_UPLOAD_FOLDER || "travel-docs/bookings";

const assertCloudinaryConfig = (): void => {
    if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
    ) {
        throw new Error(
            "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env."
        );
    }
};

export const uploadBufferToCloudinary = async ({
    buffer,
    fileType,
    originalName,
}: {
    buffer: Buffer;
    fileType: string;
    originalName: string;
}): Promise<CloudinaryUploadResult> => {
    assertCloudinaryConfig();

    const safeName = originalName
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80);
    const resourceType = fileType.startsWith("image/") ? "image" : "raw";

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: getUploadFolder(),
                public_id: `${Date.now()}-${safeName}`,
                resource_type: resourceType,
                use_filename: true,
                unique_filename: true,
            },
            (error, response) => {
                if (error || !response) {
                    reject(error ?? new Error("Cloudinary upload failed"));
                    return;
                }

                resolve(response);
            }
        );

        Readable.from(buffer).pipe(uploadStream);
    });

    return {
        secureUrl: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        bytes: result.bytes,
    };
};

export const deleteCloudinaryAsset = async ({
    publicId,
    resourceType,
}: {
    publicId?: string;
    resourceType?: string;
}): Promise<void> => {
    if (!publicId) {
        return;
    }

    assertCloudinaryConfig();

    await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: resourceType || "raw",
    });
};
