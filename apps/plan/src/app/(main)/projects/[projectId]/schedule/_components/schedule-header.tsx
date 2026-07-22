'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { z } from 'zod'
import { mapKakaoAddress } from '@bconnect/config/address'
import { UnknownSidoError, UNKNOWN_SIDO_MESSAGE } from '@bconnect/config/errors'
import {
  AddressSearchDialog,
  Button,
  Form,
  Input,
  ROW_INPUT_CLASSES,
  TextField,
} from '@bconnect/ui'
import { useGetProject } from '@bconnect/api-client'
import type { Address } from '@bconnect/api-client'

export type ScheduleHeaderProps = {
  projectId: string
}

const EDIT_BUTTON_CLASSES =
  'text-r-12 h-[26px] w-fit shrink-0 rounded-[4px] border-gray-300 px-[11px] font-normal'

const LABEL_CLASSES = 'w-[60px] shrink-0 whitespace-nowrap font-semibold text-gray-500'
const LABEL_STYLE = { fontSize: '13px', lineHeight: '19.5px' } as const

const projectNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '프로젝트명을 입력해주세요')
    .max(50, '프로젝트명은 50자 이내로 입력해주세요'),
})
type ProjectNameValues = z.infer<typeof projectNameSchema>

function ProjectNameRow({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName)
  const [editing, setEditing] = useState(false)
  const form = useForm<ProjectNameValues>({
    resolver: zodResolver(projectNameSchema),
    mode: 'onTouched',
    defaultValues: { name: initialName },
  })

  const onDone = form.handleSubmit((values) => {
    setName(values.name.trim())
    setEditing(false)
  })

  if (editing) {
    return (
      <Form {...form}>
        <form onSubmit={onDone} className="flex w-fit items-center gap-[12px]">
          <span className={LABEL_CLASSES} style={LABEL_STYLE}>
            프로젝트명
          </span>
          <div className="w-[280px]">
            <TextField
              control={form.control}
              name="name"
              className={`${ROW_INPUT_CLASSES} text-sb-14 text-gray-900`}
              autoFocus
            />
          </div>
          <Button type="submit" variant="ghost" className={EDIT_BUTTON_CLASSES}>
            완료
          </Button>
        </form>
      </Form>
    )
  }

  return (
    <div className="flex h-[26px] items-center gap-[12px]">
      <span className={LABEL_CLASSES} style={LABEL_STYLE}>
        프로젝트명
      </span>
      <span className="text-sb-14 shrink-0 text-gray-900">{name}</span>
      <Button
        variant="ghost"
        type="button"
        onClick={() => {
          form.reset({ name })
          setEditing(true)
        }}
        aria-label="프로젝트명 수정"
        className={EDIT_BUTTON_CLASSES}
      >
        수정
      </Button>
    </div>
  )
}

function seedAddress(street: string): Address {
  return { zipcode: '', street, state: '', city: '', detail: undefined, latitude: 0, longitude: 0 }
}

function formatAddress({ street, detail }: Address): string {
  return detail ? `${street} ${detail}` : (street ?? '')
}

function AddressRow({ initialAddress }: { initialAddress: string }) {
  const [address, setAddress] = useState<Address>(() => seedAddress(initialAddress))
  const [draft, setDraft] = useState<Address>(address)
  const [editing, setEditing] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [sidoError, setSidoError] = useState<string | null>(null)

  if (editing) {
    return (
      <div className="flex items-start gap-[12px]">
        <span className={`${LABEL_CLASSES} mt-[14px]`} style={LABEL_STYLE}>
          주소
        </span>
        <div className="flex w-[360px] flex-col gap-2">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex h-12 w-full items-center rounded-lg border border-gray-300 px-3 text-left text-r-14 text-gray-700 transition-colors hover:border-primary"
          >
            {draft.street || <span className="text-gray-400">주소를 검색해주세요</span>}
          </button>
          <Input
            value={draft.detail ?? ''}
            onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
            placeholder="상세주소를 입력해주세요 (동/호 등)"
          />
          {sidoError && <p className="text-r-12 text-destructive">{sidoError}</p>}
        </div>
        <Button
          type="button"
          variant="ghost"
          className={`${EDIT_BUTTON_CLASSES} mt-[14px]`}
          onClick={() => {
            setAddress(draft)
            setEditing(false)
          }}
        >
          완료
        </Button>
        <AddressSearchDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onComplete={(result) => {
            try {
              setDraft({ ...mapKakaoAddress(result), detail: draft.detail })
              setSidoError(null)
            } catch (e) {
              if (!(e instanceof UnknownSidoError)) throw e
              setSidoError(UNKNOWN_SIDO_MESSAGE)
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex h-[26px] items-center gap-[12px]">
      <span className={LABEL_CLASSES} style={LABEL_STYLE}>
        주소
      </span>
      <span className="text-r-14 shrink-0" style={{ color: '#3d3d3d' }}>
        {formatAddress(address)}
      </span>
      <Button
        variant="ghost"
        type="button"
        onClick={() => {
          setDraft(address)
          setSidoError(null)
          setEditing(true)
        }}
        aria-label="주소 수정"
        className={EDIT_BUTTON_CLASSES}
      >
        수정
      </Button>
    </div>
  )
}

export function ScheduleHeader({ projectId }: ScheduleHeaderProps) {
  const { data: project } = useGetProject(Number(projectId))

  return (
    <header className="flex min-h-[110px] flex-col gap-[10px] border-b border-solid border-[#f0f0f0] px-10 pt-7 pb-[22px]">
      {/* 편집 행은 로컬 상태 초기값이라 로드 완료 후 마운트 (useUpdateProject 연동은 후속) */}
      {project && (
        <>
          <ProjectNameRow initialName={project.title ?? ''} />
          <AddressRow initialAddress={formatAddress(project.address ?? {})} />
        </>
      )}
    </header>
  )
}
