const mongoose = require('mongoose');

const codeItRegistrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  registrationNumber: {
    type: String,
    required: true,
    trim: true,
  },
  programmingLanguage: {
    type: String,
    required: true,
    trim: true,
  },
  usedHackerRank: {
    type: String,
    enum: ['Yes', 'No'],
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('CodeItRegistration', codeItRegistrationSchema);
