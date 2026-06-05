import { Logo } from '@bconnect/ui'

export function SidebarFooter() {
  return (
    <div className="flex flex-col gap-3 p-5">
      <Logo width={70} height={24} />
      <p className="text-r-12 text-gray-500">무료 요금제</p>
    </div>
  )
}
