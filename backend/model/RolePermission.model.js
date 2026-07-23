const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema({
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'role',
        required: true
    },
    permission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'permission',
        required: true
    },
    canCreate: {
        type: Boolean,
        default: false
    },
    canRead: {
        type: Boolean,
        default: false
    },
    canUpdate: {
        type: Boolean,
        default: false
    },
    canDelete: {
        type: Boolean,
        default: false
    },
    canApprove: {
        type: Boolean,
        default: false
    },
    canExport: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    uniqueCompoundIndex: { role: 1, permission: 1 }
});

rolePermissionSchema.index({ role: 1, permission: 1 }, { unique: true });

const RolePermission = mongoose.model('rolePermission', rolePermissionSchema);
module.exports = RolePermission;
