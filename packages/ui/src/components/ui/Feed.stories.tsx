import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Feed } from './Feed'

const sampleProfile = {
  image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop',
  name: '이송목',
  location: '경기도',
  jobType: '준기공',
  specialty: '도배',
  bio: '안녕하세요, 도배 준기공 이송목입니다.',
}

const sampleContent = {
  image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
  company: '서정 건축',
  duration: '4일 소요',
  timestamp: '3일 전',
  description:
    '골프장 전원주택 도배 시공을 진행하였습니다. 고급 실크 벽지를 사용하여 세밀한 패턴 맞춤과 이음새 처리를 완벽하게 마무리했습니다.',
}

const meta = {
  title: 'UI/Feed',
  component: Feed,
  tags: ['autodocs'],
  args: { profile: sampleProfile, content: sampleContent, onToggle: fn() },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Feed>

export default meta
type Story = StoryObj<typeof meta>

/** 접힌 상태 (기본) */
export const Collapsed: Story = {}

/** 펼친 상태 */
export const Expanded: Story = {
  args: { defaultExpanded: true },
}

/** 짧은 본문 (더보기 없음) */
export const ShortContent: Story = {
  args: {
    content: { ...sampleContent, description: '간단한 도배 시공' },
  },
}
