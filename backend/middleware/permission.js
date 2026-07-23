const RolePermission = require('../model/RolePermission.model');
const User = require('../model/User.model');
const Role = require('../model/Role.model');

// Check if user has a specific permission with a specific action
const hasPermission = async (userId, permissionName, action = 'read') => {
    try {
        const user = await User.findById(userId);
        if (!user) return false;

        // Super Admin has all permissions
        if (user.role === 'Admin' || user.role === 'Super Admin') {
            return true;
        }

        // Find the role
        let role = await Role.findOne({ name: user.role });
        if (!role && user.roleId) {
            role = await Role.findById(user.roleId);
        }
        if (!role) return false;

        // Find the permission
        const permission = await RolePermission.findOne({ role: role._id })
            .populate('permission');

        if (!permission) return false;

        // Check the specific action
        const actionMap = {
            'create': 'canCreate',
            'read': 'canRead',
            'update': 'canUpdate',
            'delete': 'canDelete',
            'approve': 'canApprove',
            'export': 'canExport'
        };

        const actionField = actionMap[action];
        if (!actionField) return false;

        return permission[actionField] === true;
    } catch (error) {
        console.error('Permission check error:', error);
        return false;
    }
};

// Middleware factory for checking permissions
const authorizePermission = (permissionName, action = 'read') => {
    return async (req, res, next) => {
        try {
            const hasAccess = await hasPermission(req.user._id, permissionName, action);
            if (!hasAccess) {
                return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
            }
            next();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
};

// Middleware to check module access (for sidebar visibility)
const hasModuleAccess = async (userId, moduleName) => {
    try {
        const user = await User.findById(userId);
        if (!user) return false;

        // Super Admin has access to all modules
        if (user.role === 'Admin' || user.role === 'Super Admin') {
            return true;
        }

        // Find the role
        let role = await Role.findOne({ name: user.role });
        if (!role && user.roleId) {
            role = await Role.findById(user.roleId);
        }
        if (!role) return false;

        // Check if role has any permission for this module
        const rolePermissions = await RolePermission.find({ role: role._id })
            .populate('permission');

        const hasAccess = rolePermissions.some(rp => {
            return rp.permission && rp.permission.module === moduleName && rp.canRead;
        });

        return hasAccess;
    } catch (error) {
        console.error('Module access check error:', error);
        return false;
    }
};

module.exports = {
    hasPermission,
    authorizePermission,
    hasModuleAccess
};
