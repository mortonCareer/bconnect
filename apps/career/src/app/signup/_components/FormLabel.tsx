interface FormLabelProps {
  children: React.ReactNode
  required?: boolean
  description?: string
}

export function FormLabel({ children, required, description }: FormLabelProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm leading-[1.6] text-[#1B1B1B]">
        {children}
        {required && <span className="text-[#FF4242]">*</span>}
      </label>
      {description && <p className="text-xs leading-[1.6] text-[#9C9C9C]">{description}</p>}
    </div>
  )
}
