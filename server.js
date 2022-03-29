const url = require('url');
const path = require('path');
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const Strategy = require('passport-discord').Strategy;
const ejs = require('ejs');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const Discord = require('discord.js');
const morgan = require('morgan');
const cfg = require('./config.json');
const fs = require('fs');
var colors = require('colors');

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
    console.error(colors.black(`[DOMAIN ERROR]`).bgRed, e);
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

// We host all of the files in the assets using their name in the root address.
// A style.css file will be located at http://<url>/style.css
// We can link it in any template using src="/assets/filename.extension"
CDN.use("/", express.static(path.resolve(__dirname + `/assets/`)));

// Login route. 
CDN.get("/login", (req, res, next) => {
    // We determine the returning url.
    if (req.session.backURL) {
        req.session.backURL = req.session.backURL; // eslint-disable-line no-self-assign
    } else if (req.headers.referer) {
        const parsed = url.parse(req.headers.referer);
        if (parsed.hostname === CDN.locals.domain) {
            req.session.backURL = parsed.path;
        }
    } else {
        req.session.backURL = "/";
    }
    // Forward the request to the passport middleware.
    next();
},
    passport.authenticate("discord"));

// Callback route.
CDN.get("/callback", passport.authenticate("discord", { failureRedirect: "/" }), /* We authenticate the user, if user canceled we redirect him to index. */ async (req, res) => {

    // Check if user has already his own files folder created with his ID.
    if (req.user.id) {
        const user = await req.user.id;
        const userFolder = path.resolve(__dirname + `/users/${user}`);
        const userFolderExists = await fs.existsSync(userFolder);

        if (!userFolderExists) await fs.mkdirSync(userFolder);
    }

    // If user had set a returning url, we redirect him there, otherwise we redirect him to index.
    if (req.session.backURL) {
        const url = req.session.backURL;
        req.session.backURL = null;
        res.redirect(url);
    } else {
        res.redirect("/");
    }
});

// Logout route.
CDN.get("/logout", function (req, res) {
    // We destroy the session.
    req.session.destroy(() => {
        // We logout the user.
        req.logout();
        // We redirect user to index.
        res.redirect("/");
    });
});

// Index route.
CDN.get("/", async (req, res) => {
    if (req.isAuthenticated()) {
        return res.render(__dirname + "/views/index.ejs", {
            user: req.user,
            path: req.path,
            admins: cfg.admins
        })
    } else {
        return res.send(`You are not logged in. Please login clicking <a href='/login'>here</a>.`);
    }
});

// File upload route
CDN.post('/upload', (req, res) => {
    // check if request is authenticated
    if (!req.isAuthenticated()) return res.status(403).json({
        status: "403",
        message: "Request is not authenticated."
    })

    let file;
    let uploadPath;

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
            status: '400',
            message: 'No files were uploaded.',
        })
    }

    file = req.files.file;
    uploadPath = __dirname + `/users/${req.user.id}/`;
    let data = [];

    function move(file, uploadPath, data, res, req) {
        try {
            file.mv(uploadPath + file.name);
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                status: '500',
                message: 'Error while uploading file.',
                error: err.message
            })
        }

        data.push({
            name: file.name,
            mimetype: file.mimetype,
            size: file.size,
            path: uploadPath + file.name,
            link: cfg.domain + `/users/${req.user.id}/` + file.name
        });
    }

    Array.isArray(file) ? file.forEach((file) => move(file, uploadPath, data, res, req)) : move(file, uploadPath, data, res, req);
    res.status(200).json({
        status: '200',
        message: 'Files uploaded successfully.',
        data: data
    });
});

// Admin file upload route
CDN.post('/admin/upload', (req, res) => {
    // check if request is authenticated
    if (!req.isAuthenticated()) return res.status(403).json({
        status: "403",
        message: "Request is not authenticated."
    })

    // check if request is authenticated as admin
    if (!cfg.admins.includes(req.user.id)) return res.status(403).json({
        status: "403",
        message: "You're not authorized to access this."
    })

    let file;
    let uploadPath;

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
            status: '400',
            message: 'No files were uploaded.',
        })
    }

    file = req.files.file;
    uploadPath = __dirname + `/files/`;
    let data = [];

    function move(file, uploadPath, data, res, req) {
        try {
            file.mv(uploadPath + file.name);
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                status: '500',
                message: 'Error while uploading file.',
                error: err.message
            })
        }

        data.push({
            name: file.name,
            mimetype: file.mimetype,
            size: file.size,
            path: uploadPath + file.name,
            link: cfg.domain + `/files/` + file.name
        });
    }

    Array.isArray(file) ? file.forEach((file) => move(file, uploadPath, data, res, req)) : move(file, uploadPath, data, res, req);
    res.status(200).json({
        status: '200',
        message: 'Files uploaded successfully.',
        data: data
    });
});

// File get route
CDN.get('/files/:fileName', (req, res) => {
    const fileName = req.params.fileName;

    res.sendFile(__dirname + '/files/' + fileName);
});

// User file get route
CDN.get('/users/:userId/:fileName', (req, res) => {
    const userId = req.params.userId;
    const fileName = req.params.fileName;

    res.sendFile(__dirname + '/users/' + userId + '/' + fileName);
});

// Not found route
CDN.use(function (req, res, next) {
    res.status(404).json({
        status: '404',
        message: 'Not found.',
    });
});

// start server
CDN.listen(cfg.port, null, null, () => {
    console.log(colors.black(`[CDN]`).bgBlue + ` CDN up and running, ready to serve requests at ${cfg.domain}`);
});