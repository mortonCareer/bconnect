import { BottomNav } from './_components/BottomNav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-screen-sm bg-white">
      <main className="pb-[70px]">{children}</main>
      <BottomNav />
    </div>
  )
}
