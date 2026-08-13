import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    subject: {
      type: String,
      required: true,
    },
    className: {
      type: String,
      required: true,
      enum: ['S1', 'S2', 'S3', 'S4'],
      default: 'S2',
    },
    facultyId: {
      type: String,
      required: true,
    },
    facultyName: String,
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: String,
    fileType: {
      type: String,
      enum: ['PDF', 'PPT', 'Video', 'Document', 'Link'],
      default: 'PDF',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const StudyMaterial = mongoose.models.StudyMaterial || mongoose.model('StudyMaterial', studyMaterialSchema);
export default StudyMaterial;
