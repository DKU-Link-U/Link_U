const { toSafeUser } = require('../services/authService');

function getMe(req, res) {
  res.json({
    success: true,
    data: {
      user: toSafeUser(req.user),
    },
  });
}

module.exports = {
  getMe,
};
