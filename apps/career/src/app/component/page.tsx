'use client'

import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@morton/ui'

export default function ComponentPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Component Preview</h1>

      {/* Button 컴포넌트 */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Button</h2>

        {/* Variants */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Variants</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>

        {/* Sizes */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Sizes</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">X</Button>
          </div>
        </div>

        {/* Disabled */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Disabled</h3>
          <div className="flex flex-wrap gap-4">
            <Button disabled>Default Disabled</Button>
            <Button variant="secondary" disabled>
              Secondary Disabled
            </Button>
            <Button variant="destructive" disabled>
              Destructive Disabled
            </Button>
          </div>
        </div>
      </section>

      {/* Input 컴포넌트 */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Input</h2>

        <div className="mb-6 max-w-md space-y-4">
          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">Default</h3>
            <Input type="text" placeholder="이메일을 입력하세요" />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">With Label</h3>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" placeholder="example@email.com" />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">Disabled</h3>
            <Input type="text" placeholder="비활성화됨" disabled />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">File Input</h3>
            <Input type="file" />
          </div>
        </div>
      </section>

      {/* Card 컴포넌트 */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Card</h2>

        <div className="grid max-w-2xl gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>카드 제목</CardTitle>
              <CardDescription>카드에 대한 설명이 여기에 들어갑니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>카드 본문 내용입니다.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                더 보기
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>알림 설정</CardTitle>
              <CardDescription>알림을 받을 방법을 선택하세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="push">푸시 알림</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="sms">SMS 알림</Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">취소</Button>
              <Button>저장</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Dialog 컴포넌트 */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Dialog</h2>

        <div className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">다이얼로그 열기</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>계정 삭제</DialogTitle>
                <DialogDescription>
                  정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">취소</Button>
                <Button variant="destructive">삭제</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button>로그인</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>로그인</DialogTitle>
                <DialogDescription>계정에 로그인하세요.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">이메일</Label>
                  <Input id="login-email" type="email" placeholder="example@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">비밀번호</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" />
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full">로그인</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </div>
  )
}
