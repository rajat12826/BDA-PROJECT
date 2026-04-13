const express = require('express');
const router = express.Router();
const client = require('../hbaseClient');

// Update stock quantity
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { quantity, changeType, note } = req.body; // changeType: 'IN' or 'OUT'

  const productRow = client.table('inventory_products').row(id);
  
  // 1. Get current quantity
  productRow.get('stock:quantity', (err, cells) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const currentQty = parseInt(cells[0].$);
    const newQty = changeType === 'IN' ? currentQty + quantity : currentQty - quantity;
    
    // 2. Update product stock
    const prodColumns = ['stock:quantity', 'stock:lastUpdated'];
    const prodValues = [newQty.toString(), new Date().toISOString()];

    productRow.put(prodColumns, prodValues, (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // 3. Log transaction
      const timestamp = Date.now();
      const txnRow = client.table('inventory_transactions').row(`${id}_${timestamp}`);
      const txnColumns = ['meta:type', 'meta:note', 'meta:createdBy', 'qty:quantity', 'qty:before', 'qty:after'];
      const txnValues = [changeType, note || '', 'System', quantity.toString(), currentQty.toString(), newQty.toString()];

      txnRow.put(txnColumns, txnValues, (err) => {
        if (err) console.error('Failed to log transaction:', err);
        res.json({ message: 'Stock updated', newQty });
      });
    });
  });
});

module.exports = router;
