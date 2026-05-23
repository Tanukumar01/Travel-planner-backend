import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
    const mongoUrl = process.env.MONGO_URL;

    if (!mongoUrl) {
        throw new Error("MONGO_URL is missing from the environment");
    }

    const connection = await mongoose.connect(mongoUrl);
    console.log(`Database connected: ${connection.connection.host}`);
};

export default connectDB;
