# 가이드라인
- 코드를 작성할 때는 사용자가 승낙한 사항만 구현하세요.
- 작성된 계획은 반드시 사용자에게 검토받으세요.
- 일반적인 구현 요청시 인터페이스 변경을 최소화하고, 필요한 경우 사용자에게 검토받으세요.
- 코드를 작성할 때는 래퍼런스 문서를 참고해서 작성하고, 프로젝트 내에 유사한 코드가 있다면 톤앤매너를 맞추세요.
- 권장 사항과 사용자가 승낙한 사항을 명백하게 구분하고, 모호한 경우 질문하세요.
- 요청한 내용이 아닌 과도한 설계 · 구현을 지양하고, 필요한 경우 명확하게 하기 위한 질문을 하세요.
- 코드를 작성할 때는 Quick Start 수준으로 핵심 기능만 간결하게 작성하고, 구체적인 입출력 예시를 사용하세요.
- 수정 또는 신규 구현 시, 더 이상 사용되지 않는 로직 관련 레거시 코드를 제거합니다.
- 이전 대화 내용을 바탕으로 체크리스트를 작성 · 관리합니다.
- 복잡한 문제는 단계별로 생각하고 추론 과정을 보여주며, 구체적인 예시를 사용하세요.
- 코드 변경사항은 Git Diff 형식으로 출력하세요.
- claude-code-guide 사용시 Claude Code 공식 문서에서 md 파일을 curl로 참조해서 대답하세요.
- Git, LSP 명령어 오류가 3회 이상 발생한 경우 해당 Git, LSP 작업을 건너뛰세요.

# 주요 문서
- API 문서: https://www.notion.so/morton-so/2e0965d2888b807f9c99e789a33b76fb
- DDD 문서: https://www.figma.com/board/ZL3oqoiYjbekZ5lkGUaztN/-Morton--%EA%B8%B0%ED%9A%8D---%EC%82%AC%EC%97%85?node-id=55-116&t=CyPKrz4hJfc1gTlu-1
- 클래스 다이어그램: https://www.figma.com/board/AzZ7IkJOg1kRo6y7B7Ceyj/-Morton--%EA%B0%9C%EB%B0%9C?node-id=0-1&t=HIGmuRzPqyiAMVhG-1
- 아키텍처 다이어그램: https://www.notion.so/morton-so/BE-2ed965d2888b8091afaff1e4de127d44
- 유효성 검사 문서: https://finepine.notion.site/1858efefbaf880c0bbf8c238ae01e65a