import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['lead_assigned', 'status_changed', 'document_uploaded', 'mention', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    link: String,
  },
  {
    timestamps: true,
  }
);

// Index for performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);
