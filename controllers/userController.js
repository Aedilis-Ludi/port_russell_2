const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY;

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'missing_credentials' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'invalid_credentials' });
    }

    const token = jwt.sign(
      { user: { id: user._id, email: user.email, username: user.username } },
      SECRET,
      { expiresIn: '1d' }
    );

    user.last_login = new Date();
    await user.save();

    return res.json({ token, name: user.username, email: user.email });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'server_error' });
  }
};
