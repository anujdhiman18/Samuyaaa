import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    quote: { type: String, required: true, trim: true },
    stars: { type: Number, required: true, min: 1, max: 5, default: 5 },
    initials: { type: String, default: '' },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Feedback', feedbackSchema);
