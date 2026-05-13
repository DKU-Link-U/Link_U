const express = require('express');
const passport = require('passport');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const recruitmentRoutes = require('./routes/recruitmentRoutes');
const studyRoutes = require('./routes/studyRoutes');
const userRoutes = require('./routes/userRoutes');
const usersRoutes = require('./routes/usersRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
require('./config/passport');

const app = express();

app.use(express.json());
app.use(passport.initialize());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Link_U Backend Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/recruitments', recruitmentRoutes);
app.use('/api/studies', studyRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/verify-account', verificationRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 API를 찾을 수 없습니다.',
  });
});

module.exports = app;
