import type { CreateProfileRequest } from '@bconnect/api-client'
import { create } from 'zustand'

interface SignupFormData {
  phone: string
  username: string
  signupToken: string
  name: string
  fields: string[]
  primaryField: string | null
  experience: number | null
  /**
   * register(회원 생성)는 세션 토큰을 발급하지 않는다 → createProfile(인증 필요)을
   * 바로 호출할 수 없어, 프로필 입력값을 여기 보관했다가 재인증(/signup/verify)으로
   * accessToken 확보 후 생성한다. (BE 계약: POST /members 는 memberId 만 반환)
   */
  pendingProfile: CreateProfileRequest | null
}

interface SignupState {
  formData: SignupFormData
  setPhone: (phone: string) => void
  setUsername: (username: string) => void
  setSignupToken: (token: string) => void
  setProfile: (profile: Partial<Omit<SignupFormData, 'phone' | 'username' | 'signupToken'>>) => void
  setPendingProfile: (profile: CreateProfileRequest) => void
  reset: () => void
}

const initialFormData: SignupFormData = {
  phone: '',
  username: '',
  signupToken: '',
  name: '',
  fields: [],
  primaryField: null,
  experience: null,
  pendingProfile: null,
}

export const useSignupStore = create<SignupState>()((set) => ({
  formData: initialFormData,

  setPhone: (phone) =>
    set((state) => ({
      formData: { ...state.formData, phone },
    })),

  setUsername: (username) =>
    set((state) => ({
      formData: { ...state.formData, username },
    })),

  setSignupToken: (signupToken) =>
    set((state) => ({
      formData: { ...state.formData, signupToken },
    })),

  setProfile: (profile) =>
    set((state) => ({
      formData: { ...state.formData, ...profile },
    })),

  setPendingProfile: (pendingProfile) =>
    set((state) => ({
      formData: { ...state.formData, pendingProfile },
    })),

  reset: () => set({ formData: initialFormData }),
}))
