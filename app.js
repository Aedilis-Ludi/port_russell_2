require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const userRoutes = require('./routes/userRoutes');
const catwayRoutes = require('./routes/catwayRoutes');
const reservationRoutes = require('./routes/reservationRoutes');

const Catway = require('./models/catwayModel');
const Reservation = require('./models/reservationModel');
const User = require('./models/userModel');

const { checkJWT } = require('./middlewares/private');

const app = express();

// vue
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// --- API REST ---
app.use('/api/users', userRoutes);
app.use('/api/catways', catwayRoutes);
app.use('/api/reservations', reservationRoutes);

// --- routes de pages ---

// page d'accueil / connexion
app.get('/', (req, res) => {
  const error = req.query.error;
  res.render('index', { error });
});

// login 
app.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.redirect('/?error=missing');

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.redirect('/?error=bad_credentials');
    }

    const SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY;
    const token = jwt.sign(
      { user: { id: user._id, email: user.email, username: user.username } },
      SECRET,
      { expiresIn: '1d' }
    );

    // cookie httpOnly
    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
});

// déconnexion
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// dashboard protégé
app.get('/dashboard', checkJWT, async (req, res, next) => {
  try {
    const catways = await Catway.find().lean();
    const now = new Date();
    for (const c of catways) {
      const current = await Reservation.findOne({
        catwayNumber: c.catwayNumber,
        startDate: { $lte: now },
        endDate: { $gte: now },
      }).lean();
      c.currentReservation = current || null;
    }
    const today = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    res.render('dashboard', { catways, user: req.user, today });
  } catch (err) {
    next(err);
  }
});

// liste des catways 
app.get('/catways', checkJWT, async (req, res, next) => {
  try {
    const catways = await Catway.find().lean();
    res.render('catways', { catways, user: req.user });
  } catch (err) {
    next(err);
  }
});

// détail d'un catway + ses réservations 
app.get('/catways/:catwayNumber', checkJWT, async (req, res, next) => {
  try {
    const catwayNumber = Number(req.params.catwayNumber);
    const catway = await Catway.findOne({ catwayNumber }).lean();
    if (!catway) return res.status(404).send('Catway introuvable');
    const reservations = await Reservation.find({ catwayNumber }).lean();
    res.render('catwayDetail', { catway, reservations, user: req.user });
  } catch (err) {
    next(err);
  }
});

// liste des utilisateurs (vue)
app.get('/users', checkJWT, async (req, res, next) => {
  try {
    const users = await User.find().lean();
    users.forEach(u => delete u.password);
    res.render('user', { users, user: req.user });
  } catch (err) {
    next(err);
  }
});

// debug base
app.get('/debug/db', async (req, res) => {
  try {
    const catwaysCount = await Catway.countDocuments();
    const reservationsCount = await Reservation.countDocuments();
    const usersCount = await User.countDocuments();
    res.json({
      dbConnected: mongoose.connection.name,
      catwaysCount,
      reservationsCount,
      usersCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/docs', (req, res) => {
  res.render('docs');
});


// 404
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'Route API introuvable' });
  }
  res.status(404).send('Page non trouvée');
});

// erreur
app.use((err, req, res, next) => {
  console.error('Erreur middleware :', err);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
  res.status(500).send('Erreur serveur');
});

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/port_russell_2';

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connecté à MongoDB, base utilisée :', mongoose.connection.name);
    app.listen(PORT, () => {
      console.log(`Serveur sur le port ${PORT}`);
    });
  } catch (err) {
    console.error('Erreur connexion MongoDB :', err);
    process.exit(1);
  }
}

start();
