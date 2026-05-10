import { create } from 'zustand'
import type { Role } from '@bconnect/api-client'

/**
 * plan 회원가입 wizard 상태.
 * step 1 (멤버 생성, #319): username, name, role
 * step 2 (업체 생성, #320): corpName, registrationNumber  ← BE Corp entity 부재로 보류
 * 가입 완료 시점에 멤버+업체 정보 일괄 제출 (BE endpoint 결정 후 확정).
 */
interface SignupFormData {
  phone: string
  signupToken: string
  // member step (#319)
  username: string
  name: string
  role: Role | null
  // corp step (#320) — BE Corp entity 작업 후 활성
  corpName: string
  registrationNumber: string
}

interface SignupState {
  formData: SignupFormData
  setPhone: (phone: string) => void
  setSignupToken: (token: string) => void
  setMember: (member: Partial<Pick<SignupFormData, 'username' | 'name' | 'role'>>) => void
  setCorp: (corp: Partial<Pick<SignupFormData, 'corpName' | 'registrationNumber'>>) => void
  reset: () => void
}

const initialFormData: SignupFormData = {
  phone: '',
  signupToken: '',
  username: '',
  name: '',
  role: null,
  corpName: '',
  registrationNumber: '',
}

export const useSignupStore = create<SignupState>()((set) => ({
  formData: initialFormData,

  setPhone: (phone) =>
    set((state) => ({
      formData: { ...state.formData, phone },
    })),

  setSignupToken: (signupToken) =>
    set((state) => ({
      formData: { ...state.formData, signupToken },
    })),

  setMember: (member) =>
    set((state) => ({
      formData: { ...state.formData, ...member },
    })),

  setCorp: (corp) =>
    set((state) => ({
      formData: { ...state.formData, ...corp },
    })),

  reset: () => set({ formData: initialFormData }),
}))
