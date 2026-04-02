'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useGetMyProfile,
  useUpdateMyProfileAbout,
  useQueryClient,
  getGetMyProfileQueryKey,
} from '@morton/api-client'
import { TopBar } from '@morton/ui'

export default function EditAboutPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: profile } = useGetMyProfile({ query: { retry: false } })
  const [about, setAbout] = useState(profile?.about ?? '')

  const { mutate: updateAbout, isPending } = useUpdateMyProfileAbout({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() })
        router.back()
      },
    },
  })

  const handleSave = () => {
    updateAbout({ data: { about } })
  }

  return (
    <div className="flex flex-col">
      <TopBar
        variant="default"
        title="소개"
        actionLabel="저장"
        onAction={handleSave}
        showAction
        onBack={() => router.back()}
      />

      <div className="px-4 pt-4">
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="자기소개를 작성해주세요..."
          className="min-h-[400px] w-full resize-none text-r-14 leading-[22.4px] text-morton-gray-900 outline-none placeholder:text-morton-gray-500"
          disabled={isPending}
        />
      </div>
    </div>
  )
}
