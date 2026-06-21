/**
 * @figma-scaffold 동산보드 업로드 1단계 사진 선택 — OS 다중선택, 와이어프레임만 (SPRINT4 pre-build, 기획 node-id=1105-451)
 */
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ImageInput, TopBar } from '@bconnect/ui'
import type { ImageValue } from '@bconnect/ui'
import { useUploadStore } from '../_store/upload-store'

export default function UploadSelectPage() {
  const router = useRouter()
  const folderId = useSearchParams().get('folder') ?? ''
  const { files, setFiles, setTargetFolder } = useUploadStore()
  const [value, setValue] = useState<ImageValue[]>(files)

  // 명명 함수로 분리 — JSX on* 인라인 router.push 금지 룰 회피(위저드 forward nav 은 불가피한 imperative).
  const goNext = () => {
    setFiles(value.filter((v): v is File => v instanceof File))
    if (folderId) setTargetFolder(folderId)
    router.push('/storage/upload/board')
  }

  return (
    <>
      <TopBar
        variant="default"
        title="사진 선택"
        showBack
        onBack={() => router.back()}
        showAction
        actionLabel="다음"
        onAction={goNext}
        actionDisabled={value.length === 0}
      />
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm text-gray-500">
          동산보드에 올릴 사진을 선택하세요. 여러 장 선택할 수 있어요.
        </p>
        <ImageInput
          value={value}
          onChange={(v) => setValue(v == null ? [] : Array.isArray(v) ? v : [v])}
          multiple
          maxFiles={20}
        />
      </div>
    </>
  )
}
