const express = require('express');
const router = express.Router();
const client = require('../hbaseClient');

// Get transaction history
router.get('/', (req, res) => {
  client.table('inventory_transactions').scan({
    batch: 1000
  }, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const transactions = {};
    rows.forEach(row => {
      if (!transactions[row.key]) {
        const [prodId, ts] = row.key.split('_');
        transactions[row.key] = { 
          id: row.key,
          productId: prodId,
          timestamp: parseInt(ts),
          date: new Date(parseInt(ts)).toLocaleString()
        };
      }
      const [family, qualifier] = row.column.split(':');
      transactions[row.key][qualifier] = row.$;
    });
    
    res.json(Object.values(transactions).sort((a,b) => b.timestamp - a.timestamp));
  });
});

module.exports = router;
