/**
 * @figma-scaffold 쇼케이스 인덱스 — 컴포넌트 검수용, 디자인 N/A
 */
'use client'

import Link from 'next/link'
import {
  Button,
  Tag,
  FilterChip,
  SkillTag,
  CertTag,
  Slider,
  Input,
  Feed,
  TopBar,
  ChatMessage,
  ImageInput,
  FileInput,
  ChevronIcon,
} from '@bconnect/ui'

interface ComponentPreview {
  name: string
  description: string
  href: string
  preview: React.ReactNode
}

const components: ComponentPreview[] = [
  {
    name: 'Button',
    description: '버튼 컴포넌트 (Morton 디자인 시스템)',
    href: '/showcase/button',
    preview: (
      <Button variant="primary" size="sm">
        다음
      </Button>
    ),
  },
  {
    name: 'Tag',
    description: '태그 컴포넌트 (Morton 디자인 시스템)',
    href: '/showcase/tag',
    preview: <Tag variant="selected">도배</Tag>,
  },
  {
    name: 'FilterChip',
    description: '활성 필터 칩 (제거 가능) — 기술자 탐색 필터',
    href: '/showcase/filter-chip',
    preview: <FilterChip label="서울" onRemove={() => undefined} />,
  },
  {
    name: 'SkillTag',
    description: '공종 태그 (선택/미선택) — 기술자 카드',
    href: '/showcase/skill-tag',
    preview: <SkillTag label="도배" selected />,
  },
  {
    name: 'CertTag',
    description: '인증/자격 태그 — 기술자 카드',
    href: '/showcase/cert-tag',
    preview: <CertTag label="본인인증" />,
  },
  {
    name: 'Slider',
    description: '범위(dual-handle) 슬라이더 — 경력 등 범위 선택',
    href: '/showcase/slider',
    preview: (
      <div className="w-56">
        <Slider defaultValue={[2, 7]} min={0} max={10} formatLabel={(n) => `${n}년`} />
      </div>
    ),
  },
  {
    name: 'Input',
    description: '텍스트 입력 컴포넌트 (Morton 디자인 시스템)',
    href: '/showcase/input',
    preview: <Input placeholder="내용을 입력해주세요" className="w-48" />,
  },
  {
    name: 'Feed',
    description: '피드 컴포넌트 (Morton 디자인 시스템)',
    href: '/showcase/feed',
    preview: (
      <div className="w-48 scale-[0.4] origin-center">
        <Feed
          content={{
            images: [
              'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
            ],
            company: '서정 건축',
            duration: '4일 소요',
            timestamp: '3일 전',
            description: '골프장 전원주택 도배 시공을 진행하였습니다.',
          }}
        />
      </div>
    ),
  },
  {
    name: 'TopBar',
    description: '상단 네비게이션 바 (진행바, 기본, 홈)',
    href: '/showcase/topbar',
    preview: (
      <div className="w-full">
        <TopBar variant="progress" step={2} totalSteps={3} />
      </div>
    ),
  },
  {
    name: 'ChatMessage',
    description: '채팅 메시지 컴포넌트 (Morton 디자인 시스템)',
    href: '/showcase/chat-message',
    preview: <ChatMessage variant="mine" message="안녕하세요" timestamp="오후 2:09" />,
  },
  {
    name: 'ImageField',
    description: '이미지 업로드/미리보기/빈상태 (폼: ImageField, 제어: ImageInput)',
    href: '/showcase/image-field',
    preview: (
      <div className="w-40 origin-center scale-[0.5]">
        <ImageInput value={null} onChange={() => undefined} />
      </div>
    ),
  },
  {
    name: 'FileField',
    description: '파일(문서) 업로드 — outline 트리거→파일명 칩 (폼: FileField, 제어: FileInput)',
    href: '/showcase/file-field',
    preview: (
      <div className="w-44">
        <FileInput value={null} onChange={() => undefined} />
      </div>
    ),
  },
]

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">컴포넌트 라이브러리</h1>
          <p className="mt-2 text-gray-600">Morton 디자인 시스템 컴포넌트 미리보기</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {components.map((component) => (
            <Link
              key={component.name}
              href={component.href}
              className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-primary hover:shadow-md"
            >
              {/* Preview Area */}
              <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-gray-50">
                {component.preview}
              </div>

              {/* Component Info */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-primary">
                  {component.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{component.description}</p>
              </div>

              {/* Arrow indicator */}
              <div className="mt-4 flex items-center text-sm text-gray-400 group-hover:text-primary">
                <span>상세보기</span>
                <ChevronIcon
                  direction="right"
                  className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
