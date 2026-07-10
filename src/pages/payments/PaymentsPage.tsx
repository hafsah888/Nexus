import React, { useState, useEffect } from 'react';
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, Send, X,
  TrendingUp, Briefcase, CheckCircle, Search, ChevronDown,
  CreditCard, Building2, Smartphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUsersByRole } from '../../data/users';

// ── Types ─────────────────────────────────────────────────
type TxType = 'deposit' | 'withdraw' | 'transfer' | 'funding';
type PaymentMethod = 'card' | 'bank' | 'wallet';

interface Transaction {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  amount: number;
  type: TxType;
  status: 'completed';
  date: string;
  note?: string;
  method?: PaymentMethod;
}

// ── Constants ─────────────────────────────────────────────
const WALLET_KEY = (id: string) => `nexus_wallet_${id}`;
const TX_KEY = 'nexus_transactions';
const STARTING_BALANCE = 10_000;

// ── Helpers ───────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const shortId = (id: string) => id.slice(-8).toUpperCase();

const TYPE_META: Record<TxType, { label: string; color: string }> = {
  deposit:  { label: 'Deposit',      color: 'text-green-700 bg-green-50 border border-green-200' },
  withdraw: { label: 'Withdraw',     color: 'text-red-700 bg-red-50 border border-red-200' },
  transfer: { label: 'Transfer',     color: 'text-blue-700 bg-blue-50 border border-blue-200' },
  funding:  { label: 'Deal Funding', color: 'text-purple-700 bg-purple-50 border border-purple-200' },
};

const METHOD_META: Record<PaymentMethod, { label: string; icon: React.ReactNode }> = {
  card:   { label: 'Credit / Debit Card', icon: <CreditCard size={16} /> },
  bank:   { label: 'Bank Transfer',       icon: <Building2  size={16} /> },
  wallet: { label: 'Nexus Wallet',        icon: <Smartphone size={16} /> },
};

// ── Main Component ────────────────────────────────────────
export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance]         = useState(STARTING_BALANCE);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeModal, setActiveModal] = useState<TxType | null>(null);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]   = useState<TxType | 'all'>('all');

  // Load
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(WALLET_KEY(user.id));
    setBalance(stored !== null ? parseFloat(stored) : STARTING_BALANCE);
    const storedTx = localStorage.getItem(TX_KEY);
    if (storedTx) setTransactions(JSON.parse(storedTx));
    setTimeout(() => setLoading(false), 600);
  }, [user?.id]);

  // Persist balance
  useEffect(() => {
    if (!user || loading) return;
    localStorage.setItem(WALLET_KEY(user.id), balance.toString());
  }, [balance, user?.id]);

  // Persist transactions
  useEffect(() => {
    if (loading) return;
    localStorage.setItem(TX_KEY, JSON.stringify(transactions));
  }, [transactions]);

  if (!user) return null;

  const addTx = (tx: Omit<Transaction, 'id' | 'status' | 'date'>) => {
    const newTx: Transaction = {
      ...tx,
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      status: 'completed',
      date: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Actions
  const handleDeposit = (amount: number, method: PaymentMethod) => {
    setBalance((p) => p + amount);
    addTx({ senderId: 'external', senderName: 'External Account', receiverId: user.id, receiverName: user.name, amount, type: 'deposit', method });
    setActiveModal(null);
  };

  const handleWithdraw = (amount: number, method: PaymentMethod) => {
    if (amount > balance) return alert('Insufficient balance');
    setBalance((p) => p - amount);
    addTx({ senderId: user.id, senderName: user.name, receiverId: 'external', receiverName: 'External Account', amount, type: 'withdraw', method });
    setActiveModal(null);
  };

  const handleTransferOrFund = (amount: number, recipientId: string, recipientName: string, type: 'transfer' | 'funding', method: PaymentMethod) => {
    if (amount > balance) return alert('Insufficient balance');
    setBalance((p) => p - amount);
    const rKey = WALLET_KEY(recipientId);
    const rBal = localStorage.getItem(rKey);
    localStorage.setItem(rKey, ((rBal !== null ? parseFloat(rBal) : STARTING_BALANCE) + amount).toString());
    addTx({ senderId: user.id, senderName: user.name, receiverId: recipientId, receiverName: recipientName, amount, type, method });
    setActiveModal(null);
  };

  // Filtered transactions
  const myTx = transactions
    .filter((t) => t.senderId === user.id || t.receiverId === user.id)
    .filter((t) => filterType === 'all' || t.type === filterType)
    .filter((t) => {
      const q = search.toLowerCase();
      return !q || t.senderName.toLowerCase().includes(q) || t.receiverName.toLowerCase().includes(q) || shortId(t.id).toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Stats
  const totalIn  = transactions.filter((t) => t.receiverId === user.id).reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => t.senderId  === user.id).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Wallet className="text-primary-600" size={24} />
        <h1 className="text-xl font-semibold text-gray-900">Payments</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm gap-2">
          <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          Loading wallet…
        </div>
      ) : (
        <>
          {/* Wallet card */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-primary-200 text-xs uppercase tracking-widest mb-1">Wallet Balance</p>
                <h2 className="text-4xl font-bold tracking-tight">${fmt(balance)}</h2>
                <p className="text-primary-200 text-xs mt-1">{user.name} · Nexus Wallet</p>
              </div>

              {/* Mini stats */}
              <div className="flex gap-4 text-sm">
                <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                  <p className="text-primary-200 text-xs">Total In</p>
                  <p className="font-semibold text-green-300">+${fmt(totalIn)}</p>
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                  <p className="text-primary-200 text-xs">Total Out</p>
                  <p className="font-semibold text-red-300">-${fmt(totalOut)}</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap mt-5">
              {[
                { type: 'deposit'  as TxType, icon: <ArrowDownCircle size={15} />, label: 'Deposit'  },
                { type: 'withdraw' as TxType, icon: <ArrowUpCircle   size={15} />, label: 'Withdraw' },
                { type: 'transfer' as TxType, icon: <Send            size={15} />, label: 'Transfer' },
              ].map((btn) => (
                <button
                  key={btn.type}
                  onClick={() => setActiveModal(btn.type)}
                  className="bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  {btn.icon} {btn.label}
                </button>
              ))}
              {user.role === 'investor' && (
                <button
                  onClick={() => setActiveModal('funding')}
                  className="bg-amber-400 hover:bg-amber-300 text-amber-900 text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Briefcase size={15} /> Fund a Deal
                </button>
              )}
            </div>
          </div>

          {/* Recent activity cards */}
          {myTx.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['deposit', 'withdraw', 'transfer', 'funding'] as TxType[]).map((t) => {
                const count = myTx.filter((tx) => tx.type === t).length;
                return (
                  <div key={t} className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{TYPE_META[t].label}s</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Transaction history */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-wrap">
              <TrendingUp size={16} className="text-primary-600 shrink-0" />
              <h2 className="text-sm font-semibold text-gray-900 flex-1">Transaction History</h2>

              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg w-40 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as TxType | 'all')}
                  className="appearance-none pl-3 pr-7 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400 bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdraw">Withdraw</option>
                  <option value="transfer">Transfer</option>
                  <option value="funding">Deal Funding</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {myTx.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <TrendingUp size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No transactions yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Tx ID</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">From</th>
                      <th className="px-4 py-3">To</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {myTx.map((tx) => {
                      const isIncoming = tx.receiverId === user.id;
                      return (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-gray-400">#{shortId(tx.id)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_META[tx.type].color}`}>
                              {TYPE_META[tx.type].label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{tx.senderName}</td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{tx.receiverName}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {tx.method ? (
                              <span className="flex items-center gap-1">
                                {METHOD_META[tx.method].icon}
                                {METHOD_META[tx.method].label}
                              </span>
                            ) : '—'}
                          </td>
                          <td className={`px-4 py-3 font-semibold text-sm ${isIncoming ? 'text-green-600' : 'text-red-500'}`}>
                            {isIncoming ? '+' : '-'}${fmt(tx.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full w-fit">
                              <CheckCircle size={11} /> Completed
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                            <span>{fmtDate(tx.date)}</span>
                            <span className="block text-gray-400">{fmtTime(tx.date)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {activeModal === 'deposit' && (
        <AmountModal title="Deposit Funds" confirmLabel="Deposit" color="green" onCancel={() => setActiveModal(null)} onConfirm={handleDeposit} />
      )}
      {activeModal === 'withdraw' && (
        <AmountModal title="Withdraw Funds" confirmLabel="Withdraw" color="red" onCancel={() => setActiveModal(null)} onConfirm={handleWithdraw} />
      )}
      {activeModal === 'transfer' && (
        <RecipientModal title="Transfer Funds" confirmLabel="Send Transfer" currentUserId={user.id} currentUserRole={user.role} onCancel={() => setActiveModal(null)} onConfirm={(a, id, name, m) => handleTransferOrFund(a, id, name, 'transfer', m)} />
      )}
      {activeModal === 'funding' && (
        <RecipientModal title="Fund a Deal" confirmLabel="Fund Deal" currentUserId={user.id} currentUserRole={user.role} onlyRole="entrepreneur" onCancel={() => setActiveModal(null)} onConfirm={(a, id, name, m) => handleTransferOrFund(a, id, name, 'funding', m)} />
      )}
    </div>
  );
};

// ── Amount Modal (Deposit / Withdraw) ─────────────────────
interface AmountModalProps {
  title: string;
  confirmLabel: string;
  color: 'green' | 'red';
  onCancel: () => void;
  onConfirm: (amount: number, method: PaymentMethod) => void;
}

const AmountModal: React.FC<AmountModalProps> = ({ title, confirmLabel, color, onCancel, onConfirm }) => {
  const [step, setStep]     = useState<1 | 2>(1);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);

  const btnColor = color === 'green'
    ? 'bg-green-600 hover:bg-green-700 text-white'
    : 'bg-red-500 hover:bg-red-600 text-white';

  const handleNext = () => {
    const v = parseFloat(amount);
    if (!v || v <= 0) return alert('Please enter a valid amount');
    setStep(2);
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      onConfirm(parseFloat(amount), method);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {step === 1 ? (
          <div className="p-5 space-y-4">
            {/* Payment method */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Payment Method</p>
              <div className="space-y-2">
                {(Object.entries(METHOD_META) as [PaymentMethod, typeof METHOD_META[PaymentMethod]][]).map(([key, meta]) => (
                  <label key={key} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${method === key ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" className="hidden" checked={method === key} onChange={() => setMethod(key)} />
                    <span className={method === key ? 'text-primary-600' : 'text-gray-400'}>{meta.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                    {method === key && <CheckCircle size={15} className="ml-auto text-primary-500" />}
                  </label>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Amount</p>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-medium">$</span>
                <input
                  type="number" min="0" value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
            </div>

            <button onClick={handleNext} className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${btnColor}`}>
              Continue →
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Confirm Transaction</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Action</span><span className="font-medium">{confirmLabel}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold text-gray-900">${fmt(parseFloat(amount))}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Method</span><span>{METHOD_META[method].label}</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-300 hover:bg-gray-50">Back</button>
              <button onClick={handleConfirm} disabled={loading} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${btnColor} disabled:opacity-60`}>
                {loading ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Recipient Modal (Transfer / Fund Deal) ────────────────
interface RecipientModalProps {
  title: string;
  confirmLabel: string;
  currentUserId: string;
  currentUserRole: string;
  onCancel: () => void;
  onConfirm: (amount: number, id: string, name: string, method: PaymentMethod) => void;
  onlyRole?: 'entrepreneur' | 'investor';
}

const RecipientModal: React.FC<RecipientModalProps> = ({
  title, confirmLabel, currentUserId, currentUserRole, onCancel, onConfirm, onlyRole,
}) => {
  const [step, setStep]           = useState<1 | 2>(1);
  const [amount, setAmount]       = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [method, setMethod]       = useState<PaymentMethod>('wallet');
  const [loading, setLoading]     = useState(false);

  const roleToShow = onlyRole || (currentUserRole === 'entrepreneur' ? 'investor' : 'entrepreneur');
  const recipients = getUsersByRole(roleToShow as 'entrepreneur' | 'investor').filter((r) => r.id !== currentUserId);
  const recipient  = recipients.find((r) => r.id === recipientId);

  const handleNext = () => {
    if (!parseFloat(amount) || parseFloat(amount) <= 0) return alert('Enter a valid amount');
    if (!recipientId) return alert('Select a recipient');
    setStep(2);
  };

  const handleConfirm = () => {
    if (!recipient) return;
    setLoading(true);
    setTimeout(() => {
      onConfirm(parseFloat(amount), recipient.id, recipient.name, method);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {step === 1 ? (
          <div className="p-5 space-y-4">
            {/* Recipient */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Select Recipient</p>
              <div className="relative">
                <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full appearance-none border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white pr-8">
                  <option value="">Choose {roleToShow}…</option>
                  {recipients.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Method */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Payment Method</p>
              <div className="space-y-2">
                {(Object.entries(METHOD_META) as [PaymentMethod, typeof METHOD_META[PaymentMethod]][]).map(([key, meta]) => (
                  <label key={key} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${method === key ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" className="hidden" checked={method === key} onChange={() => setMethod(key)} />
                    <span className={method === key ? 'text-primary-600' : 'text-gray-400'}>{meta.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                    {method === key && <CheckCircle size={15} className="ml-auto text-primary-500" />}
                  </label>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Amount</p>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-medium">$</span>
                <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
            </div>

            <button onClick={handleNext} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors">
              Continue →
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Confirm Transaction</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Action</span><span className="font-medium">{confirmLabel}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">To</span><span className="font-medium">{recipient?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold text-gray-900">${fmt(parseFloat(amount))}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Method</span><span>{METHOD_META[method].label}</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-300 hover:bg-gray-50">Back</button>
              <button onClick={handleConfirm} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-60">
                {loading ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};