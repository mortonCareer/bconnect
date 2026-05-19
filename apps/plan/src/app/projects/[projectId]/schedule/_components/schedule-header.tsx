'use client'

export type ScheduleHeaderProps = {
  projectName: string
  address: string
}

function handleEditPlaceholder() {
  alert('준비 중')
}

export function ScheduleHeader(props: ScheduleHeaderProps) {
  return (
    <header
      data-testid="schedule-header"
      className="flex flex-col gap-[10px] border-b border-solid pt-[28px] pr-[40px] pb-px pl-[40px]"
      style={{ borderColor: '#f0f0f0' }}
    >
      <div
        className="flex h-[26px] w-full items-center gap-[12px]"
        data-testid="schedule-header-project-row"
      >
        <span
          className="w-[60px] shrink-0 whitespace-nowrap font-semibold text-bconnect-gray-500"
          style={{ fontSize: '13px', lineHeight: '19.5px' }}
        >
          프로젝트명
        </span>
        <span
          className="text-sb-14 shrink-0 text-bconnect-gray-900"
          data-testid="schedule-header-project-name"
        >
          {props.projectName}
        </span>
        <button
          type="button"
          onClick={handleEditPlaceholder}
          className="text-r-12 inline-flex h-[26px] w-[42.742px] shrink-0 items-center justify-center rounded-[4px] border border-solid border-bconnect-gray-300 text-bconnect-gray-500"
          data-testid="schedule-header-project-edit"
        >
          수정
        </button>
      </div>
      <div
        className="flex h-[26px] w-full items-center gap-[12px]"
        data-testid="schedule-header-address-row"
      >
        <span
          className="w-[60px] shrink-0 font-semibold text-bconnect-gray-500"
          style={{ fontSize: '13px', lineHeight: '19.5px' }}
        >
          주소
        </span>
        <span
          className="text-r-14 shrink-0"
          style={{ color: '#3d3d3d' }}
          data-testid="schedule-header-address"
        >
          {props.address}
        </span>
        <button
          type="button"
          onClick={handleEditPlaceholder}
          className="text-r-12 inline-flex h-[26px] w-[42.742px] shrink-0 items-center justify-center rounded-[4px] border border-solid border-bconnect-gray-300 text-bconnect-gray-500"
          data-testid="schedule-header-address-edit"
        >
          수정
        </button>
      </div>
    </header>
  )
}
