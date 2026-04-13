const express = require('express');
const router = express.Router();
const client = require('../hbaseClient');

// Get all products
router.get('/', (req, res) => {
  client.table('inventory_products').scan({
    batch: 1000
  }, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Process flat HBase rows into structured objects
    const products = {};
    const timestamps = {}; // tracking latest timestamps per cell

    rows.forEach(row => {
      const pId = row.key;
      if (!products[pId]) products[pId] = { id: pId };
      
      const [family, qualifier] = row.column.split(':');
      const cellId = `${pId}:${row.column}`;

      // Only keep the newest version (highest timestamp)
      if (!timestamps[cellId] || row.timestamp > timestamps[cellId]) {
        products[pId][qualifier] = row.$;
        timestamps[cellId] = row.timestamp;
      }
    });
    
    res.json(Object.values(products));
  });
});

// Add new product (Supports Dynamic Attributes for Sparsity demo)
router.post('/', (req, res) => {
  const { id, name, category, unit, quantity, threshold, price, attributes } = req.body;
  const row = client.table('inventory_products').row(id);
  
  const columns = ['info:name', 'info:category', 'info:unit', 'info:price', 'stock:quantity', 'stock:threshold', 'stock:lastUpdated'];
  const values = [name, category, unit || 'pcs', price || '0', (quantity || 0).toString(), (threshold || 0).toString(), new Date().toISOString()];

  // Add dynamic attributes if provided (BDA Sparsity demonstration)
  if (attributes && typeof attributes === 'object') {
    Object.keys(attributes).forEach(key => {
      columns.push(`info:${key}`);
      values.push(attributes[key].toString());
    });
  }

  row.put(columns, values, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Product created', id });
  });
});

// Update product metadata (Supports Dynamic Attributes)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, unit, price, threshold, attributes } = req.body;
  const row = client.table('inventory_products').row(id);

  const columns = ['info:name', 'info:category', 'info:unit', 'info:price', 'stock:threshold', 'stock:lastUpdated'];
  const values = [name, category, unit, price, (threshold || 0).toString(), new Date().toISOString()];

  if (attributes && typeof attributes === 'object') {
    Object.keys(attributes).forEach(key => {
      columns.push(`info:${key}`);
      values.push(attributes[key].toString());
    });
  }

  row.put(columns, values, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Product updated' });
  });
});

// Delete product
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  client.table('inventory_products').row(id).delete((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Product deleted' });
  });
});

module.exports = router;
