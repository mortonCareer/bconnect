/** 패널 공통 안내/에러 메시지(empty·error). 중앙 정렬 회색 텍스트. */
export function PanelMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-20 text-center">
      <p className="text-r-14 text-gray-500">{children}</p>
    </div>
  )
}
