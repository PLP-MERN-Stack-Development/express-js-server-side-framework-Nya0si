//full express.js RESTFUL API impememtning CRUD, middleware, validationa, and error handling
import express from 'express';
import {v4 as uuidv4} from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

//--------------------error classes--------------------
class AppError extends Error {
    constructor(message, status=500, details=null) {
        super(message);
        this.status = status;
        this.details = details;
    }
}

class NotFoundError extends AppError {
    constructor(message='Resource not found') {
        super(message, 404);
    }
}

class ValidationError extends AppError {
    constructor(message='Invalid data', details=null) {
        super(message, 400, details);
    }
}

//--------------------- in-memory data store ---------------------
const products = [
    {id: "1",
    name: 'Wireless Mouse',
    description: 'Ergonomic Wireless Mouse',
    price: 500,
    category: 'Electronics',
    inStock: true,
    },

    {id: "2",
    name: 'Coffee Mug',
    description: 'Ceramic Coffee Mug 350ml',
    price: 300,
    category: 'Kitchenware',
    inStock: true,
    },
    
    {id: '3',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },

  { id: "4",
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '5',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  }
];

//---------------------- helper utilities ----------------------
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

//validation helper 
const validateProductPayload = (payload, partial = false) => {
    const errors = [];

    if (!partial || Object.prototype.hasOwnProperty.call(payload, 'name')) {
        if (!payload.name || typeof payload.name !== 'string' || payload.name.trim() === '') {
            errors.push('Name is required and must be a non-empty string.');
        }
    }

    if (!partial || Object.prototype.hasOwnProperty.call(payload, 'description')) {
        if (!payload.description || typeof payload.description !== 'string' || payload.description.trim() === '') {
            errors.push('Description is required and must be a string.');
        }
    }

    if (!partial || Object.prototype.hasOwnProperty.call(payload, 'price')) {
        if (typeof payload.price !== 'number' || Number.isNaN(payload.price) || payload.price < 0) {
            errors.push('Price is required and must be a non-negative number.');
        }
    }

    if (!partial || Object.prototype.hasOwnProperty.call(payload, 'category')) {
        if (!payload.category || typeof payload.category !== 'string') {
            errors.push('Category is required and must be a string.');
        }
    }

    if (!partial || Object.prototype.hasOwnProperty.call(payload, 'inStock')) {
        if (typeof payload.inStock !== 'boolean') {
            errors.push('inStock is required and must be a boolean.');
        }
    }

    return errors;
};

//---------------------- app and middleware ----------------------
const app = express();

app.use(express.json());

//logger middleware
app.use((req, res, next) => {
    const now = new Date().toISOString();
    console.log(`[${now}] ${req.method} ${req.originalUrl}`);
    next();
});

//simple auth middleware
const apikey = process.env.API_KEY;
if (!apikey) {
    console.warn('Warning: API_KEY is not set in environment variables. Auth middleware will reject all requests.');
}
const authMiddleware = (req, res, next) => {
    const key = req.headers['x-api-key'];
    if (!key || key !== apikey) {
       throw new AppError('Invalid API key', 401);
    }
    next();
};

//---------------------- routes ----------------------
//Hello world at root
app.get('/', (req, res) => {
    res.send('Hello, World from Express Server!');
});

const router = express.Router();

//GET /products - get all products
router.get(
    '/',
    asyncHandler(async (req, res) => {
        let result =[...products];

        //filtering
        if (req.query.category) {
            const cat = req.query.category.toLowerCase();
            result = result.filter((p) => p.category.toLowerCase() === cat);
        }

        //searching
        if (req.query.search) {
            const q = String(req.query.search).toLowerCase();
            result = result.filter(
                (p) => p.name.toLowerCase().includes(q));
        }

        //pagination
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
        const startIndex = (page - 1) * limit;
        const end = startIndex + limit;
        const paginatedResult = result.slice(startIndex, end);

        res.json({
            page,
            limit,
            total: result.length,
            data: paginatedResult,
        });
    })
);

//search endpoint
router.get(
    '/search', asyncHandler(async (req, res)=> {
        const q = String(req.query.q ||'').toString().toLowerCase();
        if (!q) return res.json({total: 0, data: []});
        const found = products.filter(
            (p) => p.name.toLowerCase().includes(q)
        );
        res.json({total: found.length, data: found});
    })
);

//stats endpoint
router.get(
    '/stats',
    asyncHandler(async (req, res) => {
        const counts = products.reduce((acc, p) => {
            const cat = p.category || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }  , {});
        res.json({total: products.length, byCategory: counts});
    })
);
//GET /products/:id - get product by id
router.get(
    '/:id',
    asyncHandler(async (req, res, next) => {
        const product = products.find((p) => p.id === req.params.id);
        if (!product) throw new NotFoundError('Product not found');
        res.json(product);
    })
);

//POST /products - create a new product
router.post(
    '/',    
    authMiddleware,
    asyncHandler(async (req, res, next) => {
        const payload = req.body;
        const errors = validateProductPayload(payload, false);
        if (errors.length) throw new ValidationError('Invalid product data', errors);

        const newProduct = {
            id: uuidv4(),
            name: payload.name,
            description: payload.description,
            price: payload.price,
            category: payload.category,
            inStock: payload.inStock,
        };
        products.push(newProduct);
        res.status(201).json(newProduct);
    })
);  

//PUT /products/:id - update a product by id
router.put(
    '/:id', 
    authMiddleware,
    asyncHandler(async (req, res, next) => {
        const payload = req.body;
        const errors = validateProductPayload(payload, false);
        if (errors.length) throw new ValidationError('Invalid product payload', errors);

        const idx = products.findIndex((p) => p.id === req.params.id);
        if (idx === -1) throw new NotFoundError('Product not found');

        const updated = {
            id: products[idx].id,
            name: payload.name,
            description: payload.description,
            price: payload.price,
            category: payload.category,
            inStock: payload.inStock,
        };
        products[idx] = updated;
        res.json(updated);
    })
);

//PATCH /products/:id - partially update a product by id
router.patch(
    '/:id', 
    authMiddleware,
    asyncHandler(async (req, res, next) => {
        const payload = req.body;
        const errors = validateProductPayload(payload, true);
        if (errors.length) throw new ValidationError('Invalid product payload', errors);

        const product = products.find((p) => p.id === req.params.id);
        if (!product) throw new NotFoundError('Product not found');

        //apply updates
        Object.assign(product, payload);
        res.json(product);
    })
);
//DELETE /products/:id - delete a product by id
router.delete(
    '/:id',
    authMiddleware,
    asyncHandler(async (req, res, next) => {
        const idx = products.findIndex((p) => p.id === req.params.id);
        if (idx === -1) throw new NotFoundError('Product not found');
        products.splice(idx, 1);
        res.status(204).end();
    })
);

//mount the router at /products
app.use('/api/products', router);

//---------------------- error handling middleware ----------------------
app.use((err, req, res, next) => {
    if (err instanceof AppError) {
        const payload = {message: err.message};
        if (err.details) payload.details = err.details;
        return res.status(err.status).json(payload);
    }

    console.error('Unhandled error:', err);
    res.status(500).json({message: 'Internal Server Error'});
});

//---------------------- start the server ----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Express server is running on http://localhost:${PORT}`);
});
