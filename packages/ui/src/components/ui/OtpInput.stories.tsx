import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { OtpInput } from './OtpInput'

const meta = {
  title: 'UI/OtpInput',
  component: OtpInput,
  tags: ['autodocs'],
  argTypes: {
    remainingTime: { control: 'number', description: '남은 시간 (초)' },
    resendDisabled: { control: 'boolean', description: '재요청 버튼 비활성화' },
    placeholder: { control: 'text', description: '플레이스홀더' },
  },
  args: {
    placeholder: '인증번호 입력',
    onResend: fn(),
  },
} satisfies Meta<typeof OtpInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithTimer: Story = {
  args: { remainingTime: 178 },
}

export const ResendDisabled: Story = {
  args: { remainingTime: 0, resendDisabled: true },
}
