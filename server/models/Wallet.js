const mongoose = require('mongoose'); 

const walletSchema = new mongoose.Schema({
    address: { // Mongoose model with address, connectedAt, lastSeenAt fields, unique constraint, and regex validation
        type: String,
        required: [true, "Wallet address is required"],
        unique: true,
        lowercase: true,
        match: [/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"],
    },
    connectedAt: {
        type: Date,
        default: Date.now,
    },
    lastSeenAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Wallet', walletSchema);
