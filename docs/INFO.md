# 📋 Game-Tounder-Project 프로젝트 종합 가이드

**Game-Tounder-Project**는 Phaser 3 프레임워크를 기반으로 한 **2D 탑다운 아레나 서바이벌 슈팅 게임**입니다. 플레이어는 끊임없이 몰려오는 적들을 상대로 최대한 오래 생존하며 점수를 획득하는 것이 목표입니다.

## 🎮 게임 개요

### 핵심 특징
- **자동 공격 시스템**: 가장 가까운 적을 자동으로 타겟팅하여 공격
- **순간이동 대쉬**: 마우스 클릭으로 즉시 순간이동하는 핵심 생존 스킬 (3회 충전)
- **동적 난이도**: 20초마다 웨이브가 증가하며 적의 스폰 속도와 수량이 증가
- **성장 시스템**: 에너지 오브 수집을 통한 경험치 획득 및 무기 강화
- **물리 기반 전투**: 넉백, 충돌 처리 등 현실적인 물리 엔진 활용
- **100% 절차적 에셋**: 모든 시각적 요소를 SVG 코드로 동적 생성

### 게임플레이 메커니즘
- **이동**: `WASD` 또는 방향키로 플레이어 조작
- **대쉬**: 마우스 클릭으로 해당 위치로 순간이동 (무적 상태, 강력한 시각 효과)
- **에너지 버스트**: `스페이스바`로 주변 적을 밀쳐내는 파동 방출
- **자동 레벨업**: 에너지 오브 수집으로 경험치 획득, 무기 성능 향상
- **아이템 시스템**: 도망가는 AI를 가진 총알 업그레이드 아이템

## 📁 프로젝트 구조

```
Game-Tounder-Project/
├── index.html              # 게임의 HTML 진입점
├── js/
│   └── game.js             # 핵심 게임 로직 (GameScene, GameOverScene)
├── Hover/                  # Hover.css 애니메이션 라이브러리
│   ├── css/                # 컴파일된 CSS 파일들
│   │   ├── hover.css       # 전체 Hover.css 라이브러리
│   │   └── hover-min.css   # 압축된 버전 (실제 사용 권장)
│   ├── scss/               # SCSS 소스 파일들 (커스터마이징 시 사용)
│   ├── less/               # Less 소스 파일들 (커스터마이징 시 사용)
│   └── index.html          # Hover.css 효과 데모 페이지
├── server.js               # 개발용 Node.js HTTP 서버
├── package.json            # 프로젝트 의존성 및 스크립트
├── CLAUDE.md               # Gemini CLI 사용 가이드
├── README.md               # 프로젝트 개요 문서
└── docs/                   # 상세 기술 문서
    ├── INFO.md             # 이 파일: 프로젝트 종합 가이드
    ├── api.md              # GameScene/GameOverScene API 레퍼런스
    ├── architecture.md     # 시스템 아키텍처 및 설계 철학
    ├── systems.md          # 게임 시스템별 상세 설계 문서
    ├── development.md      # 개발 환경 설정 및 확장 가이드
    └── backend-strategy.md # Cloudflare 기반 랭킹 시스템 구축 계획
```

## 🏗️ 시스템 아키텍처

### 핵심 클래스
- **`GameScene`**: 메인 게임플레이의 모든 로직을 담당하는 핵심 클래스
- **`GameOverScene`**: 게임 종료 시 결과 표시 및 재시작 처리

### 게임 시스템 모듈
1. **⚡ 대쉬 시스템**: 순간이동, 무적 상태, 3중 차지 및 개별 쿨다운
2. **🎯 자동 조준 및 무기 시스템**: 가장 가까운 적 타겟팅, 다중 발사
3. **👹 적 AI 및 스폰 시스템**: 추적 AI, 엘리트 몬스터, 워블링 패턴
4. **💥 물리 기반 넉백 시스템**: 현실적인 물리 법칙 기반 충격 및 마찰
5. **🔮 아이템 시스템**: 도망가는 AI, 희소성 기반 스폰
6. **📈 동적 난이도 조절**: 다차원적 난이도 증가 (속도, 수량, 능력치)
7. **🎨 UI/UX 및 시각 효과**: 번개 이펙트, 잔상 효과, 카메라 흔들림
8. **🔄 게임 상태 관리**: 중앙 집중식 상태 관리 및 완벽한 초기화

### 렌더링 아키텍처
- **절차적 SVG 생성**: 모든 게임 에셋을 코드로 동적 생성
- **거대한 월드**: 8000x6000 픽셀의 광활한 게임 필드
- **추적 카메라**: 플레이어를 부드럽게 따라다니는 카메라
- **UI 레이어**: `setScrollFactor(0)`으로 화면 고정 UI 요소

## 🎨 Hover.css 애니메이션 라이브러리

### 라이브러리 개요
`Hover/` 디렉토리에는 **Hover.css** 라이브러리가 포함되어 있습니다. 이는 CSS3 기반의 UI 요소 애니메이션 라이브러리로, 마우스 호버 시 다양한 시각적 효과를 제공합니다.

### 애니메이션 카테고리
1. **2D Transitions**: grow, shrink, pulse, rotate, skew, wobble, buzz 등
2. **Background Transitions**: fade, sweep, bounce, radial, shutter 등
3. **Border Transitions**: border-fade, hollow, underline, overline, trim 등
4. **Icons**: icon-back, forward, spin, fade, drop, pulse 등
5. **Curls**: curl-top-left, curl-bottom-right 등 (모서리 말림 효과)
6. **Shadow & Glow**: shadow, glow, float-shadow, box-shadow 등
7. **Speech Bubbles**: bubble-top, bubble-bottom, bubble-float 등

### 게임 프로젝트와의 통합
1. **HTML에 CSS 연결**: `<link rel="stylesheet" href="Hover/css/hover-min.css">`
2. **HTML 요소에 클래스 적용**: 
   ```html
   <button class="hvr-grow">게임 시작</button>
   ```
3. **JavaScript로 동적 제어**:
   ```javascript
   // 아이템 획득 시 흔들림 효과
   itemIcon.classList.add('hvr-buzz-out');
   setTimeout(() => itemIcon.classList.remove('hvr-buzz-out'), 1000);
   ```

## 🚀 개발 가이드

### 개발 환경 설정
```bash
# 의존성 설치
npm install

# 개발 서버 실행 (포트 9000, 자동 브라우저 실행)
node server.js
```

### 주요 개발 패턴
- **새로운 적 타입 추가**: SVG 에셋 생성 → 속성 정의 → 스폰 로직 통합
- **새로운 아이템 추가**: 기본 설정 → 스폰 로직 → 수집 로직 구현
- **SVG 아트 생성**: 일관된 색상 팔레트, 온라인 에디터 활용, `encodeURIComponent` 사용

### 디버깅 도구
- **물리 디버거**: `physics.arcade.debug: true`로 충돌 박스 시각화
- **게임 일시정지**: `game.scene.getScene('GameScene').scene.pause()`
- **치트 코드**: 무적 모드, 대쉬 무한, 무기 레벨 최대 등

## 🌐 확장 계획: 서버리스 백엔드

현재 클라이언트 단독 실행 게임이지만, **Cloudflare Workers + D1 데이터베이스** 기반의 온라인 랭킹 시스템 도입을 계획하고 있습니다.

### 백엔드 구축 계획
1. **Cloudflare 환경 설정**: Wrangler CLI 설치 및 계정 연결
2. **D1 데이터베이스**: 점수 저장용 SQL 데이터베이스 생성
3. **Worker API 개발**: 점수 등록 및 랭킹 조회 API 구현
4. **클라이언트 연동**: 게임 종료 시 점수 전송 및 랭킹 표시

### 선정 이유
- **최상의 성능**: 전 세계 엣지 컴퓨팅으로 최소 지연시간
- **비용 효율성**: 관대한 무료 플랜, 예측 가능한 비용 구조
- **기술 적합성**: SQL 기반 랭킹 쿼리에 최적화된 환경

## 📚 문서 참조

- **[api.md](./api.md)**: GameScene과 GameOverScene의 상세 API 레퍼런스
- **[architecture.md](./architecture.md)**: 시스템 아키텍처 및 설계 철학
- **[systems.md](./systems.md)**: 각 게임 시스템의 상세 설계와 구현 방식
- **[development.md](./development.md)**: 개발 환경 설정 및 콘텐츠 확장 가이드
- **[backend-strategy.md](./backend-strategy.md)**: Cloudflare 기반 랭킹 시스템 구축 전략

## 🎯 프로젝트 특징 요약

**Game-Tounder-Project**는 다음과 같은 특징을 가진 혁신적인 웹 게임입니다:

1. **기술적 혁신**: 100% 절차적 에셋 생성으로 로딩 시간 최소화
2. **게임플레이 혁신**: 순간이동 대쉬를 중심으로 한 독특한 전투 시스템
3. **아키텍처 우수성**: 모듈화된 시스템 설계로 높은 확장성과 유지보수성
4. **UI/UX 강화**: Hover.css 통합을 통한 풍부한 인터랙션
5. **확장 계획**: 서버리스 백엔드를 통한 온라인 랭킹 시스템
6. **개발자 친화적**: 상세한 문서화와 명확한 개발 가이드

이 프로젝트는 단순한 브라우저 게임을 넘어, 현대적인 웹 기술과 게임 디자인 철학이 결합된 완성도 높은 인디 게임 프로젝트입니다.