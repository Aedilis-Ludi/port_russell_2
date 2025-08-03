// services/userService.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY;

// Helpers internes
async function sanitize(userDoc) {
  const u = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  if (u.password) delete u.password;
  return u;
}

// Création (utilisée par userController.createUser)
exports.createUser = async ({ username, email, password }) => {
  if (!username || !email || !password) {
    const err = new Error('username, email et password sont requis');
    err.status = 400;
    throw err;
  }

  const existing = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username }],
  });
  if (existing) {
    const err = new Error('Utilisateur déjà existant');
    err.status = 409;
    throw err;
  }

  const user = await User.create({
    username,
    email: email.toLowerCase(),
    password,
  });

  return sanitize(user);
};

// Liste pour controller getAllUsers
exports.getAllUsers = async () => {
  const users = await User.find().lean();
  users.forEach(u => {
    if (u.password) delete u.password;
  });
  return users;
};

// Détail par id
exports.getUserById = async (id) => {
  const user = await User.findById(id).lean();
  if (!user) return null;
  if (user.password) delete user.password;
  return user;
};

// Patch / update partiel par id
exports.patchUser = async (id, updates) => {
  const user = await User.findById(id);
  if (!user) return null;

  if (updates.username !== undefined) user.username = updates.username;
  if (updates.email !== undefined) user.email = updates.email.toLowerCase();
  if (updates.password !== undefined) user.password = updates.password; // pré-save hash

  await user.save();
  return sanitize(user);
};

// Delete par id
exports.deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) return null;
  return user;
};


// Ajouter un user via req/res (email/username/password)
exports.add = async (req, res, next) => {
  try {
    const user = await exports.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

// Lister (route GET /api/users/)
exports.list = async (req, res, next) => {
  try {
    const users = await exports.getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// Récupérer par email 
exports.getByEmail = async (req, res, next) => {
  try {
    const email = req.params.email.toLowerCase();
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ message: 'user_not_found' });
    if (user.password) delete user.password;
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Mettre à jour par email
exports.update = async (req, res, next) => {
  try {
    const emailParam = req.params.email.toLowerCase();
    const { username, email, password } = req.body;

    const user = await User.findOne({ email: emailParam });
    if (!user) return res.status(404).json({ message: 'user_not_found' });

    if (username) user.username = username;
    if (email) user.email = email.toLowerCase();
    if (password) user.password = password;

    await user.save();
    const safe = await sanitize(user);
    res.json(safe);
  } catch (err) {
    next(err);
  }
};

// Supprimer par email
exports.delete = async (req, res, next) => {
  try {
    const email = req.params.email.toLowerCase();
    const result = await User.findOneAndDelete({ email });
    if (!result) return res.status(404).json({ message: 'user_not_found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// Authentification 
exports.authenticate = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email et password requis' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'user_not_found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(403).json({ message: 'wrong_credentials' });

    const token = jwt.sign(
      { user: { id: user._id, email: user.email, username: user.username } },
      SECRET,
      { expiresIn: '1d' }
    );

    res
      .header('Authorization', `Bearer ${token}`)
      .json({ message: 'authenticate_succeed', token });
  } catch (err) {
    next(err);
  }
};
