const User = require('../model/User.model');
const Employee = require('../model/Empl.model');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Generate random password
const generatePassword = (length = 8) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
};

// Generate password for employee (HR/Admin/Manager only)
const generateEmployeePassword = async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        // Find employee
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Check if user already exists for this employee
        let user = await User.findOne({ employeeId: employee._id });
        
        // Generate new password
        const newPassword = generatePassword(10);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        if (user) {
            // Update existing user password
            user.password = hashedPassword;
            user.confirmPassword = hashedPassword;
            user.isVerified = true;
            user.status = 'Active';
            await user.save();
        } else {
            // Create new user with generated password
            const userId = 'USR' + Date.now().toString().slice(-6);
            user = await User.create({
                id: userId,
                employeeId: employee._id,
                role: 'User',
                password: hashedPassword,
                confirmPassword: hashedPassword,
                isVerified: true,
                status: 'Active'
            });
        }

        res.status(200).json({
            message: 'Password generated successfully',
            password: newPassword,
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email
            },
            user: {
                id: user._id,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reset password for specific user (HR/Admin/Manager only)
const resetUserPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId).populate('employeeId');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate new password
        const newPassword = generatePassword(10);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.confirmPassword = hashedPassword;
        user.isVerified = true;
        await user.save();

        res.status(200).json({
            message: 'Password reset successfully',
            password: newPassword,
            user: {
                id: user._id,
                role: user.role,
                employee: user.employeeId
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create user with role assignment (Admin only)
const createUserWithRole = async (req, res) => {
    try {
        const { employeeId, role } = req.body;
        
        // Find employee
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ employeeId: employee._id });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists for this employee' });
        }

        // Generate password
        const newPassword = generatePassword(10);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Create user
        const userId = 'USR' + Date.now().toString().slice(-6);
        const user = await User.create({
            id: userId,
            employeeId: employee._id,
            role: role || 'User',
            password: hashedPassword,
            confirmPassword: hashedPassword,
            isVerified: true,
            status: 'Active'
        });

        res.status(201).json({
            message: 'User created successfully',
            password: newPassword,
            user: {
                id: user._id,
                role: user.role,
                employee: employee
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    generateEmployeePassword,
    resetUserPassword,
    createUserWithRole
};
