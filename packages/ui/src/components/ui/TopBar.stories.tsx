import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { TopBar } from './TopBar'

const meta = {
  title: 'UI/TopBar',
  component: TopBar,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['progress', 'default', 'home'],
      description: '상단바 유형',
    },
    step: { control: 'number', description: '현재 진행 단계' },
    totalSteps: { control: 'number', description: '전체 단계 수' },
    title: { control: 'text', description: '페이지 제목 (default variant)' },
    actionLabel: { control: 'text', description: '액션 버튼 텍스트' },
    showAction: { control: 'boolean', description: '액션 버튼 표시 여부' },
    chatCount: { control: 'number', description: '읽지 않은 채팅 수 (home variant)' },
  },
  args: { onBack: fn(), onAction: fn(), onFilter: fn(), onChat: fn() },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TopBar>

export default meta
type Story = StoryObj<typeof meta>

/** 회원가입 플로우 진행바 */
export const Progress: Story = {
  args: { variant: 'progress', step: 2, totalSteps: 3 },
}

/** 기본 - 제목 + 액션 버튼 */
export const Default: Story = {
  args: { variant: 'default', title: '프로필 수정' },
}

/** 기본 - 액션 버튼 숨김 */
export const DefaultNoAction: Story = {
  args: { variant: 'default', title: '상세보기', showAction: false },
}

/** 홈 - 필터 + 채팅 아이콘 */
export const Home: Story = {
  args: { variant: 'home' },
}

/** 홈 - 읽지 않은 채팅 뱃지 */
export const HomeWithBadge: Story = {
  args: { variant: 'home', chatCount: 3 },
}
