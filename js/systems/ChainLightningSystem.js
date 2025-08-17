// 🌩️ Chain Lightning System - 체인 라이트닝 시스템
class ChainLightningSystem {
    constructor(gameScene) {
        this.game = gameScene;
        this.activeChains = new Map(); // 진행 중인 체인들
        this.chainedTargets = new Set(); // 현재 체이닝 중인 적들
        this.maxConcurrentChains = 3; // 동시 체인 최대 수
        this.chainIdCounter = 0;
        
        this.chainConfig = {
            maxJumps: 5,           // 최대 점프 수
            maxRange: 200,         // 최대 점프 거리
            damage: 15,            // 체인당 데미지
            damageDecay: 0.8,      // 점프마다 데미지 감소율
            duration: 150          // 각 점프 간 딜레이(ms)
        };
    }
    
    // 메인 체인 라이트닝 실행
    executeChainLightning(initialTarget, sourceX, sourceY, customConfig = {}) {
        // 설정 병합
        const config = { ...this.chainConfig, ...customConfig };
        
        // 1. 동시 체인 제한 확인
        if (this.activeChains.size >= this.maxConcurrentChains) {
            return false; // 체인 제한 초과
        }
        
        // 2. 초기 타겟이 이미 체이닝 중인지 확인
        if (this.chainedTargets.has(initialTarget.id || initialTarget)) {
            return false; // 중복 체이닝 방지
        }
        
        // 3. 타겟 유효성 검사
        if (!initialTarget || !initialTarget.active) {
            return false;
        }
        
        // 4. 체인 ID 생성 및 시작
        const chainId = this.generateChainId();
        const chainData = {
            id: chainId,
            targets: [initialTarget],
            currentJump: 0,
            currentDamage: config.damage,
            isActive: true,
            config: config
        };
        
        this.activeChains.set(chainId, chainData);
        this.chainedTargets.add(initialTarget.id || initialTarget);
        
        // 5. 첫 번째 점프 실행
        this.executeChainJump(chainData, sourceX, sourceY);
        
        return true;
    }
    
    // 개별 체인 점프 실행
    executeChainJump(chainData, fromX, fromY) {
        const currentTarget = chainData.targets[chainData.targets.length - 1];
        
        if (!currentTarget || !currentTarget.active) {
            this.endChain(chainData.id);
            return;
        }
        
        // 1. 현재 타겟에 데미지 적용
        this.applyChainDamage(currentTarget, chainData.currentDamage);
        
        // 2. 시각 효과 생성
        this.createChainLightningEffect(
            fromX, fromY, 
            currentTarget.x, currentTarget.y,
            chainData.currentJump
        );
        
        // 3. 다음 타겟 찾기
        const nextTarget = this.findBestNextTarget(
            currentTarget.x, 
            currentTarget.y, 
            chainData.targets,
            chainData.config.maxRange
        );
        
        // 4. 체인 계속 여부 결정
        if (nextTarget && chainData.currentJump < chainData.config.maxJumps - 1) {
            // 다음 점프 준비
            chainData.targets.push(nextTarget);
            chainData.currentJump++;
            chainData.currentDamage *= chainData.config.damageDecay;
            
            this.chainedTargets.add(nextTarget.id || nextTarget);
            
            // 딜레이 후 다음 점프
            this.game.time.delayedCall(chainData.config.duration, () => {
                this.executeChainJump(chainData, currentTarget.x, currentTarget.y);
            });
        } else {
            // 체인 종료
            this.endChain(chainData.id);
        }
    }
    
    // 최적 다음 타겟 선택 알고리즘
    findBestNextTarget(fromX, fromY, excludeTargets, maxRange) {
        const excludeIds = new Set(excludeTargets.map(t => t.id || t));
        let bestTarget = null;
        let bestScore = -1;
        
        this.game.enemies.children.entries.forEach(enemy => {
            if (!enemy.active || excludeIds.has(enemy.id || enemy) || 
                this.chainedTargets.has(enemy.id || enemy)) {
                return; // 제외 대상
            }
            
            const distance = Phaser.Math.Distance.Between(
                fromX, fromY, enemy.x, enemy.y
            );
            
            if (distance <= maxRange) {
                // 스코어 계산: 거리 + 적 타입 + 체력
                const score = this.calculateTargetScore(enemy, distance, maxRange);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestTarget = enemy;
                }
            }
        });
        
        return bestTarget;
    }
    
    // 타겟 우선순위 스코어 계산
    calculateTargetScore(enemy, distance, maxRange) {
        let score = 0;
        
        // 거리 점수 (가까울수록 높음)
        score += (maxRange - distance) / maxRange * 50;
        
        // 적 타입 점수
        if (enemy.enemyType === 'elite') score += 30;
        else if (enemy.enemyType === 'star_elite') score += 40;
        else if (enemy.enemyType === 'pentagon') score += 20;
        else score += 10;
        
        // 체력 점수 (체력이 낮을수록 높음 - 킬 확정)
        const healthScore = Math.max(0, 10 - (enemy.health || 1));
        score += healthScore * 2;
        
        return score;
    }
    
    // 체인 데미지 적용
    applyChainDamage(target, damage) {
        if (!target || !target.active) return;
        
        target.health -= damage;
        
        // 데미지 표시
        if (this.game.showDamageNumber) {
            this.game.showDamageNumber(target.x, target.y - 30, Math.round(damage), 0x00aaff);
        }
        
        // 감전 효과
        if (this.game.applyElectrifyEffect) {
            this.game.applyElectrifyEffect(target);
        }
        
        // 적 처치 처리
        if (target.health <= 0) {
            this.game.createExplosion(target.x, target.y);
            
            // 에너지 오브 생성
            const energyOrb = this.game.physics.add.sprite(target.x, target.y, 'energy');
            this.game.energy.add(energyOrb);
            
            // 점수 추가 (적 타입에 따라)
            let points = 100;
            if (target.enemyType === 'elite') points = 300;
            else if (target.enemyType === 'star_elite') points = 500;
            else if (target.enemyType === 'pentagon') points = 200;
            
            this.game.score += points;
            
            // 적 제거
            target.destroy();
        }
    }
    
    // 체인 종료 처리
    endChain(chainId) {
        const chainData = this.activeChains.get(chainId);
        if (!chainData) return;
        
        
        // 체이닝된 타겟들을 해제
        chainData.targets.forEach(target => {
            this.chainedTargets.delete(target.id || target);
        });
        
        // 체인 데이터 제거
        this.activeChains.delete(chainId);
        
        // 최종 폭발 효과 (옵션)
        const lastTarget = chainData.targets[chainData.targets.length - 1];
        if (lastTarget && lastTarget.active) {
            this.createChainFinaleEffect(lastTarget.x, lastTarget.y);
        }
    }
    
    // 체인 ID 생성
    generateChainId() {
        return `chain_${++this.chainIdCounter}_${Date.now()}`;
    }
    
    // 향상된 체인 라이트닝 이펙트
    createChainLightningEffect(fromX, fromY, toX, toY, jumpIndex = 0) {
        // 메인 지그재그 번개
        const mainLightning = this.createZigzagLightning(fromX, fromY, toX, toY);
        
        // 글로우 효과
        const glowEffect = this.createLightningGlow(fromX, fromY, toX, toY);
        
        // 스파크 파티클
        this.createSparkParticles(toX, toY, jumpIndex);
        
        return { mainLightning, glowEffect };
    }
    
    // 지그재그 번개 생성
    createZigzagLightning(fromX, fromY, toX, toY) {
        const lightning = this.game.add.graphics();
        
        // 메인 번개 (두껍고 밝은 청백색)
        lightning.lineStyle(4, 0x87CEEB, 1.0);
        
        const segments = 6; // 지그재그 세그먼트 수
        const deviation = 20; // 최대 편차
        
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
            
            if (perpLength > 0) {
                const normalizedPerpX = perpX / perpLength;
                const normalizedPerpY = perpY / perpLength;
                const randomDeviation = (Math.random() - 0.5) * deviation;
                
                points.push({
                    x: baseX + normalizedPerpX * randomDeviation,
                    y: baseY + normalizedPerpY * randomDeviation
                });
            } else {
                points.push({x: baseX, y: baseY});
            }
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
    createSparkParticles(x, y, intensity = 0) {
        const particleCount = 8 + (intensity * 2);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.game.add.circle(x, y, 2, 0xFFFF00, 0.8);
            
            const angle = Math.random() * Math.PI * 2;
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
    
    // 체인 최종 효과
    createChainFinaleEffect(x, y) {
        // 작은 번개 폭발
        const finale = this.game.add.circle(x, y, 15, 0x00aaff, 0.8);
        
        this.game.tweens.add({
            targets: finale,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 400,
            ease: 'Power2.easeOut',
            onComplete: () => finale.destroy()
        });
        
        // 추가 스파크
        this.createSparkParticles(x, y, 3);
    }
    
    // 정리 작업 (메모리 누수 방지)
    cleanup() {
        const now = Date.now();
        const maxAge = 10000; // 10초
        
        for (let [chainId, chainData] of this.activeChains) {
            if (now - parseInt(chainId.split('_')[2]) > maxAge) {
                this.endChain(chainId);
            }
        }
    }
    
    // 미사일 체인 라이트닝 처리 (유도미사일 전용)
    processMissileChainLightning(hitEnemy, missileX, missileY, stacks = 1) {
        const chainProbability = 0.2; // 20% 기본 확률
        const maxChainJumps = Math.min(stacks, 2); // 스택에 따른 최대 점프 수
        
        // 확률 체크
        if (Math.random() > chainProbability) {
            return false; // 체인 발생하지 않음
        }
        
        console.log(`미사일 체인 라이트닝 발동! 최대 점프: ${maxChainJumps}`);
        
        // 특별한 미사일 체인 설정
        const missileChainConfig = {
            maxJumps: maxChainJumps,
            maxRange: 150,          // 미사일 체인은 조금 더 짧은 범위
            damage: 20,             // 미사일 체인은 더 강한 데미지
            damageDecay: 0.9,       // 덜 감소
            duration: 100,          // 더 빠른 체인
            visualEffect: 'missile_chain' // 시각 효과 구분
        };
        
        // 체인 라이트닝 실행
        return this.executeChainLightning(hitEnemy, missileX, missileY, missileChainConfig);
    }
}

// 모듈 export (ES6 모듈과 CommonJS 둘 다 지원)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChainLightningSystem;
}

// 전역 스코프에도 등록 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.ChainLightningSystem = ChainLightningSystem;
}