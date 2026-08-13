const mongoose = require('mongoose');
const RawMaterial = require('../model/RawMaterial.model');
const RawMaterialPurchase = require('../model/RawMaterialPurchase.model');
const RawMaterialTransaction = require('../model/RawMaterialTransaction.model');
const Supplier = require('../model/Supplier.model');

const generateId = async (prefix, model) => {
  const count = await model.countDocuments();
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
};

const normalizeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const createStockTransaction = async ({ material, type, quantity, unitPrice, reason, referenceId, userId }) => {
  if (!material || !quantity) return null;

  return RawMaterialTransaction.create({
    rawMaterialId: material._id,
    materialCode: material.code,
    materialName: material.name,
    type,
    quantity: normalizeNumber(quantity),
    unit: material.unit,
    unitPrice: normalizeNumber(unitPrice),
    balanceAfter: material.quantity,
    reason: reason || '',
    referenceId: referenceId || '',
    createdBy: userId || null
  });
};

// ──────────────────────────────────────────────────────────────
// Raw Material CRUD Operations
// ──────────────────────────────────────────────────────────────
const createRawMaterial = async (req, res) => {
  try {
    const { name, category, description, unit, quantity, minimumStock, unitPrice, supplier, supplierId, location, warehouse, specifications, qualityCheck } = req.body;

    if (!name || !category || !unit || !unitPrice) {
      return res.status(400).json({ error: 'Name, category, unit, and unit price are required' });
    }

    // Auto-generate code
    const code = await generateId('RM', RawMaterial);

    const id = code;

    const rawMaterial = await RawMaterial.create({
      id,
      name,
      code,
      category,
      description,
      unit,
      quantity: quantity || 0,
      minimumStock: minimumStock || 10,
      unitPrice,
      totalPrice: (quantity || 0) * unitPrice,
      supplier: supplierId || null,
      supplierName: supplier || '',
      location: location || '',
      warehouse: warehouse || null,
      specifications: specifications || {},
      qualityCheck: qualityCheck || { required: false, status: 'Pending' }
    });

    if ((Number(quantity) || 0) > 0) {
      await createStockTransaction({
        material: rawMaterial,
        type: 'Opening',
        quantity: Number(quantity) || 0,
        unitPrice: Number(unitPrice) || 0,
        reason: 'Opening stock',
        userId: req.user?._id
      });
    }

    res.status(201).json(rawMaterial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllRawMaterials = async (req, res) => {
  try {
    const { category, supplier, status, minStock, maxStock } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (supplier) filter.supplier = supplier;
    if (status) filter.status = status;
    if (minStock) filter.quantity = { $gte: Number(minStock) };
    if (maxStock) filter.quantity = { ...filter.quantity, $lte: Number(maxStock) };

    const materials = await RawMaterial.find(filter)
      .populate('supplier', 'name contact phone city')
      .sort({ createdAt: -1 });
    
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRawMaterialById = async (req, res) => {
  try {
    const material = await RawMaterial.findById(req.params.id)
      .populate('supplier', 'name contact phone city gst email');
    
    if (!material) return res.status(404).json({ error: 'Raw material not found' });
    
    res.status(200).json(material);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRawMaterial = async (req, res) => {
  try {
    const material = await RawMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ error: 'Raw material not found' });

    const { code, totalPrice, id, ...updateData } = req.body;
    Object.assign(material, updateData, { updatedBy: req.user?._id });

    material.$locals.recalculateTotalPrice = true;
    const updated = await material.save();

    res.status(200).json(updated);
  } catch (error) {
    console.error('Update Raw Material Error:', error);
    res.status(500).json({ error: error.message || 'Failed to update raw material' });
  }
};

const deleteRawMaterial = async (req, res) => {
  try {
    const material = await RawMaterial.findByIdAndDelete(req.params.id);
    if (!material) return res.status(404).json({ error: 'Raw material not found' });

    res.status(200).json({ message: 'Raw material deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deduct stock when materials are used
const deductStock = async (req, res) => {
  try {
    const { materialId, quantity, reason } = req.body;
    const qty = normalizeNumber(quantity);

    const material = await RawMaterial.findById(materialId);
    if (!material) return res.status(404).json({ error: 'Raw material not found' });

    if (qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    if (material.quantity < qty) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    material.quantity -= qty;
    material.totalPrice = material.quantity * material.unitPrice;
    const updated = await material.save();

    await createStockTransaction({
      material: updated,
      type: 'Deduct',
      quantity: qty,
      unitPrice: material.unitPrice,
      reason: reason || 'Raw material used',
      userId: req.user?._id
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add stock manually (adjustment)
const addStock = async (req, res) => {
  try {
    const { materialId, quantity, unitPrice, reason } = req.body;
    const qty = normalizeNumber(quantity);
    const price = unitPrice === undefined || unitPrice === '' ? null : normalizeNumber(unitPrice, null);

    const material = await RawMaterial.findById(materialId);
    if (!material) return res.status(404).json({ error: 'Raw material not found' });

    if (qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    if (price !== null && price < 0) {
      return res.status(400).json({ error: 'Unit price cannot be negative' });
    }

    material.quantity += qty;
    if (price !== null) {
      material.unitPrice = price;
      material.lastPurchasePrice = price;
    }
    material.totalPrice = material.quantity * material.unitPrice;
    material.lastPurchaseDate = new Date();

    const updated = await material.save();

    await createStockTransaction({
      material: updated,
      type: 'Add',
      quantity: qty,
      unitPrice: material.unitPrice,
      reason: reason || 'Stock added',
      userId: req.user?._id
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// Raw Material Purchase Operations
// ──────────────────────────────────────────────────────────────
const createRawMaterialPurchase = async (req, res) => {
  try {
    const { supplier, supplierId, purchaseDate, expectedDelivery, items, paymentTerms, notes, status } = req.body;
    const userId = req.user?._id;

    if (!supplier || !supplierId || !purchaseDate || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Supplier, purchase date, and items are required' });
    }

    // Validate supplier exists
    const supplierDoc = await Supplier.findById(supplierId);
    if (!supplierDoc) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    let totalAmount = 0;
    const processedItems = [];
    
    for (const item of items) {
      // Validate raw material exists
      const material = await RawMaterial.findById(item.rawMaterialId);
      if (!material) {
        return res.status(404).json({ error: `Raw material not found: ${item.rawMaterialId}` });
      }

      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || material.unitPrice;
      const totalPrice = qty * unitPrice;
      totalAmount += totalPrice;

      processedItems.push({
        rawMaterialId: item.rawMaterialId,
        materialCode: material.code,
        materialName: material.name,
        category: material.category,
        quantity: qty,
        unit: material.unit,
        unitPrice,
        totalPrice,
        receivedQuantity: 0,
        qualityCheck: {
          required: material.qualityCheck?.required || false,
          status: 'Pending'
        }
      });
    }

    const id = await generateId('RMP', RawMaterialPurchase);

    const purchase = await RawMaterialPurchase.create({
      id,
      supplier,
      supplierId,
      purchaseDate,
      expectedDelivery: expectedDelivery || '',
      status: status || 'Pending',
      items: processedItems,
      totalAmount,
      gstRate: 18,
      gstAmount: totalAmount * 0.18,
      grandTotal: totalAmount * 1.18,
      paymentTerms: paymentTerms || '',
      paymentStatus: 'Pending',
      paymentAmount: 0,
      notes: notes || '',
      createdBy: userId,
      updatedBy: userId
    });

    // Auto-add stock if status is Delivered
    if (status === 'Delivered') {
      for (const item of processedItems) {
        const material = await RawMaterial.findById(item.rawMaterialId);
        if (material) {
          material.quantity += item.quantity;
          material.unitPrice = item.unitPrice;
          material.totalPrice = material.quantity * material.unitPrice;
          material.lastPurchaseDate = new Date();
          material.lastPurchasePrice = item.unitPrice;
          const updatedMaterial = await material.save();
          await createStockTransaction({
            material: updatedMaterial,
            type: 'Purchase',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            reason: `Purchase ${purchase.id}`,
            referenceId: purchase._id,
            userId
          });
        }
      }
    }

    res.status(201).json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllRawMaterialPurchases = async (req, res) => {
  try {
    const { supplier, status, startDate, endDate, paymentStatus } = req.query;
    const filter = {};
    
    if (supplier) filter.supplier = supplier;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (startDate && endDate) filter.purchaseDate = { $gte: startDate, $lte: endDate };

    const purchases = await RawMaterialPurchase.find(filter)
      .populate('supplierId', 'name contact phone city gst')
      .populate('items.rawMaterialId', 'name code category unit')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRawMaterialPurchaseById = async (req, res) => {
  try {
    const purchase = await RawMaterialPurchase.findById(req.params.id)
      .populate('supplierId', 'name contact phone city gst email address')
      .populate('items.rawMaterialId', 'name code category unit location')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');
    
    if (!purchase) return res.status(404).json({ error: 'Raw material purchase not found' });
    
    res.status(200).json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRawMaterialPurchase = async (req, res) => {
  try {
    const purchase = await RawMaterialPurchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ error: 'Raw material purchase not found' });

    const payload = { ...req.body, updatedBy: req.user?._id };
    
    // Handle delivery - update stock quantities
    if (req.body.status === 'Delivered' && purchase.status !== 'Delivered') {
      for (const item of purchase.items) {
        const material = await RawMaterial.findById(item.rawMaterialId);
        if (material) {
          material.quantity += item.quantity;
          material.unitPrice = item.unitPrice;
          material.totalPrice = material.quantity * material.unitPrice;
          material.lastPurchaseDate = new Date();
          material.lastPurchasePrice = item.unitPrice;
          material.supplier = purchase.supplierId;
          material.supplierName = purchase.supplier;
          const updatedMaterial = await material.save();
          await createStockTransaction({
            material: updatedMaterial,
            type: 'Purchase',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            reason: `Purchase ${purchase.id}`,
            referenceId: purchase._id,
            userId: req.user?._id
          });
        }
      }
      
      payload.actualDelivery = new Date().toISOString().split('T')[0];
      payload.receivedDate = new Date();
    }

    const updated = await RawMaterialPurchase.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true }
    );
    
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRawMaterialPurchase = async (req, res) => {
  try {
    const purchase = await RawMaterialPurchase.findByIdAndDelete(req.params.id);
    if (!purchase) return res.status(404).json({ error: 'Raw material purchase not found' });
    
    res.status(200).json({ message: 'Raw material purchase deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// Quality Check Operations
// ──────────────────────────────────────────────────────────────
const updateQualityCheck = async (req, res) => {
  try {
    const { purchaseId, itemId } = req.params;
    const { status, checkedBy, notes } = req.body;

    const purchase = await RawMaterialPurchase.findById(purchaseId);
    if (!purchase) return res.status(404).json({ error: 'Purchase not found' });

    const item = purchase.items.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.qualityCheck = {
      ...item.qualityCheck,
      status: status || item.qualityCheck.status,
      checkedBy: checkedBy || item.qualityCheck.checkedBy,
      checkDate: new Date(),
      notes: notes || item.qualityCheck.notes
    };

    // Update material quality check as well
    await RawMaterial.findByIdAndUpdate(item.rawMaterialId, {
      'qualityCheck.status': status,
      'qualityCheck.lastCheckDate': new Date(),
      'qualityCheck.nextCheckDate': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    await purchase.save();
    res.status(200).json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// Supplier Materials
// ──────────────────────────────────────────────────────────────
const getSupplierRawMaterials = async (req, res) => {
  try {
    const { supplierId } = req.params;
    
    const materials = await RawMaterial.find({ supplier: supplierId });
    
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLowStockMaterials = async (req, res) => {
  try {
    const materials = await RawMaterial.find({ 
      $expr: { $lte: ['$quantity', '$minimumStock'] }
    })
      .populate('supplier', 'name contact phone')
      .sort({ quantity: 1 });
    
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRawMaterialReport = async (req, res) => {
  try {
    const { startDate, endDate, category, supplier } = req.query;
    const filter = {};
    
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (category) filter.category = category;
    if (supplier) filter.supplier = supplier;

    const materials = await RawMaterial.find(filter)
      .populate('supplier', 'name contact phone city')
      .sort({ createdAt: -1 });

    const transactions = await RawMaterialTransaction.find()
      .populate('rawMaterialId', 'name code category unit')
      .sort({ transactionDate: -1, createdAt: -1 });

    const purchases = await RawMaterialPurchase.find()
      .populate('supplierId', 'name contact phone city')
      .sort({ purchaseDate: -1 });

    const summary = materials.reduce((acc, material) => {
      const currentStockValue = (Number(material.quantity) || 0) * (Number(material.unitPrice) || 0);

      acc.totalMaterials += 1;
      acc.currentQuantity += Number(material.quantity) || 0;
      acc.currentStockValue += currentStockValue;
      
      if (material.status === 'Low Stock') acc.lowStock += 1;
      if (material.status === 'Out of Stock') acc.outOfStock += 1;
      if (material.status === 'In Stock') acc.inStock += 1;
      
      return acc;
    }, {
      totalMaterials: 0,
      currentQuantity: 0,
      currentStockValue: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0
    });

    const purchaseSummary = purchases.reduce((acc, purchase) => {
      acc.totalPurchases += 1;
      acc.totalPurchaseAmount += Number(purchase.totalAmount) || 0;
      acc.totalGstAmount += Number(purchase.gstAmount) || 0;
      acc.totalGrandTotal += Number(purchase.grandTotal) || 0;
      
      if (purchase.status === 'Pending') acc.pending += 1;
      if (purchase.status === 'Delivered') acc.delivered += 1;
      if (purchase.status === 'Confirmed') acc.confirmed += 1;
      if (purchase.status === 'In Transit') acc.inTransit += 1;
      
      return acc;
    }, {
      totalPurchases: 0,
      totalPurchaseAmount: 0,
      totalGstAmount: 0,
      totalGrandTotal: 0,
      pending: 0,
      delivered: 0,
      confirmed: 0,
      inTransit: 0
    });

    const categoryBreakdown = materials.reduce((acc, material) => {
      if (!acc[material.category]) {
        acc[material.category] = {
          count: 0,
          quantity: 0,
          value: 0
        };
      }
      acc[material.category].count += 1;
      acc[material.category].quantity += Number(material.quantity) || 0;
      acc[material.category].value += (Number(material.quantity) || 0) * (Number(material.unitPrice) || 0);
      return acc;
    }, {});

    const stockMovements = transactions.reduce((acc, transaction) => {
      if (!acc[transaction.type]) {
        acc[transaction.type] = {
          count: 0,
          quantity: 0,
          value: 0
        };
      }
      acc[transaction.type].count += 1;
      acc[transaction.type].quantity += Number(transaction.quantity) || 0;
      acc[transaction.type].value += Number(transaction.totalAmount) || 0;
      return acc;
    }, {});

    res.status(200).json({
      summary,
      purchaseSummary,
      categoryBreakdown,
      stockMovements,
      materials,
      transactions,
      purchases
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  // Raw Material CRUD
  createRawMaterial,
  getAllRawMaterials,
  getRawMaterialById,
  updateRawMaterial,
  deleteRawMaterial,
  deductStock,
  addStock,

  // Raw Material Purchase CRUD
  createRawMaterialPurchase,
  getAllRawMaterialPurchases,
  getRawMaterialPurchaseById,
  updateRawMaterialPurchase,
  deleteRawMaterialPurchase,

  // Quality Check
  updateQualityCheck,

  // Supplier Materials
  getSupplierRawMaterials,
  getLowStockMaterials,
  getRawMaterialReport
};
