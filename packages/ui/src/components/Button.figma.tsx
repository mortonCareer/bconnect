import figma from '@figma/code-connect'
import { Button } from './Button'

/**
 * Figma Code Connect - Button 컴포넌트
 *
 * Figma 컴포넌트와 실제 코드를 연결합니다.
 * 이 매핑을 통해 AI가 Figma 디자인을 볼 때 실제 @morton/ui Button을 사용합니다.
 */
figma.connect(
  Button,
  'https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS/-Morton--%EB%94%94%EC%9E%90%EC%9D%B8?node-id=541-3090',
  {
    props: {
      // Figma variant 'state'를 코드의 variant로 매핑
      variant: figma.enum('state', {
        기본: 'primary',
        hover: 'secondary',
      }),
    },
    example: (props) => <Button variant={props.variant}>버튼</Button>,
  }
)

// 다양한 사용 예시를 위한 추가 연결
figma.connect(
  Button,
  'https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS/-Morton--%EB%94%94%EC%9E%90%EC%9D%B8?node-id=541-3090',
  {
    variant: { state: '기본' },
    example: () => (
      <Button variant="primary" size="md">
        확인
      </Button>
    ),
  }
)

figma.connect(
  Button,
  'https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS/-Morton--%EB%94%94%EC%9E%90%EC%9D%B8?node-id=541-3090',
  {
    variant: { state: 'hover' },
    example: () => (
      <Button variant="secondary" size="md">
        취소
      </Button>
    ),
  }
)
