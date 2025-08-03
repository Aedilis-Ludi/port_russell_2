require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// modèles
const Catway = require('./models/catwayModel');
const Reservation = require('./models/reservationModel');
const User = require('./models/userModel');

const catways = require(path.join(__dirname, 'data', 'catways.json'));
const reservations = require(path.join(__dirname, 'data', 'reservations.json'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/port_russell_2';

async function main() {
  if (process.env.RESET_DB !== 'true') {
    console.log('Pour lancer le seed, définis RESET_DB=true (protection anti-effacement accidentel).');
    console.log('Exemple (Windows cmd): set RESET_DB=true&& node seed.js');
    process.exit(0);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connecté à MongoDB pour seed sur', MONGO_URI);

  // Vide les collections
  await Catway.deleteMany({});
  await Reservation.deleteMany({});
  await User.deleteMany({}); // on recrée l'utilisateur aussi

  // Inserer catways et réservations
  await Catway.insertMany(catways);
  await Reservation.insertMany(reservations);
  console.log('Seed : catways et reservations importés.');

  // Crée l'utilisateur de test
  const email = 'john@example.com';
  const password = '123456';
  const username = 'john';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Utilisateur déjà présent :', email);
  } else {
    const u = new User({ email, username, password });
    await u.save(); // le pre 'save' hashera le mot de passe
    console.log('Utilisateur créé :', email);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Erreur lors du seed :', err);
  process.exit(1);
});
