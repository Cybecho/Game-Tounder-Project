# 🌩️ Chain Lightning 강화 시스템 설계서

## 📋 프로젝트 개요

### 목표
현재 프로젝트의 기초적인 Chain Lightning을 완전히 재설계하여 게임성과 시각적 효과를 대폭 강화

### 핵심 제약사항
- **중복 타겟팅 방지**: 이미 체이닝 중인 적은 체인 종료 전까지 다른 체이닝에 포함되지 않음
- **성능 최적화**: 대량의 적에서도 60FPS 유지
- **밸런스**: 게임 난이도와 조화

---

## 🧠 Chain Lightning 알고리즘 설계

### 핵심 알고리즘: Smart Target Selection

```javascript
class ChainLightningSystem {
    constructor(gameScene) {
        this.game = gameScene;
        this.activeChains = new Map(); // 진행 중인 체인들
        this.chainedTargets = new Set(); // 현재 체이닝 중인 적들
        this.maxConcurrentChains = 3; // 동시 체인 최대 수
        this.chainConfig = {
            maxJumps: 5,           // 최대 점프 수
            maxRange: 200,         // 최대 점프 거리
            damage: 15,            // 체인당 데미지
            damageDecay: 0.8,      // 점프마다 데미지 감소율
            duration: 100          // 각 점프 간 딜레이(ms)
        };
    }
    
    // 메인 체인 라이트닝 실행
    executeChainLightning(initialTarget, sourceX, sourceY) {
        // 1. 동시 체인 제한 확인
        if (this.activeChains.size >= this.maxConcurrentChains) {
            return false; // 체인 제한 초과
        }
        
        // 2. 초기 타겟이 이미 체이닝 중인지 확인
        if (this.chainedTargets.has(initialTarget.id)) {
            return false; // 중복 체이닝 방지
        }
        
        // 3. 체인 ID 생성 및 시작
        const chainId = this.generateChainId();
        const chainData = {
            id: chainId,
            targets: [initialTarget],
            currentJump: 0,
            currentDamage: this.chainConfig.damage,
            isActive: true
        };
        
        this.activeChains.set(chainId, chainData);
        this.chainedTargets.add(initialTarget.id);
        
        // 4. 첫 번째 점프 실행
        this.executeChainJump(chainData, sourceX, sourceY);
        
        return true;
    }
    
    // 개별 체인 점프 실행
    executeChainJump(chainData, fromX, fromY) {
        const currentTarget = chainData.targets[chainData.targets.length - 1];
        
        // 1. 현재 타겟에 데미지 적용
        this.applyChainDamage(currentTarget, chainData.currentDamage);
        
        // 2. 다음 타겟 찾기
        const nextTarget = this.findBestNextTarget(
            currentTarget.x, 
            currentTarget.y, 
            chainData.targets
        );
        
        // 3. 시각 효과 생성
        this.createChainLightningEffect(
            fromX, fromY, 
            currentTarget.x, currentTarget.y,
            chainData.currentJump
        );
        
        // 4. 체인 계속 여부 결정
        if (nextTarget && chainData.currentJump < this.chainConfig.maxJumps - 1) {
            // 다음 점프 준비
            chainData.targets.push(nextTarget);
            chainData.currentJump++;
            chainData.currentDamage *= this.chainConfig.damageDecay;
            
            this.chainedTargets.add(nextTarget.id);
            
            // 딜레이 후 다음 점프
            this.game.time.delayedCall(this.chainConfig.duration, () => {
                this.executeChainJump(chainData, currentTarget.x, currentTarget.y);
            });
        } else {
            // 체인 종료
            this.endChain(chainData.id);
        }
    }
    
    // 최적 다음 타겟 선택 알고리즘
    findBestNextTarget(fromX, fromY, excludeTargets) {
        const excludeIds = new Set(excludeTargets.map(t => t.id));
        let bestTarget = null;
        let bestScore = -1;
        
        this.game.enemies.children.entries.forEach(enemy => {
            if (!enemy.active || excludeIds.has(enemy.id) || 
                this.chainedTargets.has(enemy.id)) {
                return; // 제외 대상
            }
            
            const distance = Phaser.Math.Distance.Between(
                fromX, fromY, enemy.x, enemy.y
            );
            
            if (distance <= this.chainConfig.maxRange) {
                // 스코어 계산: 거리 + 적 타입 + 체력
                const score = this.calculateTargetScore(enemy, distance);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestTarget = enemy;
                }
            }
        });
        
        return bestTarget;
    }
    
    // 타겟 우선순위 스코어 계산
    calculateTargetScore(enemy, distance) {
        let score = 0;
        
        // 거리 점수 (가까울수록 높음)
        score += (this.chainConfig.maxRange - distance) / this.chainConfig.maxRange * 50;
        
        // 적 타입 점수
        if (enemy.enemyType === 'elite') score += 30;
        else if (enemy.enemyType === 'star_elite') score += 40;
        else if (enemy.enemyType === 'pentagon') score += 20;
        else score += 10;
        
        // 체력 점수 (체력이 낮을수록 높음 - 킬 확정)
        score += (10 - enemy.health) * 2;
        
        return score;
    }
    
    // 체인 종료 처리
    endChain(chainId) {
        const chainData = this.activeChains.get(chainId);
        if (!chainData) return;
        
        // 체이닝된 타겟들을 해제
        chainData.targets.forEach(target => {
            this.chainedTargets.delete(target.id);
        });
        
        // 체인 데이터 제거
        this.activeChains.delete(chainId);
        
        // 최종 폭발 효과 (옵션)
        const lastTarget = chainData.targets[chainData.targets.length - 1];
        if (lastTarget && lastTarget.active) {
            this.createChainFinaleEffect(lastTarget.x, lastTarget.y);
        }
    }
}
```

---

## 🎨 시각 효과 설계

### 향상된 번개 시각 효과

```javascript
class LightningEffectSystem {
    constructor(gameScene) {
        this.game = gameScene;
        this.effectPool = []; // 효과 재사용을 위한 풀링
    }
    
    // 개선된 체인 라이트닝 이펙트
    createChainLightningEffect(fromX, fromY, toX, toY, jumpIndex) {
        // 1. 메인 번개 라인 (지그재그)
        const mainLightning = this.createZigzagLightning(fromX, fromY, toX, toY);
        
        // 2. 글로우 효과
        const glowEffect = this.createLightningGlow(fromX, fromY, toX, toY);
        
        // 3. 스파크 파티클
        this.createSparkParticles(toX, toY, jumpIndex);
        
        // 4. 사운드 효과
        this.playChainLightningSound(jumpIndex);
        
        return { mainLightning, glowEffect };
    }
    
    // 지그재그 번개 생성
    createZigzagLightning(fromX, fromY, toX, toY) {
        const lightning = this.game.add.graphics();
        
        // 메인 번개 (두껍고 밝은 청백색)
        lightning.lineStyle(4, 0x87CEEB, 1.0);
        
        const segments = 8; // 지그재그 세그먼트 수
        const deviation = 25; // 최대 편차
        
        let points = [{x: fromX, y: fromY}];
        
        // 중간점들 생성 (랜덤 지그재그)
        for (let i = 1; i < segments; i++) {
            const progress = i / segments;
            const baseX = fromX + (toX - fromX) * progress;
            const baseY = fromY + (toY - fromY) * progress;
            
            // 수직 방향으로 랜덤 편차 추가
            const perpX = -(toY - fromY);
            const perpY = (toX - fromX);
            const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
            const normalizedPerpX = perpX / perpLength;
            const normalizedPerpY = perpY / perpLength;
            
            const randomDeviation = (Math.random() - 0.5) * deviation;
            
            points.push({
                x: baseX + normalizedPerpX * randomDeviation,
                y: baseY + normalizedPerpY * randomDeviation
            });
        }
        
        points.push({x: toX, y: toY});
        
        // 번개 그리기
        lightning.beginPath();
        lightning.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            lightning.lineTo(points[i].x, points[i].y);
        }
        lightning.strokePath();
        
        // 번개 애니메이션 (깜빡이고 사라짐)
        this.game.tweens.add({
            targets: lightning,
            alpha: 0,
            duration: 300,
            ease: 'Power2.easeOut',
            onComplete: () => lightning.destroy()
        });
        
        return lightning;
    }
    
    // 번개 글로우 효과
    createLightningGlow(fromX, fromY, toX, toY) {
        const glow = this.game.add.graphics();
        
        // 소프트 글로우 (더 굵고 투명한 청색)
        glow.lineStyle(12, 0x4169E1, 0.3);
        glow.beginPath();
        glow.moveTo(fromX, fromY);
        glow.lineTo(toX, toY);
        glow.strokePath();
        
        this.game.tweens.add({
            targets: glow,
            alpha: 0,
            duration: 400,
            onComplete: () => glow.destroy()
        });
        
        return glow;
    }
    
    // 스파크 파티클 효과
    createSparkParticles(x, y, intensity) {
        const particleCount = 8 + (intensity * 2);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.game.add.circle(x, y, 2, 0xFFFF00, 0.8);
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            const distance = 20 + Math.random() * 30;
            
            this.game.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scaleX: 0.2,
                scaleY: 0.2,
                duration: 200 + Math.random() * 200,
                ease: 'Power2.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }
}
```

---

## 🚫 중복 체이닝 방지 시스템

### 강화된 상태 관리

```javascript
class ChainTargetManager {
    constructor() {
        this.chainStates = new Map(); // 타겟별 체인 상태
        this.globalLock = false;       // 전역 체인 잠금
    }
    
    // 타겟 체인 가능 여부 확인
    canChainTarget(targetId) {
        if (this.globalLock) return false;
        
        const state = this.chainStates.get(targetId);
        return !state || state.status === 'available';
    }
    
    // 타겟을 체인에 추가
    addToChain(targetId, chainId) {
        this.chainStates.set(targetId, {
            status: 'chaining',
            chainId: chainId,
            startTime: Date.now()
        });
    }
    
    // 체인에서 타겟 제거
    removeFromChain(targetId) {
        this.chainStates.set(targetId, {
            status: 'available',
            chainId: null,
            startTime: null
        });
    }
    
    // 정리 작업 (메모리 누수 방지)
    cleanup() {
        const now = Date.now();
        const maxAge = 10000; // 10초
        
        for (let [targetId, state] of this.chainStates) {
            if (state.startTime && (now - state.startTime) > maxAge) {
                this.chainStates.delete(targetId);
            }
        }
    }
}
```

---

## 🧪 테스트 계획

### 1. 기능 테스트

**기본 체인 로직**
- ✅ 단일 체인 정상 실행
- ✅ 최대 점프 수 제한
- ✅ 거리 제한 준수
- ✅ 데미지 감쇠 정상 작동

**중복 방지 테스트**
- ✅ 동일 타겟 재체이닝 방지
- ✅ 동시 체인 제한 작동
- ✅ 체인 종료 후 타겟 해제

### 2. 성능 테스트

**대량 적 환경**
- 100+ 적에서 체인 라이트닝 실행
- 프레임 드롭 측정 (목표: <5ms)
- 메모리 사용량 모니터링

**연속 실행 테스트**
- 짧은 간격으로 연속 체인 실행
- 메모리 누수 확인
- 상태 관리 안정성

### 3. 밸런스 테스트

**게임플레이 영향**
- 적 처치 속도 변화 측정
- 점수 획득 밸런스 확인
- 플레이어 생존율 변화

---

## 📊 성능 최적화 전략

### 1. 객체 풀링
- 번개 이펙트 객체 재사용
- 파티클 시스템 최적화
- 가비지 컬렉션 최소화

### 2. 계산 최적화  
- 거리 계산 캐싱
- 시야 절단 (화면 밖 적 제외)
- 프레임당 처리 제한

### 3. 메모리 관리
- 주기적 정리 작업
- 약한 참조 사용
- 이벤트 리스너 정리

---

## 🎯 구현 우선순위

### Phase 1: 핵심 알고리즘
1. ChainLightningSystem 클래스 구현
2. 기본 타겟 선택 로직
3. 중복 방지 시스템

### Phase 2: 시각 효과
1. 향상된 번개 이펙트
2. 파티클 시스템
3. 사운드 통합

### Phase 3: 최적화 및 밸런싱
1. 성능 프로파일링
2. 밸런스 조정
3. 버그 수정 및 안정화

---

## 🔧 기존 시스템과의 통합

### 기존 코드 수정 포인트

**game_refactored.js 수정사항**
```javascript
// 기존 createChainLightning 함수를 대체
createChainLightning(enemies) {
    // 새로운 ChainLightningSystem 사용
    if (!this.chainLightningSystem) {
        this.chainLightningSystem = new ChainLightningSystem(this);
    }
    
    if (enemies && enemies.length > 0) {
        const sourceX = this.player.x;
        const sourceY = this.player.y;
        this.chainLightningSystem.executeChainLightning(
            enemies[0], sourceX, sourceY
        );
    }
}
```

**스킬 시스템 통합**
- 새로운 체인 라이트닝 관련 스킬 추가
- 체인 점프 수, 범위, 데미지 증가 스킬
- 동시 체인 수 증가 스킬

---

## 📈 예상 효과

### 게임플레이 개선
- **전략성 증가**: 적 배치에 따른 체인 효율성 고려
- **시각적 만족도**: 화려한 번개 효과로 타격감 증대
- **밸런스**: 강력하지만 제한된 사용으로 균형 유지

### 기술적 안정성
- **중복 방지**: 버그 없는 안정적인 체인 시스템
- **성능**: 대량 적 환경에서도 안정적 작동
- **확장성**: 추가 기능 구현 용이

이 설계서를 바탕으로 단계별 구현을 진행하여 현재 프로젝트에 강력하고 안정적인 Chain Lightning 시스템을 추가할 수 있습니다.