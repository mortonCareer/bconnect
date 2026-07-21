/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=3417-12398 (빈 상태 110px 타일)
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=3417-12441 (채움 상태 90px 타일)
 */
'use client'

import { cn, PlusIcon, XIcon } from '@bconnect/ui'
import { useEffect, useMemo, useRef } from 'react'

export type WorkPhoto = File | { id: number; url: string }

interface PhotoStripProps {
  value: WorkPhoto[]
  onChange: (value: WorkPhoto[]) => void
  invalid?: boolean
}

/** 작업물 사진 스트립 — 기존 첨부(id+url)와 새 File 을 한 배열로 관리. 업로드는 제출 시점에 호출부가 담당. */
export function PhotoStrip({ value, onChange, invalid }: PhotoStripProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const previews = useMemo(() => {
    const map = new Map<File, string>()
    for (const it of value) {
      if (it instanceof File) map.set(it, URL.createObjectURL(it))
    }
    return map
  }, [value])

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews])

  const srcOf = (photo: WorkPhoto) => (photo instanceof File ? previews.get(photo) : photo.url)
  const openPicker = () => inputRef.current?.click()

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'))
    e.target.value = ''
    if (picked.length > 0) onChange([...value, ...picked])
  }

  const addTile = (sizeClass: string) => (
    <button
      type="button"
      onClick={openPicker}
      aria-label="사진 추가"
      aria-invalid={invalid || undefined}
      className={cn(
        sizeClass,
        'flex shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 bg-gray-100 outline-none transition-colors hover:bg-gray-200 focus-visible:ring-1 focus-visible:ring-primary',
        invalid && 'ring-1 ring-destructive'
      )}
    >
      <PlusIcon size={16} className="text-gray-400" />
      <span className="text-r-12 text-gray-400">사진 추가</span>
    </button>
  )

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handlePick}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
      {value.length === 0 ? (
        addTile('size-27.5')
      ) : (
        <div className="flex gap-3 overflow-x-auto">
          {value.map((photo, i) => {
            const src = srcOf(photo)
            return (
              <div
                key={photo instanceof File ? `file-${i}` : `attachment-${photo.id}`}
                className="relative size-22.5 shrink-0 overflow-hidden rounded-xl bg-gray-100"
              >
                {src && <img src={src} alt="" className="h-full w-full object-cover" />}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  aria-label={`${i + 1}번째 사진 삭제`}
                  className="absolute right-1.5 top-1.5 flex size-4.5 cursor-pointer items-center justify-center rounded-full bg-gray-900 text-white"
                >
                  <XIcon size={12} />
                </button>
              </div>
            )
          })}
          {addTile('size-22.5')}
        </div>
      )}
    </div>
  )
}
