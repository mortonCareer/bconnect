/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=969-1804
 */
import type { SVGProps } from 'react'

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 322 112"
      fill="none"
      role="img"
      aria-label="품앗이"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M101 63H58V84H42V63H0V47H101V63Z" fill="#386DFF" />
      <path d="M207 24.3243H218V39.8919H207V72H191V0H207V24.3243Z" fill="#386DFF" />
      <path d="M322 0L322 72L306 72L306 0L322 0Z" fill="#386DFF" />
      <path
        d="M96 16H80.5V26.5H96V42.5H4V26.5H19V16H4V0H96V16ZM35 26.5H64.5V16H35V26.5Z"
        fill="#386DFF"
      />
      <path d="M98 72V110H3V72H98ZM19 94H82V88H19V94Z" fill="#386DFF" />
      <path
        d="M247 45L231 45L231 29L247 29L247 45ZM260 58L267 58C274.18 58 280 52.1797 280 45L280 29C280 21.8203 274.18 16 267 16L260 16C252.82 16 247 21.8203 247 29L231 29C231 13.2338 243.581 0.406544 259.252 0.00976686L260 0L267 0C283.016 0 296 12.9837 296 29L296 45L295.99 45.748C295.593 61.4186 282.766 74 267 74L260 74C244.234 74 231.407 61.4186 231.01 45.748L231 45L247 45C247 52.1797 252.82 58 260 58Z"
        fill="#386DFF"
      />
      <path
        d="M160 31C160 23.1908 153.319 16 144 16C134.681 16 128 23.1908 128 31C128 38.8092 134.681 46 144 46V62C126.327 62 112 48.1208 112 31C112 13.8792 126.327 0 144 0C161.673 0 176 13.8792 176 31C176 48.1208 161.673 62 144 62V46C153.319 46 160 38.8092 160 31Z"
        fill="#386DFF"
      />
      <rect x="254" y="95" width="68" height="16" fill="#96B2FF" />
      <path
        d="M112 103.5C124.5 103.5 158.5 90 158.5 72C158.5 82 166.5 103.5 243 103.5"
        stroke="#386DFF"
        strokeWidth="15"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}
