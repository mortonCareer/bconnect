// @bconnect/ui - Components
export { Button, buttonVariants } from './ui/Button'
export { Input, inputVariants } from './ui/Input'
export { OtpInput } from './ui/OtpInput'
export { TopBar, topBarVariants } from './ui/TopBar'
export { Tag, tagVariants } from './ui/Tag'
export { Feed, feedVariants } from './ui/Feed'
export { Tab } from './ui/Tab'
export type { TabProps, TabItem } from './ui/Tab'
export { ChatMessage, chatBubbleVariants } from './ui/ChatMessage'
export { ChatInput } from './ui/ChatInput'
export { ChatListItem, chatListItemVariants } from './ui/ChatListItem'
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from './ui/primitives/accordion'

// shadcn Form suite (ADR 0013 / #400) — primitives 디렉토리에 격리, 우리 wrapper 는 ui/ 루트
export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  useFormField,
} from './ui/primitives/form'
export { Label } from './ui/primitives/label'
export { TextField } from './ui/TextField'
export { FormError } from './ui/FormError'
export { FormSubmitButton } from './ui/FormSubmitButton'
