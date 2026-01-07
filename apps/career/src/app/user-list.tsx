'use client'

import { useGetUsers, type User } from '@morton/api-client'

export function UserList() {
  const { data, isSuccess, error } = useGetUsers()

  if (error) return <div>Error: {(error as Error).message}</div>
  if (!isSuccess) return <div>Loading...</div>

  return (
    <ul>
      {data.map((user: User) => (
        <li key={user.id}>
          {user.name} (@{user.username})
        </li>
      ))}
    </ul>
  )
}
