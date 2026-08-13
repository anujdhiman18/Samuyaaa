import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['General', 'Exam', 'Holiday', 'Fee', 'Timetable'],
      default: 'General',
    },
    targetClass: {
      type: String,
      enum: ['S1', 'S2', 'S3', 'S4', 'All'],
      default: 'All',
    },
    authorName: {
      type: String,
      default: 'Jitender Sharma (Director)',
    },
    publishedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
export default Announcement;
