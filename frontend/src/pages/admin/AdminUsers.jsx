import { useState, useEffect } from 'react';
import { adminUsers } from '../../services/api.js';
import { Loader, Users, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminUsers() {
  const [data, setData]     = useState({ users: [], pagination: {} });
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminUsers(page)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  const { users = [], pagination = {} } = data;
  const fmtDt = iso => iso ? new Date(iso).toLocaleDateString('en-IN') : '—';

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">User Management</h1>
        <p className="text-slate-400 text-sm mt-1">
          {pagination.total || 0} registered users
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-800">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Contact</th>
                  <th className="pb-3 pr-4">Platform ID</th>
                  <th className="pb-3 pr-4">Zone</th>
                  <th className="pb-3 pr-4">Policy</th>
                  <th className="pb-3 pr-4">Streak</th>
                  <th className="pb-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map(u => (
                  <tr key={u.user_id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 pr-4 font-semibold text-white">{u.name}</td>
                    <td className="py-3 pr-4 text-slate-400 text-xs">{u.email || u.phone}</td>
                    <td className="py-3 pr-4 text-slate-400 text-xs font-mono">{u.platform_rider_id || '—'}</td>
                    <td className="py-3 pr-4 text-slate-300 text-xs">{u.zone_id?.replace('Zone_','') || '—'}</td>
                    <td className="py-3 pr-4">
                      {u.policy_status
                        ? <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${u.policy_status === 'ACTIVE' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>{u.policy_status}</span>
                        : <span className="text-slate-600 text-xs">None</span>
                      }
                    </td>
                    <td className="py-3 pr-4 text-slate-300">{u.subscription_streak || 0}w</td>
                    <td className="py-3 text-slate-400 text-xs">{fmtDt(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 border border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-400">{page} / {pagination.pages}</span>
              <button
                disabled={page === pagination.pages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 border border-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
