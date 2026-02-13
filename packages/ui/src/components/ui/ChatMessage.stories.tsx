import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatMessage } from './ChatMessage'

const meta = {
  title: 'UI/ChatMessage',
  component: ChatMessage,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['mine', 'theirs', 'typing'],
      description: '메시지 유형',
    },
    message: { control: 'text', description: '메시지 내용' },
    timestamp: { control: 'text', description: '시간 (예: 오후 2:09)' },
    nickname: { control: 'text', description: '상대방 닉네임' },
    profileImage: { control: 'text', description: '상대방 프로필 이미지 URL' },
  },
} satisfies Meta<typeof ChatMessage>

export default meta
type Story = StoryObj<typeof meta>

/** 내 채팅 - 파란색 버블, 오른쪽 정렬 */
export const Mine: Story = {
  args: { variant: 'mine', message: '안녕하세요', timestamp: '오후 2:09' },
}

/** 상대방 채팅 - 회색 버블 + 프로필 */
export const Theirs: Story = {
  args: {
    variant: 'theirs',
    message: '네 안녕하세요! 도배 관련 문의 드릴게요.',
    timestamp: '오후 2:10',
    nickname: '이송목',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop',
  },
}

/** 입력 중 - 타이핑 인디케이터 */
export const Typing: Story = {
  args: {
    variant: 'typing',
    nickname: '이송목',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop',
  },
}

/** 대화 시나리오 */
export const Conversation: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-3 p-4">
      <ChatMessage
        variant="theirs"
        message="안녕하세요, 도배 시공 가능한가요?"
        timestamp="오후 2:09"
        nickname="김건축"
        profileImage="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop"
      />
      <ChatMessage
        variant="mine"
        message="네 가능합니다! 어디 지역이신가요?"
        timestamp="오후 2:10"
      />
      <ChatMessage
        variant="theirs"
        message="경기도 용인이요"
        timestamp="오후 2:11"
        nickname="김건축"
        profileImage="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop"
      />
      <ChatMessage
        variant="typing"
        nickname="김건축"
        profileImage="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop"
      />
    </div>
  ),
  parameters: { layout: 'padded' },
}
