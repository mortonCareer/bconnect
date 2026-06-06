import { create } from 'zustand'
import type { ExperienceRange } from '@/lib/experience-range'

interface SignupFormData {
  phone: string
  username: string
  signupToken: string
  name: string
  fields: string[]
  primaryField: string | null
  experience: ExperienceRange | null
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
