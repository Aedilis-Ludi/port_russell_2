// models/reservationModel.js
const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  catwayNumber: { type: Number, required: true },
  clientName:   { type: String, required: true, trim: true },
  boatName:     { type: String, required: true, trim: true },
  startDate:    { type: Date, required: true },
  endDate:      { type: Date, required: true },
}, { timestamps: true });

// Validation : la date de fin doit être après ou égale à la date de début
reservationSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    return next(new Error('La date de fin doit être postérieure ou égale à la date de début'));
  }
  next();
});

module.exports = mongoose.model('Reservation', reservationSchema);
