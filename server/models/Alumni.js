import mongoose from 'mongoose';

const alumniSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    graduation_year: {
      type: Number,
      required: [true, 'Graduation year is required'],
    },
    course: {
      type: String,
      trim: true,
      default: '',
    },
    current_company: {
      type: String,
      required: [true, 'Current company is required'],
      trim: true,
    },
    current_position: {
      type: String,
      required: [true, 'Current position is required'],
      trim: true,
    },
    package_ctc: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    achievement: {
      type: String,
      trim: true,
      default: '',
    },
    testimonial: {
      type: String,
      trim: true,
      default: '',
    },
    linkedin_url: {
      type: String,
      trim: true,
      default: '',
    },
    photo_url: {
      type: String,
      required: [true, 'Photo URL is required'],
    },
    display_order: {
      type: Number,
      default: 1,
    },
    is_featured: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export default mongoose.model('Alumni', alumniSchema);
