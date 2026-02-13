import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Tag } from './Tag'

const meta = {
  title: 'UI/Tag',
  component: Tag,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'selected', 'filter'],
      description: '태그 스타일',
    },
    size: {
      control: 'select',
      options: ['default', 'sm'],
      description: '태그 크기',
    },
    children: { control: 'text', description: '태그 텍스트' },
  },
  args: { children: '도배' },
} satisfies Meta<typeof Tag>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Selected: Story = {
  args: { variant: 'selected' },
}

export const Filter: Story = {
  args: { variant: 'filter', onRemove: fn() },
}

export const Small: Story = {
  args: { size: 'sm' },
}

/** 태그 목록 예시 */
export const TagGroup: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Tag variant="selected">도배</Tag>
      <Tag>타일</Tag>
      <Tag>마루</Tag>
      <Tag variant="filter" onRemove={() => {}}>
        경기도
      </Tag>
    </div>
  ),
}
