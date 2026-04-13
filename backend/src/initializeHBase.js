require('dotenv').config();
const client = require('./hbaseClient');

const tables = [
  {
    name: 'inventory_products',
    families: ['info', 'stock']
  },
  {
    name: 'inventory_transactions',
    families: ['meta', 'qty']
  },
  {
    name: 'inventory_alerts',
    families: ['data']
  }
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createTable(name, families) {
  return new Promise((resolve, reject) => {
    // 10 versions enabled for BDA Time Travel demonstration
    const schema = {
      name: name,
      ColumnSchema: families.map((f) => ({
        name: f,
        VERSIONS: 10 
      }))
    };

    client.table(name).create(schema, (err, success) => {
      if (err) {
        if (err.statusCode === 409 || err.code === 409 || (err.message && err.message.includes('409'))) {
          console.log(`Table ${name} already exists, skipping.`);
          resolve();
        } else {
          console.log(`Error creating table ${name}:`, err.message);
          reject(err);
        }
      } else {
        console.log(`Table ${name} created successfully with VERSIONS=10.`);
        resolve();
      }
    });
  });
}

async function dropTable(name) {
  return new Promise((resolve) => {
    client.table(name).delete((err) => {
        // Table safe to delete/not existing is fine
        if (err) console.log(`Note: Tried dropping ${name}, but it may not exist.`);
        else console.log(`Table ${name} dropped.`);
        resolve();
    });
  });
}

async function initialize() {
  console.log('Starting HBase initialization (BDA Enhanced)...');

  // Verify HBase REST reachability
  try {
    await new Promise((resolve, reject) => {
      client.version((err, version) => {
        if (err) reject(err);
        else {
          console.log('HBase REST version:', JSON.stringify(version));
          resolve();
        }
      });
    });
  } catch (err) {
    console.error('HBase connection failed. Retrying in 5 seconds...', err.message);
    await sleep(5000);
    return initialize();
  }

  // --- NEW: Drop tables to apply new VERSIONS configuration ---
  console.log('Clearing old tables to apply VERSIONS schema...');
  for (const table of tables) {
    await dropTable(table.name);
    await sleep(200);
  }

  for (const table of tables) {
    try {
      await createTable(table.name, table.families);
      await sleep(500);
    } catch (error) {
      console.error(`Error creating table ${table.name}:`, error.message);
    }
  }

  const initialProducts = [
    { id: 'PROD001', name: 'Standard Widget',  category: 'Hardware',     qty: 150, threshold: 50, price: '49.99'  },
    { id: 'PROD002', name: 'Premium Sprocket', category: 'Hardware',     qty: 25,  threshold: 30, price: '129.50' },
    { id: 'PROD003', name: 'Gasket Seal',      category: 'Accessories',  qty: 500, threshold: 100, price: '5.25'  },
    { id: 'PROD004', name: 'Lithium Battery',  category: 'Electronics',  qty: 12,  threshold: 20, price: '89.00'  },
    { id: 'PROD005', name: 'Copper Wire 5m',   category: 'Electronics',  qty: 80,  threshold: 25, price: '15.00'  },
  ];

  console.log('Seeding initial products with extra metadata...');
  for (const p of initialProducts) {
    try {
      await new Promise((resolve, reject) => {
        client
          .table('inventory_products')
          .row(p.id)
          .put(
            ['info:name', 'info:category', 'info:unit', 'info:price', 'stock:quantity', 'stock:threshold', 'stock:lastUpdated'],
            [p.name, p.category, 'pcs', p.price, p.qty.toString(), p.threshold.toString(), new Date().toISOString()],
            (err) => (err ? reject(err) : resolve())
          );
      });
      console.log(`  Seeded ${p.id} - ${p.name}`);
    } catch (err) {
      console.error(`  Failed to seed ${p.id}:`, err.message);
    }
  }

  console.log('Initialization complete.');
  process.exit(0);
}

initialize().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
