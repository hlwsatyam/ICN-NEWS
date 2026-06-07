import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('[v0] MongoDB connected successfully');
  } catch (error) {
    console.error('[v0] MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[v0] MongoDB disconnected');
  } catch (error) {
    console.error('[v0] MongoDB disconnect error:', error);
  }
};
