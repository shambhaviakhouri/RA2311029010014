require('dotenv').config();

const express = require('express');
const LoggingMiddleware = require('./LoggingMiddleware');

const app = express();

app.use(LoggingMiddleware.middleware());
app.use(express.json());

LoggingMiddleware.info('Application started');

app.get('/health', (req, res) => {
  LoggingMiddleware.info('Health check endpoint called');
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  LoggingMiddleware.info('Server started', { port: PORT });
});
