const Designation = require('../model/Designation.model');

const generateDesigId = () => 'DES' + Date.now().toString().slice(-6);

const createDesignation = async (req, res) => {
  try {
    const { title, department, isActive, id } = req.body;
    const designation = await Designation.create({
      id: id || generateDesigId(),
      title,
      department: department || undefined,
      isActive: isActive !== false,
    });
    const populated = await designation.populate('department');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllDesignations = async (req, res) => {
  try {
    const designations = await Designation.find().populate('department');
    res.status(200).json(designations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateDesignation = async (req, res) => {
  try {
    const { id } = req.params;
    const designation = await Designation.findByIdAndUpdate(id, req.body, { new: true }).populate('department');
    if (!designation) {
      return res.status(404).json({ error: 'Designation not found' });
    }
    res.status(200).json(designation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteDesignation = async (req, res) => {
  try {
    const { id } = req.params;
    const designation = await Designation.findByIdAndDelete(id);
    if (!designation) {
      return res.status(404).json({ error: 'Designation not found' });
    }
    res.status(200).json({ message: 'Designation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createDesignation,
  getAllDesignations,
  updateDesignation,
  deleteDesignation,
};
