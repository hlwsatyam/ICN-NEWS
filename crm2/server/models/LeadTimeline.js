import mongoose from 'mongoose';

const leadTimelineSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: String,
    userRole: String,
    actionType: {
      type: String,
      enum: [
        'lead_created',
        'lead_edited',
        'status_changed',
        'product_sold',
        'note_added',
        'note_edited',
        'task_created',
        'task_updated',
        'document_uploaded',
        'followup_added',
        'profile_updated',
      ],
    },
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    reason: String,
    description: String,
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
  },
  {
    timestamps: true,
  }
);

leadTimelineSchema.index({ leadId: 1 });
leadTimelineSchema.index({ userId: 1 });
leadTimelineSchema.index({ createdAt: -1 });
leadTimelineSchema.index({ actionType: 1 });

export default mongoose.model('LeadTimeline', leadTimelineSchema);
