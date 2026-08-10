require('dotenv').config();

// Fix DNS resolution for MongoDB Atlas SRV records on some Windows networks
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in .env');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 30000,
    // Windows/antivirus SSL inspection can block Atlas cert verification
    tlsAllowInvalidCertificates: process.env.NODE_ENV === 'development',
  });

  console.log('MongoDB connected successfully');

  const { seedDatabase } = require('./seed');
  await seedDatabase();
};

// Routes
app.use('/api', require('./routes'));

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Airjet Backend API' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);

    if (err.name === 'MongooseServerSelectionError') {
      const servers = err.reason?.servers;
      const sslError = servers && [...servers.values()].some(
        (s) => s.error?.message?.includes('unable to verify the first certificate')
      );

      if (sslError) {
        console.error('\nSSL certificate verification failed (common on Windows with antivirus/proxy).');
        console.error('Development mode should bypass this via tlsAllowInvalidCertificates in index.js.');
      } else {
        console.error('\nCheck MongoDB Atlas: Network Access IP whitelist and Database Access credentials.');
      }
    }

    process.exit(1);
  });

module.exports = app;
