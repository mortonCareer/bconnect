'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { z } from 'zod'
import { emptyAddressDraft, mapKakaoAddress } from '@bconnect/config/address'
import type { AddressDraft } from '@bconnect/config/address'
import { UnknownSidoError, UNKNOWN_SIDO_MESSAGE } from '@bconnect/config/errors'
import {
  AddressSearchDialog,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormSubmitButton,
  Input,
  ROW_INPUT_CLASSES,
  TextField,
  useDocumentTitle,
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
          <FormSubmitButton variant="ghost" className={EDIT_BUTTON_CLASSES}>
            완료
          </FormSubmitButton>
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

function seedAddress(street: string): AddressDraft {
  return {
    ...emptyAddressDraft(),
    street,
  }
}

function formatAddress({ street, detail }: AddressDraft): string {
  return detail ? `${street} ${detail}` : (street ?? '')
}

function AddressRow({ initialAddress }: { initialAddress: string }) {
  const [address, setAddress] = useState<AddressDraft>(() => seedAddress(initialAddress))
  const [editing, setEditing] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const form = useForm<{ address: AddressDraft }>({ defaultValues: { address } })

  const onDone = form.handleSubmit(({ address: next }) => {
    setAddress(next)
    setEditing(false)
  })

  if (editing) {
    return (
      <Form {...form}>
        <form onSubmit={onDone} className="flex items-start gap-[12px]">
          <span className={`${LABEL_CLASSES} mt-[14px]`} style={LABEL_STYLE}>
            주소
          </span>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="flex w-[360px] flex-col gap-2">
                <FormControl>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="flex h-12 w-full items-center rounded-lg border border-gray-300 px-3 text-left text-r-14 text-gray-700 transition-colors hover:border-primary"
                  >
                    {field.value.street || (
                      <span className="text-gray-400">주소를 검색해주세요</span>
                    )}
                  </button>
                </FormControl>
                <Input
                  value={field.value.detail ?? ''}
                  onChange={(e) => field.onChange({ ...field.value, detail: e.target.value })}
                  placeholder="상세주소를 입력해주세요 (동/호 등)"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormSubmitButton variant="ghost" className={`${EDIT_BUTTON_CLASSES} mt-[14px]`}>
            완료
          </FormSubmitButton>
          <AddressSearchDialog
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            onComplete={(result) => {
              try {
                const detail = form.getValues('address').detail
                form.clearErrors('address')
                form.setValue('address', { ...mapKakaoAddress(result), detail })
              } catch (e) {
                if (!(e instanceof UnknownSidoError)) throw e
                form.setError('address', { type: 'unknown-sido', message: UNKNOWN_SIDO_MESSAGE })
              }
            }}
          />
        </form>
      </Form>
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
          form.reset({ address })
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
  // 탭 title 에 프로젝트명 반영 (리뷰 반영, #785). 로딩 전엔 static fallback('공정표') 유지.
  useDocumentTitle(project ? `${project.title} - 공정표` : undefined)

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
