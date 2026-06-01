import Image from 'next/image'

export function SidebarFooter() {
  return (
    <div className="flex flex-col gap-3 p-5">
      <Image src="/logo.png" alt="품앗이" width={70} height={24} priority />
      <p className="text-r-12 text-gray-500">무료 요금제</p>
    </div>
  )
}
