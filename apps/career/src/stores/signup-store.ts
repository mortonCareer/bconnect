import { create } from 'zustand'

/**
 * 시공분야 타입
 */
type ConstructionField =
  | 'tile'
  | 'wallpaper'
  | 'flooring'
  | 'carpentry'
  | 'demolition'
  | 'cleaning'
  | 'electrical'
  | 'plumbing'

/**
 * 경력 타입
 */
type ExperienceLevel = 'newcomer' | '1-3' | '3-5' | '5-10' | '10+'

/**
 * 회원가입 폼 데이터
 *
 * 멀티 페이지 폼에서 페이지 간 데이터 공유를 위한 최소한의 상태만 저장합니다.
 * 각 페이지의 validation은 React Hook Form이 담당합니다.
 */
interface SignupFormData {
  phone: string
  username: string
  signupToken: string
  name: string
  fields: ConstructionField[]
  primaryField: ConstructionField | null
  experience: ExperienceLevel | null
  affiliation: string
}

interface SignupState {
  formData: SignupFormData
  setPhone: (phone: string) => void
  setUsername: (username: string) => void
  setSignupToken: (token: string) => void
  setProfile: (profile: Partial<Omit<SignupFormData, 'phone' | 'username' | 'signupToken'>>) => void
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
  affiliation: '',
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

  reset: () => set({ formData: initialFormData }),
}))
