import { create } from 'zustand'

export type SignupStep = 'member' | 'corp' | 'complete'

interface SignupFormData {
  phone: string
  signupToken: string
  username: string
  name: string
  companyName: string
  bizNumber: string
}

interface SignupState {
  formData: SignupFormData
  step: SignupStep
  setPhone: (phone: string) => void
  setSignupToken: (token: string) => void
  setMember: (data: { username: string; name: string }) => void
  setCorp: (data: { companyName: string; bizNumber: string }) => void
  setStep: (step: SignupStep) => void
  reset: () => void
}

const initialFormData: SignupFormData = {
  phone: '',
  signupToken: '',
  username: '',
  name: '',
  companyName: '',
  bizNumber: '',
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

  setCorp: ({ companyName, bizNumber }) =>
    set((state) => ({
      formData: { ...state.formData, companyName, bizNumber },
    })),

  setStep: (step) => set({ step }),

  reset: () => set({ formData: initialFormData, step: 'member' }),
}))
