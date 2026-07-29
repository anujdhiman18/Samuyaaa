import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Faculty name is required'],
      trim: true,
    },
    designation: {
      type: String,
      default: 'Senior Faculty Member',
    },
    subject: {
      type: String,
      default: 'General Academics',
    },
    qualification: {
      type: String,
      default: 'Master’s Degree',
    },
    experience: {
      type: String,
      default: '5+ Years Experience',
    },
    photo_url: {
      type: String,
      required: [true, 'Faculty photo URL is required'],
    },
    display_order: {
      type: Number,
      default: 1,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Faculty = mongoose.models.Faculty || mongoose.model('Faculty', facultySchema);
export default Faculty;
