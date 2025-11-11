const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
require('dotenv').config();

const { optionalAuth } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const generateRouter = require('./routes/generateSupplierOrder');

const app = express();
app.use(compression());
app.use(bodyParser.json());

// Parse optional Bearer token (does not reject by itself)
app.use(optionalAuth);

// Auth endpoints
app.use('/auth', authRouter);

// Admin routes (generateSupplierOrder is protected inside the route file)
app.use('/admin', generateRouter);

app.get('/health', (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend listening on ${port}`));
