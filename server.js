const path = require('path');
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const Strategy = require('passport-discord').Strategy;
const ejs = require('ejs');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cfg = require('./config.json');
const logger = require('./logger.js');
var colors = require('colors');

logger.debug('CDN SERVER', 'Starting up...');

// Initialize express server and session store.
const CDN = express();
const MemoryStore = require('memorystore')(session);

// Deserializing and serialize users without any additional logic.
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Validating the url by creating a new instance of an Url then assign an object with the host and protocol properties.
// If a custom domain is used, we take the protocol, then the hostname and then we add the callback route.
// Ex: Config key: https://localhost/ will have - hostname: localhost, protocol: http

var callbackUrl;
var domain;

try {

    const domainUrl = new URL(cfg.domain);
    domain = {
        host: domainUrl.hostname,
        protocol: domainUrl.protocol
    };
} catch (e) {
    logger.error('DOMAIN', e.stack);
    throw new TypeError("Invalid domain specified.");
}

if (cfg.usingCustomDomain) {
    callbackUrl = `${domain.protocol}//${domain.host}/callback`
} else {
    callbackUrl = `${domain.protocol}//${domain.host}${cfg.port == 80 ? "" : `:${cfg.port}`}/callback`;
}

// We set the passport to use a new discord strategy, we pass in client id, secret, callback url and the scopes.
/** Scopes:
 *  - Identify: Avatar's url, username and discriminator.
*/

passport.use(new Strategy({
    clientID: cfg.clientId,
    clientSecret: cfg.clientSecret,
    callbackURL: callbackUrl,
    scope: ["identify"]
},
    (accessToken, refreshToken, profile, done) => { // eslint-disable-line no-unused-vars
        // On login we pass in profile with no logic.
        process.nextTick(() => done(null, profile));
    }));

// We initialize the memorystore middleware with our express app.
CDN.use(session({
    store: new MemoryStore({ checkPeriod: 86400000 }),
    secret: cfg.wawaToken,
    resave: false,
    saveUninitialized: false,
}));

// We initialize passport middleware.
CDN.use(passport.initialize());
CDN.use(passport.session());

// We bind the domain.
CDN.locals.domain = cfg.domain.split("//")[1];

// We set out templating engine.
CDN.engine("html", ejs.renderFile);
CDN.set("view engine", "html");

// file upload middleware
CDN.use(fileUpload({
    safeFileNames: true,
    preserveExtension: true,
    parseNested: true,
    debug: true,
    uploadTimeout: 60000
}));

// other middlewares
CDN.use(cors());
CDN.use(bodyParser.json());
CDN.use(bodyParser.urlencoded({ extended: true }));
CDN.use(morgan('dev'));

// We host all of the files using their name in the root address.
CDN.use("/files/", express.static(path.resolve(__dirname + `/files/`)));
CDN.use("/users/", express.static(path.resolve(__dirname + `/users/`)));

// We import all the routes.
require('./routes/public.js')(CDN); // Public Routes.
require('./routes/post.js')(CDN); // POST Routes.

// Not found route
CDN.use(function (req, res, next) {
    res.status(404).json({
        status: '404',
        message: 'Not found.',
    });
});

// start server
CDN.listen(cfg.port, null, null, () => {
    logger.info('CDN SERVER', `CDN up and running, ready to serve requests at ${cfg.domain}`);
});

process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION', err.stack);
});

process.on("unhandledRejection", (err) => {
    logger.error('UNHANDLED REJECTION', err.stack);
});