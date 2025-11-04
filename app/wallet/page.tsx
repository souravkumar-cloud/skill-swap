"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Filter,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addAmount, setAddAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await fetch("/api/wallet", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      if (data.success) {
        setWallet(data.wallet);
      }
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/wallet/transactions", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  const handleAddMoney = async () => {
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const response = await fetch("/api/wallet/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ amount, paymentMethod: "UPI" }),
      });
      const data = await response.json();
      if (data.success) {
        setWallet(data.wallet);
        setAddAmount("");
        setShowAddMoney(false);
        fetchTransactions();
        alert("Money added successfully!");
      }
    } catch (error) {
      console.error("Failed to add money:", error);
      alert("Failed to add money");
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (wallet && amount > wallet.balance) {
      alert("Insufficient balance");
      return;
    }

    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          amount,
          withdrawMethod: "Bank Transfer",
          accountDetails: { name: "User Account" },
        }),
      });
      const data = await response.json();
      if (data.success) {
        setWallet(data.wallet);
        setWithdrawAmount("");
        setShowWithdraw(false);
        fetchTransactions();
        alert("Withdrawal request submitted!");
      }
    } catch (error) {
      console.error("Failed to withdraw:", error);
      alert("Failed to process withdrawal");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type === "credit" || type === "escrow_release") {
      return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
    }
    return <ArrowUpRight className="w-5 h-5 text-red-500" />;
  };

  const filteredTransactions =
    filterType === "all"
      ? transactions
      : transactions.filter((t) => t.category === filterType);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-blue-600" />
            My Wallet
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your payments and transactions
          </p>
        </div>

        {/* Wallet Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Main Balance */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-blue-100 text-sm">Available Balance</span>
              <Wallet className="w-6 h-6 text-blue-200" />
            </div>
            <div className="text-4xl font-bold mb-6">
              ₹{wallet?.balance?.toFixed(2) || "0.00"}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddMoney(true)}
                className="flex-1 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Money
              </button>
              <button
                onClick={() => setShowWithdraw(true)}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-400 transition flex items-center justify-center gap-2"
              >
                <Minus className="w-4 h-4" />
                Withdraw
              </button>
            </div>
          </div>

          {/* Escrow Balance */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 text-sm">In Escrow</span>
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              ₹{wallet?.escrowBalance?.toFixed(2) || "0.00"}
            </div>
            <p className="text-sm text-gray-500">Locked for ongoing swaps</p>
          </div>

          {/* Earnings */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 text-sm">Total Earned</span>
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              ₹{wallet?.totalEarned?.toFixed(2) || "0.00"}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-gray-500">
                Spent: ₹{wallet?.totalSpent?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-4 font-medium border-b-2 transition ${
                  activeTab === "overview"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("transactions")}
                className={`px-6 py-4 font-medium border-b-2 transition ${
                  activeTab === "transactions"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Transactions
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm text-green-700 mb-1">
                      This Month Earned
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      ₹0.00
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-sm text-red-700 mb-1">
                      This Month Spent
                    </div>
                    <div className="text-2xl font-bold text-red-900">
                      ₹0.00
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    How Wallet Works
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• Add money to your wallet to pay for paid skills</li>
                    <li>• Money is held in escrow during active swaps</li>
                    <li>• Payment is released when both parties confirm completion</li>
                    <li>• Withdraw your earnings anytime to your bank account</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "transactions" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Transaction History</h3>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Transactions</option>
                      <option value="add_money">Add Money</option>
                      <option value="withdraw">Withdrawals</option>
                      <option value="payment_sent">Payments Sent</option>
                      <option value="payment_received">Payments Received</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No transactions yet</p>
                    </div>
                  ) : (
                    filteredTransactions.map((txn) => (
                      <div
                        key={txn._id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                          {getTransactionIcon(txn.type)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {txn.description}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(txn.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-semibold ${
                              txn.type === "credit" ||
                              txn.type === "escrow_release"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {txn.type === "credit" ||
                            txn.type === "escrow_release"
                              ? "+"
                              : "-"}
                            ₹{txn.amount.toFixed(2)}
                          </div>
                          <div className="flex items-center gap-1 justify-end mt-1">
                            {getStatusIcon(txn.status)}
                            <span className="text-xs text-gray-500 capitalize">
                              {txn.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Add Money to Wallet</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Amount (₹)
              </label>
              <input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">Quick amounts:</p>
              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAddAmount(amt.toString())}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddMoney(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMoney}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add Money
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Withdraw Money</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Amount (₹)
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                max={wallet?.balance || 0}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                Available: ₹{wallet?.balance?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                Withdrawal will be processed within 2-3 business days to your
                registered bank account.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdraw(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
