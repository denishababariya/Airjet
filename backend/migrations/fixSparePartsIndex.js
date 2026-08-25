const mongoose = require('mongoose');
const SpareParts = require('../model/SpareParts.model');

const fixSparePartsIndex = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/airjet', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to MongoDB');
        
        // Drop the stale id_1 index if it exists
        try {
            await SpareParts.collection.dropIndex('id_1');
            console.log('Dropped stale id_1 index');
        } catch (err) {
            if (err.code !== 26) { // Index not found error
                console.log('No stale id_1 index to drop');
            } else {
                console.log('Error dropping index:', err.message);
            }
        }
        
        // Update existing documents to have unique id field
        const partsWithoutId = await SpareParts.find({ id: { $exists: false } });
        console.log(`Found ${partsWithoutId.length} parts without id field`);
        
        for (const part of partsWithoutId) {
            part.id = new mongoose.Types.ObjectId().toString();
            await part.save();
            console.log(`Updated part ${part.partNumber} with id: ${part.id}`);
        }
        
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

fixSparePartsIndex();
