/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1759-5766
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLogout, useWithdraw } from '@bconnect/api-client'
import { TopBar, ConfirmDialog, toast, isApiErrorShape } from '@bconnect/ui'
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
        router.push('/login')
      },
    },
  })

  const withdraw = useWithdraw({
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

  const notReady = () => toast({ description: '준비 중이에요' })

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="설정" showAction={false} backHref="/profile" />

      <div className="flex flex-col gap-6 px-4 py-4">
        <section className="flex flex-col gap-2">
          <h2 className="text-sb-14 text-gray-900">서비스</h2>
          <SettingsRow label="공지사항" onClick={notReady} />
          <SettingsRow label="문의/건의" onClick={notReady} />
          <SettingsRow label="후기 작성하기" onClick={notReady} />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sb-14 text-gray-900">이용정책</h2>
          <SettingsRow label="서비스 이용약관" onClick={notReady} />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sb-14 text-gray-900">로그아웃/회원탈퇴</h2>
          <SettingsRow label="로그아웃" variant="destructive" onClick={() => setLogoutOpen(true)} />
          <SettingsRow
            label="회원탈퇴"
            variant="destructive"
            onClick={() => setWithdrawOpen(true)}
          />
        </section>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="로그아웃 하시겠어요?"
        confirmLabel="로그아웃"
        onConfirm={() => logout.mutate()}
      />
      <ConfirmDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title="정말 탈퇴하시겠어요?"
        description="탈퇴한 계정은 복구할 수 없어요."
        confirmLabel="탈퇴"
        destructive
        onConfirm={() => withdraw.mutate()}
      />
    </div>
  )
}
