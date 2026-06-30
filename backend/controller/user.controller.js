const user = require("../model/User.model");

const createUser = async (req,res) => {
    try {
        const newUser = await user.create(req.body);
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const updateUser = async ( req,res ) => {
    try {
        const { id } = req.params;

        const findUser =await user.findById(id);
        if(findUser){
            res.status(404).json({message : 'User not found'});
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = {
    createUser,
    updateUser
}