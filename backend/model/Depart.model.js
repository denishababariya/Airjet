const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({

    id: {
        type: String,
        require: true
    },
    title: {
        type: String,
        require: true
    },
    head: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
})

const department = mongoose.model("department", departmentSchema)

module.exports = department;
