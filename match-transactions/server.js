const express = require("express");
const cors = require("cors");
const Fuse = require("fuse.js");
const fs = require("fs");
const app = express();
const PORT = 5000;
const approvalsFile = "approvals.json";

app.use(cors());
app.use(express.json());

const matchOrdersWithTransactions = (orders, transactions) => {
    const matchedResults = [];
    const approvals = loadApprovals();

    const fuseOptions = {
        keys: ["customer", "orderId"],
        threshold: 0.5,
    };
    const fuse = new Fuse(transactions, fuseOptions);

    orders.forEach((order) => {
        console.log(`Searching for matches for Order: ${order.customer} (ID: ${order.orderId})`);

        // already approved/rejected, use the stored decision
        if (approvals[order.orderId] !== undefined) {
            matchedResults.push({
                order,
                transactions: approvals[order.orderId].isApproved
                    ? [{ customer: "✅ Approved Match", txnType: "N/A", txnAmount: "N/A", confidence: 100 }]
                    : [],
            });
            return;
        }

        // Convert Fuse.js score into a confidence percentage
        const results = fuse.search(order.customer).map((res) => ({
            ...res.item,
            confidence: (1 - res.score) * 100,
        }));

        const filteredResults = results.map((txn) => {
            if (!txn.orderId || !txn.customer || !txn.txnAmount) {
                return null;
            }

            let confidence = txn.confidence || 0;

            // Normalize and compare order IDs
            const normalizeId = (id) => id?.replace(/\W/g, "").toLowerCase();
            if (normalizeId(txn.orderId) === normalizeId(order.orderId)) {
                // Add confidence for an exact order ID match
                confidence += 20;
            } else if (normalizeId(txn.orderId).includes(normalizeId(order.orderId))) {
                // Partial order ID match
                confidence += 10;
            }

            // Price Match
            if (txn.price === order.price) {
                confidence += 15;
            }

            // Date Proximity
            const orderDate = new Date(order.date);
            const txnDate = new Date(txn.date);
            if (!isNaN(orderDate) && !isNaN(txnDate)) {
                const dateDiff = Math.abs((txnDate - orderDate) / (1000 * 60 * 60 * 24));
                if (dateDiff <= 1) {
                    // Transactions within 1 day
                    confidence += 15;
                } else if (dateDiff <= 3) {
                    confidence += 10;
                } else if (dateDiff <= 7) {
                    confidence += 5;
                }
            }

            // Use past approvals to adjust confidence score
            const transactionKey = `${txn.customer}-${txn.orderId}-${txn.date}-${txn.txnAmount}`;
            if (approvals[order.orderId]?.transactionKey === transactionKey) {
                confidence += approvals[order.orderId].isApproved ? 20 : -20;
            }

            return { ...txn, confidence: Math.min(confidence, 100) };
        }).filter(Boolean);

        console.log(`Matched Transactions for ${order.customer}:`, filteredResults);

        matchedResults.push({
            order,
            transactions: filteredResults.length > 0 ? filteredResults : [],
        });
    });

    return matchedResults;
};


const loadApprovals = () => {
    if (fs.existsSync(approvalsFile)) {
        return JSON.parse(fs.readFileSync(approvalsFile));
    }
    return {};
};


app.post("/match", (req, res) => {
    const { orders, transactions } = req.body;
    if (!orders || !transactions) {
        return res.status(400).json({ error: "Missing orders or transactions data" });
    }

    const matched = matchOrdersWithTransactions(orders, transactions);
    res.json(matched);
});

// Save approvals
const saveApproval = (orderId, transactionKey, isApproved) => {
    let approvals = {};

    if (fs.existsSync(approvalsFile)) {
        approvals = JSON.parse(fs.readFileSync(approvalsFile));
    }
    
    approvals[orderId] = { transactionKey, isApproved };
    fs.writeFileSync(approvalsFile, JSON.stringify(approvals, null, 2));
};


app.post("/approve", (req, res) => {
    const { orderId, transactionKey, isApproved } = req.body;

    if (!orderId || !transactionKey || isApproved === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    saveApproval(orderId, transactionKey, isApproved);
    res.json({ success: true, message: "Approval saved." });
});

app.listen(PORT, () => console.log("Server running on http://localhost:5000"));
