const express = require('express');
const router = express.Router();
const client = require('../hbaseClient');

// Get versioned history for a specific product
// Returns a merged timeline of changes for key fields
router.get('/:id', (req, res) => {
  const { id } = req.params;

  // Request up to 10 versions for key columns
  const columns = ['stock:quantity', 'info:price', 'info:name'];
  
  client.table('inventory_products').row(id).get(columns, { v: 10 }, (err, cells) => {
    if (err) {
      if (err.statusCode === 404) return res.json([]);
      return res.status(500).json({ error: err.message });
    }
    
    // HBase returns cells. We group them by timestamp to show the state at each point.
    // 1. Collect all unique timestamps and all known column values
    const timestamps = [...new Set(cells.map(c => c.timestamp))].sort((a, b) => a - b);
    const timeline = [];
    let currentState = {};

    timestamps.forEach(ts => {
      // Find all cells at this exact timestamp
      const cellsAtTs = cells.filter(c => c.timestamp === ts);
      
      // Update our "rolling" state with these changes
      cellsAtTs.forEach(cell => {
        const key = cell.column.split(':')[1];
        currentState[key] = cell.$;
      });

      // Create a snapshot at this point in time
      timeline.push({
        timestamp: ts,
        date: new Date(parseInt(ts)).toLocaleString(),
        ...currentState
      });
    });

    // Return newest first for the UI
    const history = timeline.reverse();
    
    res.json(history);
  });
});


// Restore a product to a specific historical version
router.post('/:id/restore', (req, res) => {
  const { id } = req.params;
  const { quantity, price } = req.body;

  const productRow = client.table('inventory_products').row(id);
  
  // 1. Get current state for transaction logging and fallback
  productRow.get(['stock:quantity', 'info:price'], (err, cells) => {
    let currentQty = '0';
    let currentPrice = '0';
    
    if (!err && cells) {
      cells.forEach(c => {
        if (c.column === 'stock:quantity') currentQty = c.$;
        if (c.column === 'info:price') currentPrice = c.$;
      });
    }

    // Use values from request, or fallback to current state if missing
    const targetQty = quantity !== undefined ? quantity.toString() : currentQty;
    const targetPrice = price !== undefined ? price.toString() : currentPrice;

    // 2. Update to historical values
    const prodColumns = ['stock:quantity', 'info:price', 'stock:lastUpdated'];
    const prodValues = [targetQty, targetPrice, new Date().toISOString()];


    productRow.put(prodColumns, prodValues, (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // 3. Log "RESTORE" transaction
      const timestamp = Date.now();
      const txnRow = client.table('inventory_transactions').row(`${id}_${timestamp}`);
      const txnColumns = ['meta:type', 'meta:note', 'meta:createdBy', 'qty:quantity', 'qty:before', 'qty:after'];
      // For RESTORE, we log the quantity diff or just the new quantity
      const txnValues = ['RESTORE', `Travelled back to Price: $${targetPrice}`, 'System', targetQty, currentQty, targetQty];

      txnRow.put(txnColumns, txnValues, (err) => {
        if (err) console.error('Failed to log restore transaction:', err);
        res.json({ message: 'Time travel successful! Product restored.' });
      });
    });
  });
});

module.exports = router;


