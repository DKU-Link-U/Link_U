import { useMemo, useState } from 'react'
import { verifyExternalAccount } from '../../api/accountVerificationApi'
import { useAccountLinks, useAppState, useExternalProfile } from '../../store'

const PLATFORM_DEFS = [
  {
    key: 'github',
    name: 'GitHub',
    idKey: 'githubId',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.6 9.6 0 0112 6.84c.85 0 1.71.11 2.51.34 1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.69-4.57 4.94.36.31.68.92.68 1.86v2.72c0 .26.18.58.69.48A10 10 0 0012 2z" />
      </svg>
    ),
    color: 'text-gray-800',
  },
  {
    key: 'baekjoon',
    name: '백준',
    idKey: 'bojId',
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3" />
      </svg>
    ),
    color: 'text-blue-600',
  },
  {
    key: 'dreamhack',
    name: 'Dreamhack',
    idKey: 'dhId',
    icon: (
      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
        <path d="M9 12l2 2 4-5" />
      </svg>
    ),
    color: 'text-purple-600',
  },
]

function createVerificationCode(platformKey) {
  return `link-u-${platformKey}-${Math.random().toString(36).slice(2, 8)}`
}

function getPlatformStat(platformKey, rating) {
  if (platformKey === 'github') {
    return `${rating.githubCommitCount} commits · ${rating.githubPrCount ?? 0} PRs`
  }

  if (platformKey === 'baekjoon') {
    return `${rating.baekjoonTier} · ${rating.baekjoonSolvedCount ?? 0}문제 해결`
  }

  return `${rating.dreamhackScore ?? 0}점 · ${rating.dreamhackSolvedCount ?? 0}문제 해결`
}

function getErrorList(errors) {
  return Object.values(errors ?? {})
}

function getVerificationGuide(platformName) {
  return `${platformName} 공개 프로필 소개/자기소개 영역에 아래 검증 코드를 잠시 추가한 뒤 소유 확인을 눌러주세요.`
}

export default function AccountLinks() {
  const { rating } = useAppState()
  const {
    accountLinks,
    setAccountLink,
    verifyAccountLink,
    disconnectAccountLink,
  } = useAccountLinks()
  const { externalProfile, loadIntegratedUserData, clearExternalProfileError } = useExternalProfile()
  const [inputMap, setInputMap] = useState({})
  const [verifyingMap, setVerifyingMap] = useState({})
  const [verificationErrors, setVerificationErrors] = useState({})
  const platforms = useMemo(() => PLATFORM_DEFS.map(platform => {
    const link = accountLinks[platform.key] ?? {}

    return {
      ...platform,
      username: link.username ?? '',
      connected: Boolean(link.username),
      verified: Boolean(link.verified),
      verificationCode: link.verificationCode || createVerificationCode(platform.key),
      verifiedAt: link.verifiedAt,
      verifying: Boolean(verifyingMap[platform.key]),
      verificationError: verificationErrors[platform.key] ?? null,
    }
  }), [accountLinks, verificationErrors, verifyingMap])

  const linkedIds = useMemo(() => platforms.reduce((ids, platform) => {
    if (platform.connected && platform.verified) {
      ids[platform.idKey] = platform.username
    }

    return ids
  }, {}), [platforms])

  const verifiedCount = PLATFORM_DEFS.filter(platform => linkedIds[platform.idKey]?.trim()).length
  const connectedCount = platforms.filter(platform => platform.connected).length
  const canSync = verifiedCount > 0 && !externalProfile.loading

  const connect = key => {
    const username = inputMap[key]
    if (!username?.trim()) return
    const normalizedUsername = username.trim()

    if (key === 'dreamhack' && normalizedUsername.includes('@')) {
      setVerificationErrors(errors => ({
        ...errors,
        [key]: 'Dreamhack은 이메일이 아니라 공개 닉네임을 입력해야 합니다.',
      }))
      return
    }

    clearExternalProfileError()
    setAccountLink({
      platform: key,
      username: normalizedUsername,
      verificationCode: createVerificationCode(key),
    })
    setVerificationErrors(errors => ({ ...errors, [key]: null }))
    setInputMap(m => ({ ...m, [key]: '' }))
  }

  const disconnect = key => {
    clearExternalProfileError()
    disconnectAccountLink(key)
    setVerificationErrors(errors => ({ ...errors, [key]: null }))
    setVerifyingMap(map => ({ ...map, [key]: false }))
  }

  const verifyPlatform = async key => {
    const platform = platforms.find(item => item.key === key)
    if (!platform?.connected || !platform.username) return

    setVerifyingMap(map => ({ ...map, [key]: true }))
    setVerificationErrors(errors => ({ ...errors, [key]: null }))

    try {
      const result = await verifyExternalAccount({
        platform: platform.key,
        accountId: platform.username,
        token: platform.verificationCode,
      })

      if (result.verified) {
        verifyAccountLink(key)
      }

      setVerifyingMap(map => ({ ...map, [key]: false }))
      setVerificationErrors(errors => ({
        ...errors,
        [key]: result.verified ? null : result.message,
      }))
    } catch (error) {
      setVerifyingMap(map => ({ ...map, [key]: false }))
      setVerificationErrors(errors => ({ ...errors, [key]: error.message }))
    }
  }

  const syncExternalData = async () => {
    if (!canSync) return

    try {
      await loadIntegratedUserData(linkedIds)
    } catch {
      // Store에 error 상태를 남기므로 화면에서는 externalProfile.error만 보여준다.
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-800">계정 연동 관리</h2>
          <p className="text-xs text-gray-500 mt-1">원하는 외부 계정만 선택하고, 소유 확인이 끝난 계정만 활동 데이터에 반영합니다.</p>
        </div>
        <button
          onClick={syncExternalData}
          disabled={!canSync}
          className={`text-xs font-semibold px-4 py-2 rounded-xl transition-opacity ${
            canSync ? 'bg-primary text-white hover:opacity-90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {externalProfile.loading ? '동기화 중...' : `검증된 계정 동기화${verifiedCount > 0 ? ` (${verifiedCount})` : ''}`}
        </button>
      </div>

      {connectedCount > 0 && verifiedCount === 0 && (
        <div className="bg-yellow-50 border border-yellow-100 text-yellow-700 text-xs rounded-xl px-4 py-3">
          계정 소유 확인을 완료해야 활동 데이터를 동기화할 수 있습니다.
        </div>
      )}

      {externalProfile.error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-3">
          {externalProfile.error}
        </div>
      )}

      {externalProfile.partialSuccess && !externalProfile.error && (
        <div className="bg-yellow-50 border border-yellow-100 text-yellow-700 text-xs rounded-xl px-4 py-3">
          <p className="font-semibold mb-1">일부 플랫폼만 동기화되었습니다.</p>
          <div className="flex flex-col gap-1">
            {getErrorList(externalProfile.errors).map(error => (
              <p key={error.platform}>{error.platform}: {error.message}</p>
            ))}
          </div>
        </div>
      )}

      {externalProfile.loadedAt && !externalProfile.error && !externalProfile.partialSuccess && (
        <div className="bg-green-50 border border-green-100 text-green-700 text-xs rounded-xl px-4 py-3">
          외부 활동 데이터를 반영했습니다.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {platforms.map(p => (
          <div key={p.key} className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={p.color}>{p.icon}</span>
                <div>
                  <p className="text-sm font-bold text-gray-800">{p.name}</p>
                  {p.connected && (
                    <p className="text-xs text-gray-400">
                      @{p.username}
                      {p.verifiedAt && <span> · 확인 완료</span>}
                    </p>
                  )}
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                p.connected
                  ? p.verified
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {p.connected ? (p.verified ? '소유 확인됨' : '소유 확인 필요') : '미연동'}
              </span>
            </div>

            {p.connected ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                  <p className="text-xs text-gray-600">
                    {p.verified ? getPlatformStat(p.key, rating) : '소유 확인 후 활동 데이터 동기화 가능'}
                  </p>
                  <button onClick={() => disconnect(p.key)}
                    className="text-[10px] text-red-500 hover:underline">연동 해제</button>
                </div>

                {!p.verified && (
                  <div className="border border-yellow-100 bg-yellow-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-yellow-800 leading-relaxed mb-2">
                      {getVerificationGuide(p.name)}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white border border-yellow-100 rounded-lg px-3 py-2 text-[11px] text-gray-700">
                        {p.verificationCode}
                      </code>
                      <button
                        onClick={() => verifyPlatform(p.key)}
                        disabled={p.verifying}
                        className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {p.verifying ? '확인 중...' : '소유 확인'}
                      </button>
                    </div>
                    {p.verificationError && (
                      <p className="text-[11px] text-red-500 mt-2">{p.verificationError}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    value={inputMap[p.key] ?? ''}
                    onChange={e => setInputMap(m => ({ ...m, [p.key]: e.target.value }))}
                    placeholder={`${p.name} ${p.key === 'dreamhack' ? '닉네임' : '아이디'} 입력`}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
                  />
                  <button onClick={() => connect(p.key)}
                    className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
                    연동
                  </button>
                </div>
                {p.verificationError && (
                  <p className="text-[11px] text-red-500">{p.verificationError}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
