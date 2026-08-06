const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
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
    badge: {
      type: String,
      default: '🎓 Faculty Role',
    },
    color: {
      type: String,
      default: 'purple',
    },
    description: {
      type: String,
      default: '',
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    permissions: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
