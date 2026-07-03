const User = require("../model/User.model");
const Employee = require("../model/Empl.model");
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// In-memory OTP store: { email: { otp, expiresAt } }
// For production, use Redis or a DB collection
const otpStore = {};

const ALLOWED_RESET_ROLES = ["Admin", "Manager"];

const createUser = async (req, res) => {
    try {
        const { password, ...rest } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            ...rest,
            password: hashedPassword,
            confirmPassword: hashedPassword
        });
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find employee by email first
        const employee = await Employee.findOne({ email });
        if (!employee) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Find user by employeeId
        const user = await User.findOne({ employeeId: employee._id }).populate('employeeId');
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user is active and verified
        if (user.status !== 'Active') {
            return res.status(403).json({ error: 'Account is inactive' });
        }

        res.status(200).json({
            message: 'Login successful',
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

// Check if user exists and has an allowed role for password reset
const checkRoleForReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Find employee by email
        const employee = await Employee.findOne({ email: email.toLowerCase().trim() });
        if (!employee) {
            return res.status(404).json({ error: 'No account found with this email address' });
        }

        // Find associated user
        const user = await User.findOne({ employeeId: employee._id });
        if (!user) {
            return res.status(404).json({ error: 'No account found with this email address' });
        }

        // Check role
        if (!ALLOWED_RESET_ROLES.includes(user.role)) {
            return res.status(403).json({
                error: 'Password reset is only available for Admin or Manager accounts. Please contact your administrator.'
            });
        }

        if (user.status !== 'Active') {
            return res.status(403).json({ error: 'Account is inactive. Please contact your administrator.' });
        }

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        otpStore[email] = {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        };

        // TODO: Send OTP via email (integrate nodemailer here)
        // For now, log to console in development
        console.log(`[OTP] ${email} => ${otp}`);

        res.status(200).json({
            message: 'OTP sent to your email address',
            role: user.role,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Verify OTP submitted by user
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        const record = otpStore[email];
        if (!record) {
            return res.status(400).json({ error: 'OTP not found. Please request a new OTP.' });
        }

        if (Date.now() > record.expiresAt) {
            delete otpStore[email];
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }

        if (record.otp !== otp.trim()) {
            return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
        }

        // OTP verified — clear it so it can't be reused
        delete otpStore[email];

        res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createUser,
    loginUser,
    checkRoleForReset,
    verifyOtp,
    updateUser
};