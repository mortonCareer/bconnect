import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from './Input'

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'error'],
      description: '입력 필드 스타일',
    },
    errorMessage: { control: 'text', description: '에러 메시지 (하단 표시)' },
    placeholder: { control: 'text', description: '플레이스홀더 텍스트' },
    disabled: { control: 'boolean', description: '비활성화 상태' },
  },
  args: { placeholder: '내용을 입력해주세요' },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Error: Story = {
  args: { variant: 'error' },
}

export const ErrorWithMessage: Story = {
  args: { variant: 'error', errorMessage: '올바른 형식이 아닙니다' },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const WithValue: Story = {
  args: { defaultValue: '이송목' },
}
