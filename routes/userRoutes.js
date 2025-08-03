const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const userService = require('../services/userService');
const { checkJWT } = require('../middlewares/private');
const User = require('../models/userModel');

// login API (retourne token)
router.post('/login', userController.login);

// récupérer son propre profil
router.get('/me', checkJWT, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'user_not_found' });
    delete user.password;
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// CRUD utilisateurs 
router.get('/', checkJWT, userService.list);
router.get('/:email', checkJWT, userService.getByEmail);
router.post('/', checkJWT, userService.add);
router.put('/:email', checkJWT, userService.update);
router.patch('/:email', checkJWT, userService.update); 
router.delete('/:email', checkJWT, userService.delete);

// déconnexion API
router.get('/logout', (req, res) => {
  res.json({ message: 'Déconnecté' });
});

module.exports = router;
