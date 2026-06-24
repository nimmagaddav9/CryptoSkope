const express = require('express');
const Wallet = require('../models/Wallet');

const router = express.Router();

router.route('/wallet/connect').post(async (req, res) => { // POST /api/v1/wallet/connect upserts the wallet (creates on first connect, updates lastSeenAt on subsequent connects) Registered the route in server/app.js
    try {
        const { address } = req.body;

        if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid wallet address',
            });
        }

        const wallet = await Wallet.findOneAndUpdate(
            { address: address.toLowerCase() },
            { address: address.toLowerCase(), lastSeenAt: new Date() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            success: true,
            wallet,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});

module.exports = router;
