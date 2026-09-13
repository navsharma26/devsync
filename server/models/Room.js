import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      unique: true,
      required: [true, 'Room ID is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Interview Workspace',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    language: {
      type: String,
      default: 'javascript',
      trim: true,
    },
    code: {
      type: String,
      default: '// Write your solution here...',
    },
    problemDescription: {
      type: String,
      default:
        'Two Sum: Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    },
    testCases: [
      {
        input: { type: String, required: true },
        expectedOutput: { type: String, required: true },
        isHidden: { type: Boolean, default: false },
      },
    ],
    feedback: {
      problemSolvingRating: { type: Number, min: 1, max: 5, default: null },
      codeQualityRating: { type: Number, min: 1, max: 5, default: null },
      communicationRating: { type: Number, min: 1, max: 5, default: null },
      feedbackNotes: { type: String, default: '' },
      submittedAt: { type: Date, default: null },
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // MongoDB TTL index: automatically delete documents 24 hours (86400s) after createdAt
    },
  },
  {
    timestamps: true,
  }
);

const Room = mongoose.model('Room', roomSchema);

export default Room;
