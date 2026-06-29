const mongoose = require('mongoose');

const empoleeSchema = new mongoose.Schema({

    id: {
        type: String,
        require: true
    },
    name: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    address: {
        type: String,
    },
    phoneNo: {
        type: Number,
    },
    docs: {
        type: String,
        default: ""
    },
    image: {
        type: String,
        default: ""
    },
    bod: {
        type: Date,
    },
    age: {
        type: Number,
    },
    department: {

        type: mongoose.Types.ObjectId,
        ref: "department"
    },
    designation: {
        type: mongoose.Types.ObjectId,
        ref: "designation"
    },
    salary: {
        type: Number,
    },
    gender: {
        type: String,
    },
    workShift: {
        type: String,
    },
    cast: {
        type: String,
    },
    status: {
        type: String,
        default: "Active",
        enum: ["Active", "Inactive"]
    }

}, {
    timestamps: true
})

const employee = mongoose.model("employee", empoleeSchema)

module.exports = employee;