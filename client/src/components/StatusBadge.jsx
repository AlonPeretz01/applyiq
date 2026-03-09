export const STATUS_META = {
  DRAFT:     { label: 'Draft',     cls: 'bg-gray-500/15 text-gray-400 border-gray-500/25' },
  READY:     { label: 'Ready',     cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  APPLIED:   { label: 'Applied',   cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
  OA:        { label: 'OA',        cls: 'bg-orange-500/15 text-orange-400 border-orange-500/25' },
  INTERVIEW: { label: 'Interview', cls: 'bg-purple-500/15 text-purple-400 border-purple-500/25' },
  REJECTED:  { label: 'Rejected',  cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
  OFFER:     { label: 'Offer',     cls: 'bg-green-500/15 text-green-400 border-green-500/25' },
  WITHDRAWN: { label: 'Withdrawn', cls: 'bg-gray-500/15 text-gray-500 border-gray-500/25' },
}

export const ALL_STATUSES = Object.keys(STATUS_META)

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, cls: 'bg-gray-500/15 text-gray-400 border-gray-500/25' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.cls}`}>
      {meta.label}
    </span>
  )
}
