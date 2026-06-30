const emp = require("../models/emp.model");

const createEmployee = async (req, res) => {
  const newEmployee = new emp(req.body);
  try {
    const savedEmployee = await newEmployee.save();
    res.status(201).json(savedEmployee);
  } catch (error) {
    res.status(500).json({ message: "Error creating employee" });
  }
};

const getAllEmployees = async (req, res) => {
  try {
    
    const employees = await emp.find();
    if (!employees || employees.length === 0) {
      return res.status(400).json({ message: "No employees found" });
    }
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employees" });
  }
};

const getEmployeeById = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await emp.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employee" });
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
};
