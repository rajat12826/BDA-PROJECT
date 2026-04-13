const express = require('express');
const router = express.Router();
const client = require('../hbaseClient');

// Get low stock alerts
router.get('/', (req, res) => {
  // In a real app, this could be a pre-computed table or a scan with filter
  // For this demo, we'll scan products and filter in memory
  client.table('inventory_products').scan({
    batch: 1000
  }, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const products = {};
    const timestamps = {};

    rows.forEach(row => {
      const pId = row.key;
      if (!products[pId]) products[pId] = { id: pId };
      
      const [family, qualifier] = row.column.split(':');
      const cellId = `${pId}:${row.column}`;

      // Latest timestamp wins
      if (!timestamps[cellId] || row.timestamp > timestamps[cellId]) {
        products[pId][qualifier] = row.$;
        timestamps[cellId] = row.timestamp;
      }
    });
    
    const alerts = Object.values(products)
      .filter(p => parseInt(p.quantity) <= parseInt(p.threshold))
      .map(p => ({
        productId: p.id,
        name: p.name,
        currentQty: parseInt(p.quantity),
        threshold: parseInt(p.threshold),
        status: parseInt(p.quantity) === 0 ? 'CRITICAL' : 'LOW'
      }));
    
    res.json(alerts);
  });
});

module.exports = router;
