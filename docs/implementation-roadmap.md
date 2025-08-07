# 스킬 카드 시스템 구현 로드맵

## 1. 개발 단계 개요

### 1.1 단계별 접근법
- **Phase 1**: 핵심 인프라 구축 (1-2일)
- **Phase 2**: 기본 스킬 시스템 구현 (2-3일)  
- **Phase 3**: UI 및 사용자 경험 (1-2일)
- **Phase 4**: 고급 스킬 및 효과 (2-3일)
- **Phase 5**: 밸런스 및 최적화 (1-2일)
- **Phase 6**: 광고 연동 준비 (1일)

### 1.2 전체 예상 기간: 7-13일

## 2. Phase 1: 핵심 인프라 구축

### 2.1 데이터 구조 설정

#### 우선순위: 최고 ⭐⭐⭐
#### 예상 시간: 4-6시간

```javascript
// 1. initializeGameVariables() 함수에 스킬 시스템 변수 추가
this.skillSystem = {
    // 선택된 스킬들
    selectedSkills: new Set(),
    skillStacks: new Map(),
    
    // 액티브 스킬 상태
    barrierCharges: 0,
    maxBarrierCharges: 3,
    
    // 시간 제한 버프들
    activeBuffs: new Map(),
    
    // UI 상태
    isCardSelectionActive: false,
    currentCardOptions: [],
    
    // 광고 관련
    adRefreshCount: 0,
    maxAdRefreshPerLevel: 1
};

// 2. 능력치 수정자 엔진 초기화
this.statModifierEngine = new StatModifierEngine(this);
```

#### 구현 단계:
1. **스킬 데이터 구조 정의** (1시간)
2. **게임 변수에 스킬 시스템 통합** (1시간) 
3. **StatModifierEngine 클래스 구현** (2시간)
4. **기본 스킬 정의 파일 작성** (2시간)

### 2.2 기존 레벨업 시스템 수정

#### 우선순위: 최고 ⭐⭐⭐
#### 예상 시간: 2-3시간

```javascript
// game.js의 levelUp() 함수 수정
levelUp() {
    if (this.isLevelingUp || this.weaponLevel >= 30) return;
    
    this.isLevelingUp = true;
    this.weaponLevel += 1;
    this.experience = 0;
    this.experienceToNext = 100 + (this.weaponLevel * 75);
    
    // 기존 자동 스탯 증가 제거
    // this.fireRate = Math.max(100, this.fireRate - 20);  // 제거
    // this.fireRange += 30;  // 제거
    // this.bulletCount += 1;  // 제거
    
    // 레벨업 시각 효과
    this.showLevelUpText();
    
    // 스킬 카드 선택으로 대체
    this.time.delayedCall(1500, () => {
        this.showSkillCardSelection();
    });
}
```

#### 구현 단계:
1. **levelUp() 함수 백업 및 수정** (30분)
2. **자동 스탯 증가 로직 제거** (30분)
3. **스킬 선택 플로우 연결** (1시간)
4. **테스트 및 검증** (30분-1시간)

### 2.3 이벤트 훅 시스템 구축

#### 우선순위: 높음 ⭐⭐
#### 예상 시간: 3-4시간

```javascript
// 이벤트 시스템 초기화
initializeSkillEventSystem() {
    this.skillEventHandlers = {
        onBulletHit: [],
        onEnemyKill: [],
        onPlayerHit: [],
        onDashStart: [],
        onDashEnd: [],
        onLightningWave: [],
        onLevelUp: []
    };
}

// 기존 이벤트 함수들에 훅 추가
hitEnemy(bullet, enemy) {
    // 기존 로직...
    
    // 스킬 이벤트 트리거 추가
    this.triggerSkillEvent('onBulletHit', { bullet, enemy });
    
    if (enemy.health <= 0) {
        // 기존 킬 로직...
        this.triggerSkillEvent('onEnemyKill', { enemy });
    }
}
```

#### 구현 단계:
1. **이벤트 핸들러 시스템 구축** (2시간)
2. **기존 함수들에 이벤트 훅 추가** (1-2시간)
3. **테스트용 샘플 이벤트 핸들러 작성** (30분-1시간)

## 3. Phase 2: 기본 스킬 시스템 구현

### 3.1 스킬 정의 및 관리

#### 우선순위: 최고 ⭐⭐⭐
#### 예상 시간: 4-5시간

```javascript
// skillDefinitions.js 파일 생성
const skillDefinitions = {
    // Phase 2에서 구현할 기본 스킬들
    bullet_count: {
        id: 'bullet_count',
        name: '다중 사격',
        description: '총알이 +1개 추가됩니다',
        category: 'passive',
        rarity: 'common',
        stackable: true,
        maxStacks: 7,
        effect: {
            type: 'stat_modifier',
            target: 'bulletCount',
            operation: 'add',
            value: 1
        }
    },
    
    fire_rate_up: {
        id: 'fire_rate_up',
        name: '속사',
        description: '발사 속도가 25% 빨라집니다',
        category: 'passive',
        rarity: 'common',
        stackable: true,
        maxStacks: 5,
        effect: {
            type: 'stat_modifier',
            target: 'fireRate',
            operation: 'multiply',
            value: 0.75
        }
    },
    
    instant_barrier: {
        id: 'instant_barrier',
        name: '방어 배리어',
        description: '배리어 충전 +1 (최대 3)',
        category: 'active',
        rarity: 'common',
        stackable: true,
        maxStacks: 3,
        effect: {
            type: 'instant',
            action: 'add_barrier'
        }
    },
    
    // ... 더 많은 기본 스킬들
};
```

#### 구현 단계:
1. **기본 스킬 10-15개 정의** (2시간)
2. **스킬 효과 적용 엔진 구현** (2시간)  
3. **스킬 스택 관리 시스템** (1시간)

### 3.2 스킬 확률 및 선택 시스템

#### 우선순위: 높음 ⭐⭐
#### 예상 시간: 3-4시간

```javascript
generateRandomSkills(count = 3) {
    const playerLevel = this.weaponLevel;
    const weights = this.getWeightsForLevel(playerLevel);
    
    // 이미 최대 스택에 도달한 스킬들 제외
    const availableSkills = Object.values(skillDefinitions)
        .filter(skill => this.canSelectSkill(skill));
        
    // 가중치 기반 랜덤 선택
    const selectedSkills = [];
    const usedCategories = new Set();
    
    for (let i = 0; i < count; i++) {
        const skill = this.weightedRandomSelection(
            availableSkills, 
            weights,
            usedCategories
        );
        if (skill) {
            selectedSkills.push(skill);
            usedCategories.add(skill.category);
        }
    }
    
    return selectedSkills;
}
```

#### 구현 단계:
1. **확률 가중치 시스템 구현** (1시간)
2. **중복 방지 로직** (1시간)
3. **카테고리 균형 로직** (1시간)
4. **레벨 구간별 확률 조정** (1시간)

### 3.3 기본 스킬 효과 구현

#### 우선순위: 높음 ⭐⭐
#### 예상 시간: 4-6시간

```javascript
applySkillEffect(skill) {
    switch(skill.effect.type) {
        case 'stat_modifier':
            this.statModifierEngine.addModifier(
                skill.effect.target,
                `${skill.id}_${this.getSkillStack(skill.id)}`,
                skill.effect.operation,
                skill.effect.value
            );
            break;
            
        case 'instant':
            this.applyInstantEffect(skill);
            break;
            
        case 'special_behavior':
            this.registerSpecialBehavior(skill);
            break;
    }
    
    // 스킬 획득 기록
    this.addSkillToInventory(skill);
}
```

#### 구현 단계:
1. **능력치 수정자 효과 구현** (2시간)
2. **즉시 효과 구현 (배리어, 힐 등)** (1시간)
3. **패시브 효과 구현** (2시간)
4. **효과 테스트 및 검증** (1-2시간)

## 4. Phase 3: UI 및 사용자 경험

### 4.1 스킬 카드 선택 인터페이스

#### 우선순위: 최고 ⭐⭐⭐
#### 예상 시간: 5-6시간

```javascript
showSkillCardSelection() {
    // 게임 일시정지
    this.pauseGameForSkillSelection();
    
    // 모달 배경
    this.createSkillModal();
    
    // 랜덤 스킬 3개 생성
    const randomSkills = this.generateRandomSkills(3);
    
    // 카드 UI 생성
    this.createSkillCards(randomSkills);
    
    // 애니메이션 효과
    this.animateModalAppearance();
}

createSkillCards(skills) {
    skills.forEach((skill, index) => {
        const cardX = 200 + (index * 200);
        const card = this.createSkillCard(skill, cardX, 300);
        this.skillModal.cards.push(card);
    });
}
```

#### 구현 단계:
1. **모달 오버레이 구현** (1시간)
2. **카드 레이아웃 및 디자인** (2시간)
3. **카드 선택 상호작용** (1시간)
4. **애니메이션 및 전환 효과** (1-2시간)

### 4.2 스킬 상태 UI 표시

#### 우선순위: 중간 ⭐
#### 예상 시간: 2-3시간

```javascript
updateSkillStatusUI() {
    // 배리어 표시
    if (this.skillSystem.barrierCharges > 0) {
        this.showBarrierIndicator(this.skillSystem.barrierCharges);
    }
    
    // 액티브 버프 표시
    this.updateActiveBuffsUI();
    
    // 스킬 카운터 업데이트
    this.updateSkillCounterUI();
}
```

#### 구현 단계:
1. **배리어 충전 표시** (1시간)
2. **액티브 버프 아이콘** (1시간)  
3. **스킬 상태 패널** (30분-1시간)

### 4.3 피드백 및 효과음

#### 우선순위: 낮음 ⭐
#### 예상 시간: 1-2시간

```javascript
// 스킬 선택시 효과
onSkillCardSelected(skill) {
    // 선택 효과음 (추후 추가)
    // this.sound.play('skill_select');
    
    // 카드 선택 애니메이션
    this.animateCardSelection(skill);
    
    // 효과 적용
    this.applySkillEffect(skill);
    
    // 획득 알림
    this.showSkillAcquiredNotification(skill);
}
```

## 5. Phase 4: 고급 스킬 및 효과

### 5.1 시간 제한 버프 시스템

#### 우선순위: 높음 ⭐⭐
#### 예상 시간: 3-4시간

```javascript
applyTimedBuff(effect, duration) {
    const buffId = effect.buffId;
    
    // 기존 버프 제거
    if (this.skillSystem.activeBuffs.has(buffId)) {
        this.removeTimedBuff(buffId);
    }
    
    // 새 버프 적용
    const buffData = {
        startTime: this.time.now,
        duration: duration,
        effect: effect,
        modifiers: []
    };
    
    // 능력치 수정자 적용
    effect.modifiers.forEach(mod => {
        const modifierId = `buff_${buffId}_${mod.target}`;
        this.statModifierEngine.addModifier(
            mod.target, modifierId, mod.operation, mod.value
        );
        buffData.modifiers.push(modifierId);
    });
    
    this.skillSystem.activeBuffs.set(buffId, buffData);
    
    // 만료 타이머 설정
    this.time.delayedCall(duration, () => {
        this.removeTimedBuff(buffId);
    });
}
```

#### 구현 단계:
1. **버프 적용/제거 시스템** (2시간)
2. **버프 UI 표시** (1시간)
3. **다중 버프 관리** (1시간)

### 5.2 특수 행동 스킬들

#### 우선순위: 중간 ⭐
#### 예상 시간: 6-8시간

```javascript
// 연쇄 번개 스킬
createLightningChain(startEnemy, maxChains) {
    let currentEnemy = startEnemy;
    let chainCount = 0;
    
    const chainInterval = this.time.addEvent({
        delay: 300,
        callback: () => {
            if (chainCount >= maxChains || !currentEnemy) {
                chainInterval.destroy();
                return;
            }
            
            // 가장 가까운 적 찾기
            const nearestEnemy = this.findNearestEnemy(
                currentEnemy, 150, [startEnemy] // 이미 맞은 적 제외
            );
            
            if (nearestEnemy) {
                // 번개 이펙트 생성
                this.createLightningEffect(currentEnemy, nearestEnemy);
                
                // 피해 적용
                this.damageEnemy(nearestEnemy, this.bulletDamage);
                
                currentEnemy = nearestEnemy;
                chainCount++;
            }
        },
        repeat: maxChains - 1
    });
}
```

#### 구현 단계:
1. **연쇄 번개 효과** (2시간)
2. **블랙홀 생성** (2시간)
3. **파편 폭발 시스템** (2시간)
4. **얼음 효과** (1시간)
5. **생명력 흡수** (1시간)

### 5.3 대쉬/파동파 강화 스킬

#### 우선순위: 중간 ⭐
#### 예상 시간: 4-5시간

```javascript
// 대쉬 강화 - 경로상 공격
onDashStart() {
    if (this.hasSkill('dash_attack')) {
        // 대쉬 경로상의 적들에게 피해
        this.addDashAttackDetection();
    }
    
    if (this.hasSkill('dash_knockback')) {
        // 대쉬 경로상의 적들에게 넉백
        this.addDashKnockbackDetection();
    }
}

onDashEnd() {
    if (this.hasSkill('dash_explosion')) {
        // 착지 지점에 폭발
        this.createDashExplosion(this.player.x, this.player.y);
    }
}
```

#### 구현 단계:
1. **대쉬 경로 감지 시스템** (2시간)
2. **대쉬 강화 효과들** (2시간)
3. **파동파 강화 효과들** (1시간)

## 6. Phase 5: 밸런스 및 최적화

### 6.1 스킬 밸런스 조정

#### 우선순위: 중간 ⭐
#### 예상 시간: 3-4시간

```javascript
// 밸런스 설정을 외부 파일로 분리
const skillBalanceConfig = {
    // 카테고리별 확률
    categoryWeights: {
        early: { active: 0.40, passive: 0.50, skill: 0.10 },
        mid: { active: 0.50, passive: 0.35, skill: 0.15 },
        late: { active: 0.55, passive: 0.25, skill: 0.20 }
    },
    
    // 희귀도별 확률  
    rarityWeights: {
        early: { common: 0.70, uncommon: 0.25, rare: 0.05, legendary: 0.00 },
        mid: { common: 0.50, uncommon: 0.30, rare: 0.17, legendary: 0.03 },
        late: { common: 0.40, uncommon: 0.25, rare: 0.25, legendary: 0.10 }
    },
    
    // 스킬별 효과 값
    effectValues: {
        bullet_count: { value: 1, maxStacks: 7 },
        fire_rate_up: { multiplier: 0.8, maxStacks: 5 },
        speed_increase: { multiplier: 1.25, maxStacks: 3 }
    }
};
```

#### 구현 단계:
1. **밸런스 설정 파일 작성** (1시간)
2. **게임플레이 테스트** (2시간)
3. **수치 조정** (1시간)

### 6.2 성능 최적화

#### 우선순위: 높음 ⭐⭐
#### 예상 시간: 2-3시간

```javascript
// 스킬 효과 캐싱
updateSkillEffectCache() {
    const cache = {
        fireRateMultiplier: 1.0,
        damageMultiplier: 1.0,
        speedMultiplier: 1.0
    };
    
    // 모든 활성 모디파이어 계산하여 캐시
    for (let [statName, modifiers] of this.statModifierEngine.modifiers) {
        let multiplier = 1.0;
        for (let [id, modifier] of modifiers) {
            if (modifier.operation === 'multiply') {
                multiplier *= modifier.value;
            }
        }
        cache[`${statName}Multiplier`] = multiplier;
    }
    
    this.skillEffectCache = cache;
}
```

#### 구현 단계:
1. **효과 캐싱 시스템** (1시간)
2. **메모리 누수 방지** (1시간)
3. **성능 프로파일링** (30분-1시간)

## 7. Phase 6: 광고 연동 준비

### 7.1 광고 인터페이스 구조

#### 우선순위: 낮음 ⭐
#### 예상 시간: 2-3시간

```javascript
// 광고 관리 모듈 (추후 확장)
class AdManager {
    constructor(gameScene) {
        this.game = gameScene;
        this.isAdReady = false;
        this.rewardedAdCallback = null;
    }
    
    showRewardedAd(callback) {
        // 실제 광고 SDK 연동은 추후
        this.rewardedAdCallback = callback;
        
        // 테스트용 - 3초 후 콜백 실행
        this.game.time.delayedCall(3000, () => {
            if (this.rewardedAdCallback) {
                this.rewardedAdCallback();
                this.rewardedAdCallback = null;
            }
        });
    }
    
    isRewardedAdAvailable() {
        // 테스트용 - 항상 사용 가능
        return true;
    }
}

// 카드 재선택 기능
addAdRefreshButton() {
    if (this.skillSystem.adRefreshCount >= this.skillSystem.maxAdRefreshPerLevel) {
        return; // 이미 최대 횟수 사용
    }
    
    const adButton = this.add.rectangle(400, 520, 250, 40, 0x4CAF50, 0.8)
        .setScrollFactor(0)
        .setDepth(1005)
        .setStrokeStyle(2, 0xffffff)
        .setInteractive();
        
    const adText = this.add.text(400, 520, '📺 광고 시청으로 재선택', {
        fontSize: '14px',
        color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1006);
    
    adButton.on('pointerdown', () => {
        this.requestAdRefresh();
    });
}
```

#### 구현 단계:
1. **광고 관리자 클래스** (1시간)
2. **재선택 UI 구현** (1시간)  
3. **광고 SDK 연동 준비** (30분-1시간)

## 8. 구현 우선순위 및 마일스톤

### 8.1 핵심 기능 (반드시 구현)

1. **레벨업시 카드 선택** ⭐⭐⭐
   - Phase 1-2에서 완성
   - 기본적인 3장 카드 선택 시스템

2. **기본 패시브 스킬들** ⭐⭐⭐
   - 총알 수, 발사속도, 이동속도 등
   - 즉시 효과를 체감할 수 있는 스킬들

3. **스킬 UI 표시** ⭐⭐⭐
   - 선택된 스킬들의 시각적 피드백
   - 배리어, 버프 상태 표시

### 8.2 중요 기능 (가능하면 구현)

1. **액티브 스킬들** ⭐⭐
   - 배리어, 힐, 시간 제한 버프
   - 즉각적인 효과와 전략성 추가

2. **특수 효과 스킬들** ⭐⭐
   - 연쇄 번개, 관통, 폭발 등
   - 게임플레이에 변화를 주는 스킬들

3. **대쉬/파동파 강화** ⭐⭐
   - 기존 스킬의 확장과 강화
   - 스킬 간 시너지 효과

### 8.3 추가 기능 (시간이 허락하면)

1. **고급 특수 효과** ⭐
   - 블랙홀, 얼음, 파편 폭발 등
   - 시각적으로 임팩트 있는 스킬들

2. **광고 연동** ⭐
   - 카드 재선택 기능
   - 수익화 준비

3. **밸런스 조정 도구** ⭐
   - 외부 설정 파일
   - 실시간 밸런스 조정 기능

## 9. 일정별 목표

### Day 1: 인프라 구축
- [ ] 스킬 데이터 구조 설정
- [ ] 레벨업 시스템 수정
- [ ] 이벤트 훅 시스템 구축
- [ ] 기본 테스트 환경 구축

### Day 2-3: 핵심 스킬 시스템
- [ ] 스킬 정의 및 관리
- [ ] 확률 시스템 구현
- [ ] 기본 패시브 스킬 10개 구현
- [ ] 능력치 수정자 엔진 완성

### Day 4-5: UI 및 사용자 경험
- [ ] 스킬 카드 선택 인터페이스 완성
- [ ] 카드 애니메이션 및 전환 효과
- [ ] 스킬 상태 UI 표시
- [ ] 사용자 피드백 시스템

### Day 6-7: 고급 기능
- [ ] 액티브 스킬 구현 (배리어, 버프)
- [ ] 시간 제한 버프 시스템
- [ ] 특수 효과 스킬들 (연쇄번개 등)
- [ ] 대쉬/파동파 강화

### Day 8-9: 완성도 향상
- [ ] 밸런스 조정
- [ ] 성능 최적화
- [ ] 버그 수정 및 안정화
- [ ] 광고 연동 준비

## 10. 위험 요소 및 대응 방안

### 10.1 주요 위험 요소

1. **기존 시스템과의 충돌**
   - 대응: 점진적 통합, 철저한 테스트
   - 백업 코드 유지

2. **성능 저하**
   - 대응: 효과 캐싱, 최적화된 데이터 구조
   - 성능 모니터링 도구 사용

3. **복잡성 증가**
   - 대응: 모듈화 설계, 명확한 인터페이스
   - 문서화 철저히 진행

4. **밸런스 이슈**
   - 대응: 외부 설정 파일 사용
   - 쉬운 수치 조정 시스템

### 10.2 진행 상황 점검

#### 각 단계별 검증 포인트
- **Phase 1 완료**: L키로 레벨업시 빈 카드 선택 화면 표시
- **Phase 2 완료**: 기본 스킬들이 실제로 능력치 변경
- **Phase 3 완료**: 완전한 카드 선택 UI 동작
- **Phase 4 완료**: 고급 스킬 효과들이 시각적으로 확인
- **Phase 5 완료**: 안정적인 게임플레이 제공

이 로드맵을 따라 단계별로 구현하면 안정적이고 확장 가능한 스킬 카드 시스템을 완성할 수 있습니다.