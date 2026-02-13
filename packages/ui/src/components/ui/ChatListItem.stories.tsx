import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatListItem } from './ChatListItem'

const meta = {
  title: 'UI/ChatListItem',
  component: ChatListItem,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'badge'],
      description: '리스트 아이템 유형',
    },
    name: { control: 'text', description: '이름' },
    location: { control: 'text', description: '지역' },
    jobType: { control: 'text', description: '직종' },
    specialty: { control: 'text', description: '전문분야' },
    lastMessage: { control: 'text', description: '마지막 메시지 미리보기' },
    timestamp: { control: 'text', description: '시간 (badge variant)' },
    unreadCount: { control: 'number', description: '읽지 않은 수 (badge variant)' },
  },
  args: {
    name: '이송목',
    location: '경기도',
    jobType: '준기공',
    specialty: '도배',
    lastMessage: '네 내일 오전에 방문 가능합니다',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop',
  },
} satisfies Meta<typeof ChatListItem>

export default meta
type Story = StoryObj<typeof meta>

/** 기본 - chevron 아이콘 */
export const Default: Story = {}

/** 뱃지 - 시간 + 읽지 않은 수 */
export const Badge: Story = {
  args: { variant: 'badge', timestamp: '오후 2:09', unreadCount: 3 },
}

/** 뱃지 - 읽지 않은 수 없음 */
export const BadgeNoUnread: Story = {
  args: { variant: 'badge', timestamp: '어제' },
}

/** 채팅 리스트 */
export const ChatList: Story = {
  render: () => (
    <div className="flex w-full flex-col">
      <ChatListItem
        variant="badge"
        name="이송목"
        location="경기도"
        jobType="준기공"
        specialty="도배"
        lastMessage="네 내일 오전에 방문 가능합니다"
        timestamp="오후 2:09"
        unreadCount={3}
        profileImage="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop"
      />
      <ChatListItem
        variant="badge"
        name="김타일"
        location="서울"
        jobType="기공"
        specialty="타일"
        lastMessage="견적 보내드렸습니다"
        timestamp="어제"
        profileImage="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop"
      />
      <ChatListItem
        variant="badge"
        name="박마루"
        location="인천"
        jobType="준기공"
        specialty="마루"
        lastMessage="감사합니다"
        timestamp="2일 전"
        profileImage="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop"
      />
    </div>
  ),
  parameters: { layout: 'padded' },
}
