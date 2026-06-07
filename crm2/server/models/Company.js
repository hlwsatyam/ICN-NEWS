import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    industry: String,
    website: String,
    email: {
      type: String,
      lowercase: true,
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    employees: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['prospect', 'customer', 'inactive'],
      default: 'prospect',
    },
    logo: String,
    leads: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Company', companySchema);
