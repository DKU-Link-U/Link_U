import { useState } from 'react'
import { mockMessages, mockUser } from '../../models'

const TABS = ['받은 쪽지', '보낸 쪽지']

function MessageRow({ msg, isSent, onClick, selected }) {
  return (
    <button
      onClick={() => onClick(msg)}
      className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
        selected ? 'bg-primary/5' : ''
      }`}
    >
      {/* 아바타 */}
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
        {(isSent ? msg.senderName : msg.senderName)?.[0] ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-xs font-semibold text-gray-800">
            {isSent ? `To. ${msg.senderName}` : msg.senderName}
          </p>
          <p className="text-[10px] text-gray-400 flex-shrink-0">{msg.createdAt.slice(5, 16)}</p>
        </div>
        <p className="text-xs text-gray-500 truncate">{msg.content}</p>
      </div>
      {!isSent && !msg.isRead && (
        <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1" />
      )}
    </button>
  )
}

export default function MessagesPage() {
  const [tab, setTab] = useState('받은 쪽지')
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState(mockMessages)
  const [compose, setCompose] = useState(false)
  const [newMsg, setNewMsg] = useState({ to: '', content: '' })

  const received = messages.filter(m => m.receiverId === mockUser.userId)
  const sent = messages.filter(m => m.senderId === mockUser.userId)
  const list = tab === '받은 쪽지' ? received : sent

  const openMsg = msg => {
    setSelected(msg)
    setMessages(prev => prev.map(m => m.messageId === msg.messageId ? { ...m, isRead: true } : m))
  }

  const sendMessage = () => {
    if (!newMsg.to.trim() || !newMsg.content.trim()) return
    alert(`"${newMsg.to}"에게 쪽지를 보냈습니다.`)
    setCompose(false)
    setNewMsg({ to: '', content: '' })
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">쪽지함</h1>
        <button
          onClick={() => setCompose(true)}
          className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          쪽지 쓰기
        </button>
      </div>

      {/* 작성 모달 */}
      {compose && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-sm font-bold text-gray-800 mb-4">새 쪽지 작성</h2>
            <div className="flex flex-col gap-3">
              <input
                value={newMsg.to} onChange={e => setNewMsg(m => ({ ...m, to: e.target.value }))}
                placeholder="받는 사람 닉네임"
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50"
              />
              <textarea
                value={newMsg.content} onChange={e => setNewMsg(m => ({ ...m, content: e.target.value }))}
                rows={5} placeholder="내용을 입력하세요"
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setCompose(false)}
                  className="px-4 py-2 text-xs text-gray-500 hover:text-gray-800">취소</button>
                <button onClick={sendMessage}
                  className="bg-primary text-white px-5 py-2 rounded-xl text-xs font-semibold hover:opacity-90">보내기</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-5">
        {/* 목록 패널 */}
        <div className="flex-1 bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
          {/* 탭 */}
          <div className="flex border-b border-gray-100">
            {TABS.map(t => (
              <button key={t} onClick={() => { setTab(t); setSelected(null) }}
                className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                  tab === t ? 'text-primary border-b-2 border-primary' : 'text-gray-400'
                }`}
              >
                {t}
                {t === '받은 쪽지' && received.filter(m => !m.isRead).length > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                    {received.filter(m => !m.isRead).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          {/* 목록 */}
          <div className="flex-1 overflow-y-auto">
            {list.length === 0
              ? <p className="text-center py-12 text-xs text-gray-400">쪽지가 없습니다.</p>
              : list.map(m => (
                  <MessageRow
                    key={m.messageId}
                    msg={m}
                    isSent={tab === '보낸 쪽지'}
                    onClick={openMsg}
                    selected={selected?.messageId === m.messageId}
                  />
                ))
            }
          </div>
        </div>

        {/* 상세 패널 */}
        <div className="w-72 flex-shrink-0">
          {selected ? (
            <div className="bg-white rounded-2xl shadow-md p-5">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {selected.senderName[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{selected.senderName}</p>
                  <p className="text-[10px] text-gray-400">{selected.createdAt}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{selected.content}</p>
              {selected.receiverId === mockUser.userId && (
                <button
                  onClick={() => { setCompose(true); setNewMsg(m => ({ ...m, to: selected.senderName })) }}
                  className="mt-4 w-full border border-primary/30 text-primary text-xs font-semibold py-2 rounded-xl hover:bg-primary/5 transition-colors"
                >
                  답장
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-md p-5 flex items-center justify-center h-40">
              <p className="text-xs text-gray-400">쪽지를 선택하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
