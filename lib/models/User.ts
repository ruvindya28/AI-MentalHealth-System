import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 120 },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
        },
        passwordHash: { type: String, required: false, select: false },
        googleId: { type: String, sparse: true, unique: true, select: false },
        image: { type: String, default: null },
        imageSource: { type: String, enum: ["google", "upload", "custom", null], default: null },
        emailVerified: { type: Boolean, default: false },
        timezone: { type: String, default: "UTC" },
        preferences: {
            notifications: { type: Schema.Types.Mixed, default: {} },
            privacy: { type: Schema.Types.Mixed, default: {} },
        },
        resetPasswordTokenHash: { type: String, select: false },
        resetPasswordExpires: { type: Date, select: false },
        otpCodeHash: { type: String, select: false },
        otpExpires: { type: Date, select: false },
    },
    { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: Schema.Types.ObjectId };

export const User: Model<UserDocument> =
    models.User ?? model<UserDocument>("User", userSchema);
