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
      default: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      default: 'faculty123',
    },
    phone: {
      type: String,
      default: '9816099999',
    },
    department: {
      type: String,
      default: 'Science & Mathematics',
    },
    assignedClasses: [
      {
        type: String,
        default: '10th',
      },
    ],
    assignedSubjects: [
      {
        type: String,
        default: 'Mathematics',
      },
    ],
    role: {
      type: String,
      default: 'Faculty',
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
