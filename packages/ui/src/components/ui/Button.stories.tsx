import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Button } from './Button'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost'],
      description: '버튼 스타일 변형',
      table: {
        type: { summary: '"primary" | "secondary" | "outline" | "ghost"' },
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'full'],
      description: '버튼 크기',
      table: {
        type: { summary: '"default" | "sm" | "full"' },
        defaultValue: { summary: 'default' },
      },
    },
    isLoading: { control: 'boolean', description: '로딩 상태' },
    loadingText: { control: 'text', description: '로딩 중 표시 텍스트' },
    disabled: { control: 'boolean', description: '비활성화 상태' },
    children: { control: 'text', description: '버튼 텍스트' },
  },
  args: { children: '다음', onClick: fn() },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/** 활성 - 파란색 배경 (#386DFF) */
export const Primary: Story = {
  args: { variant: 'primary' },
}

/** 비활성 - 회색 배경 (#F4F4F4) */
export const Secondary: Story = {
  args: { variant: 'secondary' },
}

/** 활성_stroke - 파란색 테두리 */
export const Outline: Story = {
  args: { variant: 'outline' },
}

/** 비활성_stroke - 회색 테두리 */
export const Ghost: Story = {
  args: { variant: 'ghost' },
}

/** Small 사이즈 (206x40) */
export const Small: Story = {
  args: { variant: 'primary', size: 'sm' },
}

/** Full Width */
export const FullWidth: Story = {
  args: { variant: 'primary', size: 'full' },
}

/** 로딩 상태 */
export const Loading: Story = {
  args: { variant: 'primary', isLoading: true, loadingText: '처리 중...' },
}

/** 비활성화 상태 */
export const Disabled: Story = {
  args: { variant: 'primary', disabled: true },
}

/** 모든 variant를 한눈에 비교 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <p className="text-sb-14 text-morton-gray-700">Default Size (360x50)</p>
        <Button variant="primary">Primary - 활성</Button>
        <Button variant="secondary">Secondary - 비활성</Button>
        <Button variant="outline">Outline - 활성_stroke</Button>
        <Button variant="ghost">Ghost - 비활성_stroke</Button>
      </div>
      <div className="space-y-2">
        <p className="text-sb-14 text-morton-gray-700">Small Size (206x40)</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm">
            Primary
          </Button>
          <Button variant="secondary" size="sm">
            Secondary
          </Button>
          <Button variant="outline" size="sm">
            Outline
          </Button>
          <Button variant="ghost" size="sm">
            Ghost
          </Button>
        </div>
      </div>
    </div>
  ),
}
