const emp = require("../model/Empl.model");
const { syncEntityAcrossModules, deleteEntityFromModules, getEntityFromAllModules } = require("../services/universalDataSync.service");
const crypto = require('crypto');

const generateEmpId = () => 'EMP' + Date.now().toString().slice(-6);

const calculateAge = (bod) => {
  if (!bod) return undefined;
  const birthDate = new Date(bod);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const generateQrToken = () => {
  return `AJ_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

const createEmployee = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      id: req.body.id || generateEmpId(),
      qrToken: req.body.qrToken || generateQrToken(),
      phoneNo: req.body.phoneNo ? Number(req.body.phoneNo) : req.body.phoneNo,
      age: calculateAge(req.body.bod),
    };
    const savedEmployee = await emp.create(payload);
    
    // Sync employee data across all modules
    await syncEntityAcrossModules(savedEmployee, 'employee', 'create');
    
    const populated = await emp.findById(savedEmployee._id)
      .populate('department')
      .populate('designation');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message || "Error creating employee" });
  }
};

const getAllEmployees = async (req, res) => {
  try {
    const employees = await emp.find()
      .populate('department')
      .populate('designation')
      .sort({ createdAt: -1 });
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ error: "Error fetching employees" });
  }
};

const getEmployeeById = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await emp.findById(id)
      .populate('department')
      .populate('designation');
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({ error: "Error fetching employee" });
  }
};

const updateEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const payload = { ...req.body };
    if (payload.phoneNo) payload.phoneNo = Number(payload.phoneNo);
    if (payload.bod) payload.age = calculateAge(payload.bod);
    const employee = await emp.findByIdAndUpdate(id, payload, { new: true })
      .populate('department')
      .populate('designation');
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    
    // Sync updated employee data across all modules
    await syncEntityAcrossModules(employee, 'employee', 'update');
    
    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message || "Error updating employee" });
  }
};

const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await emp.findByIdAndDelete(id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    
    // Delete employee data from all modules
    await deleteEntityFromModules(id, 'employee');
    
    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting employee" });
  }
};

const getEmployeeModuleData = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await emp.findById(id)
      .populate('department')
      .populate('designation');
    
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    
    const moduleData = await getEntityFromAllModules(id, 'employee');
    
    res.status(200).json({
      employee,
      moduleData
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching employee data from modules" });
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeeModuleData,
};
