# 🛠️ 개발 가이드 문서

이 문서는 게임의 개발 환경 설정, 워크플로우, 코드 확장 및 디버깅 방법에 대해 안내합니다.

## 1. 개발 환경 설정

- **필수 도구:** Node.js (16+), 최신 웹 브라우저 (Chrome 권장)
- **프로젝트 설정:**
  ```bash
  # 의존성 설치 (express, open)
  npm install
  ```
- **개발 서버 실행:**
  ```bash
  # 서버 시작 및 브라우저 자동 실행
  node server.js
  ```
  서버가 시작되면 `http://localhost:9000` 주소로 게임이 자동으로 열립니다.

## 2. 🚀 개발 워크플로우

1.  **코드 수정:** `js/game.js` 파일을 수정합니다.
2.  **변경 확인:** 브라우저를 새로고침하여 변경사항을 즉시 확인합니다. (캐시 문제 방지를 위해 `Ctrl+Shift+R` 또는 `Cmd+Shift+R` 사용 권장)
3.  **디버깅:** 브라우저의 개발자 도구(`F12`)를 적극적으로 활용합니다.

### 유용한 디버깅 팁

- **Phaser 물리 디버거:** `game.js`의 `config` 객체에서 `physics.arcade.debug`를 `true`로 설정하면 모든 오브젝트의 충돌 박스와 속도 벡터가 시각적으로 표시됩니다.
- **게임 일시정지/재개:** 개발자 도구 콘솔에서 `game.scene.getScene('GameScene').scene.pause()`와 `...resume()`을 사용하여 특정 상황을 정밀하게 분석할 수 있습니다.
- **게임 속도 조절:** `game.loop.targetFps` 값을 조절하여 게임 속도를 늦추거나(예: `30`) 원래대로( `60`) 되돌릴 수 있습니다.

## 3. 🔧 주요 개발 패턴: 콘텐츠 확장

### 새로운 적 타입 추가하기

1.  **SVG 에셋 생성 (`preload`):** 새로운 적의 SVG 디자인을 문자열로 정의하고 `this.load.image`를 통해 로드합니다.
    ```javascript
    this.load.image('enemy4', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
        <svg width="28" height="28" xmlns="http://www.w3.org/2000/svg">
            <polygon points="14,2 26,26 2,26" fill="#FFEB3B" stroke="#FBC02D" stroke-width="2"/>
        </svg>
    `));
    ```
2.  **속성 정의 (`getEnemy...` 함수):** `getEnemyHealth`, `getEnemySpeed`, `getEnemyPoints` 함수에 새로운 적 타입의 속성(체력, 속도 배율, 점수)을 추가합니다.
    ```javascript
    // getEnemyHealth 내
    case 'enemy4': return 5;
    ```
3.  **스폰 로직에 통합 (`spawnEnemy`):** `spawnEnemy` 함수 내의 `enemyTypes` 배열에 새로운 적 타입을 추가하여 게임 월드에 자연스럽게 등장하도록 합니다.

### 새로운 아이템 추가하기

1.  **기본 설정 (`preload`, `create`):**
    - 아이템의 SVG 에셋을 `preload`에서 로드합니다.
    - `create`에서 아이템을 담을 새로운 물리 그룹(`this.newItems = ...`)을 생성합니다.
    - 플레이어와 새 아이템 그룹 간의 충돌 검사(`this.physics.add.overlap`)를 설정하고, 충돌 시 호출될 콜백 함수(`collectNewItem`)를 연결합니다.
    - `this.time.addEvent`를 사용하여 아이템을 주기적으로 생성할 스폰 타이머를 등록합니다.
2.  **스폰 로직 구현 (`spawnNewItem`):**
    - 아이템이 생성될 위치를 결정합니다 (주로 플레이어 주변의 랜덤한 위치).
    - `this.newItems.create(x, y, 'newItemKey')`를 사용하여 아이템을 생성하고 그룹에 추가합니다.
3.  **수집 로직 구현 (`collectNewItem`):**
    - 아이템을 화면에서 제거합니다 (`item.destroy()`).
    - 플레이어에게 적용될 효과를 구현합니다 (예: `this.playerSpeed *= 1.5`).
    - 효과가 일시적이라면, `this.time.delayedCall`을 사용하여 일정 시간 후에 효과를 되돌리는 로직을 추가합니다.
    - 시각적/청각적 피드백(폭발 효과, 사운드 등)을 추가하여 아이템 획득을 명확하게 인지시킵니다.

## 4. 🎨 SVG 아트 생성 가이드

- **일관된 색상 팔레트:** 게임의 시각적 통일성을 위해 기존 에셋의 색상(플레이어: 녹색, 적: 빨강, 아이템: 노랑 등)을 참고하세요.
- **온라인 SVG 에디터 활용:** [Figma](https://www.figma.com/), [Vectr](https://vectr.com/), [Boxy SVG](https://boxy-svg.com/)와 같은 웹 기반 툴을 사용하여 SVG를 시각적으로 디자인한 후, 코드(XML)를 복사하여 게임에 붙여넣으면 편리합니다.
- **`encodeURIComponent` 사용:** SVG 문자열에 포함될 수 있는 특수 문자(`,`, `/`, `#` 등)로 인한 오류를 방지하기 위해 항상 `encodeURIComponent()`로 문자열을 감싸야 합니다.

## 5. 🧪 테스트 및 디버깅 치트

브라우저 개발자 도구 콘솔에서 `game.scene.getScene('GameScene')`을 `scene` 변수에 할당하면, 다음과 같은 치트 코드를 사용하여 테스트를 용이하게 할 수 있습니다.

```javascript
const scene = game.scene.getScene('GameScene');

// 무적 모드
scene.playerHealth = 9999;

// 대쉬 무한
scene.dashCharges = 999;

// 무기 레벨 최대
scene.levelUp(); // 여러 번 호출하여 레벨업
scene.bulletCount = 20;

// 엘리트 몬스터 즉시 소환
scene.spawnEliteMonster();

// 적 스폰 중지/재개
scene.enemySpawnTimer.paused = true; // or false
```

## 6. 🌐 배포

이 게임은 순수한 클라이언트 사이드 애플리케이션이므로, 별도의 빌드 과정 없이 정적 파일 호스팅이 가능한 모든 플랫폼(GitHub Pages, Netlify, Vercel 등)에 쉽게 배포할 수 있습니다. 배포 전 `physics.arcade.debug` 옵션을 `false`로 설정하는 것을 잊지 마세요.
