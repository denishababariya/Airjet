const Payroll = require('../model/Payroll');

exports.getAllPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.find();
    res.json(payroll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    res.json(payroll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPayroll = async (req, res) => {
  try {
    const payroll = new Payroll(req.body);
    const savedPayroll = await payroll.save();
    res.status(201).json(savedPayroll);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updatePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    res.json(payroll);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndDelete(req.params.id);
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    res.json({ message: 'Payroll record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
