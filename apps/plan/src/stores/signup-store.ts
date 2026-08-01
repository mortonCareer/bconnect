import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type SignupStep = 'member' | 'corp' | 'complete'

interface SignupFormData {
  signupToken: string
  username: string
  name: string
  companyName: string
  bizNumber: string
}

interface SignupState {
  formData: SignupFormData
  step: SignupStep
  /**
   * register(POST /members) 중복 실패를 앞 단계(/signup/member)로 넘기는 1회성 안내.
   * 그 화면에서만 사용자명을 고칠 수 있어 메시지를 함께 되돌린다. persist 대상 아님.
   */
  registerError: string | null
  setSignupToken: (token: string) => void
  setMember: (data: { username: string; name: string }) => void
  setCorp: (data: { companyName: string; bizNumber: string }) => void
  setStep: (step: SignupStep) => void
  setRegisterError: (message: string | null) => void
  reset: () => void
}

const initialFormData: SignupFormData = {
  signupToken: '',
  username: '',
  name: '',
  companyName: '',
  bizNumber: '',
}

export const useSignupStore = create<SignupState>()(
  persist(
    (set) => ({
      formData: initialFormData,
      step: 'member' as SignupStep,
      registerError: null,

      setSignupToken: (signupToken) =>
        set((state) => ({
          formData: { ...state.formData, signupToken },
        })),

      setMember: ({ username, name }) =>
        set((state) => ({
          formData: { ...state.formData, username, name },
        })),

      setCorp: ({ companyName, bizNumber }) =>
        set((state) => ({
          formData: { ...state.formData, companyName, bizNumber },
        })),

      setStep: (step) => set({ step }),

      setRegisterError: (registerError) => set({ registerError }),

      reset: () => set({ formData: initialFormData, step: 'member', registerError: null }),
    }),
    {
      name: 'plan-signup-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ formData: state.formData, step: state.step }),
    }
  )
)
