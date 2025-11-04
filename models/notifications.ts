import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'swap_proposal' | 'friend_request' | 'swap_accepted' | 'swap_rejected' | 'message';
  senderId: mongoose.Types.ObjectId;
  message: string;
  data: {
    matchId?: string;
    skillOffered?: string;
    skillRequested?: string;
    proposalMessage?: string;
    messageId?: string;
    requestId?: string;
  };
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['swap_proposal', 'friend_request', 'swap_accepted', 'swap_rejected', 'message'],
    required: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    matchId: String,
    skillOffered: String,
    skillRequested: String,
    proposalMessage: String,
    messageId: String,
    requestId: String
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;