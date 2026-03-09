import { useApplications } from '../hooks/useApplications.js'
import StatusBadge from '../components/StatusBadge.jsx'

function StatCard({ label, value, accent }) {
  const accentMap = {
    blue:   'border-blue-500/30 text-blue-400',
    purple: 'border-purple-500/30 text-purple-400',
    green:  'border-green-500/30 text-green-400',
    gray:   'border-[#2a2a2a] text-gray-300',
  }
  const [borderCls, valueCls] = (accentMap[accent] ?? accentMap.gray).split(' ')

  return (
    <div className={`bg-[#1a1a1a] border rounded-xl p-5 ${borderCls}`}>
      <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-2">{label}</p>
      <p className={`text-3xl font-bold ${valueCls}`}>{value}</p>
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Dashboard() {
  const { data: apps = [], isLoading } = useApplications()

  const total       = apps.length
  const inProgress  = apps.filter(a => ['OA', 'INTERVIEW'].includes(a.status)).length
  const interviews  = apps.filter(a => a.status === 'INTERVIEW').length
  const offers      = apps.filter(a => a.status === 'OFFER').length
  const recent      = apps.slice(0, 10)

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Your job search at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Applications" value={total}      accent="gray"   />
        <StatCard label="In Progress"         value={inProgress} accent="blue"   />
        <StatCard label="Interviews"          value={interviews} accent="purple" />
        <StatCard label="Offers"              value={offers}     accent="green"  />
      </div>

      {/* Recent Applications Table */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recent Applications</h2>
          <span className="text-xs text-gray-600">{total} total</span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-gray-600 text-sm">Loading…</div>
        ) : recent.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-sm">No applications yet.</p>
            <p className="text-gray-700 text-xs mt-1">Head to Applications to add your first one!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                {['Company', 'Role', 'Status', 'Match Score', 'Date Applied'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(app => (
                <tr
                  key={app.id}
                  className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#222] transition-colors"
                >
                  <td className="px-6 py-3.5 font-medium text-white">
                    {app.job?.company_name ?? '—'}
                  </td>
                  <td className="px-6 py-3.5 text-gray-400">{app.job?.title ?? '—'}</td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-6 py-3.5 text-gray-400">
                    {app.match_score != null ? `${app.match_score}%` : '—'}
                  </td>
                  <td className="px-6 py-3.5 text-gray-500">
                    {formatDate(app.applied_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
