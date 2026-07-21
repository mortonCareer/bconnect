/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1759-5766
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLogout, useDeleteMyMember } from '@bconnect/api-client'
import { TopBar, ConfirmDialog, toast, isApiErrorShape } from '@bconnect/ui'
import { revokeDeviceToken } from '@bconnect/push'
import { useAuthStore } from '@/stores/auth-store'
import { SettingsRow } from './_components/SettingsRow'

export default function SettingsPage() {
  const router = useRouter()
  const clearAuth = useAuthStore((s) => s.logout)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  const logout = useLogout({
    mutation: {
      onSettled: () => {
        clearAuth()
        router.push('/signup/auth')
      },
    },
  })

  const withdraw = useDeleteMyMember({
    mutation: {
      onSuccess: () => {
        clearAuth()
        router.push('/')
        toast({ description: '탈퇴가 완료되었어요', variant: 'success' })
      },
      onError: (error) =>
        toast({
          description: isApiErrorShape(error)
            ? error.message
            : '탈퇴에 실패했어요. 다시 시도해주세요',
          variant: 'error',
        }),
    },
  })

  // 서버가 해제에도 인증을 요구하므로 accessToken 이 살아있는 동안 먼저 해제한다.
  const revokeThen = (run: () => void) => async () => {
    await revokeDeviceToken()
    run()
  }

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="설정" showAction={false} backHref="/profile" />

      <div className="flex flex-col gap-7 px-4 py-4">
        <section className="flex flex-col gap-1">
          <h2 className="text-sb-16 text-gray-900">서비스</h2>
          <div className="flex flex-col">
            <SettingsRow label="공지사항" disabled />
            <SettingsRow label="문의/건의" disabled />
            <SettingsRow label="후기 작성하기" disabled />
          </div>
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="text-sb-16 text-gray-900">이용정책</h2>
          <div className="flex flex-col">
            <SettingsRow label="서비스 이용약관" href="/terms" />
            <SettingsRow label="개인정보 처리방침" href="/privacy" />
          </div>
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="text-sb-16 text-gray-900">로그아웃/회원탈퇴</h2>
          <div className="flex flex-col">
            <SettingsRow label="로그아웃" onClick={() => setLogoutOpen(true)} />
            <SettingsRow label="회원탈퇴" onClick={() => setWithdrawOpen(true)} />
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="로그아웃 하시겠어요?"
        confirmLabel="로그아웃"
        onConfirm={revokeThen(() => logout.mutate())}
      />
      <ConfirmDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title="정말 탈퇴하시겠어요?"
        description="탈퇴한 계정은 복구할 수 없어요."
        confirmLabel="탈퇴"
        destructive
        onConfirm={revokeThen(() => withdraw.mutate())}
      />
    </div>
  )
}
