import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  authKey: string;
  isActive: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  loginCount: number;
  updateLoginStats(): Promise<IUser>;
}

const userSchema = new Schema<IUser>({
  authKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isSuperAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  }
});

// Update last login time and increment login count
userSchema.methods.updateLoginStats = function() {
  this.lastLoginAt = new Date();
  this.loginCount += 1;
  return this.save();
};

export const User = mongoose.model<IUser>('User', userSchema); 