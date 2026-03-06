# Figma Compare — Split View

Figma 디자인(왼쪽)과 Dev 서버(오른쪽)를 나란히 비교하는 스킬.
Playwright MCP(Figma) + Puppeteer(Dev)를 각각 CDP로 제어한다.

---

## 화면 배치

```text
상하 듀얼 모니터 (1920x1080 x 2) 기준

┌───────────┬───────────┐
│  Figma    │  Dev      │
│ Playwright│ Puppeteer │
│ (왼 960px)│ (우 960px)│
└───────────┴───────────┘

모니터 Y좌표: monitor 1 = 0 (위), monitor 2 = 1080 (아래)
디폴트: monitor 2 (아래), 폴백: monitor 1 (위)
```

---

## 사전 준비

### Puppeteer 설치 (/tmp에, 프로젝트 오염 방지)

```bash
cd /tmp && npm ls puppeteer 2>/dev/null || npm install puppeteer
```

### Dev 서버 확인

Dev 서버가 실행 중인지 확인. 없으면 사용자에게 안내.

---

## Step 1: Puppeteer Dev 브라우저 실행 (오른쪽)

`/tmp/dev-browser.mjs` 생성 후 백그라운드 실행:

```javascript
import puppeteer from 'puppeteer';

const monitor = parseInt(process.env.MONITOR || '2');
const monitorY = monitor === 2 ? 1080 : 0;

const browser = await puppeteer.launch({
  headless: false,
  devtools: false,
  args: [`--window-size=960,1080`, `--window-position=960,${monitorY}`],
  defaultViewport: { width: 393, height: 852 },
});

const [page] = await browser.pages();

// CDP로 창 위치/크기 강제 설정 (오른쪽 절반)
const session = await page.createCDPSession();
const { windowId } = await session.send('Browser.getWindowForTarget');
await session.send('Browser.setWindowBounds', {
  windowId,
  bounds: { left: 960, top: monitorY, width: 960, height: 1080, windowState: 'normal' },
});

await page.goto(process.env.DEV_URL || 'http://localhost:3000');

// stdin으로 URL 이동 명령 수신
process.stdin.setEncoding('utf8');
process.stdin.on('data', async (data) => {
  const url = data.trim();
  if (url === 'exit') {
    await browser.close();
    process.exit(0);
  }
  if (url) {
    await page.goto(url);
    console.log(`Navigated to: ${url}`);
  }
});

console.log(`READY: Dev browser (right, monitor ${monitor})`);
```

실행:

```bash
MONITOR=2 node /tmp/dev-browser.mjs &
```

> **주의**: 백그라운드로 실행. `| head` 파이프 금지 (BrokenPipeError).

---

## Step 2: Playwright 창 배치 (왼쪽)

Playwright MCP `browser_run_code`로 CDP를 사용해 왼쪽에 배치:

```javascript
// browser_run_code에서 실행
const monitor = 2; // 디폴트 모니터
const monitorY = monitor === 2 ? 1080 : 0;

const client = await page.context().newCDPSession(page);
const { windowId } = await client.send('Browser.getWindowForTarget');
await client.send('Browser.setWindowBounds', {
  windowId,
  bounds: { left: 0, top: monitorY, width: 960, height: 1080, windowState: 'normal' },
});
```

---

## Step 3: 비교 이터레이션

각 이터레이션에서:

1. **Figma 스크린샷**: `mcp__figma__get_screenshot` 또는 Playwright로 Figma 페이지 이동 (`browser_navigate`)
2. **Dev 페이지 이동**: Puppeteer stdin에 URL 전달 (Bash `echo "http://localhost:3000/path" > /proc/<PID>/fd/0` 또는 named pipe)
3. **시각적 비교**: 사용자가 두 화면을 나란히 보며 차이점 확인
4. **조정**: 차이점 발견 시 코드 수정 후 Dev 리로드

> **새 탭/창 생성 금지**: 매 이터레이션마다 기존 탭에서 URL만 이동한다.

---

## Step 4: 정리

```bash
# Puppeteer 프로세스 종료
echo "exit" > /proc/<PID>/fd/0
# 또는
kill <PID>
```

Playwright는 `browser_close`로 정리.

---

## 모니터 변경

디폴트 monitor 2(아래)가 안 맞으면 monitor 1(위)로 폴백:

- Puppeteer: `MONITOR=1 node /tmp/dev-browser.mjs`
- Playwright: `browser_run_code`에서 `const monitor = 1;`

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 창이 모니터 밖에 표시 | monitorY 값 불일치 | MONITOR 환경변수 확인 |
| Puppeteer 설치 실패 | /tmp 권한 | `sudo npm install puppeteer` |
| 창 크기가 안 맞음 | 윈도우 매니저 간섭 | CDP `setWindowBounds` 재실행 |
| BrokenPipeError | stdout에 `\| head` 파이프 | 파이프 제거, 백그라운드 실행 |
