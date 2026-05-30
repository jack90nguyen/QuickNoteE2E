import mongoose, { Schema, Document } from 'mongoose';

export interface IApiToken extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  prefix: string;
  tokenHash: string;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApiTokenSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, maxlength: 100 },
    prefix: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true },
    lastUsedAt: { type: Date, required: false },
  },
  { timestamps: true }
);

export default mongoose.models.ApiToken ||
  mongoose.model<IApiToken>('ApiToken', ApiTokenSchema);
