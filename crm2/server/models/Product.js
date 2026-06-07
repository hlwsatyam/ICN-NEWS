import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    stock: {
      type: Number,
      default: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    image: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued'],
      default: 'active',
    },
    features: [String],
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

export default mongoose.model('Product', productSchema);
