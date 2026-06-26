const Overtime = require('../model/Overtime');

exports.getAllOvertime = async (req, res) => {
  try {
    const overtime = await Overtime.find();
    res.json(overtime);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOvertimeById = async (req, res) => {
  try {
    const overtime = await Overtime.findById(req.params.id);
    if (!overtime) {
      return res.status(404).json({ error: 'Overtime record not found' });
    }
    res.json(overtime);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createOvertime = async (req, res) => {
  try {
    const overtime = new Overtime(req.body);
    const savedOvertime = await overtime.save();
    res.status(201).json(savedOvertime);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateOvertime = async (req, res) => {
  try {
    const overtime = await Overtime.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!overtime) {
      return res.status(404).json({ error: 'Overtime record not found' });
    }
    res.json(overtime);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteOvertime = async (req, res) => {
  try {
    const overtime = await Overtime.findByIdAndDelete(req.params.id);
    if (!overtime) {
      return res.status(404).json({ error: 'Overtime record not found' });
    }
    res.json({ message: 'Overtime record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
