const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Common Faculty Basics',
        'Subject Teacher',
        'Senior Faculty',
        'Head of Department (HOD)',
        'Academic Coordinator',
        'Admin System Control',
      ],
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Permission', permissionSchema);
