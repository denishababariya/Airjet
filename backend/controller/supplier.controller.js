const Supplier = require('../model/Supplier.model');
const { syncEntityAcrossModules, deleteEntityFromModules, getEntityFromAllModules } = require('../services/universalDataSync.service');

const generateId = async () => {
  const count = await Supplier.countDocuments();
  return `SUP${String(count + 1).padStart(3, '0')}`;
};

const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create({
      ...req.body,
      id: req.body.id || await generateId(),
    });
    
    // Sync supplier data across relevant modules
    await syncEntityAcrossModules(supplier, 'supplier', 'create');
    
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    
    // Sync updated supplier data across relevant modules
    await syncEntityAcrossModules(supplier, 'supplier', 'update');
    
    res.status(200).json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    
    // Delete supplier data from all modules
    await deleteEntityFromModules(req.params.id, 'supplier');
    
    res.status(200).json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSupplierModuleData = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    
    const moduleData = await getEntityFromAllModules(req.params.id, 'supplier');
    
    res.status(200).json({
      supplier,
      moduleData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createSupplier,
  getAllSuppliers,
  updateSupplier,
  deleteSupplier,
  getSupplierModuleData,
};
