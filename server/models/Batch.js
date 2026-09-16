import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
    },
    academicSession: {
      type: String,
      default: '2025-2026',
      trim: true,
    },
    className: {
      type: String,
      default: '10th',
      trim: true,
    },
    category: {
      type: String,
      enum: ['S1', 'S2', 'S3', 'S4'],
      default: 'S2',
    },
    timings: {
      type: String,
      default: '5:00 PM – 6:30 PM',
      trim: true,
    },
    branch: {
      type: String,
      default: 'Main Center (Bagru)',
      trim: true,
    },
    maxCapacity: {
      type: Number,
      default: 20,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

batchSchema.index({ academicSession: 1, className: 1, branch: 1 });

const Batch = mongoose.models.Batch || mongoose.model('Batch', batchSchema);
export default Batch;
