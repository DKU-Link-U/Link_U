import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  buildGoogleLoginUrl,
  GOOGLE_OAUTH_MESSAGE_TYPES,
} from '../api/accountVerificationApi'
import { useAppState } from '../store'
import { canAccessApp, DANKOOK_EMAIL_DOMAIN, isDankookEmail } from '../utils/auth'
import { openOAuthPopup } from '../utils/oauthPopup'

export default function LoginPage() {
  const { state, setCurrentUser } = useAppState()
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const from = location.state?.from?.pathname || '/'

  if (canAccessApp(state.auth)) {
    return <Navigate to={from} replace />
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await openOAuthPopup({
        url: buildGoogleLoginUrl(),
        name: 'link-u-google-login',
        platform: 'google',
        successType: GOOGLE_OAUTH_MESSAGE_TYPES.success,
        errorType: GOOGLE_OAUTH_MESSAGE_TYPES.error,
        closedMessage: '로그인 창이 닫혔습니다.',
        timeoutMessage: '로그인 응답 시간이 초과되었습니다.',
      })

      if (!result.accessToken || !result.user) {
        throw new Error('로그인 정보를 받지 못했습니다. 다시 시도해주세요.')
      }

      if (!isDankookEmail(result.user.email)) {
        throw new Error(`단국대학교 Google 계정(${DANKOOK_EMAIL_DOMAIN})으로만 로그인할 수 있습니다.`)
      }

      setCurrentUser(result.user, result.accessToken)
      navigate(from, { replace: true })
    } catch (loginError) {
      setError(loginError.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-gray-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-10">
        <section className="grid w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex min-h-[420px] flex-col justify-between bg-primary px-8 py-8 text-white">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-bold">
                  L
                </div>
                <div>
                  <p className="text-lg font-bold">Link-U</p>
                  <p className="text-xs text-white/60">Dankook verified workspace</p>
                </div>
              </div>
              <h1 className="text-2xl font-bold leading-tight">
                단국대학교 계정으로 인증해주세요.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
                인증된 단국대 Google 계정만 대시보드, 커뮤니티, 계정 연동 기능에 접근할 수 있습니다.
              </p>
            </div>
            <p className="text-xs text-white/50">
              허용 도메인: {DANKOOK_EMAIL_DOMAIN}
            </p>
          </div>

          <div className="flex min-h-[420px] flex-col justify-center px-8 py-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Sign in
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900">
              학교 계정 인증
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Google 인증이 완료되면 메인 페이지로 이동합니다.
            </p>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-base font-bold text-blue-600">
                G
              </span>
              {loading ? '인증 진행 중...' : '단국대 Google 계정으로 로그인'}
            </button>

            {error && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600">
                {error}
              </div>
            )}

            <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-700">
              로그인 후 마이페이지에서 GitHub 연동을 완료하면 계정 정보가 DB에 저장됩니다.
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
