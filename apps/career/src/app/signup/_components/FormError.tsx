interface FormErrorProps {
  message?: string | null
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null

  return <p className="text-sm leading-[1.6] text-[#FF4242]">{message}</p>
}
