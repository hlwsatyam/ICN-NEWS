import mongoose from 'mongoose';

const productSaleSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    salePrice: {
      type: Number,
      required: true,
    },
    soldBy: {
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

productSaleSchema.index({ leadId: 1 });
productSaleSchema.index({ productId: 1 });
productSaleSchema.index({ soldBy: 1 });
productSaleSchema.index({ createdAt: -1 });

export default mongoose.model('ProductSale', productSaleSchema);
