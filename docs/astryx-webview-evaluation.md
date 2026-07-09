# Astryx Webview 적용 검토

작성일: 2026-07-10

## 요약 판단

`facebook/astryx`를 사용해 VS Code webview를 수정하는 것은 기술적으로 가능하다. 다만 현재 이 확장의 webview 구조와 제품 목적을 기준으로 보면, 전면 도입은 권장하지 않는다.

현재 확장은 TypeScript가 HTML, CSS, JavaScript 문자열을 생성해 webview에 주입하는 가벼운 구조다. 런타임 의존성도 `vis-network` 하나뿐이고, webview는 VS Code 테마 CSS 변수와 nonce 기반 스크립트 CSP에 맞춰 직접 구성되어 있다. 반면 Astryx는 React 19 기반 디자인 시스템이며, core 패키지와 theme 패키지, React/ReactDOM, 빌드 또는 번들링 경로를 함께 고려해야 한다. 이 차이 때문에 Astryx를 쓰려면 단순 CSS 교체가 아니라 webview 프런트엔드 아키텍처 변경에 가깝다.

따라서 지금 단계에서는 Astryx를 전면 적용하기보다, 필요한 UI 패턴만 참고해 현재 webview의 CSS/DOM 구조를 개선하는 편이 더 낫다. Astryx는 추후 webview가 React 기반의 큰 앱으로 성장하거나, 복잡한 폼/테이블/다이얼로그가 반복되는 시점에 재검토하는 것이 합리적이다.

## 검토 대상

- 저장소: [facebook/astryx](https://github.com/facebook/astryx)
- 핵심 패키지: `@astryxdesign/core`, `@astryxdesign/theme-neutral`, `@astryxdesign/cli`
- 현재 확인 버전: `0.1.4`
- 라이선스: MIT
- 상태: 공식 README 기준 Beta

Astryx는 Meta 내부에서 성장한 디자인 시스템을 오픈소스로 공개한 것으로 소개되며, README는 150개 이상의 접근성 컴포넌트, 테마, 다크 모드, 템플릿, CLI를 제공한다고 설명한다. 공식 문서는 React와 StyleX 기반이지만 소비자는 pre-built CSS/JS를 import할 수 있고 별도 build plugin 없이 사용할 수 있다고 안내한다.

## 현재 확장의 webview 구조

현재 프로젝트의 주요 webview는 다음 흐름으로 구성되어 있다.

- `src/codegraphPanel.ts`: Dashboard webview panel 생성, `enableScripts: true`, `retainContextWhenHidden: true`
- `src/dashboardHtml.ts`: 전체 HTML 문자열 생성, inline style/script 삽입, nonce 기반 script CSP 적용
- `src/dashboardStyles.ts`: VS Code 테마 변수 기반 CSS 문자열
- `src/dashboardScript.ts`: DOM 직접 조작 및 `acquireVsCodeApi()` 메시지 처리
- `src/codegraphGraphPanel.ts`: Graph Explorer webview panel 생성
- `src/graphHtml.ts`: graph HTML 문자열 생성, `vis-network` 스크립트와 graph 스크립트 inline 삽입
- `src/graphStyles.ts`, `src/graphScript.ts`: 그래프 UI 스타일과 런타임 로직

현재 CSP는 대체로 다음 형태다.

```html
default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-...';
```

즉, 현재 webview는 외부 CDN을 허용하지 않고, 로컬 리소스 URI도 별도 `asWebviewUri`로 연결하지 않는다. 확장 패키지 내부에서 문자열로 HTML/CSS/JS를 합성하는 방식이라 빌드 파이프라인도 단순하다.

## 적용 가능 여부

가능하다. 다만 적용 방식에 따라 비용과 위험이 다르다.

### 1. CDN 방식

Astryx core README는 no-build 환경에서 CDN을 통해 UMD global 또는 ESM을 로드하는 방식을 안내한다. 하지만 VS Code webview에서는 이 방식이 적합하지 않다.

이유는 다음과 같다.

- 현재 CSP가 외부 script/style을 허용하지 않는다.
- CDN 사용은 오프라인/폐쇄망/프록시 환경의 VS Code 사용성을 떨어뜨린다.
- unversioned CDN은 최신 릴리스로 해석될 수 있어 재현 가능한 확장 패키징과 맞지 않는다.
- VS Code webview는 보안상 로컬 리소스도 `Webview.asWebviewUri`를 통해 명시적으로 변환해야 한다.

따라서 CDN 방식은 프로토타입 검증에는 가능하지만 Marketplace 배포용 확장에는 권장하지 않는다.

### 2. 로컬 번들 방식

가장 현실적인 방식이다. React, ReactDOM, Astryx 컴포넌트, Astryx CSS, 선택한 테마 CSS를 webview용 번들로 빌드하고, 빌드 산출물을 확장 패키지에 포함한다.

필요한 변화는 다음과 같다.

- webview별 엔트리 파일을 React/TSX로 분리
- esbuild, Vite, webpack 중 하나로 webview bundle 생성
- `package.json`에 빌드 스크립트와 의존성 추가
- 생성된 JS/CSS를 `media/` 또는 유사 디렉터리에 넣고 `webview.asWebviewUri`로 로드
- CSP를 `script-src 'nonce-...' ${webview.cspSource}` 및 `style-src ${webview.cspSource}` 중심으로 재설계
- `acquireVsCodeApi()` 메시지 레이어를 React state/effect 구조에 맞게 재작성
- 기존 HTML 문자열 테스트를 bundle 기반 테스트로 조정

이 방식은 가능하지만 현재 코드베이스에는 꽤 큰 구조 변경이다.

### 3. CSS/토큰만 부분 참고

Astryx 컴포넌트를 직접 가져오지 않고, Astryx가 제시하는 레이아웃/토큰/컴포넌트 패턴만 참고해 기존 CSS와 DOM을 개선하는 방식이다.

현재 확장에는 이 방식이 가장 현실적이다. React 런타임을 들이지 않고도 검색 폼, 탭, 리스트, 그래프 컨트롤, 상태 표시, 빈 상태, 접근성 라벨 등을 정돈할 수 있다.

## 실제 장점

Astryx를 로컬 번들 방식으로 제대로 도입했을 때 얻을 수 있는 장점은 있다.

- 컴포넌트 일관성: 버튼, 입력, 탭, 테이블, 카드, 다이얼로그 같은 UI가 반복될수록 직접 CSS/DOM을 유지하는 비용이 줄어든다.
- 접근성 기본값: Astryx는 접근 가능한 컴포넌트를 강점으로 내세우므로, 직접 구현한 interactive DOM보다 키보드/ARIA 품질을 높이기 쉽다.
- 테마 시스템: CSS custom property 기반 테마를 활용하면 색상/간격/타이포그래피의 일관성을 더 체계적으로 관리할 수 있다.
- 문서와 CLI: 컴포넌트 문서, 템플릿, swizzle, codemod 등 도구가 있어 UI 규모가 커질 때 작업 방식이 안정될 수 있다.
- 미래 확장성: webview가 단순 검색/그래프를 넘어 설정, 저장된 쿼리, 비교 화면, 결과 테이블, 복잡한 필터 편집기로 확장되면 React 컴포넌트 시스템의 이점이 커진다.

## 실제 단점과 위험

현재 프로젝트 기준으로는 단점이 더 크다.

- 의존성 증가: `@astryxdesign/core@0.1.4`는 React 19, ReactDOM 19, StyleX를 peer dependency로 요구한다. 현재 확장의 런타임 의존성은 `vis-network`뿐이라 증가 폭이 크다.
- 패키지 크기 증가: npm 메타데이터 기준 `@astryxdesign/core@0.1.4`의 unpacked size는 약 13.8MB다. theme-neutral도 추가되고, React/ReactDOM까지 포함하면 VSIX 크기와 로드 비용이 늘어난다.
- 베타 리스크: 공식 README가 Beta 상태를 명시하고 있고 최신 릴리스도 아직 `0.1.x`다. Marketplace 확장의 안정적인 UI 기반으로 삼기에는 API 변경 가능성이 있다.
- 아키텍처 변경 비용: 현재 webview는 문자열 기반 HTML/CSS/JS와 직접 DOM 조작으로 동작한다. Astryx 컴포넌트를 쓰려면 React 앱 구조와 번들링을 새로 들여와야 한다.
- CSP 복잡도: 현재는 inline script에 nonce를 붙이는 단순 모델이다. 번들 파일, CSS 파일, React 런타임을 로드하려면 `asWebviewUri`, `localResourceRoots`, CSP source를 함께 관리해야 한다.
- VS Code 테마 적합성: 현재 UI는 `var(--vscode-...)` 토큰을 직접 사용해 VS Code 테마에 잘 붙는다. Astryx 테마를 그대로 쓰면 VS Code 내장 테마와 시각적으로 어긋날 수 있고, 결국 Astryx 토큰을 VS Code 토큰에 매핑해야 한다.
- 그래프 영역 이득 제한: Graph Explorer의 핵심 가치는 `vis-network` 기반 그래프 상호작용이다. Astryx는 주변 컨트롤에는 도움이 되지만 캔버스/그래프 렌더링 자체를 대체하지 않는다.
- 테스트 변경: 현재 테스트는 생성 HTML과 asset 포함 여부를 검증하기 쉽다. 번들 기반으로 바꾸면 빌드 산출물 검증, webview 리소스 URI, CSP 회귀 테스트가 필요하다.

## 보안 및 패키징 고려사항

VS Code 공식 문서는 webview가 강력하지만 리소스 비용이 크고, 필요한 경우에만 사용해야 한다고 안내한다. 또한 webview는 로컬 파일에 직접 접근할 수 없으므로 확장 내부 리소스를 로드할 때 `Webview.asWebviewUri`를 사용해야 하며, `localResourceRoots`와 CSP를 통해 가능한 제한적으로 리소스를 허용하라고 설명한다.

이 확장은 이미 webview를 쓰고 있으므로 webview 자체 사용 여부가 문제는 아니다. 문제는 webview 안에 React/Astryx 런타임을 추가하는 만큼 충분한 사용자 가치가 생기느냐다.

도입한다면 최소 기준은 다음과 같다.

- CDN 금지, 모든 JS/CSS는 확장 패키지 내부에 고정 버전으로 포함
- `localResourceRoots`는 webview asset 디렉터리로 제한
- CSP는 `default-src 'none'` 유지
- 원격 script/style 허용 금지
- React/Astryx bundle 크기 측정 후 VSIX 증가량 기록
- 고대비 테마, 라이트/다크 테마, 키보드 탐색 회귀 테스트
- Dashboard부터 작은 proof of concept로 시작하고 Graph Explorer는 나중에 판단

## 대안

현재 단계의 추천 대안은 다음 순서다.

1. 기존 구조 유지 + CSS/DOM 정리
   - 가장 낮은 비용으로 현재 목적에 맞는다.
   - VS Code 테마 변수와 기존 테스트를 그대로 활용할 수 있다.

2. 작은 webview asset 빌드만 도입
   - React 없이 TypeScript/JS를 파일로 분리하고 `asWebviewUri`로 로드한다.
   - CSP를 더 엄격하게 만들 수 있고, 문자열 파일이 커지는 문제도 줄일 수 있다.

3. React 도입 후 Astryx 일부 컴포넌트 실험
   - Dashboard의 탭, 폼, 결과 리스트 정도를 별도 branch에서 PoC한다.
   - 번들 크기, 초기 렌더 시간, 테마 적합성을 측정한 뒤 확대 여부를 판단한다.

## 최종 판단

근거를 종합하면, 지금 이 확장에는 Astryx 전면 도입을 하지 않는 것이 맞다.

가장 큰 이유는 이 확장의 제품 목적이 “Codegraph가 활성화된 워크스페이스에서 빠르게 심볼과 위치를 찾는 가벼운 도구”라는 점이다. 현재 webview는 이 목적에 맞게 작고 직접적이다. Astryx는 좋은 디자인 시스템이지만, 이 프로젝트에 넣는 순간 React 런타임, 테마 레이어, 번들링, CSP 리소스 처리, 테스트 전략까지 함께 바뀐다. 사용자가 즉시 얻는 이득은 UI 컴포넌트 품질과 일관성인데, 현재 화면 규모에서는 그 이득이 전환 비용을 넘지 않는다.

다만 조건부로는 재검토할 가치가 있다. Dashboard가 복잡한 데이터 작업 화면으로 커지고, 저장된 검색, 다중 필터, 결과 테이블, 상세 패널, 설정/프리셋 관리 같은 UI가 반복되면 Astryx의 컴포넌트/템플릿/접근성 장점이 실제로 살아난다. 그때도 바로 전면 적용하지 말고 Dashboard 한 화면만 PoC로 만들고, VSIX 크기와 webview 로드 시간, VS Code 테마 적합성, CSP 유지 가능성을 측정한 뒤 결정하는 것이 좋다.

현재 결론은 다음과 같다.

**단기: 도입하지 않는다. Astryx의 패턴만 참고해 기존 webview를 개선한다.**

**중기: webview 코드가 더 커지면 먼저 asset 번들 구조를 도입한다.**

**장기: React 기반 webview 앱으로 전환할 명확한 필요가 생길 때 Astryx를 PoC로 재검토한다.**

## 근거 자료

- [facebook/astryx GitHub README](https://github.com/facebook/astryx): Beta 상태, React/StyleX 기반, 150개 이상 컴포넌트, 테마와 CLI 제공 설명.
- [@astryxdesign/core README](https://github.com/facebook/astryx/tree/main/packages/core): CSS import, Theme provider, Vite/Next.js/no-build CDN 사용 방식, CLI와 템플릿 안내.
- [@astryxdesign/core package.json](https://raw.githubusercontent.com/facebook/astryx/main/packages/core/package.json): `react`, `react-dom`, `@stylexjs/stylex` peer dependency, ESM/UMD/CSS exports, MIT 라이선스.
- npm metadata 확인: `@astryxdesign/core@0.1.4` unpacked size 약 13.8MB, `@astryxdesign/theme-neutral@0.1.4`는 `lucide-react` 의존.
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview): webview의 리소스 비용, `Webview.asWebviewUri`, `localResourceRoots`, CSP 권장사항.
- [VS Code Webview UX Guidelines](https://code.visualstudio.com/api/ux-guidelines/webviews): webview는 꼭 필요할 때만 사용하고, 테마와 접근성을 지켜야 한다는 가이드.
