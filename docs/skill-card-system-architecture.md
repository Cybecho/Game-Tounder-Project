# 스킬 카드 시스템 아키텍처 계획서

## 1. 프로젝트 개요

### 1.1 목표
레벨업할 때마다 3장의 랜덤 스킬 카드가 등장하여 플레이어가 하나를 선택할 수 있는 로그라이크 스타일 진행 시스템 구현

### 1.2 핵심 요구사항
- **카드 선택 시스템**: 레벨업시 3장의 랜덤 카드 표시
- **스킬 분류**: Active (50%), Passive (35%), Skill (15%) 비율로 등장
- **광고 연동 준비**: 추후 광고 시청으로 카드 재선택 기능 확장 가능한 구조
- **밸런스**: 각 스킬의 중첩 가능 여부와 최대 레벨 관리
- **지속성**: 선택된 스킬들의 영구적 적용

## 2. 현재 게임 구조 분석

### 2.1 기존 시스템 현황

#### 레벨링 시스템 (game.js:2124-2176)
```javascript
// 현재 레벨업 처리
levelUp() {
    if (this.isLevelingUp || this.weaponLevel >= 30) return;
    this.isLevelingUp = true;
    this.weaponLevel += 1;
    // 자동 스탯 증가 (제거 예정)
    this.fireRate = Math.max(100, this.fireRate - 20);
    this.fireRange += 30;
    this.bulletCount = Math.min(8, this.bulletCount + 1);
}
```

**통합 지점**: 자동 스탯 증가를 카드 선택으로 대체

#### 플레이어 능력 시스템
- **대쉬 시스템**: 3회 충전, 4초 쿨다운, 번개 효과
- **번개 파동파**: 15초 쿨다운, 800px 반경
- **사격 시스템**: 자동 조준, 다양한 발사 패턴

#### UI 시스템 패턴
```javascript
// 기존 UI 생성 패턴
this.add.rectangle(x, y, width, height, color, alpha)
this.add.text(x, y, text, style).setScrollFactor(0)
```

### 2.2 확장 가능한 시스템들

#### 게임 상태 관리
- `scene.pause()` / `scene.resume()` 기능 활용
- `isLevelingUp` 플래그로 중복 방지
- 기존 입력 처리 시스템 재활용

#### 애니메이션 시스템
```javascript
// 기존 트윈 애니메이션 패턴
this.tweens.add({
    targets: element,
    scaleX: 1.1, scaleY: 1.1,
    duration: 600,
    ease: 'Back.easeOut'
});
```

## 3. 스킬 카드 시스템 설계

### 3.1 데이터 구조

#### 스킬 정의 구조
```javascript
const skillDefinitions = {
    // Active Skills (50%)
    instant_barrier: {
        id: 'instant_barrier',
        name: '방어 배리어',
        description: '공격을 1회 막아주는 베리어 생성 (최대 3회 중첩)',
        category: 'active',
        rarity: 'common',
        stackable: true,
        maxStacks: 3,
        probability: 0.12,
        effect: {
            type: 'instant',
            action: 'add_barrier',
            value: 1
        }
    },
    
    // Passive Skills (35%)
    bullet_count: {
        id: 'bullet_count',
        name: '다중 사격',
        description: '총알이 +1 개 추가됩니다 (최대 8개)',
        category: 'passive',
        rarity: 'common',
        stackable: true,
        maxStacks: 7,
        probability: 0.08,
        effect: {
            type: 'stat_modifier',
            target: 'bulletCount',
            operation: 'add',
            value: 1
        }
    },
    
    // Skill Enhancement (15%)
    dash_enhanced: {
        id: 'dash_enhanced',
        name: '대쉬 강화',
        description: '대쉬 거리 30% 감소, 쿨타임 20% 단축 (최대 3회)',
        category: 'skill',
        rarity: 'rare',
        stackable: true,
        maxStacks: 3,
        probability: 0.03,
        effect: {
            type: 'multi_modifier',
            modifiers: [
                { target: 'dashDistance', operation: 'multiply', value: 0.7 },
                { target: 'dashCooldown', operation: 'multiply', value: 0.8 }
            ]
        }
    }
};
```

#### 플레이어 스킬 상태
```javascript
// initializeGameVariables()에 추가
this.playerSkills = {
    // 액티브 스킬 상태
    barrierCharges: 0,
    maxBarrierCharges: 3,
    
    // 버프 상태
    activeBuffs: new Map(), // 시간 제한 버프들
    
    // 패시브 스킬 스택
    skillStacks: new Map(), // skillId -> currentStacks
    
    // 획득한 스킬 목록
    acquiredSkills: new Set()
};
```

### 3.2 카드 선택 UI 시스템

#### 모달 오버레이 구조
```javascript
showSkillCardSelection() {
    // 게임 일시정지
    this.scene.pause();
    this.skillCardsPaused = true;
    
    // 모달 배경
    this.cardModalBg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.9)
        .setScrollFactor(0)
        .setDepth(1000);
    
    // 3장의 랜덤 카드 생성
    const randomSkills = this.generateRandomSkills(3);
    this.createSkillCards(randomSkills);
}
```

#### 카드 레이아웃
```
[  카드 1  ] [  카드 2  ] [  카드 3  ]
┌─────────┐ ┌─────────┐ ┌─────────┐
│  아이콘  │ │  아이콘  │ │  아이콘  │
│  제목   │ │  제목   │ │  제목   │
│ 설명텍스트│ │ 설명텍스트│ │ 설명텍스트│
│ [선택]  │ │ [선택]  │ │ [선택]  │
└─────────┘ └─────────┘ └─────────┘
```

### 3.3 확률 시스템

#### 스킬 등급별 확률
```javascript
const rarityWeights = {
    common: 0.60,    // 60%
    uncommon: 0.25,  // 25%
    rare: 0.12,      // 12%
    legendary: 0.03  // 3%
};

const categoryWeights = {
    active: 0.50,    // 50%
    passive: 0.35,   // 35%
    skill: 0.15      // 15%
};
```

#### 중복 방지 로직
```javascript
generateRandomSkills(count) {
    const availableSkills = Object.values(skillDefinitions)
        .filter(skill => {
            // 이미 최대 스택 달성한 스킬 제외
            const currentStacks = this.playerSkills.skillStacks.get(skill.id) || 0;
            return !skill.stackable || currentStacks < skill.maxStacks;
        });
        
    return this.weightedRandomSelection(availableSkills, count);
}
```

## 4. 스킬 효과 시스템

### 4.1 효과 적용 엔진

#### 통합 효과 적용기
```javascript
applySkillEffect(skill) {
    switch(skill.effect.type) {
        case 'instant':
            this.applyInstantEffect(skill.effect);
            break;
        case 'stat_modifier':
            this.applyStatModifier(skill.effect);
            break;
        case 'multi_modifier':
            skill.effect.modifiers.forEach(mod => 
                this.applyStatModifier(mod));
            break;
        case 'timed_buff':
            this.applyTimedBuff(skill.effect);
            break;
    }
    
    // 스킬 획득 기록
    this.playerSkills.acquiredSkills.add(skill.id);
    this.incrementSkillStack(skill.id);
}
```

#### 스탯 수정 시스템
```javascript
applyStatModifier(modifier) {
    const currentValue = this[modifier.target];
    
    switch(modifier.operation) {
        case 'add':
            this[modifier.target] = currentValue + modifier.value;
            break;
        case 'multiply':
            this[modifier.target] = currentValue * modifier.value;
            break;
        case 'set':
            this[modifier.target] = modifier.value;
            break;
    }
    
    // UI 업데이트 트리거
    this.updateUIAfterSkillChange();
}
```

### 4.2 시간 제한 버프 시스템

#### 버프 관리
```javascript
applyTimedBuff(effect) {
    const buffId = effect.buffId;
    const duration = effect.duration;
    
    // 기존 버프 제거 (중첩되지 않는 경우)
    if (this.playerSkills.activeBuffs.has(buffId)) {
        this.removeTimedBuff(buffId);
    }
    
    // 새 버프 적용
    this.playerSkills.activeBuffs.set(buffId, {
        startTime: this.time.now,
        duration: duration,
        effect: effect
    });
    
    // 타이머 설정
    this.time.delayedCall(duration, () => {
        this.removeTimedBuff(buffId);
    });
}
```

## 5. 광고 연동 시스템 준비

### 5.1 카드 재선택 구조

#### 광고 시청 후 재선택 인터페이스
```javascript
showSkillCardSelection() {
    // ... 기존 카드 표시 로직 ...
    
    // 광고 시청 버튼 추가 (추후 구현)
    this.adRefreshButton = this.add.rectangle(400, 550, 200, 40, 0x4CAF50, 0.8)
        .setScrollFactor(0)
        .setDepth(1001)
        .setInteractive();
        
    this.add.text(400, 550, '광고 시청으로 재선택', {
        fontSize: '16px',
        color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);
    
    this.adRefreshButton.on('pointerdown', this.onAdRefreshRequested, this);
}

onAdRefreshRequested() {
    // 광고 SDK 호출 (추후 구현)
    // this.showRewardedAd(() => {
    //     this.refreshSkillCards();
    // });
    
    // 현재는 즉시 재선택 (테스트용)
    this.refreshSkillCards();
}

refreshSkillCards() {
    // 기존 카드 제거
    this.clearCurrentCards();
    
    // 새로운 3장 생성
    const newSkills = this.generateRandomSkills(3);
    this.createSkillCards(newSkills);
}
```

### 5.2 광고 이벤트 처리

#### 광고 상태 관리
```javascript
// initializeGameVariables()에 추가
this.adSystem = {
    isAdPlaying: false,
    adRefreshCount: 0,
    maxAdRefreshPerLevel: 1, // 레벨당 최대 1회 광고 재선택
    lastAdTime: 0
};
```

## 6. 통합 및 최적화

### 6.1 기존 시스템과의 통합

#### 레벨업 플로우 수정
```javascript
// 기존 levelUp() 함수 대체
levelUp() {
    if (this.isLevelingUp || this.weaponLevel >= 30) return;
    
    this.isLevelingUp = true;
    this.weaponLevel += 1;
    this.experience = 0;
    this.experienceToNext = 100 + (this.weaponLevel * 75);
    
    // 레벨업 효과 표시
    this.showLevelUpText();
    
    // 스킬 카드 선택으로 이동 (자동 스탯 증가 제거)
    this.time.delayedCall(1500, () => {
        this.showSkillCardSelection();
    });
}
```

#### 기존 업그레이드 시스템과의 공존
```javascript
// 총알 업그레이드 아이템은 유지하되, 스킬과 구분
collectBulletUpgrade(player, upgrade) {
    // 기존 로직 유지
    if (this.bulletCount < 8) {
        this.bulletCount += 1;
        // 스킬 시스템과 별도로 관리
        this.showUpgradeCollectedText('Bullet Count +1');
    }
    upgrade.destroy();
}
```

### 6.2 성능 최적화

#### 스킬 효과 캐싱
```javascript
// 자주 계산되는 스킬 효과들을 캐시
this.skillEffectCache = {
    fireRateModifier: 1.0,
    damageModifier: 1.0,
    speedModifier: 1.0,
    // ... 기타 수정자들
};

updateSkillEffectCache() {
    // 모든 획득한 스킬들의 효과를 누적 계산
    this.skillEffectCache = this.calculateCumulativeEffects();
}
```

#### 메모리 관리
```javascript
cleanup() {
    // 스킬 관련 리소스 정리
    this.playerSkills.activeBuffs.clear();
    this.skillEffectCache = null;
    
    // 카드 UI 리소스 정리
    if (this.cardModalBg) {
        this.cardModalBg.destroy();
        this.cardModalBg = null;
    }
}
```

## 7. 확장성 고려사항

### 7.1 모듈화 설계
- **SkillManager**: 스킬 정의, 확률, 효과 적용 전담
- **CardUI**: 카드 선택 인터페이스 전담  
- **EffectSystem**: 스킬 효과 처리 전담
- **AdManager**: 광고 연동 기능 전담

### 7.2 데이터 저장
```javascript
// 추후 로컬 스토리지나 서버 연동을 위한 구조
getSkillSaveData() {
    return {
        acquiredSkills: Array.from(this.playerSkills.acquiredSkills),
        skillStacks: Object.fromEntries(this.playerSkills.skillStacks),
        currentLevel: this.weaponLevel
    };
}

loadSkillData(saveData) {
    this.playerSkills.acquiredSkills = new Set(saveData.acquiredSkills);
    this.playerSkills.skillStacks = new Map(Object.entries(saveData.skillStacks));
    // 효과 재적용
    this.reapplyAllSkillEffects();
}
```

### 7.3 밸런스 조정 시스템
```javascript
// 설정 파일로 분리하여 쉬운 밸런스 조정
const skillBalanceConfig = {
    categoryProbabilities: { active: 0.50, passive: 0.35, skill: 0.15 },
    rarityWeights: { common: 0.60, uncommon: 0.25, rare: 0.12, legendary: 0.03 },
    stackLimits: { bullet_count: 7, dash_enhanced: 3, /* ... */ },
    effectValues: { fireRateIncrease: 0.25, damageIncrease: 0.15, /* ... */ }
};
```

이 아키텍처는 기존 게임의 안정성을 해치지 않으면서도 강력하고 확장 가능한 스킬 카드 시스템을 제공합니다.