'use client'

import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { getTradeLabel } from '@bconnect/api-client'
import type { CoworkerRequest } from '@bconnect/api-client'
import { Button, ProfileCard, ProfileCardSkeleton, Tab } from '@bconnect/ui'
import { DEFAULT_PROFILE_IMAGE } from '@bconnect/config/avatar'

type Mode = 'received' | 'sent'

export interface CoworkerRequestListProps {
  /** 앱이 resolve 해 내려줌. undefined = 아직 로딩 중 (스켈레톤) */
  received?: CoworkerRequest[]
  sent?: CoworkerRequest[]
  /** 받은 요청 수락 */
  onAccept?: (id: number) => void
  /** 받은 요청 거절 */
  onDeny?: (id: number) => void
  /** 보낸 요청 취소 */
  onCancel?: (id: number) => void
  /** 처리 중인 요청 id — 해당 행 버튼 비활성 (중복 클릭 방지) */
  pendingId?: number | null
  /** 요청자/수신자 프로필 href — 소비처 주입 (career: /profile/:id) */
  profileHref: (memberId: number) => string
}

/**
 * 동료요청 목록 본문 — 받은/보낸 탭 + 각 행의 수락·거절·취소 액션.
 * loading(스켈레톤)·empty·리스트 상태를 한 곳에서 처리한다.
 * 감싸는 shell(career 페이지)은 소비처 책임, 본 컴포넌트는 탭+행 렌더만.
 */
export function CoworkerRequestList({
  received,
  sent,
  onAccept,
  onDeny,
  onCancel,
  pendingId,
  profileHref,
}: CoworkerRequestListProps) {
  const [mode, setMode] = useQueryState(
    'tab',
    parseAsStringLiteral(['received', 'sent'] as const)
      .withDefault('received')
      .withOptions({ history: 'push' })
  )

  const active = mode === 'received' ? received : sent
  const isLoading = active === undefined
  const items = active ?? []

  return (
    <section className="flex flex-col">
      <Tab
        items={[
          { key: 'received', label: `받은 요청${received ? ` ${received.length}` : ''}` },
          { key: 'sent', label: `보낸 요청${sent ? ` ${sent.length}` : ''}` },
        ]}
        activeKey={mode}
        onChange={(key) => setMode(key as Mode)}
      />

      {isLoading ? (
        <ul className="flex flex-col">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProfileCardSkeleton key={i} as="li" className="px-4" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="px-4 py-6 text-r-14 text-gray-500">
          {mode === 'received' ? '받은 동료요청이 없습니다' : '보낸 동료요청이 없습니다'}
        </p>
      ) : (
        <ul className="flex flex-col">
          {items.map((request) => (
            <CoworkerRequestRow
              key={request.id}
              request={request}
              mode={mode}
              pending={request.id != null && request.id === pendingId}
              onAccept={onAccept}
              onDeny={onDeny}
              onCancel={onCancel}
              profileHref={profileHref}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function CoworkerRequestRow({
  request,
  mode,
  pending,
  onAccept,
  onDeny,
  onCancel,
  profileHref,
}: {
  request: CoworkerRequest
  mode: Mode
  pending: boolean
  onAccept?: (id: number) => void
  onDeny?: (id: number) => void
  onCancel?: (id: number) => void
  profileHref: (memberId: number) => string
}) {
  const { id, member, profile } = request
  const memberId = member?.id

  return (
    <ProfileCard
      as="li"
      className="px-4"
      avatarUrl={member?.picture || DEFAULT_PROFILE_IMAGE}
      name={member?.name ?? '이름 없음'}
      profileHref={memberId != null ? profileHref(memberId) : undefined}
      meta={{
        // TODO: BE required 처리 후 type narrowing 필요. region/trade는 표시 필수값인데 optional emit이라 빈값으로 silent fallback 중.
        region: profile?.address?.city ?? '',
        trade: profile?.primaryTrade ? getTradeLabel(profile.primaryTrade) : '',
        // 등급(role)은 MemberSummary/ProfileSummary 미제공(#473) — 추가되면 연결
      }}
      rightSlot={
        // TODO: BE required 처리 후 type narrowing 필요. CoworkerRequest.id는 액션 키인데 optional emit이라 없으면 버튼 비활성.
        mode === 'received' ? (
          <div className="flex items-center gap-2">
            <Button
              size="small"
              variant="outline"
              disabled={pending || id == null}
              onClick={() => id != null && onAccept?.(id)}
            >
              수락
            </Button>
            <Button
              size="small"
              variant="ghost"
              disabled={pending || id == null}
              onClick={() => id != null && onDeny?.(id)}
            >
              거절
            </Button>
          </div>
        ) : (
          <Button
            size="small"
            variant="ghost"
            disabled={pending || id == null}
            onClick={() => id != null && onCancel?.(id)}
          >
            취소
          </Button>
        )
      }
    />
  )
}
