import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  kdfSalt: string;
  encryptedMasterKey: string;
  masterKeyIv: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    kdfSalt: { type: String, required: true },
    encryptedMasterKey: { type: String, required: true },
    masterKeyIv: { type: String, required: true },
    tokenVersion: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);