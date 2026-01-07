import { UserList } from './user-list'

export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold underline mb-4">Hello Career!</h1>
      <h2 className="text-xl mb-2">Users:</h2>
      <UserList />
    </div>
  )
}
