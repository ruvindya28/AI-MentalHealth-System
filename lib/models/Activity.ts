import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const activitySchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        type: { type: String, required: true, trim: true, maxlength: 60 },
        name: { type: String, required: true, trim: true, maxlength: 120 },
        durationMinutes: { type: Number, min: 0, max: 1440 },
        description: { type: String, trim: true, maxlength: 1000 },
    },
    { timestamps: true }
);

export type ActivityDocument = InferSchemaType<typeof activitySchema> & {
    _id: Schema.Types.ObjectId;
};

export const Activity: Model<ActivityDocument> =
    models.Activity ?? model<ActivityDocument>("Activity", activitySchema);
