import { create } from 'zustand'

export type SignupStep = 'member' | 'corp' | 'complete'

interface SignupFormData {
  phone: string
  signupToken: string
  username: string
  name: string
}

interface SignupState {
  formData: SignupFormData
  step: SignupStep
  setPhone: (phone: string) => void
  setSignupToken: (token: string) => void
  setMember: (data: { username: string; name: string }) => void
  setStep: (step: SignupStep) => void
  reset: () => void
}

const initialFormData: SignupFormData = {
  phone: '',
  signupToken: '',
  username: '',
  name: '',
}

export const useSignupStore = create<SignupState>()((set) => ({
  formData: initialFormData,
  step: 'member' as SignupStep,

  setPhone: (phone) =>
    set((state) => ({
      formData: { ...state.formData, phone },
    })),

  setSignupToken: (signupToken) =>
    set((state) => ({
      formData: { ...state.formData, signupToken },
    })),

  setMember: ({ username, name }) =>
    set((state) => ({
      formData: { ...state.formData, username, name },
    })),

  setStep: (step) => set({ step }),

  reset: () => set({ formData: initialFormData, step: 'member' }),
}))
