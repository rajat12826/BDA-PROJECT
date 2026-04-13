const express = require('express');
const router = express.Router();
const client = require('../hbaseClient');

// Get absolute raw data from any table
// This demonstrates the true "Sparse" JSON structure of HBase
router.get('/:table', (req, res) => {
  const { table } = req.params;
  
  client.table(table).scan({
    batch: 1000
  }, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Return the raw array of cells exactly as HBase sends it
    res.json({
        tableName: table,
        rawCells: rows,
        count: rows.length
    });
  });
});

module.exports = router;
