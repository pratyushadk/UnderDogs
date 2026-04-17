import { useState, useEffect } from 'react';
import { adminTransactions } from '../../services/api.js';
import { Loader, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDt = iso => new Date(iso).toLocaleString('en-IN', { day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit' });

const STATUS_COLOR = { PAID:'text-emerald-400', CREATED:'text-amber-400', FAILED:'text-red-400', REFUNDED:'text-slate-400' };

export default function AdminTransactions() {
  const [txns, setTxns]     = useState([]);
  const [filter, setFilter] = useState({ type: '', status: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminTransactions(filter)
      .then(r => setTxns(r.data.transactions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Transactions</h1>
          <p className="text-slate-400 text-sm mt-1">All premium payments and claim payouts.</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filter.type}
            onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl px-3 py-2"
          >
            <option value="">All Types</option>
            <option value="PREMIUM_PAYMENT">Premium Payment</option>
            <option value="CLAIM_PAYOUT">Claim Payout</option>
          </select>
          <select
            value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl px-3 py-2"
          >
            <option value="">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="CREATED">Created</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader className="w-8 h-8 animate-spin text-indigo-400" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-800">
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Razorpay Order</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {txns.map(t => (
                <tr key={t.txn_id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {t.type === 'CLAIM_PAYOUT'
                        ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                        : <ArrowUpRight  className="w-4 h-4 text-indigo-400" />
                      }
                      <span className="text-slate-300 text-xs font-medium">{t.type === 'CLAIM_PAYOUT' ? 'Payout' : 'Premium'}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-white text-xs">{t.user_name}</div>
                    <div className="text-slate-500 text-[10px]">{t.email}</div>
                  </td>
                  <td className={`py-3 pr-4 font-bold ${t.type === 'CLAIM_PAYOUT' ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {t.type === 'CLAIM_PAYOUT' ? '+' : '-'}{fmt(t.amount_inr)}
                  </td>
                  <td className={`py-3 pr-4 font-semibold text-xs ${STATUS_COLOR[t.status] || 'text-slate-400'}`}>{t.status}</td>
                  <td className="py-3 pr-4 text-slate-500 text-[10px] font-mono">{t.razorpay_order_id?.slice(0, 16) || '—'}</td>
                  <td className="py-3 text-slate-400 text-xs">{fmtDt(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {txns.length === 0 && (
            <div className="text-center py-16 text-slate-500">No transactions found for the selected filter.</div>
          )}
        </div>
      )}
    </div>
  );
}
