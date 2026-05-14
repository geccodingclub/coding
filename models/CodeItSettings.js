const mongoose = require('mongoose');

const codeItSettingsSchema = new mongoose.Schema({
  hackerrankLink: {
    type: String,
    default: ''
  },
  isLinkPublished: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('CodeItSettings', codeItSettingsSchema);
