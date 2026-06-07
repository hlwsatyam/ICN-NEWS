import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileType: String,
    fileSize: Number,
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['proposal', 'contract', 'invoice', 'notes', 'attachment', 'other'],
      default: 'other',
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Document', documentSchema);
