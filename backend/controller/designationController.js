const Designation = require('../model/Designation');

exports.getAllDesignations = async (req, res) => {
  try {
    const designations = await Designation.find();
    res.json(designations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDesignationById = async (req, res) => {
  try {
    const designation = await Designation.findById(req.params.id);
    if (!designation) {
      return res.status(404).json({ error: 'Designation not found' });
    }
    res.json(designation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createDesignation = async (req, res) => {
  try {
    const designation = new Designation(req.body);
    const savedDesignation = await designation.save();
    res.status(201).json(savedDesignation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateDesignation = async (req, res) => {
  try {
    const designation = await Designation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!designation) {
      return res.status(404).json({ error: 'Designation not found' });
    }
    res.json(designation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteDesignation = async (req, res) => {
  try {
    const designation = await Designation.findByIdAndDelete(req.params.id);
    if (!designation) {
      return res.status(404).json({ error: 'Designation not found' });
    }
    res.json({ message: 'Designation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
