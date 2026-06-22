/**
 * @figma-scaffold 저장소 업로드 보드 작성 — 공통 메타(템플릿 기억) + 완료 커밋, 와이어프레임만 (SPRINT4 pre-build, 기획 node-id=1106-697)
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
  const { files, sharedRows, targetFolderId, setSharedRows, reset } = useUploadStore()
  const { data: template } = useMetaTemplate()
  const { addImages, saveTemplateKeys } = useStorageMutations()

  // 행 제목 템플릿으로 초기 시드(편집 전), 편집 시 store 로 캡처.
  const displayRows: BoardRow[] =
    sharedRows.length > 0 ? sharedRows : (template?.keys ?? []).map((k) => ({ key: k, value: '' }))

  // 명명 함수(인라인 router.push 룰 회피). 공통 보드를 선택 사진 전체에 적용해 커밋.
  // 사진별 위치/메타/설명/삭제는 업로드 후 갤러리 상세에서.
  const complete = () => {
    saveTemplateKeys(displayRows.map((r) => r.key).filter((k) => k.trim() !== ''))
    if (targetFolderId && files.length > 0) {
      addImages(
        targetFolderId,
        files.map((f) => ({
          imageUrl: URL.createObjectURL(f), // TODO(orval): 업로드 후 CloudFront URL. revoke 생략(와이어프레임 허용).
          boardRows: displayRows,
          boardPosition: 'tl' as const,
          description: '',
        }))
      )
    }
    reset()
    router.push(targetFolderId ? `/storage/${targetFolderId}` : '/storage')
  }

  return (
    <>
      <TopBar
        variant="default"
        title="보드 작성"
        showBack
        onBack={() => router.back()}
        showAction
        actionLabel="완료"
        onAction={complete}
      />
      <div className="flex flex-col gap-3 p-4">
        <BoardMetadataTable
          rows={displayRows}
          onChange={setSharedRows}
          templateKeys={template?.keys}
        />
        <p className="text-xs text-gray-500">
          선택한 사진 전체에 적용돼요. 사진별 세부 수정은 업로드 후 갤러리에서 할 수 있어요.
          <br />행 제목은 저장돼서 다음에 만들 때도 그대로 써요.
        </p>
      </div>
    </>
  )
}
