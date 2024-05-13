const jwt = require("jsonwebtoken");
const App_Status = require("../contact/contact");
const adminTable = require("../models/Admin");
const userTable = require("../models/user");
const dotenv = require("dotenv").config();


const adminAuthMiddleware = async (req, resp, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return resp.status(401).send({
            Status: App_Status.Failed,
            message: "Unauthorized. Missing or invalid token."
        });
    }
    const token = authHeader.replace('Bearer ', '');
    try {
        const data = jwt.verify(token, process.env.SECRET_KEY);
        req.userid = data.id;
        req.isAdmin = !!await adminTable.findById(data.id);
        if (req.isAdmin) {
            next();
        } else {
            resp.status(401).send({
                Status: App_Status.Failed,
                message: "Admin only access"
            });
        }
    } catch (error) {
        resp.status(401).send({
            Status: App_Status.Failed,
            message: "Invalid credentials"
        });
    }
};

module.exports = adminAuthMiddleware;
