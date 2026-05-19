import type { TaskStatus } from './gantt-chart/types'

export type ProjectInfo = { id: string; name: string; address: string }
export type SidebarUser = { name: string; role: string }
export type SidebarProjectMenuItem = {
  label: string
  slug: 'schedule' | 'recruit' | 'docs'
}
export type TaskAssignee = {
  name: string
  region: string
  level: string
  specialty: string
}
export type TaskRow = {
  id: string
  category: string
  status: TaskStatus
  assignee?: TaskAssignee
}
