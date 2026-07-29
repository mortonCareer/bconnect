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
  setUsername: (username: string) => void
  setName: (name: string) => void
  setSignupToken: (token: string) => void
  setProfile: (profile: Partial<Omit<SignupFormData, 'username' | 'signupToken'>>) => void
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

      reset: () => set({ formData: initialFormData }),
    }),
    {
      name: 'career-signup-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ formData: state.formData }),
    }
  )
)
