const jwt = require('jsonwebtoken');
const User = require('../model/User.model');

// Role hierarchy for access control
const ROLE_HIERARCHY = {
    'Admin': 4,
    'Super Admin': 4,
    'Manager': 3,
    'Head': 2,
    'HR': 1,
    'User': 0
};

const normalizeRole = (role = '') => String(role || '').trim().toLowerCase();

const roleMatches = (userRole, requiredRole) => {
    const normalizedUserRole = normalizeRole(userRole);
    const normalizedRequiredRole = normalizeRole(requiredRole);

    if (!normalizedUserRole || !normalizedRequiredRole) return false;
    if (normalizedUserRole === normalizedRequiredRole) return true;

    if (normalizedRequiredRole === 'admin') {
        return normalizedUserRole === 'admin' || normalizedUserRole === 'super admin';
    }

    if (normalizedRequiredRole === 'manager') {
        return normalizedUserRole.includes('manager');
    }

    if (normalizedRequiredRole === 'head') {
        return normalizedUserRole.includes('head');
    }

    if (normalizedRequiredRole === 'hr') {
        return normalizedUserRole === 'hr' || normalizedUserRole.includes('hr');
    }

    return false;
};

const getRoleLevel = (role) => {
    const normalizedRole = normalizeRole(role);

    if (normalizedRole === 'admin' || normalizedRole === 'super admin') return ROLE_HIERARCHY.Admin;
    if (normalizedRole.includes('manager')) return ROLE_HIERARCHY.Manager;
    if (normalizedRole.includes('head')) return ROLE_HIERARCHY.Head;
    if (normalizedRole === 'hr' || normalizedRole.includes('hr')) return ROLE_HIERARCHY.HR;
    return ROLE_HIERARCHY.User;
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

        const isAllowed = allowedRoles.some((allowedRole) => roleMatches(req.user.role, allowedRole));
        if (!isAllowed) {
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

        const userLevel = getRoleLevel(req.user.role);
        
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

    if (!roleMatches(req.user.role, 'HR') && !roleMatches(req.user.role, 'Admin') && !roleMatches(req.user.role, 'Manager')) {
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
    ROLE_HIERARCHY,
    roleMatches
};
