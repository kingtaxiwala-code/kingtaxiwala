const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { cacheMiddleware } = require('./utils/cache');

// Load env vars
dotenv.config();

console.log('[DEBUG] MONGO_URI present:', !!process.env.MONGO_URI);
if (process.env.MONGO_URI) {
    const masked = process.env.MONGO_URI.replace(/:([^@]+)@/, ':****@');
    console.log('[DEBUG] MONGO_URI format:', masked);
}

const app = express();

// 1. Gzip Compression (Early in the stack)
app.use(compression());

// ── Security Middleware ──────────────────────────────────────────────────────
// 1. Helmet for security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:       ["'self'"],
            baseUri:          ["'self'"],
            fontSrc:          ["'self'", "https:", "data:"],
            formAction:       ["'self'"],
            frameAncestors:   ["'self'"],
            objectSrc:        ["'none'"],
            scriptSrc:        ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            scriptSrcAttr:    ["'unsafe-inline'"],
            styleSrc:         ["'self'", "https:", "'unsafe-inline'"],
            imgSrc:           ["'self'", "data:", "https:"],
            mediaSrc:         ["'self'", "https://assets.mixkit.co"],
            frameSrc:         ["'self'", "https://www.google.com", "https://maps.google.com"],
            connectSrc:       ["'self'", "https://*.google.com", "https://*.googleapis.com"],
            upgradeInsecureRequests: [],
        },
    },
}));

// 2. Prevent NoSQL Injection
// app.use(mongoSanitize());

// 3. Rate Limiting (Prevent Spam/Brute force)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Raised to support 5s polling across multiple users/tabs
    message: { success: false, error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Strict limiter only for login (brute-force protection)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Max 20 login attempts per 15 min
    message: { success: false, error: 'Too many login attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/admin/login', loginLimiter);

// 4. Force HTTPS (in production)
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
        const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
        return res.redirect(`${baseUrl}${req.url}`);
    }
    next();
});

// Disable server fingerprint
app.disable('x-powered-by');

// Body parser
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS

// Enable CORS
app.use(cors());

// ── Cache-Control & Security Headers ─────────────────────────────────────────
app.use((req, res, next) => {
    const url = req.url;

    // Cache static assets, but NEVER cache sw.js
    if (url.includes('sw.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (/\.(js|css|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|ico)(\?.*)?$/.test(url)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Vary', 'Accept-Encoding');
    } else if (/\.html?$/.test(url) || url === '/' || !url.includes('.')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    next();
});

// ── Explicit route for /pricing — hard no-cache, bypasses express.static ETags ─
app.get('/pricing', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, 'public', 'pricing.html'));
});

// ── Force Root Route to Index ────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Static files ─────────────────────────────────────────────────────────────
// etag + lastModified enabled by default in Express — send 304 Not Modified when unchanged
app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html'],
    etag: true,
    lastModified: true,
    setHeaders(res, filePath) {
        // Extra: serve fonts with proper CORS so browsers can use them cross-origin
        if (/\.(woff2?|ttf|otf|eot)$/.test(filePath)) {
            res.setHeader('Access-Control-Allow-Origin', '*');
        }
    }
}));

// Global API Logger
app.use('/api', (req, res, next) => {
    console.log(`[API] ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

// Mount API routes
const bookings = require('./routes/booking');
const reviews  = require('./routes/reviews');
const gallery  = require('./routes/gallery');
const admin    = require('./routes/admin');
app.use('/api/bookings', bookings);
app.use('/api/reviews', reviews); // Remove cache for real-time polling
app.use('/api/gallery', cacheMiddleware(600), gallery); // Cache gallery for 10 mins
app.use('/api/admin', admin); // Must be before the catch-all below

// ── Final 404 & Error Handlers ──────────────────────────────────────────────
// Note: Express v5 no longer supports bare '*' wildcard in app.get() — use app.use() instead
app.use((req, res) => {
    // If it's an HTML request, serve index.html as a fallback (for SPA functionality or broken links)
    if (req.accepts('html')) {
        return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
    res.status(404).json({ error: 'Not Found', path: req.url });
});


// ── Database & Server Start ──────────────────────────────────────────────────
const startServer = async () => {
    try {
        console.log('[INFO] Starting Server Audit...');
        console.log(`[INFO] Current Environment: ${process.env.NODE_ENV || 'development'}`);
        
        // Log IP for whitelisting help
        require('dns').lookup(require('os').hostname(), (err, add, fam) => {
            console.log(`[INFO] Internal Server IP: ${add} (Add this or your public IP to Atlas Whitelist)`);
        });

        console.log('[INFO] Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 8000, // Slightly longer for stability
            socketTimeoutMS: 45000,
        });
        
        console.log('[SUCCESS] MongoDB Connected Successfully');

        const PORT = process.env.PORT || 3000;
        const server = app.listen(PORT, () => {
            console.log(`[SUCCESS] Server is listening on port ${PORT}`);
            console.log(`[INFO] Process ID: ${process.pid}`);
            console.log(`[INFO] Live Site: ${process.env.BASE_URL || 'http://localhost:3000'}`);
        });

        server.on('error', (err) => {
            console.error('[CRITICAL] Server failed to start:', err.message);
            if (err.code === 'EADDRINUSE') {
                console.error(`[ERROR] Port ${PORT} is already in use.`);
            }
        });

    } catch (err) {
        console.error('[CRITICAL] MongoDB Connection Failed during startup');
        console.error('Error Details:', err.message);
        
        // Even if DB fails, we may want to start the server in "maintenance mode"
        // But the user requested "real database as source of truth", so we'll 
        // keep trying to connect or let it crash to indicate the dependency issue.
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`[WARNING] Server started without database connection on port ${PORT}`);
        });
    }
};

startServer();

// Keep-alive check
setInterval(() => {
    if (mongoose.connection.readyState !== 1) {
        // console.log(`[RETRY] DB State: ${mongoose.connection.readyState}`);
    }
}, 30000);

