import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILabelDocument extends Document {
  name: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LabelSchema = new Schema<ILabelDocument>(
  {
    name: { type: String, required: true, trim: true },
    userId: { type: String, default: null, index: true },
  },
  {
    timestamps: true,
  }
);

export const LabelModel: Model<ILabelDocument> =
  mongoose.models.Label || mongoose.model<ILabelDocument>('Label', LabelSchema);

export default LabelModel;
