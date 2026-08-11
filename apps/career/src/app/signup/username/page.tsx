/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-4289
 * @figma-state 에러 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=617-4273
 */
'use client'

import { useSignupStore } from '@/stores/signup-store'
import { checkUsername } from '@bconnect/api-client'
import { formatIsoDateInput } from '@bconnect/config/date'
import { formatUsername } from '@bconnect/config/username'
import {
  Form,
  FormError,
  FormSubmitButton,
  TextField,
  passthroughError,
  useServerError,
} from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { SignupHeader } from '../_components/SignupHeader'
import { usernameSchema, type UsernameFormData } from './schema'

export default function SignupUsernamePage() {
  const router = useRouter()
  const { formData, setUsername, setName, setBirth, registerError, setRegisterError } =
    useSignupStore()

  const form = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    mode: 'onTouched',
    defaultValues: {
      name: formData.name,
      birth: formData.birth,
      username: formData.username,
    },
  })
  const { control, handleSubmit } = form

  const server = useServerError(control, passthroughError<UsernameFormData>('username'))

  const onSubmit = async (data: UsernameFormData) => {
    // 가입 단계에서 되돌아오며 받은 안내는 재제출 시점에 무효해진다.
    setRegisterError(null)
    try {
      const { available } = await checkUsername({ username: data.username })
      if (!available) {
        form.setError('username', { message: '이미 존재하는 사용자 이름입니다.' })
        return
      }
      setName(data.name)
      setBirth(data.birth)
      setUsername(data.username)
      router.push('/signup/profile')
    } catch (err) {
      server.capture(err, data)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SignupHeader step={2} onBack={() => router.back()} />

      {/* Content */}
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-6 px-4 pt-3">
          {/* Title Section */}
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold leading-[1.4] text-black">
              이름과 서비스에서 사용할 ID를
              <br />
              입력해 주세요
            </h1>

            {/* Name Input */}
            <TextField
              control={control}
              name="name"
              type="text"
              autoComplete="name"
              label="이름"
              required
              placeholder="이름을 입력해주세요"
            />

            {/* Birth Input */}
            <TextField
              control={control}
              name="birth"
              type="text"
              autoComplete="bday"
              inputMode="numeric"
              label="생년월일"
              required
              placeholder="0000-00-00"
              transform={formatIsoDateInput}
            />

            {/* Username Input */}
            <TextField
              control={control}
              name="username"
              type="text"
              autoComplete="username"
              label="사용자 ID"
              description="ID는 프로필과 검색에 활용되며, 한 번 설정하면 변경이 불가해요."
              placeholder="아이디를 입력해주세요"
              transform={formatUsername}
              serverError={server.fieldError('username')}
            />
          </div>

          <FormError error={registerError ?? undefined} />

          {/* Submit Button */}
          <FormSubmitButton size="full">다음으로</FormSubmitButton>
        </form>
      </Form>
    </div>
  )
}
