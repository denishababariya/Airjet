const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema({
    id : {
        type : String,
        require : true
    },
    title : {
        type : String,
        require : true
    },
    department : {
        type : mongoose.Types.ObjectId,
        ref : "department"
    },
    isActive : {
        type : Boolean,
        default : true
    }
},{
    timestamps: true
})

const designation = mongoose.model("designation",designationSchema)
module.exports = designation;
