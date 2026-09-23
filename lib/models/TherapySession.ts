import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const messageSchema = new Schema(
    {
        role: { type: String, enum: ["user", "assistant"], required: true },
        content: { type: String, required: true, trim: true, maxlength: 4000 },
        timestamp: { type: Date, required: true, default: Date.now },
        emotion: {
            type: String,
            enum: ["Anxious", "Sad", "Angry", "Hopeful", "Calm", "Neutral", "Unknown"],
        },
        confidence: { type: Number, min: 0, max: 100 },
        crisisLevel: { type: String, enum: ["none", "low", "medium", "high"] },
        technique: { type: String, trim: true, maxlength: 120 },
    },
    { _id: false }
);

const therapySessionSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        type: { type: String, enum: ["chat", "voice"], required: true, default: "chat" },
        messages: { type: [messageSchema], default: [] },
        durationSeconds: { type: Number, min: 0, default: 0 },
        dominantEmotion: {
            type: String,
            enum: ["Anxious", "Sad", "Angry", "Hopeful", "Calm", "Neutral", "Unknown"],
        },
    },
    { timestamps: true }
);

export type TherapySessionDocument = InferSchemaType<typeof therapySessionSchema> & {
    _id: Schema.Types.ObjectId;
};

if (process.env.NODE_ENV === "development" && models.TherapySession) {
    delete (models as Record<string, unknown>).TherapySession;
}

export const TherapySession: Model<TherapySessionDocument> =
    (models.TherapySession as Model<TherapySessionDocument>) ??
    model<TherapySessionDocument>("TherapySession", therapySessionSchema);
