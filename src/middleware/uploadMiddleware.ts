import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 15 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "text/plain",
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
            return;
        }

        cb(new Error("Only PDF, DOC, DOCX, TXT, JPG, PNG, and WEBP files are allowed"));
    },
});

export default upload;
