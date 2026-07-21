const Department = require('../model/Depart.model');

const generateDeptId = () => 'DEPT' + Date.now().toString().slice(-6);

const createDepart = async (req, res) => {
  try {
    const { title, head, isActive, id } = req.body;
    const data = await Department.create({
      id: id || generateDeptId(),
      title,
      head: head || undefined,
      isActive: isActive !== false,
    });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find().populate('head');
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findByIdAndUpdate(id, req.body, { new: true }).populate('head');
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.status(200).json(department);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findByIdAndDelete(id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createDepart,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
};
