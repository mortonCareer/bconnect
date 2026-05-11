interface FormErrorProps {
  message?: string | null
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null

  return <p className="text-r-14 text-bconnect-error">{message}</p>
}
