const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id : {
        type: String,
        require: true
    },
    employeeId : {
        type: mongoose.Types.ObjectId,
        ref: "employee"
    },
    role : {
        type: String,
        enum: ["Super Admin", "Admin", "Sales Manager", "Sales Executive", "Purchase Manager", "Purchase Executive", "Inventory Manager", "Warehouse Staff", "HR Manager", "Accountant", "Service Manager", "Quality Inspector", "CEO/Director", "User"],
        default: "User"
    },
    roleId : {
        type: mongoose.Types.ObjectId,
        ref: "role"
    },
    password : {
        type: String,
        require: true
    },
    confirmPassword : {
        type: String,
        require: true
    },
    isVerified : {
        type: Boolean,
        default: false
    },
    status : {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    }
},{
    timestamps: true
})

const user = mongoose.model("user", userSchema)

module.exports = user;