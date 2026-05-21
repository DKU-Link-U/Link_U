const express = require('express');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Link_U Backend Server is running' });
});

app.use('/api/user', userRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 API를 찾을 수 없습니다.',
  });
});

module.exports = app;
