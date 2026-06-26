const SparePart = require('../model/SparePart');

exports.getAllSpareParts = async (req, res) => {
  try {
    const parts = await SparePart.find();
    res.json(parts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSparePartById = async (req, res) => {
  try {
    const part = await SparePart.findById(req.params.id);
    if (!part) {
      return res.status(404).json({ error: 'Spare part not found' });
    }
    res.json(part);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSparePart = async (req, res) => {
  try {
    const part = new SparePart(req.body);
    const savedPart = await part.save();
    res.status(201).json(savedPart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateSparePart = async (req, res) => {
  try {
    const part = await SparePart.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!part) {
      return res.status(404).json({ error: 'Spare part not found' });
    }
    res.json(part);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteSparePart = async (req, res) => {
  try {
    const part = await SparePart.findByIdAndDelete(req.params.id);
    if (!part) {
      return res.status(404).json({ error: 'Spare part not found' });
    }
    res.json({ message: 'Spare part deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
