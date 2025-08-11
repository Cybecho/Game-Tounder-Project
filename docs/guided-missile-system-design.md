# 🚀 Guided Missile System Design Document

## 📋 Project Overview

### Core Requirements
Based on research into guided missile mechanics and MapleStory-style projectile systems, implementing a sophisticated missile system with the following specifications:

**Skill 1: Missile Launcher (중첩)**
- 3초마다 적을 향해 유도 미사일 발사
- 스택당 미사일 수 증가 (최대 10개)
- 각 미사일은 지능적 유도 시스템 적용

**Skill 2: Bouncing Missiles (중첩)**  
- 미사일이 적 타격 시 즉시 소멸하지 않음
- n회 주변 적들에게 튕겨서 연쇄 타격
- 스택당 바운스 횟수 증가 (최대 3회)

---

## 🧠 Research Findings

### Modern Guided Missile Algorithms (2024)
**Proportional Navigation**: Real missiles use proportional navigation where the missile turns proportionally to the line-of-sight (LOS) rate between missile and target.

**Common Implementation Issues**:
- Orbital behavior: Missiles can get trapped in stable orbits around targets
- Solution: Balance between `angleChangingSpeed` and `movementSpeed`

**Advanced Targeting**:
- **Intercept Calculation**: Aim at where target "will be" rather than current position
- **Acceleration Curves**: Gradual acceleration/deceleration for natural movement

### MapleStory Projectile Systems
**Key Characteristics**:
- Different projectile mechanics per character class
- Bouncing mechanics with coefficient of restitution
- Sophisticated collision detection for tactical gameplay
- Max bounce count system prevents infinite bouncing

---

## 🏗️ System Architecture

### Core Components

```
GuidedMissileSystem
├── MissileSkillManager (스킬 관리)
├── MissilePool (객체 풀링)
├── GuidedMissile (유도탄 객체)
├── TargetingService (타겟팅 로직)
├── BounceHandler (튕김 메커니즘)
├── VisualEffectsManager (시각 효과)
└── PerformanceMonitor (성능 관리)
```

### 1. MissileSkillManager
**Responsibilities**:
- 스킬 스택 관리 (미사일 발사 수, 바운스 횟수)
- 3초 주기 발사 타이머
- 미사일 풀에서 객체 할당/해제
- 스킬 레벨업 이벤트 처리

```javascript
class MissileSkillManager {
    constructor(gameScene) {
        this.scene = gameScene;
        this.launchStack = 0;        // 0-10 (발사 미사일 수)
        this.bounceStack = 0;        // 0-3 (바운스 횟수)
        this.launchCooldown = 3000;  // 3초 고정
        this.maxActiveMissiles = 60; // 성능 제한
        
        this.setupLaunchTimer();
    }
}
```

### 2. MissilePool (Object Pooling)
**Purpose**: GC 최소화를 위한 미사일 객체 재사용 시스템

```javascript
class MissilePool extends Phaser.Physics.Arcade.Group {
    constructor(scene) {
        super(scene.physics.world, scene, {
            classType: GuidedMissile,
            runChildUpdate: true,
            maxSize: 100
        });
    }
    
    spawnMissile(x, y, target, bounceCount) {
        const missile = this.get(x, y);
        if (missile) {
            missile.launch(target, bounceCount);
        }
        return missile;
    }
}
```

### 3. GuidedMissile (Core Missile Logic)
**State Machine**:
- `LAUNCHING`: 초기 발사 상태 (0.2초)
- `SEEKING`: 타겟 추적 중
- `BOUNCING`: 타격 후 리타겟 중 (120ms iFrame)
- `EXPIRED`: 수명 종료/소멸

**Key Properties**:
```javascript
class GuidedMissile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'missile');
        
        // Navigation System
        this.speedMin = 180;           // px/s
        this.speedMax = 420;           // px/s
        this.currentSpeed = 260;       // px/s
        this.turnRate = 8;             // rad/s
        this.accelerationEasing = 0.15;
        
        // Wobble Effect (S자 궤적)
        this.wobbleAmp = 45;           // px
        this.wobbleFreq = 8;           // rad/s
        this.wobbleTime = 0;
        
        // Bounce System
        this.bounceLeft = 3;           // 남은 바운스 횟수
        this.bounceRadius = 220;       // 바운스 타겟 탐색 반경
        this.hitCooldown = 0;          // 중복 타격 방지
        this.visitedTargets = new Set(); // 방문한 적 추적
        
        // Lifecycle
        this.maxLifetime = 6;          // 최대 수명 (초)
        this.currentLifetime = 0;
        
        this.setupPhysics();
    }
}
```

---

## 🎯 Advanced Targeting System

### Targeting Service
**Purpose**: 지능적 타겟 선택 및 리타겟 로직

```javascript
class TargetingService {
    // 발사 타겟 선택: 근접 거리 + 가중치 기반
    selectLaunchTarget(playerX, playerY, enemies, range = 400) {
        const candidates = enemies.filter(enemy => {
            const distance = Phaser.Math.Distance.Between(
                playerX, playerY, enemy.x, enemy.y
            );
            return enemy.active && distance <= range;
        });
        
        if (candidates.length === 0) return null;
        
        // 가중치 계산: 거리^(-1) × 체력비율 × 위협도
        return this.calculateBestTarget(candidates, playerX, playerY);
    }
    
    // 바운스 리타겟: 주변 반경에서 새로운 적 선택
    selectBounceTarget(hitX, hitY, enemies, radius, visitedTargets, excludeTarget) {
        const candidates = enemies.filter(enemy => {
            if (!enemy.active || enemy === excludeTarget) return false;
            
            const distance = Phaser.Math.Distance.Between(
                hitX, hitY, enemy.x, enemy.y
            );
            
            return distance <= radius;
        });
        
        // 우선순위: 미방문 적 > 방문한 적
        const unvisited = candidates.filter(e => !visitedTargets.has(e));
        return unvisited.length > 0 ? 
               this.getClosestTarget(unvisited, hitX, hitY) :
               this.getClosestTarget(candidates, hitX, hitY);
    }
}
```

---

## 🌊 Sophisticated Navigation Algorithm

### Proportional Navigation with Wobble
**Based on real missile guidance systems**:

```javascript
updateNavigation(delta) {
    const dt = delta / 1000;
    this.wobbleTime += dt;
    this.currentLifetime += dt;
    this.hitCooldown = Math.max(0, this.hitCooldown - delta);
    
    // 수명 체크
    if (this.currentLifetime > this.maxLifetime || !this.target || !this.target.active) {
        return this.destroyMissile();
    }
    
    // 목표점 계산 (Wobble 효과 적용)
    const aimPoint = this.calculateWobbledAimPoint();
    
    // Proportional Navigation
    const desiredAngle = Phaser.Math.Angle.Between(this.x, this.y, aimPoint.x, aimPoint.y);
    const currentAngle = this.body.velocity.angle();
    const nextAngle = Phaser.Math.Angle.RotateTo(currentAngle, desiredAngle, this.turnRate * dt);
    
    // 속도 조절: 정렬도 기반
    const alignment = Math.cos(Phaser.Math.Angle.Wrap(desiredAngle - nextAngle));
    const targetSpeed = Phaser.Math.Linear(this.speedMin, this.speedMax, (alignment + 1) * 0.5);
    this.currentSpeed = Phaser.Math.Linear(this.currentSpeed, targetSpeed, this.accelerationEasing);
    
    // 물리 적용
    this.scene.physics.velocityFromRotation(nextAngle, this.currentSpeed, this.body.velocity);
    this.rotation = nextAngle;
}

calculateWobbledAimPoint() {
    // 기본 타겟 벡터
    const toTarget = new Phaser.Math.Vector2(this.target.x - this.x, this.target.y - this.y);
    
    // 수직 벡터 (S자 궤적용)
    const perpendicular = new Phaser.Math.Vector2(-toTarget.y, toTarget.x).normalize();
    
    // Wobble 오프셋 계산
    const wobbleOffset = Math.sin(this.wobbleTime * this.wobbleFreq) * this.wobbleAmp;
    
    // 최종 에임 포인트
    return new Phaser.Math.Vector2(this.target.x, this.target.y)
        .add(perpendicular.scale(wobbleOffset));
}
```

---

## 🏀 Advanced Bounce Mechanics

### Bounce Handler
**MapleStory-inspired bouncing system**:

```javascript
class BounceHandler {
    handleBounce(missile, hitEnemy) {
        // 데미지 적용
        this.applyDamage(hitEnemy, missile.damage);
        
        // 바운스 카운트 감소
        missile.bounceLeft--;
        missile.visitedTargets.add(hitEnemy);
        missile.hitCooldown = 120; // 120ms iFrame
        
        // 바운스 종료 조건
        if (missile.bounceLeft < 0) {
            return missile.destroyMissile();
        }
        
        // 다음 타겟 찾기
        const nextTarget = this.targetingService.selectBounceTarget(
            hitEnemy.x, hitEnemy.y,
            this.scene.enemies.children.entries,
            missile.bounceRadius,
            missile.visitedTargets,
            hitEnemy
        );
        
        if (nextTarget) {
            // 바운스 성공
            missile.target = nextTarget;
            missile.state = 'SEEKING';
            this.createBounceEffect(hitEnemy.x, hitEnemy.y, nextTarget.x, nextTarget.y);
        } else {
            // 바운스 실패 - 같은 타겟 재공격 또는 종료
            if (this.allowSameTargetBounce) {
                missile.target = hitEnemy; // 보스전 대응
            } else {
                missile.destroyMissile();
            }
        }
    }
    
    createBounceEffect(fromX, fromY, toX, toY) {
        // 바운스 시각 효과
        const spark = this.scene.add.circle(fromX, fromY, 8, 0xFFAA00, 0.8);
        
        this.scene.tweens.add({
            targets: spark,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => spark.destroy()
        });
        
        // 방향 표시 파티클
        const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);
        this.createDirectionParticles(fromX, fromY, angle);
    }
}
```

---

## 🎨 Visual Effects & Impact Design

### Missile Trail System
```javascript
class MissileTrailRenderer {
    constructor(missile) {
        this.missile = missile;
        this.trailPoints = [];
        this.maxTrailPoints = 12;
    }
    
    update() {
        // 트레일 포인트 추가
        this.trailPoints.push({
            x: this.missile.x,
            y: this.missile.y,
            timestamp: Date.now()
        });
        
        // 오래된 포인트 제거
        const cutoffTime = Date.now() - 300; // 300ms
        this.trailPoints = this.trailPoints.filter(p => p.timestamp > cutoffTime);
        
        this.renderTrail();
    }
    
    renderTrail() {
        if (this.trailPoints.length < 2) return;
        
        const graphics = this.missile.scene.add.graphics();
        
        for (let i = 1; i < this.trailPoints.length; i++) {
            const alpha = i / this.trailPoints.length;
            const width = alpha * 4;
            
            graphics.lineStyle(width, 0xFF6600, alpha);
            graphics.beginPath();
            graphics.moveTo(this.trailPoints[i-1].x, this.trailPoints[i-1].y);
            graphics.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
            graphics.strokePath();
        }
        
        // 트레일 페이드 아웃
        this.missile.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 300,
            onComplete: () => graphics.destroy()
        });
    }
}
```

### Impact Effects
```javascript
class ImpactEffectManager {
    createMissileHit(x, y, isBounce = false) {
        // 폭발 효과
        const explosion = this.scene.add.circle(x, y, 15, isBounce ? 0xFFAA00 : 0xFF4444, 0.8);
        
        this.scene.tweens.add({
            targets: explosion,
            scaleX: 2.5,
            scaleY: 2.5,
            alpha: 0,
            duration: 300,
            ease: 'Power2.easeOut',
            onComplete: () => explosion.destroy()
        });
        
        // 스파크 파티클
        this.createSparkParticles(x, y, isBounce ? 8 : 12);
        
        // 카메라 흔들림
        if (!isBounce) {
            this.scene.cameras.main.shake(60, 0.01);
        }
    }
    
    createLaunchEffect(x, y, targetX, targetY) {
        // 발사 연기
        const smoke = this.scene.add.circle(x, y, 12, 0x666666, 0.6);
        
        this.scene.tweens.add({
            targets: smoke,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => smoke.destroy()
        });
    }
}
```

---

## ⚡ Performance Optimization Strategy

### Object Pooling Implementation
```javascript
class PerformanceOptimizer {
    constructor() {
        this.maxActiveMissiles = 60;
        this.poolWarningThreshold = 45;
        this.gcPreventionInterval = 5000; // 5초
    }
    
    monitorPerformance() {
        // 활성 미사일 수 체크
        const activeMissiles = this.missilePool.countActive();
        
        if (activeMissiles > this.poolWarningThreshold) {
            console.warn(`높은 미사일 활성화: ${activeMissiles}/${this.maxActiveMissiles}`);
        }
        
        // 메모리 정리
        if (activeMissiles > this.maxActiveMissiles) {
            this.forceCleanupOldestMissiles();
        }
    }
    
    forceCleanupOldestMissiles() {
        const missiles = this.missilePool.getChildren()
            .filter(m => m.active)
            .sort((a, b) => a.currentLifetime - b.currentLifetime);
            
        const excessCount = missiles.length - this.maxActiveMissiles + 10;
        
        for (let i = 0; i < Math.min(excessCount, missiles.length); i++) {
            missiles[i].destroyMissile();
        }
    }
}
```

### Spatial Partitioning for Large Maps
```javascript
class SpatialGrid {
    constructor(worldWidth, worldHeight, cellSize = 200) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(worldWidth / cellSize);
        this.rows = Math.ceil(worldHeight / cellSize);
        this.grid = new Array(this.cols * this.rows).fill(null).map(() => []);
    }
    
    getNearbyEnemies(x, y, radius) {
        const startCol = Math.max(0, Math.floor((x - radius) / this.cellSize));
        const endCol = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
        const startRow = Math.max(0, Math.floor((y - radius) / this.cellSize));
        const endRow = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));
        
        const nearbyEnemies = [];
        
        for (let col = startCol; col <= endCol; col++) {
            for (let row = startRow; row <= endRow; row++) {
                const cellIndex = row * this.cols + col;
                nearbyEnemies.push(...this.grid[cellIndex]);
            }
        }
        
        return nearbyEnemies.filter(enemy => {
            const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            return distance <= radius;
        });
    }
}
```

---

## 📊 Skill Definition Integration

### Skill Data Structure
```javascript
// 기존 스킬 정의에 추가
const missileSkills = {
    guided_missile: {
        id: 'guided_missile',
        name: '유도 미사일',
        description: '3초에 한번씩 적을향해 유도하는 미사일을 발사합니다 (최대 10회)',
        category: 'skill',
        rarity: 'rare',
        stackable: true,
        maxStacks: 10,
        probability: 0.04,
        effect: {
            type: 'special_behavior',
            action: 'activate_guided_missile',
            value: 1
        }
    },
    
    bouncing_missile: {
        id: 'bouncing_missile', 
        name: '튕기는 미사일',
        description: '미사일이 바로 소멸되지 않고, n회 주위 적들을 튕깁니다. (최대 3회)',
        category: 'skill',
        rarity: 'rare',
        stackable: true,
        maxStacks: 3,
        probability: 0.03,
        effect: {
            type: 'special_behavior',
            action: 'enhance_missile_bounce',
            value: 1
        }
    }
};
```

---

## 🔧 Implementation Phases

### Phase 1: Core Navigation (Week 1)
- [x] Research missile guidance systems
- [ ] Implement basic MissileSkillManager
- [ ] Create GuidedMissile class with basic navigation
- [ ] Add proportional navigation algorithm
- [ ] Implement wobble effect for S-curve movement

### Phase 2: Bouncing System (Week 2)  
- [ ] Design and implement BounceHandler
- [ ] Create advanced TargetingService
- [ ] Add visited target tracking
- [ ] Implement bounce visual effects
- [ ] Balance bounce mechanics and parameters

### Phase 3: Visual Polish (Week 3)
- [ ] Implement sophisticated trail rendering
- [ ] Create impact and launch effects  
- [ ] Add camera shake and screen effects
- [ ] Polish missile appearance and animations
- [ ] Optimize visual performance

### Phase 4: Performance & Integration (Week 4)
- [ ] Implement object pooling system
- [ ] Add spatial partitioning for large maps
- [ ] Performance testing and optimization
- [ ] Integration with existing skill system
- [ ] Balancing and playtesting

---

## 🎯 Expected Results

### Gameplay Experience
- **Tactical Depth**: Players must consider enemy positioning for optimal bouncing
- **Visual Spectacle**: Satisfying missile trails and impact effects
- **Performance**: Smooth 60fps even with 60+ active missiles
- **Balance**: Powerful but not overpowering, requires strategic use

### Technical Achievements  
- **Zero GC Spikes**: Object pooling prevents garbage collection issues
- **Intelligent AI**: Missiles behave like real guided weapons
- **Scalable Architecture**: System can easily support additional missile types
- **MapleStory Feel**: Bouncing mechanics capture the original game's charm

This comprehensive design provides the foundation for implementing a sophisticated guided missile system that combines modern game development techniques with classic MapleStory-style bouncing mechanics, ensuring both technical excellence and engaging gameplay.