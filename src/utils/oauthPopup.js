export function openOAuthPopup({
  url,
  name,
  platform,
  successType,
  errorType,
  closedMessage,
  timeoutMessage,
  width = 560,
  height = 720,
}) {
  return new Promise((resolve, reject) => {
    let settled = false
    let closedTimer = null
    let timeoutTimer = null

    const cleanup = () => {
      window.removeEventListener('message', handleMessage)
      if (closedTimer) window.clearInterval(closedTimer)
      if (timeoutTimer) window.clearTimeout(timeoutTimer)
    }

    const finish = callback => {
      if (settled) return
      settled = true
      cleanup()
      callback()
    }

    const handleMessage = event => {
      const data = event.data

      if (data?.source !== 'link-u' || data.platform !== platform) return

      if (data.type === successType) {
        finish(() => resolve(data))
        return
      }

      if (data.type === errorType) {
        finish(() => reject(new Error(data.message || timeoutMessage)))
      }
    }

    window.addEventListener('message', handleMessage)

    const popup = window.open(
      url,
      name,
      `width=${width},height=${height}`,
    )

    if (!popup) {
      finish(() => reject(new Error('팝업이 차단되었습니다. 브라우저에서 팝업을 허용한 뒤 다시 시도해주세요.')))
      return
    }

    closedTimer = window.setInterval(() => {
      if (!settled && popup.closed) {
        finish(() => reject(new Error(closedMessage)))
      }
    }, 500)

    timeoutTimer = window.setTimeout(() => {
      if (!settled) {
        finish(() => reject(new Error(timeoutMessage)))
        popup.close()
      }
    }, 120000)
  })
}
