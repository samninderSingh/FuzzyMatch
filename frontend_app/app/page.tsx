'use client'
import { useState } from "react";
import axios from "axios";
import { MatchedData } from "./type";

type ApprovedMatches = Record<string, boolean>;

export default function Home() {
  const OrderJson = JSON.stringify([
    {
      "customer": "Alex Abel",
      "orderId": "18G",
      "date": "2023-07-11",
      "item": "Tool A",
      "price": 1.23
    },
    {
      "customer": "Brian Bell",
      "orderId": "20S",
      "date": "2023-08-08",
      "item": "Toy B",
      "price": 3.21
    }
  ]
  )
  const transactionsJson = JSON.stringify([
    {
      "customer": "Alexis Abe",
      "orderId": "1B6",
      "date": "2023-07-12",
      "item": "Tool A",
      "price": 1.23,
      "txnType": "payment",
      "txnAmount": 1.23
    },
    {
      "customer": "Alex Able",
      "orderId": "I8G",
      "date": "2023-07-13",
      "item": "Tool A",
      "price": 1.23,
      "txnType": "refund",
      "txnAmount": -1.23
    }, {
      "customer": "Alex Able",
      "orderId": "I8G",
      "date": "2023-07-13",
      "item": "Tool A",
      "price": 1.23,
      "txnType": "refund",
      "txnAmount": -1.23
    },
    {
      "customer": "Brian Ball",
      "orderId": "ZOS",
      "date": "2023-08-11",
      "item": "Toy B",
      "price": 3.21,
      "txnType": "payment-1",
      "txnAmount": 1.21
    },
    {
      "customer": "Bryan",
      "orderId": "705",
      "date": "2023-08-13",
      "item": "Toy B",
      "price": 3.21,
      "txnType": "payment-2",
      "txnAmount": 2.00
    }
  ]
  )
  const [orders, setOrders] = useState("");
  const [transactions, setTransactions] = useState("");
  const [matchedData, setMatchedData] = useState<MatchedData | null>(null);
  const [approvedMatches, setApprovedMatches] = useState<ApprovedMatches>({});

  const handleApproval = (orderId: string, approved: boolean) => {
    const updatedApprovals = { ...approvedMatches, [orderId]: approved };
    setApprovedMatches(updatedApprovals);
    // TODO: Implement API call to update and store the status in the backend.
  };

  const handleMatch = async () => {
    try {
      const res = await axios.post("http://localhost:5000/match", {
        orders: JSON.parse(orders),
        transactions: JSON.parse(transactions),
      });
      console.log("Matched Data:", res.data);
      setMatchedData(res.data);
    } catch (error) {
      console.error("Error matching data:", error);
    }
  };

  return (
    <div>
      <div className="p-5 flex flex-row justify-evenly items-center">
        <div className="bg-[white] flex flex-col p-[21px] shadow-[0px_0px_9px_0px_rgba(0,0,0,0.25)] rounded-lg">
          <h1 className="mb-5">Order & Transaction Matcher</h1>
          <textarea
            className="w-full p-3 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={5}
            cols={50}
            placeholder="Paste orders JSON"
            value={orders}
            onChange={(e) => setOrders(e.target.value)}
          />
          <textarea
            className="w-full p-3 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mt-5"
            rows={5}
            cols={50}
            placeholder="Paste transactions JSON"
            value={transactions}
            onChange={(e) => setTransactions(e.target.value)}
          />
          <button
            onClick={handleMatch}
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-600 transition-all duration-200 mt-5">
            Match Transactions
          </button>

        </div>

        <div className="p-5">
          <div>
            <h2 className="mb-2">Matched Results</h2>
            {matchedData && matchedData.map((match: any, index: number) => (
              <div key={index} className="mb-5 border border-black p-5 shadow-md rounded-md">
                <h3>Order: {match.order.customer} (ID: {match.order.orderId})</h3>
                <p><strong>Item:</strong> {match.order.item}, <strong>Price:</strong> ${match.order.price}</p>

                <h4>Matching Transactions:</h4>
                <ul>
                  {match.transactions.length > 0 ? (
                    match.transactions
                      .map((txn: any, idx: string) => (
                        <li key={idx}>
                          {txn.customer} - {txn.txnType} - ${txn.txnAmount}
                          <strong> (Confidence: {txn.confidence ? txn.confidence : "N/A"}%)</strong>
                        </li>
                      ))
                  ) : (
                    <p>No transactions found.</p>
                  )}
                  {approvedMatches[match?.order?.orderId] !== undefined ? (
                    <p>
                      {approvedMatches[match?.order?.orderId] ? "✅ Approved" : "❌ Rejected"}
                    </p>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApproval(match.order.orderId, true)}
                        className="bg-green-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-green-700 transition-all duration-200 flex items-center gap-1">
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(match.order.orderId, false)}
                        className="bg-red-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-red-700 transition-all duration-200 flex items-center gap-1">
                        Reject
                      </button>
                    </div>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      <hr />
      {/* Note: The following code is for testing purposes only. */}
      <div className="p-5">
        <h1>Order JSON</h1>
        <code>
          {OrderJson}
        </code>
        <br />
        <br />
        <h1>Transaction JSON</h1>
        <code>
          {transactionsJson}
        </code>
      </div>
    </div>
  );
}
