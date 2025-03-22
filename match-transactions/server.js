const express = require("express");
const cors = require("cors");
const Fuse = require("fuse.js");
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const matchOrdersWithTransactions = (orders, transactions) => {
    const matchedResults = [];
    const approvals = {};
    const fuseOptions = {
        keys: ["customer", "orderId"],
        threshold: 0.5,
    };
    const fuse = new Fuse(transactions, fuseOptions);

    orders.forEach((order) => {
        console.log(`Searching for matches for Order: ${order.customer} (ID: ${order.orderId})`);

        if (approvals[order.orderId] !== undefined) {
            matchedResults.push({
                order,
                transactions: approvals[order.orderId] ? ["✅ Approved Match"] : [],
            });
            return;
        }

        // Convert Fuse.js score into a confidence percentage
        const results = fuse.search(order.customer).map((res) => ({
            ...res.item,
            confidence: (1 - res.score) * 100, 
        }));

        const filteredResults = results.map((txn) => {
            let confidence = txn.confidence || 0;

            // Normalize and compare order IDs
            const normalizeId = (id) => id.replace(/\W/g, "").toLowerCase();
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
            const dateDiff = Math.abs((txnDate - orderDate) / (1000 * 60 * 60 * 24));
            if (dateDiff <= 1) {
                // Transactions within 1 day
                confidence += 15;
            } else if (dateDiff <= 3) {
                confidence += 10;
            } else if (dateDiff <= 7) {
                confidence += 5;
            }
            // Ensure confidence is max 100%
            confidence = Math.min(confidence, 100);
            return { ...txn, confidence };
        });

        console.log(`Matched Transactions for ${order.customer}:`, filteredResults);

        matchedResults.push({
            order,
            transactions: filteredResults,
        });
    });

    return matchedResults;
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
const saveApprovals = (approvals) => {
};

app.post("/approve", (req, res) => {
    // saveApprovals(approvals);
    res.json({ success: true, message: "Approval saved." });
});

app.listen(PORT, () => console.log("Server running on http://localhost:5000"));
