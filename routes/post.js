// Export POST routes

const cfg = require('../config.json');
const path = require('path');

module.exports = (CDN) => {

    // Declare absolute paths
    const uploadsPath = path.join(__dirname, '../files/');
    const usersPath = path.join(__dirname, '../users/');

    // File upload route
    CDN.post('/upload', (req, res) => {
        // check if request is authenticated
        if (!req.isAuthenticated()) return res.status(401).json({
            status: "401",
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
        uploadPath = path.join(usersPath, req.user.id);
        let data = [];

        function move(file, uploadPath, data, res, req) {
            try {
                file.mv(path.join(uploadPath, file.name));
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

    // Private file upload route
    CDN.post('/upload/private', (req, res) => {
        // check if request is authenticated
        if (!req.isAuthenticated()) return res.status(401).json({
            status: "401",
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
        uploadPath = path.join(usersPath, req.user.id, '/private/');
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
                link: cfg.domain + `/users/${req.user.id}/private/` + file.name
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
        if (!req.isAuthenticated()) return res.status(401).json({
            status: "401",
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
        uploadPath = uploadsPath;
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
}