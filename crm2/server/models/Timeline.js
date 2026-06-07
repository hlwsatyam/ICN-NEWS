import mongoose from 'mongoose';

const timelineSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
    },
    type: {
      type: String,
      enum: ['status_change', 'assignment', 'note', 'document_upload', 'call', 'email', 'meeting', 'comment'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    oldValue: String,
    newValue: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Index for performance
timelineSchema.index({ lead: 1, createdAt: -1 });

export default mongoose.model('Timeline', timelineSchema);
