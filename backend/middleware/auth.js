const jwt = require('jsonwebtoken');
const User = require('../model/User.model');

// Role hierarchy for access control
const ROLE_HIERARCHY = {
    'Admin': 4,
    'Manager': 3,
    'Head': 2,
    'HR': 1,
    'User': 0
};

// Authenticate user with JWT token
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.id).populate('employeeId');
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (user.status !== 'Active') {
            return res.status(403).json({ error: 'Account is inactive' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Check if user has required role
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Access denied. Insufficient permissions.' 
            });
        }

        next();
    };
};

// Check if user has minimum role level
const authorizeByLevel = (minLevel) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
        
        if (userLevel < minLevel) {
            return res.status(403).json({ 
                error: 'Access denied. Higher privileges required.' 
            });
        }

        next();
    };
};

// HR specific authorization - can generate passwords for employees
const authorizeHR = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'HR' && req.user.role !== 'Admin' && req.user.role !== 'Manager') {
        return res.status(403).json({ 
            error: 'Access denied. HR privileges required.' 
        });
    }

    next();
};

module.exports = {
    authenticate,
    authorize,
    authorizeByLevel,
    authorizeHR,
    ROLE_HIERARCHY
};
