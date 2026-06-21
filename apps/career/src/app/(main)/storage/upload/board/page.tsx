/**
 * @figma-scaffold 동산보드 업로드 2단계 보드 작성 — 공통 메타(템플릿 기억), 와이어프레임만 (SPRINT4 pre-build, 기획 node-id=1106-697)
 */
'use client'

import { useRouter } from 'next/navigation'
import { TopBar } from '@bconnect/ui'
import { BoardMetadataTable } from '@bconnect/features'
import type { BoardRow } from '@bconnect/features'
import { useMetaTemplate, useStorageMutations } from '@/lib/storage-mock/hooks'
import { useUploadStore } from '../_store/upload-store'

export default function UploadBoardPage() {
  const router = useRouter()
  const { sharedRows, setSharedRows } = useUploadStore()
  const { data: template } = useMetaTemplate()
  const { saveTemplateKeys } = useStorageMutations()

  // 행 제목 템플릿으로 초기 시드(편집 전), 편집 시 store 로 캡처.
  const displayRows: BoardRow[] =
    sharedRows.length > 0 ? sharedRows : (template?.keys ?? []).map((k) => ({ key: k, value: '' }))

  const goNext = () => {
    setSharedRows(displayRows)
    // 행 제목을 템플릿으로 저장 — 다음 업로드에도 기억.
    saveTemplateKeys(displayRows.map((r) => r.key).filter((k) => k.trim() !== ''))
    router.push('/storage/upload/photos')
  }

  return (
    <>
      <TopBar
        variant="default"
        title="보드 작성"
        showBack
        onBack={() => router.back()}
        showAction
        actionLabel="저장"
        onAction={goNext}
      />
      <div className="flex flex-col gap-3 p-4">
        <BoardMetadataTable
          rows={displayRows}
          onChange={setSharedRows}
          templateKeys={template?.keys}
        />
        <p className="text-xs text-gray-500">
          공통으로 들어갈 보드판으로, 다음 단계에서 사진마다 따로 수정할 수 있어요.
          <br />행 제목은 저장돼서 다음에 만들 때도 그대로 써요.
        </p>
      </div>
    </>
  )
}
