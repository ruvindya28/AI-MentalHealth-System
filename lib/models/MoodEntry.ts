import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const moodEntrySchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        moodScore: { type: Number, required: true, min: 0, max: 100 },
        note: { type: String, trim: true, maxlength: 1000 },
    },
    { timestamps: true }
);

export type MoodEntryDocument = InferSchemaType<typeof moodEntrySchema> & {
    _id: Schema.Types.ObjectId;
};

export const MoodEntry: Model<MoodEntryDocument> =
    models.MoodEntry ?? model<MoodEntryDocument>("MoodEntry", moodEntrySchema);
