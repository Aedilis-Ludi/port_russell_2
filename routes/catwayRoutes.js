const express = require('express');
const router = express.Router();
const Catway = require('../models/catwayModel');
const reservationRoutes = require('./reservationRoutes');
const { checkJWT } = require('../middlewares/private'); 

// GET /catways - liste tous les catways avec réservation active
router.get('/', async (req, res, next) => {
  try {
    const today = new Date();
    const catways = await Catway.find().lean();
    const Reservation = require('../models/reservationModel');

    const activeReservations = await Reservation.find({
      startDate: { $lte: today },
      endDate: { $gte: today },
    }).lean();

    const reservedMap = {};
    activeReservations.forEach(r => {
      reservedMap[r.catwayNumber] = r;
    });

    const list = catways.map(c => ({
      ...c,
      currentReservation: reservedMap[c.catwayNumber] || null,
    }));

    res.render ? res.render('catways', { catways: list }) : res.json(list);
  } catch (err) {
    next(err);
  }
});

// GET /catways/:catwayNumber - détail
router.get('/:catwayNumber', async (req, res, next) => {
  try {
    const catwayNumber = Number(req.params.catwayNumber);
    const catway = await Catway.findOne({ catwayNumber }).lean();
    if (!catway) return res.status(404).json({ message: 'Catway introuvable' });
    res.json(catway);
  } catch (err) {
    next(err);
  }
});

// POST /catways - créer un nouveau catway
router.post('/', checkJWT, async (req, res, next) => {
  try {
    const { catwayNumber, catwayType, catwayState } = req.body;
    if (catwayNumber == null || !catwayType) {
      return res.status(400).json({ message: 'catwayNumber et catwayType requis' });
    }
    const existing = await Catway.findOne({ catwayNumber });
    if (existing) {
      return res.status(409).json({ message: 'Catway déjà existant' });
    }
    const catway = await Catway.create({ catwayNumber, catwayType, catwayState });
    res.status(201).json(catway);
  } catch (err) {
    next(err);
  }
});

// PUT /catways/:catwayNumber - modifier uniquement l'état (catwayState)
router.put('/:catwayNumber', checkJWT, async (req, res, next) => {
  try {
    const catwayNumber = Number(req.params.catwayNumber);
    const { catwayState } = req.body;
    if (catwayState === undefined) {
      return res.status(400).json({ message: 'catwayState requis pour mise à jour' });
    }
    const updated = await Catway.findOneAndUpdate(
      { catwayNumber },
      { catwayState },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ message: 'Catway introuvable' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /catways/:catwayNumber
router.delete('/:catwayNumber', checkJWT, async (req, res, next) => {
  try {
    const catwayNumber = Number(req.params.catwayNumber);
    const deleted = await Catway.findOneAndDelete({ catwayNumber });
    if (!deleted) return res.status(404).json({ message: 'Catway introuvable' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Imbriquer les réservations : /catways/:catwayNumber/reservations
router.use('/:catwayNumber/reservations', reservationRoutes);

module.exports = router;
