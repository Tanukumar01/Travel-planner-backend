import jwt from "jsonwebtoken";

const generateToken = (id: string): string => {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error("JWT_SECRET is missing from the environment");
    }

    return jwt.sign({ id }, jwtSecret, {
        expiresIn: "1d",
    });
};

export default generateToken;
