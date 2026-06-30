const depart = require('../model/Depart.model')


const createDepart = async (req,res) => {
    const {title,head,isActive} = req.body;

    const data = await depart.create({title,head,isActive});
    res.status(201).json(data);
}

module.export = {
    createDepart
}