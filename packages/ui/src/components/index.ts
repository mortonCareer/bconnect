// @bconnect/ui - Components
export { Button, buttonVariants } from './ui/Button'
export { Input, inputVariants } from './ui/Input'
export { OtpInput } from './ui/OtpInput'
export { TopBar, topBarVariants } from './ui/TopBar'
export { Tag, tagVariants } from './ui/Tag'
export { Feed, feedVariants } from './ui/Feed'
export { Tab } from './ui/Tab'
export type { TabProps, TabItem } from './ui/Tab'
export { SelectDropdown, MultiSelectDropdown } from './ui/SelectDropdown'
export type { SelectDropdownOption } from './ui/SelectDropdown'
export { ChatMessage, chatBubbleVariants } from './ui/ChatMessage'
export { ChatInput } from './ui/ChatInput'
export { ChatListItem, chatListItemVariants } from './ui/ChatListItem'
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/shadcn/accordion'

// shadcn Form suite (ADR 0013 / #400) — shadcn 디렉토리에 격리, 우리 wrapper 는 ui/ 루트
export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  useFormField,
} from './ui/shadcn/form'
export { Label } from './ui/shadcn/label'
export { TextField } from './ui/form/TextField'
export { TextareaField } from './ui/form/TextareaField'
export { SelectField } from './ui/form/SelectField'
export type { SelectFieldOption } from './ui/form/SelectField'
export { FormError } from './ui/form/FormError'
export { FormSubmitButton } from './ui/form/FormSubmitButton'
