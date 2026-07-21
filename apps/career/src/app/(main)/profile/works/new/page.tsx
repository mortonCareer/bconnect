/**
 * @figma-pending 작업물 생성 flow — #967에서 구현 예정 (프로필 헤더 '+' 진입점 선배선, #966)
 */
import { TopBar } from '@bconnect/ui'

export default function NewWorkPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar variant="default" title="작업물 생성" backHref="/profile" showAction={false} />
      <div className="flex flex-1 items-center justify-center">
        <p className="text-r-14 text-gray-500">작업물 생성 화면을 준비 중입니다</p>
      </div>
    </div>
  )
}
