const Category = require('../model/Category.model');
const SpareParts = require('../model/SpareParts.model');

// Get all categories
exports.getAllCategories = async (req, res) => {
    try {
        const { status, search } = req.query;
        const filter = {};
        
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        const categories = await Category.find(filter).sort({ name: 1 });
        
        // Get part count for each category
        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const partCount = await SpareParts.countDocuments({ category: category.name });
                return {
                    ...category.toObject(),
                    partCount
                };
            })
        );
        
        res.json(categoriesWithCount);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single category
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        const partCount = await SpareParts.countDocuments({ category: category.name });
        
        res.json({
            ...category.toObject(),
            partCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create category
exports.createCategory = async (req, res) => {
    try {
        const { name, description, status } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        // Check if category already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ error: 'Category with this name already exists' });
        }
        
        const category = new Category({
            name,
            description,
            status: status || 'Active',
            createdBy: req.user?._id
        });
        
        await category.save();
        
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        const { name, description, status } = req.body;
        
        if (name && name !== category.name) {
            // Check if new name already exists
            const existingCategory = await Category.findOne({ name });
            if (existingCategory) {
                return res.status(400).json({ error: 'Category with this name already exists' });
            }
            // Update all spare parts with this category
            await SpareParts.updateMany(
                { category: category.name },
                { category: name }
            );
        }
        
        category.name = name || category.name;
        category.description = description !== undefined ? description : category.description;
        category.status = status || category.status;
        category.updatedBy = req.user?._id;
        
        await category.save();
        
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete category
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        // Check if category has spare parts
        const partCount = await SpareParts.countDocuments({ category: category.name });
        if (partCount > 0) {
            return res.status(400).json({ 
                error: `Cannot delete category. It has ${partCount} spare parts associated with it.` 
            });
        }
        
        await Category.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
