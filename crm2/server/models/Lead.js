import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    alternateNumber: String,
    city: String,
    address: String,
    saleValue: {
      type: Number,
      default: 0,
    },
    loanType: {
      type: String,
      enum: ['personal', 'business', 'car', 'credit', 'home', 'gold'],
      required: true,
    },
    status: {
      type: String,
      enum: ['new', 'order', 'in_progress', 'payment_done', 'hold', 'cancelled', 'rejected'],
      default: 'new',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    followupDate: Date,
    description: String,
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true,
        },
        content: String,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: Date,
      },
    ],
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        quantity: Number,
        salePrice: Number,
        saleDate: Date,
        soldBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    followups: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true,
        },
        type: {
          type: String,
          enum: ['call', 'meeting', 'email'],
        },
        date: Date,
        notes: String,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    timeline: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LeadTimeline',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
leadSchema.index({ status: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ company: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ loanType: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ followupDate: 1 });

export default mongoose.model('Lead', leadSchema);
