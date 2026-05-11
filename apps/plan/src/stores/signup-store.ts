import { create } from 'zustand'

interface SignupFormData {
  phone: string
  signupToken: string
}

interface SignupState {
  formData: SignupFormData
  setPhone: (phone: string) => void
  setSignupToken: (token: string) => void
  reset: () => void
}

const initialFormData: SignupFormData = {
  phone: '',
  signupToken: '',
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

  reset: () => set({ formData: initialFormData }),
}))
