const ServiceTicket = require('../model/ServiceTicket');

exports.getAllServiceTickets = async (req, res) => {
  try {
    const tickets = await ServiceTicket.find();
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getServiceTicketById = async (req, res) => {
  try {
    const ticket = await ServiceTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Service ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createServiceTicket = async (req, res) => {
  try {
    const ticket = new ServiceTicket(req.body);
    const savedTicket = await ticket.save();
    res.status(201).json(savedTicket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateServiceTicket = async (req, res) => {
  try {
    const ticket = await ServiceTicket.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!ticket) {
      return res.status(404).json({ error: 'Service ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteServiceTicket = async (req, res) => {
  try {
    const ticket = await ServiceTicket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Service ticket not found' });
    }
    res.json({ message: 'Service ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
