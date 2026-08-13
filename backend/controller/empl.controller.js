const emp = require("../model/Empl.model");
const { syncEntityAcrossModules, deleteEntityFromModules, getEntityFromAllModules } = require("../services/universalDataSync.service");
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const deleteFileIfExists = (filePath) => {
  if (!filePath) return;

  try {
    const filename = path.basename(filePath);
    const fullPath = path.join(UPLOAD_DIR, filename);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted file: ${fullPath}`);
    } else {
      console.log(`File not found: ${fullPath}`);
    }
  } catch (err) {
    console.error(`Failed to delete file: ${filePath}`, err.message);
  }
};

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
    if (req.files?.image?.[0]) {
      payload.image = `/uploads/${req.files.image[0].filename}`;
    }
    if (req.files?.docImage?.[0]) {
      payload.docImage = `/uploads/${req.files.docImage[0].filename}`;
    }
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
    const existingEmployee = await emp.findById(id);
    if (!existingEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const payload = { ...req.body };
    if (payload.phoneNo) payload.phoneNo = Number(payload.phoneNo);
    if (payload.bod) payload.age = calculateAge(payload.bod);
    
    // If new image is uploaded, delete the old one
    if (req.files?.image?.[0]) {
      deleteFileIfExists(existingEmployee.image);
      payload.image = `/uploads/${req.files.image[0].filename}`;
    }
    // If new docImage is uploaded, delete the old one
    if (req.files?.docImage?.[0]) {
      deleteFileIfExists(existingEmployee.docImage);
      payload.docImage = `/uploads/${req.files.docImage[0].filename}`;
    }
    
    const employee = await emp.findByIdAndUpdate(id, payload, { new: true })
      .populate('department')
      .populate('designation');
    
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
    const employee = await emp.findById(id);

    if (!employee) {
      return res.status(404).json({
        error: "Employee not found"
      });
    }

    // Delete employee profile image from uploads folder
    if (employee.image) {
      deleteFileIfExists(employee.image);
    }

    // Delete employee document image from uploads folder
    if (employee.docImage) {
      deleteFileIfExists(employee.docImage);
    }

    // Delete employee from Employee collection
    await emp.findByIdAndDelete(id);

    // Delete employee data from all related modules
    await deleteEntityFromModules(id, 'employee');

    return res.status(200).json({
      success: true,
      message: "Employee and associated images deleted successfully"
    });

  } catch (error) {
    console.error("Delete employee error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Error deleting employee"
    });
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
