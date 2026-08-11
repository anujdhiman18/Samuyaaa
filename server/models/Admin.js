import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide admin name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide admin email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: 6,
    },
    role: {
      type: String,
      default: 'SuperAdmin',
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    phone: {
      type: String,
      default: '+91 9816543210',
    },
    department: {
      type: String,
      default: 'Academic Management & Operations',
    },
    bio: {
      type: String,
      default: 'Director & Senior Administrator overseeing Saumyaa Studies academic excellence, faculty management, and student affairs.',
    },
    permissions: {
      type: [String],
      default: ['MARK_ATTENDANCE', 'UPLOAD_GRADES', 'VIEW_STUDENT_ACADEMICS', 'MANAGE_CLASSES'],
    },
    additionalPermissions: {
      type: [String],
      default: ['MARK_ATTENDANCE', 'UPLOAD_GRADES', 'VIEW_STUDENT_ACADEMICS', 'MANAGE_CLASSES'],
    },
  },
  { timestamps: true }
);

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
export default Admin;
