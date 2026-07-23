import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    role?: string;
    password: string;
    pages: string[]
}

const userSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String },
    pages: { type: [String], default: [] },
    password: { type: String, required: true },
});

// Prevent model overwrite in development (hot reloading)
export default mongoose.models.User || mongoose.model<IUser>("User", userSchema);
