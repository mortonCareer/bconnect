'use client'

import { useGetMembers, type Member } from '@morton/api-client'

export function MemberList() {
  const { data, isSuccess, error } = useGetMembers()

  if (error) return <div>Error: {(error as Error).message}</div>
  if (!isSuccess) return <div>Loading...</div>

  return (
    <ul>
      {data.map((member: Member) => (
        <li key={member.id}>
          {member.name} (@{member.username})
        </li>
      ))}
    </ul>
  )
}
