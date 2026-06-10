export type TaskStatus = 'completed' | 'in_progress' | 'recruited' | 'recruiting' | 'not_started'

export type TaskAssignee = {
  profileId: number
  name: string
  region: string
  level: string
  specialty: string
}

export type ScheduleTask = {
  id: string
  category: string
  ganttName: string
  startDate: string
  endDate: string
  status: TaskStatus
  assignee?: TaskAssignee
}

export type ScheduleGridProps = {
  tasks: ScheduleTask[]
  startDate: string
  endDate: string
  today?: string
}
