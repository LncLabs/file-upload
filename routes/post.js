// Export POST routes

const cfg = require('../config.json');
const logger = require('../logger.js');
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

        let files;
        let uploadPath;

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                status: '400',
                message: 'No files were uploaded.',
            })
        }

        files = req.files.files;
        uploadPath = path.join(usersPath, req.user.id);
        let data = [];

        function move(file, uploadPath, data, res, req) {
            try {
                file.mv(path.join(uploadPath, file.name));
            } catch (err) {
                logger.error("File Upload", err.stack);
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

        Array.isArray(files) ? files.forEach((file) => move(file, uploadPath, data, res, req)) : move(files, uploadPath, data, res, req);

        data.forEach((file) => logger.debug("New File", `**Link:** ${file.link}\n**Size:** ${file.size}, **MimeType:** ${file.mimetype}`));
        res.status(200).json({
            status: '200',
            message: 'Files uploaded successfully.',
            data: data
        });
        logger.info("File Upload", `User ${req.user.id} uploaded ${data.length} file(s).`);
        logger.message("-----------------------------");
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

        let files;
        let uploadPath;

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                status: '400',
                message: 'No files were uploaded.',
            })
        }

        files = req.files.files;
        uploadPath = uploadsPath;
        let data = [];

        function move(file, uploadPath, data, res, req) {
            try {
                file.mv(path.join(uploadPath, file.name));
            } catch (err) {
                logger.error("File Upload", err.stack);
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

        Array.isArray(files) ? files.forEach((file) => move(file, uploadPath, data, res, req)) : move(files, uploadPath, data, res, req);

        data.forEach((file) => logger.debug("New File", `**Link:** ${file.link}\n**Size:** ${file.size}, **MimeType:** ${file.mimetype}`));
        res.status(200).json({
            status: '200',
            message: 'Files uploaded successfully.',
            data: data
        });
        logger.info("File Upload", `User ${req.user.id} uploaded ${data.length} file(s) to the main folder.`);
        logger.message("-----------------------------");
    });
}