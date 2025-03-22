export interface Transaction {
    customer: string;
    orderId: string;
    date: string;
    item: string;
    price: number;
    txnType: "payment" | "refund";
    txnAmount: number;
    confidence: number;
};

export interface Order {
    customer: string;
    orderId: string;
    date: string;
    item: string;
    price: number;
};

export interface MatchedData {
    order: Order;
    transactions: Transaction[];
} [];