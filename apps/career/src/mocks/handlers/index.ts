import { authHandlers } from './auth'
import { membersHandlers } from './members'
import { profilesHandlers } from './profiles'
import { credentialsHandlers } from './credentials'
import { coworkersHandlers } from './coworkers'
import { coworkerRequestsHandlers } from './coworker-requests'
import { feedsHandlers } from './feeds'
import { postsHandlers } from './posts'
import { tasksHandlers } from './tasks'
import { chatsHandlers } from './chats'
import { recommendationsHandlers } from './recommendations'
import { devicesHandlers } from './devices'

export const handlers = [
  ...authHandlers,
  ...membersHandlers,
  ...profilesHandlers,
  ...credentialsHandlers,
  ...coworkersHandlers,
  ...coworkerRequestsHandlers,
  ...feedsHandlers,
  ...postsHandlers,
  ...tasksHandlers,
  ...chatsHandlers,
  ...recommendationsHandlers,
  ...devicesHandlers,
]
