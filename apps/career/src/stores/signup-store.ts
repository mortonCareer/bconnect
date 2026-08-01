import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface SignupFormData {
  username: string
  signupToken: string
  name: string
  fields: string[]
  primaryField: string | null
  experience: number | null
}

interface SignupState {
  formData: SignupFormData
  /**
   * register(POST /members) 중복 실패를 앞 단계(/signup/username)로 넘기는 1회성 안내.
   * 그 화면에서만 사용자명을 고칠 수 있어 메시지를 함께 되돌린다. persist 대상 아님.
   */
  registerError: string | null
  setUsername: (username: string) => void
  setName: (name: string) => void
  setSignupToken: (token: string) => void
  setProfile: (profile: Partial<Omit<SignupFormData, 'username' | 'signupToken'>>) => void
  setRegisterError: (message: string | null) => void
  reset: () => void
}

const initialFormData: SignupFormData = {
  username: '',
  signupToken: '',
  name: '',
  fields: [],
  primaryField: null,
  experience: null,
}

export const useSignupStore = create<SignupState>()(
  persist(
    (set) => ({
      formData: initialFormData,
      registerError: null,

      setUsername: (username) =>
        set((state) => ({
          formData: { ...state.formData, username },
        })),

      setName: (name) =>
        set((state) => ({
          formData: { ...state.formData, name },
        })),

      setSignupToken: (signupToken) =>
        set((state) => ({
          formData: { ...state.formData, signupToken },
        })),

      setProfile: (profile) =>
        set((state) => ({
          formData: { ...state.formData, ...profile },
        })),

      setRegisterError: (registerError) => set({ registerError }),

      reset: () => set({ formData: initialFormData, registerError: null }),
    }),
    {
      name: 'career-signup-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ formData: state.formData }),
    }
  )
)
