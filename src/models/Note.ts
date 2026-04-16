import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  isEncrypted: boolean;
  iv?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, required: false, default: '' },
    isEncrypted: { type: Boolean, required: true, default: false },
    iv: { type: String, required: false },
    tags: { type: [String], required: false, default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);