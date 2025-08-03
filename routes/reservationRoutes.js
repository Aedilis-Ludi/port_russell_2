const express = require('express');
const router = express.Router({ mergeParams: true }); 
const Reservation = require('../models/reservationModel');

// helper pour détecter chevauchement
async function hasOverlap(catwayNumber, startDate, endDate, excludeId = null) {
  const criteria = {
    catwayNumber,
    $and: [
      { startDate: { $lte: new Date(endDate) } },
      { endDate: { $gte: new Date(startDate) } },
    ],
  };
  if (excludeId) {
    criteria._id = { $ne: excludeId };
  }
  const overlapping = await Reservation.findOne(criteria);
  return !!overlapping;
}

// GET liste 
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.params.catwayNumber) {
      filter.catwayNumber = Number(req.params.catwayNumber);
    }
    const reservations = await Reservation.find(filter).lean();
    res.json(reservations);
  } catch (err) {
    next(err);
  }
});

// GET une réservation par id
router.get('/:id', async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id).lean();
    if (!reservation) return res.status(404).json({ message: 'Réservation introuvable' });

    if (req.params.catwayNumber && reservation.catwayNumber !== Number(req.params.catwayNumber)) {
      return res.status(404).json({ message: 'Réservation non liée à ce catway' });
    }

    res.json(reservation);
  } catch (err) {
    next(err);
  }
});

// POST création avec prévention de chevauchement et validation de dates
router.post('/', async (req, res, next) => {
  try {
    if (!req.params.catwayNumber) {
      return res.status(400).json({ message: 'catwayNumber requis dans l\'URL' });
    }
    const catwayNumber = Number(req.params.catwayNumber);
    const { clientName, boatName, startDate, endDate } = req.body;

    if (!clientName || !boatName || !startDate || !endDate) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // validation des dates
    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: 'startDate doit être avant endDate' });
    }

    // chevauchement
    if (await hasOverlap(catwayNumber, start, end)) {
      return res.status(409).json({ message: 'Chevauchement avec une réservation existante' });
    }

    const reservation = new Reservation({
      catwayNumber,
      clientName,
      boatName,
      startDate: start,
      endDate: end,
    });

    await reservation.save();
    res.status(201).json(reservation);
  } catch (err) {
    next(err);
  }
});

// PUT mise à jour avec vérifications
router.put('/:id', async (req, res, next) => {
  try {
    // récupérer la réservation existante
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Réservation introuvable' });

    if (req.params.catwayNumber && reservation.catwayNumber !== Number(req.params.catwayNumber)) {
      return res.status(404).json({ message: 'Réservation non liée à ce catway' });
    }

    // préparer les nouvelles valeurs
    const updates = {};
    if (req.body.clientName !== undefined) updates.clientName = req.body.clientName;
    if (req.body.boatName !== undefined) updates.boatName = req.body.boatName;

    const newStart = req.body.startDate ? new Date(req.body.startDate) : reservation.startDate;
    const newEnd = req.body.endDate ? new Date(req.body.endDate) : reservation.endDate;

    // validation des dates
    if (isNaN(newStart) || isNaN(newEnd) || newStart >= newEnd) {
      return res.status(400).json({ message: 'startDate doit être avant endDate' });
    }

    // chevauchement en excluant la réservation elle-même
    if (await hasOverlap(reservation.catwayNumber, newStart, newEnd, reservation._id)) {
      return res.status(409).json({ message: 'Chevauchement avec une réservation existante' });
    }

    // appliquer les mises à jour
    if (updates.clientName) reservation.clientName = updates.clientName;
    if (updates.boatName) reservation.boatName = updates.boatName;
    reservation.startDate = newStart;
    reservation.endDate = newEnd;

    await reservation.save();
    res.json(reservation);
  } catch (err) {
    next(err);
  }
});

// DELETE une réservation
router.delete('/:id', async (req, res, next) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Réservation introuvable' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
