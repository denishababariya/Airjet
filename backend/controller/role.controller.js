const Role = require('../model/Role.model');
const Permission = require('../model/Permission.model');
const RolePermission = require('../model/RolePermission.model');
const mongoose = require('mongoose');

// ──────────────────────────────────────────────────────────────
// Role CRUD
// ──────────────────────────────────────────────────────────────

const createRole = async (req, res) => {
    try {
        const { name, description, level, isSystem } = req.body;
        if (!name || level === undefined) {
            return res.status(400).json({ error: 'Name and level are required' });
        }
        const id = name.toUpperCase().replace(/\s+/g, '_');
        const role = await Role.create({ id, name, description, level, isSystem: isSystem || false });
        res.status(201).json(role);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllRoles = async (req, res) => {
    try {
        const roles = await Role.find().sort({ level: 1 });
        res.status(200).json(roles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getRoleById = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) return res.status(404).json({ error: 'Role not found' });
        res.status(200).json(role);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateRole = async (req, res) => {
    try {
        const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!role) return res.status(404).json({ error: 'Role not found' });
        res.status(200).json(role);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) return res.status(404).json({ error: 'Role not found' });
        if (role.isSystem) {
            return res.status(403).json({ error: 'Cannot delete a system role' });
        }
        await Role.findByIdAndDelete(req.params.id);
        await RolePermission.deleteMany({ role: req.params.id });
        res.status(200).json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ──────────────────────────────────────────────────────────────
// Permission CRUD
// ──────────────────────────────────────────────────────────────

const createPermission = async (req, res) => {
    try {
        const { name, module, description, actions } = req.body;
        if (!name || !module) {
            return res.status(400).json({ error: 'Name and module are required' });
        }
        const id = name.toUpperCase().replace(/\s+/g, '_');
        const permission = await Permission.create({ id, name, module, description, actions: actions || [] });
        res.status(201).json(permission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllPermissions = async (req, res) => {
    try {
        const permissions = await Permission.find().sort({ module: 1, name: 1 });
        res.status(200).json(permissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPermissionsByModule = async (req, res) => {
    try {
        const { module } = req.params;
        const permissions = await Permission.find({ module }).sort({ name: 1 });
        res.status(200).json(permissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updatePermission = async (req, res) => {
    try {
        const permission = await Permission.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!permission) return res.status(404).json({ error: 'Permission not found' });
        res.status(200).json(permission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deletePermission = async (req, res) => {
    try {
        const permission = await Permission.findById(req.params.id);
        if (!permission) return res.status(404).json({ error: 'Permission not found' });
        await Permission.findByIdAndDelete(req.params.id);
        await RolePermission.deleteMany({ permission: req.params.id });
        res.status(200).json({ message: 'Permission deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ──────────────────────────────────────────────────────────────
// Role-Permission Assignment
// ──────────────────────────────────────────────────────────────

const assignPermissionToRole = async (req, res) => {
    try {
        const { roleId, permissionId, canCreate, canRead, canUpdate, canDelete, canApprove, canExport } = req.body;
        if (!roleId || !permissionId) {
            return res.status(400).json({ error: 'roleId and permissionId are required' });
        }
        const rolePermission = await RolePermission.findOneAndUpdate(
            { role: roleId, permission: permissionId },
            { role: roleId, permission: permissionId, canCreate, canRead, canUpdate, canDelete, canApprove, canExport },
            { new: true, upsert: true }
        ).populate('permission');
        res.status(200).json(rolePermission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getRolePermissions = async (req, res) => {
    try {
        const { roleId } = req.params;
        const rolePermissions = await RolePermission.find({ role: roleId })
            .populate('permission')
            .sort({ 'permission.module': 1, 'permission.name': 1 });
        res.status(200).json(rolePermissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const removePermissionFromRole = async (req, res) => {
    try {
        const { roleId, permissionId } = req.params;
        await RolePermission.findOneAndDelete({ role: roleId, permission: permissionId });
        res.status(200).json({ message: 'Permission removed from role' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getRoleWithPermissions = async (req, res) => {
    try {
        const { roleId } = req.params;
        const role = await Role.findById(roleId);
        if (!role) return res.status(404).json({ error: 'Role not found' });
        const permissions = await RolePermission.find({ role: roleId }).populate('permission');
        res.status(200).json({ role, permissions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ──────────────────────────────────────────────────────────────
// Bulk Operations
// ──────────────────────────────────────────────────────────────

const bulkAssignPermissions = async (req, res) => {
    try {
        const { roleId, permissions } = req.body;
        if (!roleId || !Array.isArray(permissions)) {
            return res.status(400).json({ error: 'roleId and permissions array are required' });
        }
        const bulkOps = permissions.map(p => ({
            updateOne: {
                filter: { role: roleId, permission: p.permissionId },
                update: {
                    role: roleId,
                    permission: p.permissionId,
                    canCreate: p.canCreate || false,
                    canRead: p.canRead || false,
                    canUpdate: p.canUpdate || false,
                    canDelete: p.canDelete || false,
                    canApprove: p.canApprove || false,
                    canExport: p.canExport || false
                },
                upsert: true
            }
        }));
        await RolePermission.bulkWrite(bulkOps);
        res.status(200).json({ message: 'Permissions assigned successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getMyPermissions = async (req, res) => {
    try {
        const user = await require('../model/User.model').findById(req.user._id).populate('roleId');
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        let roleId = null;
        if (user.roleId) {
            roleId = typeof user.roleId === 'object' && user.roleId._id ? user.roleId._id : user.roleId;
        } else if (user.role) {
            const role = await Role.findOne({ name: user.role });
            roleId = role ? role._id : null;
        }
        if (!roleId) {
            return res.status(200).json({ role: user.role, permissions: [] });
        }
        const permissions = await RolePermission.find({ role: roleId }).populate('permission');
        const role = await Role.findById(roleId);
        res.status(200).json({ role, permissions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createRole,
    getAllRoles,
    getRoleById,
    updateRole,
    deleteRole,
    createPermission,
    getAllPermissions,
    getPermissionsByModule,
    updatePermission,
    deletePermission,
    assignPermissionToRole,
    getRolePermissions,
    removePermissionFromRole,
    getRoleWithPermissions,
    bulkAssignPermissions,
    getMyPermissions
};
