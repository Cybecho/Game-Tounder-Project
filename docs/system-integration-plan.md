# 기존 게임 시스템 통합 계획서

## 1. 통합 개요

### 1.1 통합 원칙
- **비파괴적 통합**: 기존 게임 시스템을 손상시키지 않음
- **점진적 확장**: 기존 패턴을 활용하여 자연스러운 확장
- **모듈화 설계**: 스킬 시스템을 독립적인 모듈로 구현
- **성능 최적화**: 기존 성능을 유지하면서 새 기능 추가

### 1.2 핵심 통합 지점
1. **레벨업 시스템** - 자동 스탯 증가를 카드 선택으로 대체
2. **UI 시스템** - 기존 UI 패턴을 활용한 카드 인터페이스
3. **게임 상태 관리** - pause/resume 기능을 활용한 카드 선택
4. **능력치 시스템** - 기존 변수들을 스킬로 조작
5. **이벤트 시스템** - 기존 이벤트 핸들러에 스킬 효과 추가

## 2. 레벨업 시스템 통합

### 2.1 기존 레벨업 플로우 분석

#### 현재 구조 (game.js:2124-2176)
```javascript
levelUp() {
    if (this.isLevelingUp || this.weaponLevel >= 30) return;
    
    this.isLevelingUp = true;
    this.weaponLevel += 1;
    this.experience = 0;
    this.experienceToNext = 100 + (this.weaponLevel * 75);
    
    // 자동 스탯 증가 (제거 대상)
    this.fireRate = Math.max(100, this.fireRate - 20);
    this.fireRange += 30;
    if (this.bulletCount < 8) {
        this.bulletCount += 1;
    }
    
    // UI 업데이트 및 애니메이션
    this.showLevelUpText();
    this.performLevelUpSequence();
    
    // 레벨업 완료
    setTimeout(() => { this.isLevelingUp = false; }, 3000);
}
```

### 2.2 새로운 레벨업 플로우

#### 수정된 구조
```javascript
levelUp() {
    if (this.isLevelingUp || this.weaponLevel >= 30) return;
    
    this.isLevelingUp = true;
    this.weaponLevel += 1;
    this.experience = 0;
    this.experienceToNext = 100 + (this.weaponLevel * 75);
    
    // 레벨업 시각 효과
    this.showLevelUpText();
    
    // 1.5초 후 스킬 카드 선택 화면 표시
    this.time.delayedCall(1500, () => {
        this.showSkillCardSelection();
    });
}

onSkillCardSelected(skill) {
    // 스킬 효과 적용
    this.applySkillEffect(skill);
    
    // 카드 UI 제거
    this.hideSkillCardSelection();
    
    // 레벨업 완료 애니메이션
    this.performLevelUpSequence();
    
    // 게임 재개
    this.time.delayedCall(1000, () => {
        this.isLevelingUp = false;
        this.scene.resume();
    });
}
```

### 2.3 기존 업그레이드 시스템과의 병존

#### 아이템 기반 업그레이드 유지
```javascript
// 기존 총알 업그레이드 아이템 시스템 유지
collectBulletUpgrade(player, upgrade) {
    if (this.bulletCount < 8) {
        this.bulletCount += 1;
        this.showUpgradeCollectedText('총알 +1');
        
        // 스킬 시스템과 구분하여 관리
        this.itemBasedBulletUpgrades = (this.itemBasedBulletUpgrades || 0) + 1;
    }
    upgrade.destroy();
}
```

## 3. UI 시스템 통합

### 3.1 기존 UI 패턴 분석

#### 현재 UI 생성 패턴
```javascript
// 텍스트 생성
this.add.text(x, y, text, {
    fontSize: '20px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 2
}).setScrollFactor(0);

// 도형 생성
this.add.rectangle(x, y, width, height, color, alpha)
    .setStrokeStyle(thickness, strokeColor)
    .setInteractive();

// 애니메이션
this.tweens.add({
    targets: element,
    alpha: 1,
    scaleX: 1.1,
    duration: 600,
    ease: 'Back.easeOut'
});
```

### 3.2 스킬 카드 UI 설계

#### 모달 오버레이 구조
```javascript
showSkillCardSelection() {
    // 게임 일시정지
    this.scene.pause();
    
    // 모달 배경
    this.skillModal = {
        background: this.add.rectangle(400, 300, 800, 600, 0x000000, 0.95)
            .setScrollFactor(0)
            .setDepth(1000)
            .setStrokeStyle(4, 0x4CAF50),
            
        title: this.add.text(400, 150, '스킬 선택', {
            fontSize: '48px',
            color: '#4CAF50',
            stroke: '#000000',
            strokeThickness: 4,
            fontWeight: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001),
        
        cards: [],
        
        // 광고 재선택 버튼 (추후 구현)
        adButton: null
    };
    
    // 3장의 카드 생성
    const randomSkills = this.generateRandomSkills(3);
    this.createSkillCards(randomSkills);
    
    // 페이드인 애니메이션
    this.skillModal.background.setAlpha(0);
    this.skillModal.title.setAlpha(0);
    
    this.tweens.add({
        targets: [this.skillModal.background, this.skillModal.title],
        alpha: 1,
        duration: 500,
        ease: 'Power2'
    });
}
```

#### 개별 카드 생성
```javascript
createSkillCard(skill, index) {
    const cardX = 200 + (index * 200); // 200, 400, 600
    const cardY = 300;
    
    const card = {
        // 카드 배경
        background: this.add.rectangle(cardX, cardY, 160, 240, 0x1a1a1a, 0.9)
            .setScrollFactor(0)
            .setDepth(1002)
            .setStrokeStyle(3, this.getCardBorderColor(skill.rarity))
            .setInteractive(),
            
        // 희귀도 표시 (상단 띠)
        rarityStripe: this.add.rectangle(cardX, cardY - 105, 160, 20, this.getRarityColor(skill.rarity))
            .setScrollFactor(0)
            .setDepth(1003),
            
        // 스킬 아이콘
        icon: this.add.text(cardX, cardY - 60, this.getSkillIcon(skill), {
            fontSize: '40px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1003),
        
        // 스킬 이름
        name: this.add.text(cardX, cardY - 10, skill.name, {
            fontSize: '18px',
            color: '#ffffff',
            fontWeight: 'bold',
            align: 'center',
            wordWrap: { width: 140 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1003),
        
        // 스킬 설명
        description: this.add.text(cardX, cardY + 40, skill.description, {
            fontSize: '12px',
            color: '#cccccc',
            align: 'center',
            wordWrap: { width: 140 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1003),
        
        // 선택 버튼
        selectButton: this.add.rectangle(cardX, cardY + 90, 120, 30, 0x4CAF50, 0.8)
            .setScrollFactor(0)
            .setDepth(1003)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive(),
            
        selectText: this.add.text(cardX, cardY + 90, '선택', {
            fontSize: '16px',
            color: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1004)
    };
    
    // 호버 효과
    card.background.on('pointerover', () => {
        this.tweens.add({
            targets: [card.background, card.selectButton],
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 150
        });
    });
    
    card.background.on('pointerout', () => {
        this.tweens.add({
            targets: [card.background, card.selectButton],
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 150
        });
    });
    
    // 선택 이벤트
    card.selectButton.on('pointerdown', () => {
        this.selectSkillCard(skill, index);
    });
    
    return card;
}
```

### 3.3 기존 UI 요소와의 조화

#### 색상 테마 통일
```javascript
const uiTheme = {
    primary: 0x4CAF50,      // 기존 녹색 테마
    secondary: 0x2E7D32,    // 어두운 녹색
    accent: 0x81C784,       // 밝은 녹색
    background: 0x0a0a1a,   // 기존 배경색
    text: 0xffffff,         // 흰색 텍스트
    textSecondary: 0xcccccc // 회색 텍스트
};

const rarityColors = {
    common: 0x9E9E9E,       // 회색
    uncommon: 0x4CAF50,     // 녹색
    rare: 0x2196F3,         // 파랑
    legendary: 0xFF9800     // 주황
};
```

## 4. 게임 상태 관리 통합

### 4.1 기존 상태 관리 분석

#### 현재 게임 상태 변수들
```javascript
// 게임 플래그들
isLevelingUp: false,
isPlayerInvincible: false,
isDashing: false,
lightningWaveReady: true,
skillCardsPaused: false  // 추가 예정
```

### 4.2 스킬 상태 통합

#### 확장된 게임 상태
```javascript
initializeGameVariables() {
    // ... 기존 변수들 ...
    
    // 스킬 시스템 상태
    this.skillSystem = {
        isCardSelectionActive: false,
        selectedSkillsThisRun: new Set(),
        skillEffectCache: new Map(),
        
        // 액티브 스킬 상태
        barrierCharges: 0,
        maxBarrierCharges: 3,
        
        // 시간 제한 버프들
        activeBuffs: new Map(),
        
        // 스킬 스택 정보
        skillStacks: new Map(),
        
        // 광고 관련
        adRefreshCount: 0,
        maxAdRefreshPerLevel: 1
    };
}
```

### 4.3 Scene 관리 통합

#### 일시정지/재개 로직
```javascript
pauseGameForSkillSelection() {
    // 타이머들 일시정지
    this.enemySpawnTimer.paused = true;
    this.physics.world.pause();
    
    // 입력 비활성화 (스킬 카드 선택 제외)
    this.cursors.enabled = false;
    this.wasd.enabled = false;
    
    // 시각적 표시 (게임 화면 어둡게)
    this.gameOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.3)
        .setScrollFactor(0)
        .setDepth(999);
}

resumeGameAfterSkillSelection() {
    // 타이머들 재개
    this.enemySpawnTimer.paused = false;
    this.physics.world.resume();
    
    // 입력 재활성화
    this.cursors.enabled = true;
    this.wasd.enabled = true;
    
    // 오버레이 제거
    if (this.gameOverlay) {
        this.gameOverlay.destroy();
        this.gameOverlay = null;
    }
}
```

## 5. 능력치 시스템 통합

### 5.1 기존 능력치 체계 분석

#### 현재 플레이어 스탯들
```javascript
// 이동 관련
playerSpeed: 400,
playerAcceleration: 1200,
playerDrag: 900,

// 전투 관련
fireRate: 200,
bulletSpeed: 700,
bulletCount: 1,
fireRange: 300,

// 체력 관련
playerHealth: 3,
maxPlayerHealth: 3,

// 스킬 관련
dashCharges: 3,
dashCooldown: 4000,
lightningWaveCooldown: 15000
```

### 5.2 스킬 효과 적용 시스템

#### 능력치 수정자 엔진
```javascript
class StatModifierEngine {
    constructor(gameScene) {
        this.game = gameScene;
        this.baseStats = this.captureBaseStats();
        this.modifiers = new Map();
    }
    
    captureBaseStats() {
        return {
            playerSpeed: this.game.playerSpeed,
            fireRate: this.game.fireRate,
            bulletCount: this.game.bulletCount,
            // ... 모든 기본 스탯들
        };
    }
    
    addModifier(statName, modifierId, operation, value) {
        if (!this.modifiers.has(statName)) {
            this.modifiers.set(statName, new Map());
        }
        
        this.modifiers.get(statName).set(modifierId, { operation, value });
        this.recalculateStat(statName);
    }
    
    removeModifier(statName, modifierId) {
        if (this.modifiers.has(statName)) {
            this.modifiers.get(statName).delete(modifierId);
            this.recalculateStat(statName);
        }
    }
    
    recalculateStat(statName) {
        let finalValue = this.baseStats[statName];
        const statModifiers = this.modifiers.get(statName);
        
        if (statModifiers) {
            // 먼저 덧셈 수정자 적용
            for (let [id, modifier] of statModifiers) {
                if (modifier.operation === 'add') {
                    finalValue += modifier.value;
                }
            }
            
            // 그 다음 곱셈 수정자 적용
            for (let [id, modifier] of statModifiers) {
                if (modifier.operation === 'multiply') {
                    finalValue *= modifier.value;
                }
            }
        }
        
        // 게임 객체에 적용
        this.game[statName] = Math.max(1, finalValue); // 최소값 보장
        
        // 물리 엔진에도 적용 (필요한 경우)
        this.applyToPhysicsEngine(statName, finalValue);
    }
    
    applyToPhysicsEngine(statName, value) {
        switch(statName) {
            case 'playerSpeed':
                this.game.player.setMaxVelocity(value);
                break;
            case 'playerDrag':
                this.game.player.setDrag(value);
                break;
        }
    }
}
```

#### 스킬 효과 적용 통합
```javascript
applySkillEffect(skill) {
    const modifierId = `${skill.id}_${Date.now()}`;
    
    switch(skill.effect.type) {
        case 'stat_modifier':
            this.statModifierEngine.addModifier(
                skill.effect.target,
                modifierId,
                skill.effect.operation,
                skill.effect.value
            );
            break;
            
        case 'multi_modifier':
            skill.effect.modifiers.forEach(mod => {
                this.statModifierEngine.addModifier(
                    mod.target,
                    `${modifierId}_${mod.target}`,
                    mod.operation,
                    mod.value
                );
            });
            break;
            
        case 'instant':
            this.applyInstantEffect(skill.effect);
            break;
            
        case 'timed_buff':
            this.applyTimedBuff(skill.effect, modifierId);
            break;
    }
    
    // UI 업데이트
    this.updateStatsUI();
}
```

## 6. 이벤트 시스템 통합

### 6.1 기존 이벤트 분석

#### 현재 게임 이벤트들
```javascript
// 충돌 이벤트
this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
this.physics.add.overlap(this.player, this.enemies, this.playerHit, null, this);

// 입력 이벤트
this.input.on('pointerdown', this.onPointerDown, this);
this.input.keyboard.on('keydown-SPACE', this.onSpaceKey, this);

// 타이머 이벤트
this.time.addEvent({
    delay: 1000,
    callback: this.updateGameTime,
    loop: true
});
```

### 6.2 스킬 이벤트 훅 시스템

#### 이벤트 훅 추가
```javascript
// 기존 hitEnemy 함수 확장
hitEnemy(bullet, enemy) {
    // 기존 로직
    enemy.health -= this.bulletDamage;
    
    // 스킬 이벤트 트리거
    this.triggerSkillEvent('onBulletHit', { bullet, enemy });
    
    if (enemy.health <= 0) {
        this.killEnemy(enemy);
        this.triggerSkillEvent('onEnemyKill', { enemy });
    }
}

// 기존 playerHit 함수 확장
playerHit(player, enemy) {
    // 배리어 체크
    if (this.skillSystem.barrierCharges > 0) {
        this.skillSystem.barrierCharges--;
        this.showBarrierBreakEffect();
        this.updateBarrierUI();
        return; // 피해 무시
    }
    
    // 기존 피해 로직
    if (!this.isPlayerInvincible) {
        this.playerHealth -= 1;
        this.isPlayerInvincible = true;
        
        // 스킬 이벤트 트리거
        this.triggerSkillEvent('onPlayerHit', { enemy });
        
        // 기존 무적 처리
        this.startPlayerInvincibility();
    }
}
```

#### 이벤트 핸들러 시스템
```javascript
initializeSkillEventSystem() {
    this.skillEventHandlers = {
        onBulletHit: [],
        onEnemyKill: [],
        onPlayerHit: [],
        onDashStart: [],
        onDashEnd: [],
        onLightningWave: []
    };
}

registerSkillEventHandler(eventType, handler, skillId) {
    if (!this.skillEventHandlers[eventType]) {
        this.skillEventHandlers[eventType] = [];
    }
    
    this.skillEventHandlers[eventType].push({
        handler: handler,
        skillId: skillId
    });
}

triggerSkillEvent(eventType, eventData) {
    const handlers = this.skillEventHandlers[eventType] || [];
    
    for (let handlerInfo of handlers) {
        try {
            handlerInfo.handler.call(this, eventData);
        } catch (error) {
            console.error(`스킬 이벤트 처리 오류 (${handlerInfo.skillId}):`, error);
        }
    }
}
```

### 6.3 스킬별 이벤트 등록 예시

#### 연쇄 번개 스킬 이벤트
```javascript
registerLightningChainSkill() {
    this.registerSkillEventHandler('onBulletHit', (data) => {
        if (Math.random() < 0.5) { // 50% 확률
            const chainCount = this.getSkillStack('lightning_chain') || 1;
            this.createLightningChain(data.enemy, chainCount);
        }
    }, 'lightning_chain');
}
```

#### 생명력 흡수 스킬 이벤트
```javascript
registerLifeStealSkill() {
    this.registerSkillEventHandler('onEnemyKill', (data) => {
        const stacks = this.getSkillStack('life_steal') || 0;
        const chance = stacks * 0.05;
        
        if (Math.random() < chance && this.playerHealth < this.maxPlayerHealth) {
            this.playerHealth += 1;
            this.updateHealthUI();
            this.showLifeStealEffect();
        }
    }, 'life_steal');
}
```

## 7. 성능 최적화 통합

### 7.1 메모리 관리

#### 스킬 리소스 정리
```javascript
cleanupSkillResources() {
    // 이벤트 핸들러 정리
    Object.keys(this.skillEventHandlers).forEach(eventType => {
        this.skillEventHandlers[eventType] = [];
    });
    
    // 모디파이어 정리
    if (this.statModifierEngine) {
        this.statModifierEngine.modifiers.clear();
    }
    
    // 액티브 버프 정리
    this.skillSystem.activeBuffs.clear();
    
    // 카드 UI 정리
    if (this.skillModal) {
        this.destroySkillModal();
    }
}
```

### 7.2 성능 모니터링

#### 스킬 시스템 성능 추적
```javascript
measureSkillPerformance() {
    const performanceData = {
        activeSkills: this.skillSystem.selectedSkillsThisRun.size,
        activeModifiers: this.statModifierEngine.modifiers.size,
        activeBuffs: this.skillSystem.activeBuffs.size,
        eventHandlers: Object.values(this.skillEventHandlers)
            .reduce((sum, handlers) => sum + handlers.length, 0)
    };
    
    // 성능 경고 (개발 모드에서만)
    if (performanceData.activeModifiers > 50) {
        console.warn('스킬 모디파이어가 많습니다:', performanceData);
    }
    
    return performanceData;
}
```

## 8. 테스트 및 디버깅 통합

### 8.1 기존 디버그 기능 활용

#### L키 치트 확장
```javascript
// 기존 L키 이벤트 (game.js:1062) 확장
handleLKeyPress() {
    // 기존 레벨업 로직
    this.gainExperience(this.experienceToNext);
    
    // 개발 모드에서 스킬 테스트 옵션 추가
    if (this.game.config.physics.arcade.debug) {
        this.showSkillTestMenu();
    }
}

showSkillTestMenu() {
    // 개발자용 스킬 테스트 메뉴
    const testSkills = ['bullet_count', 'dash_enhanced', 'lightning_chain'];
    this.createDebugSkillCards(testSkills);
}
```

### 8.2 스킬 시스템 디버그 정보

#### 디버그 패널
```javascript
createSkillDebugPanel() {
    if (!this.game.config.physics.arcade.debug) return;
    
    this.debugPanel = this.add.group();
    
    // 현재 스킬 상태 표시
    const debugText = this.add.text(600, 16, '', {
        fontSize: '12px',
        color: '#00ff00',
        backgroundColor: '#000000'
    }).setScrollFactor(0).setDepth(9999);
    
    // 매 프레임 업데이트
    this.time.addEvent({
        delay: 100,
        callback: () => {
            const debugInfo = [
                `스킬 수: ${this.skillSystem.selectedSkillsThisRun.size}`,
                `모디파이어: ${this.statModifierEngine.modifiers.size}`,
                `배리어: ${this.skillSystem.barrierCharges}`,
                `버프: ${this.skillSystem.activeBuffs.size}`,
                `총알 수: ${this.bulletCount}`,
                `발사속도: ${Math.round(this.fireRate)}ms`
            ];
            debugText.setText(debugInfo.join('\n'));
        },
        loop: true
    });
    
    this.debugPanel.add(debugText);
}
```

이 통합 계획을 통해 기존 게임의 안정성과 성능을 유지하면서 강력한 스킬 카드 시스템을 자연스럽게 통합할 수 있습니다.