import mongoose, { Document, Model, Schema } from 'mongoose';
import { NoteColorId } from '@/types/note';

export interface INoteDocument extends Document {
  title: string;
  content: string;
  color: NoteColorId;
  isPinned: boolean;
  isImportant: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  labels: string[];
  checklist?: {
    id: string;
    text: string;
    completed: boolean;
  }[];
  noteType: 'text' | 'checklist' | 'image' | 'voice';
  images: string[];
  audioUrl?: string | null;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const CheckItemSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const NoteSchema = new Schema<INoteDocument>(
  {
    title: { type: String, default: '', trim: true },
    content: { type: String, default: '' },
    color: {
      type: String,
      default: 'default',
      enum: [
        'default',
        'coral',
        'peach',
        'sand',
        'mint',
        'sage',
        'fog',
        'storm',
        'dusk',
        'blossom',
        'clay',
      ],
    },
    isPinned: { type: Boolean, default: false, index: true },
    isImportant: { type: Boolean, default: false, index: true },
    isArchived: { type: Boolean, default: false, index: true },
    isTrashed: { type: Boolean, default: false, index: true },
    labels: [{ type: String, trim: true }],
    checklist: [CheckItemSchema],
    noteType: { type: String, default: 'text', enum: ['text', 'checklist', 'image', 'voice'], index: true },
    images: [{ type: String }],
    audioUrl: { type: String, default: null },
    userId: { type: String, default: null, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        if (ret._id) {
          ret.id = String(ret._id);
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Prevent re-compilation during hot module replacement
export const NoteModel: Model<INoteDocument> =
  mongoose.models.Note || mongoose.model<INoteDocument>('Note', NoteSchema);

export default NoteModel;
