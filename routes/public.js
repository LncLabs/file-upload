// Export public routes

const url = require('url');
const passport = require('passport');
const fs = require('fs');
const path = require('path');
const cfg = require('../config.json');

module.exports = (CDN) => {

    // Declare absolute paths
    const viewsPath = path.join(__dirname, '../views/');
    const usersPath = path.join(__dirname, '../users/');

    // Login route
    CDN.get('/login', (req, res, next) => {

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
    }, passport.authenticate('discord'));

    // Callback route.
    CDN.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), /* We authenticate the user, if user canceled we redirect him to index. */ async (req, res) => {

        // Check if user has already his own files folder created with his ID.
        if (req.user.id) {
            const user = await req.user.id;
            const userFolder = path.join(usersPath, user);
            const userFolderExists = await fs.existsSync(userFolder);

            if (!userFolderExists) await fs.mkdirSync(userFolder);
        }

        // If user had set a returning url, we redirect him there, otherwise we redirect him to index.
        if (req.session.backURL) {
            const url = req.session.backURL;
            req.session.backURL = null;
            res.redirect(url);
        } else {
            res.redirect('/');
        }
    });

    // Logout route.
    CDN.get('/logout', function (req, res) {
        // We destroy the session.
        req.session.destroy(() => {
            // We logout the user.
            req.logout();
            // We redirect user to index.
            res.redirect('/');
        });
    });

    // Index route.
    CDN.get("/", async (req, res) => {
        if (req.isAuthenticated()) {
            return res.render(`${viewsPath}index.ejs`, {
                user: req.user,
                path: req.path,
                admins: cfg.admins
            })
        } else {
            return res.send(`You are not logged in. Please login clicking <a href='/login'>here</a>.`);
        }
    });

    // User file get route
    CDN.get('/users/:userId/:fileName', (req, res) => {
        const userId = req.params.userId;
        const fileName = req.params.fileName;

        res.sendFile(path.join(usersPath, userId, fileName));
    });
}