export type TaskStatus = 'completed' | 'in_progress' | 'recruited' | 'recruiting' | 'not_started'

export type GanttTask = {
  id: string
  name: string
  category: string
  startDate: string
  endDate: string
  status: TaskStatus
}

export type GanttChartProps = {
  tasks: GanttTask[]
  startDate: string
  endDate: string
  today?: string
}
