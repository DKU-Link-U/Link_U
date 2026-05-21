const STATUS_META = {
  pending: {
    label: '대기',
    className: 'bg-yellow-100 text-yellow-700',
  },
  accepted: {
    label: '승인',
    className: 'bg-green-100 text-green-700',
  },
  rejected: {
    label: '거절',
    className: 'bg-red-100 text-red-600',
  },
  canceled: {
    label: '취소',
    className: 'bg-gray-100 text-gray-500',
  },
}

function getApplicantName(application) {
  return application.applicant?.nickname ||
    application.applicant?.name ||
    application.applicant?.email ||
    '지원자'
}

function formatAppliedAt(value) {
  if (!value) return ''
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${meta.className}`}>
      {meta.label}
    </span>
  )
}

export default function ApplicationReviewPanel({
  applications,
  error,
  loading,
  onReload,
  onUpdateStatus,
  title = '신청자 목록',
  updatingId,
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-md">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-800">{title}</h2>
          <p className="mt-1 text-xs text-gray-400">모집글 작성자만 신청자를 승인하거나 거절할 수 있습니다.</p>
        </div>
        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          새로고침
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-500">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-xs text-gray-400">
          신청자 목록을 불러오는 중입니다.
        </div>
      )}

      {!loading && applications.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-xs text-gray-400">
          아직 신청자가 없습니다.
        </div>
      )}

      {!loading && applications.length > 0 && (
        <div className="flex flex-col gap-3">
          {applications.map(application => {
            const status = application.status ?? 'pending'
            const isUpdating = updatingId === application.id

            return (
              <article key={application.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-gray-800">{getApplicantName(application)}</p>
                      <StatusBadge status={status} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {application.applicant?.department || '학과 미입력'}
                      {application.applicant?.email ? ` · ${application.applicant.email}` : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-gray-500">
                      {application.applicant?.githubId && (
                        <span className="rounded-full bg-white px-2 py-1">GitHub @{application.applicant.githubId}</span>
                      )}
                      {application.applicant?.bojId && (
                        <span className="rounded-full bg-white px-2 py-1">BOJ @{application.applicant.bojId}</span>
                      )}
                      {application.applicant?.dreamhackId && (
                        <span className="rounded-full bg-white px-2 py-1">Dreamhack @{application.applicant.dreamhackId}</span>
                      )}
                      <span className="rounded-full bg-white px-2 py-1">신청일 {formatAppliedAt(application.appliedAt)}</span>
                    </div>
                    {application.message && (
                      <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs leading-5 text-gray-600">
                        {application.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:w-[150px]">
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(application.id, 'accepted')}
                      disabled={isUpdating || status === 'accepted'}
                      className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(application.id, 'rejected')}
                      disabled={isUpdating || status === 'rejected'}
                      className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      거절
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
