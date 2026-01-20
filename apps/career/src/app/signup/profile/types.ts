export type ConstructionField =
  | 'tile'
  | 'wallpaper'
  | 'flooring'
  | 'carpentry'
  | 'demolition'
  | 'cleaning'
  | 'electrical'
  | 'plumbing'

export type ExperienceLevel = 'newcomer' | '1-3' | '3-5' | '5-10' | '10+'

export interface FieldOption {
  id: ConstructionField
  emoji: string
  label: string
}

export interface ExperienceOption {
  id: ExperienceLevel
  label: string
}
