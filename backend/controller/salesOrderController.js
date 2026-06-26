const SalesOrder = require('../model/SalesOrder');

exports.getAllSalesOrders = async (req, res) => {
  try {
    const orders = await SalesOrder.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSalesOrderById = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Sales order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSalesOrder = async (req, res) => {
  try {
    const order = new SalesOrder(req.body);
    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateSalesOrder = async (req, res) => {
  try {
    const order = await SalesOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ error: 'Sales order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteSalesOrder = async (req, res) => {
  try {
    const order = await SalesOrder.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Sales order not found' });
    }
    res.json({ message: 'Sales order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
