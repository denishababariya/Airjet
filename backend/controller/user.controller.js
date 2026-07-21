const User = require("../model/User.model");
const Employee = require("../model/Empl.model");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// In-memory OTP store: { email: { otp, expiresAt } }
const otpStore = {};

// Reset tokens after OTP verification: { email: { token, expiresAt } }
const resetTokenStore = {};

const ALLOWED_RESET_ROLES = ["Admin", "Manager"];

const JWT_SECRET = () => process.env.JWT_SECRET || 'your-secret-key';

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
        
        const employee = await Employee.findOne({ email: email.toLowerCase().trim() });
        if (!employee) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = await User.findOne({ employeeId: employee._id })
            .populate({ path: 'employeeId', populate: [{ path: 'department' }, { path: 'designation' }] });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.status !== 'Active') {
            return res.status(403).json({ error: 'Account is inactive' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET(),
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
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

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({ path: 'employeeId', populate: [{ path: 'department' }, { path: 'designation' }] });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({
            id: user._id,
            role: user.role,
            status: user.status,
            isVerified: user.isVerified,
            employee: user.employeeId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const checkRoleForReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const employee = await Employee.findOne({ email: normalizedEmail });
        if (!employee) {
            return res.status(404).json({ error: 'No account found with this email address' });
        }

        const user = await User.findOne({ employeeId: employee._id });
        if (!user) {
            return res.status(404).json({ error: 'No account found with this email address' });
        }

        if (!ALLOWED_RESET_ROLES.includes(user.role)) {
            return res.status(403).json({
                error: 'Password reset is only available for Admin or Manager accounts. Please contact your administrator.'
            });
        }

        if (user.status !== 'Active') {
            return res.status(403).json({ error: 'Account is inactive. Please contact your administrator.' });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        otpStore[normalizedEmail] = {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000,
        };

        console.log(`[OTP] ${normalizedEmail} => ${otp}`);

        res.status(200).json({
            message: 'OTP sent to your email address',
            role: user.role,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const record = otpStore[normalizedEmail];
        if (!record) {
            return res.status(400).json({ error: 'OTP not found. Please request a new OTP.' });
        }

        if (Date.now() > record.expiresAt) {
            delete otpStore[normalizedEmail];
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }

        if (record.otp !== otp.trim()) {
            return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
        }

        delete otpStore[normalizedEmail];

        const resetToken = crypto.randomBytes(32).toString('hex');
        resetTokenStore[normalizedEmail] = {
            token: resetToken,
            expiresAt: Date.now() + 15 * 60 * 1000,
        };

        res.status(200).json({
            message: 'OTP verified successfully',
            resetToken,
            email: normalizedEmail,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const resetPasswordWithToken = async (req, res) => {
    try {
        const { email, resetToken, newPassword } = req.body;
        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({ error: 'Email, reset token, and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const record = resetTokenStore[normalizedEmail];
        if (!record || record.token !== resetToken) {
            return res.status(400).json({ error: 'Invalid or expired reset session. Please start again.' });
        }
        if (Date.now() > record.expiresAt) {
            delete resetTokenStore[normalizedEmail];
            return res.status(400).json({ error: 'Reset session expired. Please request a new OTP.' });
        }

        const employee = await Employee.findOne({ email: normalizedEmail });
        if (!employee) {
            return res.status(404).json({ error: 'Account not found' });
        }

        const user = await User.findOne({ employeeId: employee._id });
        if (!user) {
            return res.status(404).json({ error: 'Account not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.confirmPassword = hashedPassword;
        user.isVerified = true;
        await user.save();

        delete resetTokenStore[normalizedEmail];

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.confirmPassword = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        if (updates.password) {
            const hashedPassword = await bcrypt.hash(updates.password, 10);
            updates.password = hashedPassword;
            updates.confirmPassword = hashedPassword;
        }
        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true })
            .populate({ path: 'employeeId', populate: [{ path: 'department' }, { path: 'designation' }] });
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
    getMe,
    checkRoleForReset,
    verifyOtp,
    resetPasswordWithToken,
    changePassword,
    updateUser
};
