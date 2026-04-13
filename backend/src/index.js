require('dotenv').config();
const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/products');
const stockRoutes = require('./routes/stock');
const transactionRoutes = require('./routes/transactions');
const alertRoutes = require('./routes/alerts');
const historyRoutes = require('./routes/history');
const rawRoutes = require('./routes/raw');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/raw', rawRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
