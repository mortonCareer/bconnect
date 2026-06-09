'use client'

export type ScheduleHeaderProps = {
  projectName: string
  address: string
}

function handleEditPlaceholder() {
  alert('준비 중')
}

function EditButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={handleEditPlaceholder}
      aria-label={`${label} 수정`}
      className="text-r-12 inline-flex h-[26px] w-[42.742px] shrink-0 items-center justify-center rounded-[4px] border border-solid border-gray-300 text-gray-500"
    >
      수정
    </button>
  )
}

export function ScheduleHeader({ projectName, address }: ScheduleHeaderProps) {
  return (
    <header
      data-testid="schedule-header"
      className="flex flex-col gap-[10px] border-b border-solid border-[#f0f0f0] pb-[22px]"
    >
      <div
        className="flex h-[26px] items-center gap-[12px]"
        data-testid="schedule-header-project-row"
      >
        <span
          className="w-[60px] shrink-0 whitespace-nowrap font-semibold text-gray-500"
          style={{ fontSize: '13px', lineHeight: '19.5px' }}
        >
          프로젝트명
        </span>
        <span
          className="text-sb-14 shrink-0 text-gray-900"
          data-testid="schedule-header-project-name"
        >
          {projectName}
        </span>
        <EditButton label="프로젝트명" />
      </div>
      <div
        className="flex h-[26px] items-center gap-[12px]"
        data-testid="schedule-header-address-row"
      >
        <span
          className="w-[60px] shrink-0 font-semibold text-gray-500"
          style={{ fontSize: '13px', lineHeight: '19.5px' }}
        >
          주소
        </span>
        <span
          className="text-r-14 shrink-0"
          style={{ color: '#3d3d3d' }}
          data-testid="schedule-header-address"
        >
          {address}
        </span>
        <EditButton label="주소" />
      </div>
    </header>
  )
}
