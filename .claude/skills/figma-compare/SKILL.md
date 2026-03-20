# Figma Compare — Split View

Figma 디자인(왼쪽)과 Dev 서버(오른쪽)를 나란히 비교하는 스킬.
Playwright MCP(Figma) + Puppeteer(Dev)를 각각 CDP로 제어한다.

---

## 화면 배치

```text
xrandr로 타겟 모니터의 해상도/오프셋을 자동 감지하여 반반 분할.

┌────────────────┬────────────────┐
│  Figma         │  Dev           │
│  Playwright    │  Puppeteer     │
│  (왼쪽 W/2)    │  (오른쪽 W/2)  │
└────────────────┴────────────────┘

디폴트: 모니터 2번 (두 번째), 폴백: 모니터 1번
```

---

## 사전 준비

### 모니터 해상도 감지

`xrandr`로 모니터 목록 파싱. `WxH+X+Y` 형식에서 추출:

```bash
xrandr --query | grep ' connected'
# 출력 예: XWAYLAND0 connected 1920x1080+7+0
#          XWAYLAND1 connected 1920x1080+0+1080
```

모니터 번호(1-based)로 선택. 파싱 결과를 환경변수로 Puppeteer에 전달.

### Puppeteer 설치 (/tmp에, 프로젝트 오염 방지)

```bash
cd /tmp && npm ls puppeteer 2>/dev/null || npm install puppeteer
```

### Dev 서버 확인

Dev 서버가 실행 중인지 확인. 없으면 사용자에게 안내.

---

## Step 0: 모니터 정보 파싱

실행 전 반드시 xrandr로 타겟 모니터 정보를 파싱한다:

```bash
# 모니터 목록 (1-based index)
xrandr --query | grep ' connected' | awk '{print NR": "$1, $3}'
```

출력 예:

```
1: XWAYLAND0 1920x1080+7+0
2: XWAYLAND1 1920x1080+0+1080
```

타겟 모니터(디폴트 2번)에서 W, H, X, Y를 추출:

```bash
# 2번 모니터 기준
MON_INFO=$(xrandr --query | grep ' connected' | sed -n '2p' | grep -oP '\d+x\d+\+\d+\+\d+')
MON_W=$(echo "$MON_INFO" | grep -oP '^\d+')
MON_H=$(echo "$MON_INFO" | grep -oP '(?<=x)\d+')
MON_X=$(echo "$MON_INFO" | grep -oP '(?<=\+)\d+' | head -1)
MON_Y=$(echo "$MON_INFO" | grep -oP '(?<=\+)\d+' | tail -1)
HALF_W=$((MON_W / 2))
echo "Monitor: ${MON_W}x${MON_H}+${MON_X}+${MON_Y}, half=$HALF_W"
```

이 값들을 Puppeteer와 Playwright 양쪽에 전달한다.

---

## Step 1: Puppeteer Dev 브라우저 실행 (오른쪽)

`/tmp/dev-browser.mjs` 생성 후 백그라운드 실행.
환경변수 `MON_W`, `MON_H`, `MON_X`, `MON_Y`를 Step 0에서 전달받는다.
HTTP 제어 서버(포트 19222)로 URL 네비게이션을 받는다:

```javascript
import puppeteer from 'puppeteer'
import http from 'http'

// 환경변수에서 모니터 정보 읽기 (Step 0에서 파싱한 값)
const monW = parseInt(process.env.MON_W || '1920')
const monH = parseInt(process.env.MON_H || '1080')
const monX = parseInt(process.env.MON_X || '0')
const monY = parseInt(process.env.MON_Y || '0')
const halfW = Math.floor(monW / 2)
const controlPort = parseInt(process.env.CONTROL_PORT || '19222')

const browser = await puppeteer.launch({
  headless: false,
  devtools: false,
  args: [`--window-size=${halfW},${monH}`, `--window-position=${monX + halfW},${monY}`],
  defaultViewport: { width: 393, height: 852 },
})

const [page] = await browser.pages()

// CDP로 창 위치/크기 강제 설정 (오른쪽 절반)
const session = await page.createCDPSession()
const { windowId } = await session.send('Browser.getWindowForTarget')
await session.send('Browser.setWindowBounds', {
  windowId,
  bounds: { left: monX + halfW, top: monY, width: halfW, height: monH, windowState: 'normal' },
})

await page.goto(process.env.DEV_URL || 'http://localhost:3000')

// HTTP 제어 서버
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${controlPort}`)
  if (url.pathname === '/navigate') {
    const target = url.searchParams.get('url')
    if (target) {
      await page.goto(target)
      res.writeHead(200).end(`Navigated to: ${target}`)
      console.log(`Navigated to: ${target}`)
    } else {
      res.writeHead(400).end('Missing url param')
    }
  } else if (url.pathname === '/exit') {
    res.writeHead(200).end('Closing')
    await browser.close()
    server.close()
    process.exit(0)
  } else {
    res.writeHead(200).end('OK')
  }
})

server.listen(controlPort, () => {
  console.log(
    `READY: Dev browser (right ${halfW}x${monH}+${monX + halfW}+${monY}), control: http://localhost:${controlPort}`
  )
})
```

실행:

```bash
MON_W=$MON_W MON_H=$MON_H MON_X=$MON_X MON_Y=$MON_Y node /tmp/dev-browser.mjs &
```

> **주의**: 백그라운드로 실행. `| head` 파이프 금지 (BrokenPipeError).

---

## Step 2: Playwright 창 배치 (왼쪽)

Figma URL로 이동 후, Step 0에서 파싱한 값을 사용하여 Playwright MCP `browser_run_code`로 CDP 배치:

```javascript
// browser_run_code에서 실행
// MON_X, MON_Y, HALF_W, MON_H는 Step 0에서 파싱한 값으로 대체
const monX = ${MON_X};
const monY = ${MON_Y};
const halfW = ${HALF_W};
const monH = ${MON_H};

const client = await page.context().newCDPSession(page);
const { windowId } = await client.send('Browser.getWindowForTarget');
await client.send('Browser.setWindowBounds', {
  windowId,
  bounds: { left: monX, top: monY, width: halfW, height: monH, windowState: 'normal' },
});
```

---

## Step 3: 비교 이터레이션

각 이터레이션에서:

1. **Figma 이동**: Playwright `browser_navigate`로 Figma 노드 URL 이동
2. **Dev 페이지 이동**: HTTP 제어로 Puppeteer 네비게이션
   ```bash
   curl -s "http://localhost:19222/navigate?url=http://localhost:3000/path"
   ```
3. **시각적 비교**: 사용자가 두 화면을 나란히 보며 차이점 확인
4. **조정**: 차이점 발견 시 코드 수정 후 Dev 리로드

> **새 탭/창 생성 금지**: 매 이터레이션마다 기존 탭에서 URL만 이동한다.

---

## Step 4: 정리

```bash
# HTTP로 종료
curl -s "http://localhost:19222/exit"
# 또는
kill $(pgrep -f 'dev-browser.mjs')
```

Playwright는 `browser_close`로 정리.

---

## 모니터 변경

디폴트 monitor 2가 안 맞으면 monitor 1로 폴백:

- Puppeteer: Step 0에서 `sed -n '1p'`로 1번 모니터 파싱 후 환경변수 변경
- Playwright: `browser_run_code`에서 1번 모니터 좌표 사용

모니터가 1개만 있으면 자동으로 해당 모니터 사용.

---

## 트러블슈팅

| 증상                  | 원인                      | 해결                                    |
| --------------------- | ------------------------- | --------------------------------------- |
| 창이 모니터 밖에 표시 | xrandr 오프셋 불일치      | `xrandr --query \| grep connected` 확인 |
| Puppeteer 설치 실패   | /tmp 권한                 | `sudo npm install puppeteer`            |
| 창 크기가 안 맞음     | 윈도우 매니저 간섭        | CDP `setWindowBounds` 재실행            |
| BrokenPipeError       | stdout에 `\| head` 파이프 | 파이프 제거, 백그라운드 실행            |
| xrandr 없음           | Wayland-only 환경         | `wlr-randr` 또는 수동으로 해상도 지정   |
| 19222 포트 충돌       | 다른 프로세스 사용 중     | `CONTROL_PORT=19223` 환경변수로 변경    |
