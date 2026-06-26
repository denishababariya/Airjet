const Leave = require('../model/Leave');

exports.getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find();
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    res.json(leave);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createLeave = async (req, res) => {
  try {
    const leave = new Leave(req.body);
    const savedLeave = await leave.save();
    res.status(201).json(savedLeave);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateLeave = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    res.json(leave);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
