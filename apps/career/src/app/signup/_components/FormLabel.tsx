interface FormLabelProps {
  children: React.ReactNode
  required?: boolean
  description?: string
}

export function FormLabel({ children, required, description }: FormLabelProps) {
  return (
    <div className="flex flex-col">
      <label className="text-m-16 text-[#222]">
        {children} {required && <span className="text-bconnect-error">*</span>}
      </label>
      {description && <p className="text-r-12 text-bconnect-gray-700">{description}</p>}
    </div>
  )
}
