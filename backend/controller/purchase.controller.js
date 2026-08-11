const mongoose = require('mongoose');
const PurchaseOrder = require('../model/PurchaseOrder.model');
const PurchaseReturn = require('../model/PurchaseReturn.model');
const Stock = require('../model/Stock.model');
const SpareParts = require('../model/SpareParts.model');
const RawMaterial = require('../model/RawMaterial.model');
const Supplier = require('../model/Supplier.model');
const ErpRecord = require('../model/ErpRecord.model');

const generateId = async (prefix, model) => {
  const count = await model.countDocuments();
  return `${prefix}${String(count + 1).padStart(3, '0')}`;
};

// ──────────────────────────────────────────────────────────────
// Purchase Orders
// ──────────────────────────────────────────────────────────────
const createPurchaseOrder = async (req, res) => {
  try {
    const { supplier, supplierId, date, delivery, items, notes } = req.body;
    const userId = req.user?._id;

    if (!supplier || !date || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Supplier, date, and at least one item are required' });
    }

    let totalAmount = 0;
    const processedItems = items.map(item => {
      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const totalPrice = qty * unitPrice;
      totalAmount += totalPrice;
      return {
        itemCode: item.itemCode || '',
        itemName: item.itemName || '',
        category: item.category || '',
        quantity: qty,
        unitPrice,
        totalPrice,
        stockId: item.stockId || null,
        sparePartId: item.sparePartId || null
      };
    });

    const gstRate = 18;
    const gstAmount = totalAmount * gstRate / 100;
    const grandTotal = totalAmount + gstAmount;

    const id = await generateId('PO', PurchaseOrder);

    const po = await PurchaseOrder.create({
      id,
      supplier,
      supplierId: supplierId || null,
      date,
      delivery: delivery || '',
      status: 'Pending',
      items: processedItems,
      totalAmount,
      grandTotal,
      notes: notes || '',
      createdBy: userId,
      updatedBy: userId
    });

    // Also create ERP record for unified view
    await ErpRecord.create({
      id,
      module: 'purchase',
      recordType: 'order',
      supplier,
      date,
      items: processedItems.length,
      amount: totalAmount,
      totalAmount,
      grandTotal,
      gstRate,
      gstAmount,
      delivery: delivery || '',
      status: 'Pending',
      notes: notes || ''
    });

    res.status(201).json(po);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllPurchaseOrders = async (req, res) => {
  try {
    const { supplier, status, startDate, endDate } = req.query;
    const filter = {};
    if (supplier) filter.supplier = supplier;
    if (status) filter.status = status;
    if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };

    const orders = await PurchaseOrder.find(filter).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPurchaseOrderById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    res.status(200).json(po);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePurchaseOrder = async (req, res) => {
  try {
    const { status } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });

    const payload = { ...req.body, updatedBy: req.user?._id };
    if (status) payload.status = status;

    const updated = await PurchaseOrder.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deletePurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    res.status(200).json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// Purchase Returns
// ──────────────────────────────────────────────────────────────
const createPurchaseReturn = async (req, res) => {
  try {
    const { po, poId, supplier, supplierId, date, reason, items } = req.body;
    const userId = req.user?._id;

    if (!po || !supplier || !date || !reason || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'PO, supplier, date, reason, and items are required' });
    }

    let totalAmount = 0;
    const processedItems = items.map(item => {
      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const totalPrice = qty * unitPrice;
      totalAmount += totalPrice;
      return {
        itemCode: item.itemCode || '',
        itemName: item.itemName || '',
        quantity: qty,
        unitPrice,
        totalPrice,
        stockId: item.stockId || null,
        sparePartId: item.sparePartId || null
      };
    });

    const id = await generateId('RET', PurchaseReturn);

    const purchaseReturn = await PurchaseReturn.create({
      id,
      po,
      poId: poId || null,
      supplier,
      supplierId: supplierId || null,
      date,
      reason,
      status: 'Pending',
      items: processedItems,
      totalAmount,
      createdBy: userId,
      updatedBy: userId
    });

    // Also create ERP record
    await ErpRecord.create({
      id,
      module: 'purchase',
      recordType: 'return',
      po,
      supplier,
      date,
      reason,
      qty: processedItems.reduce((sum, i) => sum + i.quantity, 0),
      amount: totalAmount,
      totalAmount,
      status: 'Pending'
    });

    res.status(201).json(purchaseReturn);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllPurchaseReturns = async (req, res) => {
  try {
    const { supplier, status, startDate, endDate } = req.query;
    const filter = {};
    if (supplier) filter.supplier = supplier;
    if (status) filter.status = status;
    if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };

    const returns = await PurchaseReturn.find(filter).sort({ createdAt: -1 });
    res.status(200).json(returns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePurchaseReturn = async (req, res) => {
  try {
    const { status } = req.body;
    const purchaseReturn = await PurchaseReturn.findById(req.params.id);
    if (!purchaseReturn) return res.status(404).json({ error: 'Purchase return not found' });

    const payload = { ...req.body, updatedBy: req.user?._id };
    if (status) payload.status = status;

    const updated = await PurchaseReturn.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deletePurchaseReturn = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findByIdAndDelete(req.params.id);
    if (!purchaseReturn) return res.status(404).json({ error: 'Purchase return not found' });
    res.status(200).json({ message: 'Purchase return deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// Supplier Products
// ──────────────────────────────────────────────────────────────
const getSupplierProducts = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    // Get product details from supplier's products array
    const productPromises = supplier.products.map(async (prod) => {
      let details = null;
      if (prod.productType === 'stock') {
        details = await Stock.findById(prod.productId);
      } else if (prod.productType === 'sparePart') {
        details = await SpareParts.findById(prod.productId);
      } else if (prod.productType === 'rawMaterial') {
        details = await RawMaterial.findById(prod.productId);
      }
      return {
        ...prod.toObject(),
        _id: prod.productId,
        ...(details ? details.toObject() : {}),
        productType: prod.productType,
        unitPrice: prod.unitPrice || (details?.unitPrice || details?.sellingPrice || 0),
      };
    });

    const products = await Promise.all(productPromises);

    res.status(200).json({
      supplier,
      products,
      stockItems: products.filter(p => p.productType === 'stock'),
      spareParts: products.filter(p => p.productType === 'sparePart'),
      rawMaterials: products.filter(p => p.productType === 'rawMaterial'),
      totalProducts: products.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addSupplierProduct = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { productType, productId, itemName, itemCode, category, unitPrice } = req.body;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    // Check if product already exists
    const exists = supplier.products.find(p => p.productId?.toString() === productId && p.productType === productType);
    if (exists) {
      return res.status(400).json({ error: 'Product already added to this supplier' });
    }

    let product = null;
    if (productType === 'stock') {
      product = await Stock.findById(productId);
      if (product) {
        product.supplier = supplier.name;
        await product.save();
      }
    } else if (productType === 'sparePart') {
      product = await SpareParts.findById(productId);
      if (product) {
        product.supplier = supplier.name;
        await product.save();
      }
    } else if (productType === 'rawMaterial') {
      product = await RawMaterial.findById(productId);
      if (product) {
        product.supplierName = supplier.name;
        product.supplier = supplier._id;
        await product.save();
      }
    }

    if (!product) return res.status(404).json({ error: 'Product not found' });

    supplier.products.push({
      productType,
      productId,
      itemName: itemName || product.itemName || product.name,
      itemCode: itemCode || product.itemCode,
      category: category || product.category,
      unitPrice: unitPrice || product.unitPrice || product.sellingPrice || 0,
    });

    await supplier.save();

    res.status(200).json({ message: 'Product added to supplier', supplier });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeSupplierProduct = async (req, res) => {
  try {
    const { supplierId, productId } = req.params;
    const { productType } = req.body;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    // Remove from supplier products array
    supplier.products = supplier.products.filter(p => {
      const matchesId = p.productId?.toString() === productId;
      const matchesType = !productType || p.productType === productType;
      return !(matchesId && matchesType);
    });

    // Also clear supplier field from the actual product
    if (productType === 'stock') {
      const product = await Stock.findById(productId);
      if (product && product.supplier === supplier.name) {
        product.supplier = '';
        await product.save();
      }
    } else if (productType === 'sparePart') {
      const product = await SpareParts.findById(productId);
      if (product && product.supplier === supplier.name) {
        product.supplier = '';
        await product.save();
      }
    } else if (productType === 'rawMaterial') {
      const product = await RawMaterial.findById(productId);
      if (product && product.supplierName === supplier.name) {
        product.supplierName = '';
        product.supplier = null;
        await product.save();
      }
    } else {
      // Try all if type not specified
      const stockProduct = await Stock.findById(productId);
      if (stockProduct && stockProduct.supplier === supplier.name) {
        stockProduct.supplier = '';
        await stockProduct.save();
      }
      const spareProduct = await SpareParts.findById(productId);
      if (spareProduct && spareProduct.supplier === supplier.name) {
        spareProduct.supplier = '';
        await spareProduct.save();
      }
      const rawProduct = await RawMaterial.findById(productId);
      if (rawProduct && rawProduct.supplierName === supplier.name) {
        rawProduct.supplierName = '';
        rawProduct.supplier = null;
        await rawProduct.save();
      }
    }

    await supplier.save();

    res.status(200).json({ message: 'Product removed from supplier', supplier });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// GRN Controller - Update Stock when GRN is created/verified
// ──────────────────────────────────────────────────────────────
const createGRN = async (req, res) => {
  try {
    const { po, poId, supplier, supplierId, date, receivedBy, items, status } = req.body;
    const userId = req.user?._id;

    if (!supplier || !date || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Supplier, date, and items are required' });
    }

    let totalAmount = 0;
    const processedItems = items.map(item => {
      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const totalPrice = qty * unitPrice;
      totalAmount += totalPrice;
      return {
        itemCode: item.itemCode || '',
        itemName: item.itemName || '',
        category: item.category || '',
        quantity: qty,
        unitPrice,
        totalPrice,
        stockId: item.stockId || null,
        sparePartId: item.sparePartId || null
      };
    });

    const id = await generateId('GRN', ErpRecord);

    const grn = await ErpRecord.create({
      id,
      module: 'purchase',
      recordType: 'grn',
      po: po || '',
      poId: poId || null,
      supplier,
      supplierId: supplierId || null,
      date,
      receivedBy: receivedBy || '',
      items: processedItems,
      amount: totalAmount,
      totalAmount,
      status: status || 'Pending',
    });

    // If GRN is Verified, update Stock / SpareParts quantities
    if (status === 'Verified') {
      for (const item of processedItems) {
        if (item.stockId) {
          await Stock.findByIdAndUpdate(item.stockId, {
            $inc: { quantity: item.quantity },
          });
        } else if (item.sparePartId) {
          await SpareParts.findByIdAndUpdate(item.sparePartId, {
            $inc: { quantity: item.quantity },
          });
        }
      }
    }

    res.status(201).json(grn);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateGRN = async (req, res) => {
  try {
    const grn = await ErpRecord.findById(req.params.id);
    if (!grn) return res.status(404).json({ error: 'GRN not found' });

    const oldStatus = grn.status;
    const newStatus = req.body.status;
    const newItems = req.body.items;

    const updated = await ErpRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // If status changed to Verified, update stock
    if (oldStatus !== 'Verified' && newStatus === 'Verified') {
      const itemsToProcess = newItems || grn.items;
      for (const item of itemsToProcess) {
        if (item.stockId) {
          await Stock.findByIdAndUpdate(item.stockId, {
            $inc: { quantity: Number(item.quantity) || 0 },
          });
        } else if (item.sparePartId) {
          await SpareParts.findByIdAndUpdate(item.sparePartId, {
            $inc: { quantity: Number(item.quantity) || 0 },
          });
        }
      }
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
  createPurchaseReturn,
  getAllPurchaseReturns,
  updatePurchaseReturn,
  deletePurchaseReturn,
  getSupplierProducts,
  addSupplierProduct,
  removeSupplierProduct,
  createGRN,
  updateGRN,
};
