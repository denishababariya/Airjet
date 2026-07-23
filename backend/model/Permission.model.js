const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    module: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    actions: [{
        type: String,
        enum: ['create', 'read', 'update', 'delete', 'approve', 'export']
    }]
}, {
    timestamps: true
});

const Permission = mongoose.model('permission', permissionSchema);
module.exports = Permission;
