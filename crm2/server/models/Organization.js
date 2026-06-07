import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logo: String,
    favicon: String,
    sidebarLogo: String,
    themeColor: {
      type: String,
      default: '#3B82F6',
    },
    secondaryTheme: {
      type: String,
      default: '#1E40AF',
    },
    contactDetails: {
      email: String,
      phone: String,
      address: String,
    },
    footerText: String,
    backgroundImage: String,
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Organization', organizationSchema);
