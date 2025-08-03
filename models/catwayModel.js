const mongoose = require('mongoose');

const catwaySchema = new mongoose.Schema({
  catwayNumber: {
    type: Number,
    required: true,
    unique: true, // garantit l'unicité et crée un index
  },

  catwayType: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    enum: {
      values: ['long', 'short'],
      message: 'Le type doit être "long" ou "short".',
    },
  },

  catwayState: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Catway', catwaySchema);
