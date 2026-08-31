const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up directory paths
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

// Adjust payloads to handle large base64 uploaded product images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Sample data to initialize the system if empty
const defaultProducts = [
    {
        id: 1,
        name: 'Heineken Beer (Carton)',
        description: 'Premium imported lager beer. 24 bottles per carton. Crisp refreshing taste.',
        price: 18000,
        category: 'beer',
        unit: 'Per Carton',
        minOrder: '50 Cartons',
        available: true,
        image: ''
    },
    {
        id: 2,
        name: 'Coca-Cola 50cl (Crate)',
        description: 'Classic Coca-Cola PET bottles. 24 pieces per crate. Wholesale price.',
        price: 4500,
        category: 'softdrink',
        unit: 'Per Crate',
        minOrder: '100 Crates',
        available: true,
        image: ''
    },
    {
        id: 3,
        name: 'Hennessy VS Cognac',
        description: 'Hennessy Very Special Cognac. 70cl bottle. Original and sealed.',
        price: 28000,
        category: 'wine',
        unit: 'Per Bottle',
        minOrder: '12 Bottles',
        available: true,
        image: ''
    },
    {
        id: 4,
        name: 'Chi Exotic Juice (Pack)',
        description: 'Tropical fruit juice blend. 1 Litre x 12 pack. No added sugar.',
        price: 6500,
        category: 'juice',
        unit: 'Per Pack',
        minOrder: '50 Packs',
        available: true,
        image: ''
    },
    {
        id: 5,
        name: 'Red Bull Energy (Tray)',
        description: 'Red Bull energy drink. 250ml x 24 cans per tray. Wings for wholesale.',
        price: 14000,
        category: 'energy',
        unit: 'Per Tray',
        minOrder: '30 Trays',
        available: true,
        image: ''
    },
    {
        id: 6,
        name: 'Eva Water (Pack)',
        description: 'Premium table water. 75cl x 12 bottles per pack. Pure refreshment.',
        price: 2200,
        category: 'water',
        unit: 'Per Pack',
        minOrder: '200 Packs',
        available: true,
        image: ''
    }
];

// Helper functions to handle JSON file DB
function initDatabase() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PRODUCTS_FILE)) {
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(defaultProducts, null, 2), 'utf-8');
        console.log("Database initialized with default sample products.");
    }
}

function readProducts() {
    try {
        const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading database file, returning empty array:", err);
        return [];
    }
}

function writeProducts(products) {
    try {
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
    } catch (err) {
        console.error("Error writing to database file:", err);
    }
}

// Initialize Database
initDatabase();

// API ROUTES
app.get('/api/products', (req, res) => {
    res.json(readProducts());
});

app.post('/api/products', (req, res) => {
    const products = readProducts();
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct = {
        id: newId,
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        unit: req.body.unit,
        minOrder: req.body.minOrder,
        available: req.body.available === undefined ? true : req.body.available,
        image: req.body.image || ''
    };
    products.push(newProduct);
    writeProducts(products);
    res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const products = readProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
        products[idx] = {
            id: id,
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            unit: req.body.unit,
            minOrder: req.body.minOrder,
            available: req.body.available === undefined ? products[idx].available : req.body.available,
            image: req.body.image !== undefined ? req.body.image : products[idx].image
        };
        writeProducts(products);
        res.json(products[idx]);
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

app.patch('/api/products/:id/toggle', (req, res) => {
    const id = parseInt(req.params.id);
    const products = readProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
        products[idx].available = !products[idx].available;
        writeProducts(products);
        res.json(products[idx]);
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

app.delete('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    let products = readProducts();
    const originalLength = products.length;
    products = products.filter(p => p.id !== id);
    if (products.length < originalLength) {
        writeProducts(products);
        res.json({ success: true, message: 'Product deleted' });
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

// Serve frontend route fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running globally on port ${PORT}`);
});
