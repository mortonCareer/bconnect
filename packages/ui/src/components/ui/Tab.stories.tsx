import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Tab } from './Tab'

const meta = {
  title: 'UI/Tab',
  component: Tab,
  tags: ['autodocs'],
  argTypes: {
    activeKey: { control: 'text', description: '현재 선택된 탭 key' },
  },
  args: {
    items: [
      { key: 'feed', label: '피드' },
      { key: 'profile', label: '프로필' },
      { key: 'chat', label: '채팅' },
    ],
    activeKey: 'feed',
    onChange: fn(),
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Tab>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SecondTabActive: Story = {
  args: { activeKey: 'profile' },
}

export const TwoTabs: Story = {
  args: {
    items: [
      { key: 'all', label: '전체' },
      { key: 'mine', label: '내 글' },
    ],
    activeKey: 'all',
  },
}
