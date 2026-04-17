import { useState, useEffect } from 'react';
import { fetchPaymentHistory } from '../services/api.js';
import { CreditCard, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft, Loader } from 'lucide-react';

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDt = iso => new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const TYPE_LABEL  = { PREMIUM_PAYMENT: 'Premium Paid', CLAIM_PAYOUT: 'Payout Received' };
const STATUS_CLASS = {
  PAID:    'badge-success',
  CREATED: 'badge-warning',
  FAILED:  'badge-danger',
  REFUNDED:'badge-info',
};

export default function PaymentHistory() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentHistory()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-container flex items-center justify-center min-h-[60vh]">
      <Loader className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  );

  const { transactions = [], summary = {} } = data || {};

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-eyebrow">Finances</div>
        <h1 className="page-header-title">Payment History</h1>
        <p className="page-header-subtitle">All your premium payments and income payouts in one place.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total Paid</div>
            <div className="text-xl font-extrabold text-slate-900">{fmt(summary.total_paid)}</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total Received</div>
            <div className="text-xl font-extrabold text-slate-900">{fmt(summary.total_received)}</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className={`w-11 h-11 ${summary.net >= 0 ? 'bg-emerald-50' : 'bg-red-50'} rounded-xl flex items-center justify-center`}>
            <Wallet className={`w-5 h-5 ${summary.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Net Balance</div>
            <div className={`text-xl font-extrabold ${summary.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {summary.net >= 0 ? '+' : ''}{fmt(summary.net)}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-900 text-sm">Transactions</span>
          <span className="badge badge-neutral ml-auto">{transactions.length}</span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {transactions.map(t => (
              <div key={t.txn_id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  t.type === 'CLAIM_PAYOUT' ? 'bg-emerald-50' : 'bg-indigo-50'
                }`}>
                  {t.type === 'CLAIM_PAYOUT'
                    ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                    : <ArrowUpRight   className="w-4 h-4 text-indigo-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm">{TYPE_LABEL[t.type]}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{fmtDt(t.created_at)}</div>
                  {t.razorpay_payment_id && (
                    <div className="text-[10px] text-slate-300 font-mono mt-0.5">{t.razorpay_payment_id.slice(0,20)}…</div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`font-bold text-sm ${t.type === 'CLAIM_PAYOUT' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {t.type === 'CLAIM_PAYOUT' ? '+' : '-'}{fmt(t.amount_inr)}
                  </div>
                  <div className={`badge ${STATUS_CLASS[t.status] || 'badge-neutral'} mt-1`}>{t.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
