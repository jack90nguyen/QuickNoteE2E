import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  snippet?: string;
  isEncrypted: boolean;
  iv?: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: false, default: '' },
    snippet: { type: String, required: false, default: '' },
    isEncrypted: { type: Boolean, required: true, default: false },
    iv: { type: String, required: false },
    isPinned: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

NoteSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
