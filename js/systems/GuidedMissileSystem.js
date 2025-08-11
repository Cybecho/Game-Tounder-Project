// 🚀 Guided Missile System - Advanced Implementation
// Based on real missile navigation algorithms with MapleStory-style bouncing

// ===============================
// Core GuidedMissile Class
// ===============================
export class GuidedMissile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'energy'); // 기존 에너지 텍스처 재사용
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setAllowGravity(false);
        this.setActive(false).setVisible(false);
        
        // Navigation System - Heavy MapleStory Style Physics
        this.speedMin = 120;           // px/s 최소 속도 (묵직한 시작)
        this.speedMax = 360;           // px/s 최대 속도 (적당한 최고속도) 
        this.currentSpeed = 120;       // px/s 현재 속도 (묵직하게 시작)
        this.launchSpeed = 120;        // px/s 발사 초기 속도
        this.turnRate = 6;             // rad/s 회전 속도 (더 묵직하게)
        this.accelerationEasing = 0.12; // 가속도 이징 (더 무겁게)
        
        // Dot Product Speed Control System
        this.alignmentSpeedMultiplier = 1.5; // 정렬 시 속도 배수
        this.misalignmentSpeedMultiplier = 0.6; // 급회전 시 속도 배수
        this.speedTransition = 0.08;   // 속도 전환 부드러움
        
        // Cubic Bezier Acceleration - 새로운 커브 (.73,-0.41,1,.53)
        this.accelerationTime = 0;     // 가속 시간 누적
        this.accelerationDuration = 1.2; // 가속 지속 시간 (초)
        this.bounciness = 0.8;         // 바운스 탄성계수
        this.newCubicBezier = true;    // 새로운 베지어 커브 사용
        
        // Enhanced Wobble Effect (무거운 곡선 궤적)
        this.wobbleAmp = 40;           // px 진폭 (더 큰 움직임)
        this.wobbleFreq = 3;           // rad/s 주파수 (더 느리고 묵직하게)
        this.wobbleTime = 0;           // 시간 누적
        this.wobbleIntensity = 1.2;    // 웨이브 강도 (더 강하게)
        
        // Bezier Curve System for Smooth Tracking
        this.bezierPoints = [];        // 베지어 곡선 포인트들
        this.bezierTime = 0;           // 베지어 진행 시간
        this.useBezierTracking = true; // 베지어 추적 사용
        
        // Enhanced Bounce System
        this.bounceLeft = 2;           // 기본 2회 바운스
        this.bounceRadius = 180;       // 바운스 탐색 반경 (더 가까이)
        this.hitCooldown = 0;          // 중복 타격 방지 (ms)
        this.visitedTargets = new Set(); // 방문한 적 추적
        this.bounceForce = 1.2;        // 바운스 힘 (탄성적 움직임)
        this.bounceDecay = 0.9;        // 바운스시 속도 유지율
        
        // Lifecycle Management
        this.maxLifetime = 6;          // 최대 수명 (초)
        this.currentLifetime = 0;      // 현재 수명
        this.damage = 2;               // 기본 데미지 (추가 하향)
        
        // State Machine
        this.state = 'INACTIVE';       // INACTIVE, LAUNCHING, SEEKING, WANDERING, BOUNCING, EXPIRED
        this.target = null;            // 현재 타겟
        
        // Wandering State (방황 상태) - 렘니스케이트 자유 배회
        this.wanderingTime = 0;        // 방황 시간
        this.wanderingTimeout = 4.0;   // 4초 후 폭발 (연장)
        this.wanderingDirection = 0;   // 방황 방향
        this.wanderingSpeed = 240;     // 방황 속도 (더 빠르게)
        this.directionChangeInterval = 0.5; // 0.5초마다 방향 변경
        this.lastDirectionChange = 0;  // 마지막 방향 변경 시간
        
        // Wandering Lemniscate Pattern (방황 렘니스케이트) - 과감하게 강화
        this.wanderingLemniscateTime = 0; // 방황 렘니스케이트 시간
        this.wanderingCenter = new Phaser.Math.Vector2(0, 0); // 방황 중심점
        this.wanderingRadius = 160;    // 방황 반경 대형화 (100 → 160)
        
        // Heavy Trajectory System (묵직한 궤적)
        this.momentum = new Phaser.Math.Vector2(0, 0); // 관성 벡터
        this.momentumDecay = 0.85;     // 관성 감쇠
        this.trajectoryWeight = 0.3;   // 궤적 무게감
        
        // Lemniscate (∞) Pattern for Continuous Attack - 과감하게 강화
        this.lemniscateTime = 0;       // 렘니스케이트 시간
        this.lemniscateRadius = 240;   // 렘니스케이트 반경 대형화 (80 → 240)
        this.isLemniscateMode = false; // 렘니스케이트 모드
        this.lemniscateCenter = new Phaser.Math.Vector2(0, 0); // 중심점
        
        // Enhanced Impact System (강화된 타격감)
        this.bounceBackForce = 3.5;    // 반대방향 튕김 강도 3.5배
        this.bounceBackDistance = 200;  // 튕김 거리 2배 증가
        this.targetOnly = true;        // 타겟만 타격 가능
        
        // Visual Effects
        this.trailPoints = [];         // 궤적 포인트들
        this.maxTrailPoints = 24;      // 최대 궤적 길이
        
        this.setupVisualEffects();
    }
    
    setupVisualEffects() {
        // 미사일 외형 설정 (푸른색 에너지, 대형 크기)
        this.setTint(0x00AAFF);
        this.setScale(3.0); // 1.2 → 3.0으로 추가 대형화
        
        // 글로우 효과
        this.glowEffect = this.scene.add.circle(this.x, this.y, 8, 0x87CEEB, 0.3);
        this.glowEffect.setVisible(false);
    }
    
    // 미사일 발사
    launch(target, bounceCount) {
        if (!target || !target.active) return false;
        
        this.setActive(true).setVisible(true);
        this.glowEffect.setVisible(true);
        
        // 초기 상태 설정
        this.target = target;
        this.bounceLeft = bounceCount + 2; // 기본 2회 바운스 추가
        this.currentLifetime = 0;
        this.wobbleTime = 0;
        this.hitCooldown = 0;
        this.accelerationTime = 0; // 가속 시간 초기화
        this.visitedTargets.clear();
        this.trailPoints = [];
        this.state = 'LAUNCHING';
        
        // 느린 초기 속도로 시작
        this.currentSpeed = this.launchSpeed;
        
        // 초기 방향 설정 (타겟을 향해)
        const initialAngle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        this.scene.physics.velocityFromRotation(initialAngle, this.currentSpeed, this.body.velocity);
        this.rotation = initialAngle;
        
        console.log(`🚀 미사일 발사! 타겟: ${target.enemyType || 'unknown'}, 바운스: ${bounceCount}`);
        
        // 0.2초 후 SEEKING 상태로 전환
        this.scene.time.delayedCall(200, () => {
            if (this.active) {
                this.state = 'SEEKING';
            }
        });
        
        return true;
    }
    
    // 매 프레임 업데이트
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        if (!this.active) return;
        
        const dt = delta / 1000;
        this.currentLifetime += dt;
        this.wobbleTime += dt;
        this.accelerationTime += dt; // 가속 시간 누적
        this.hitCooldown = Math.max(0, this.hitCooldown - delta);
        
        // Cubic-Bezier 가속도 커브 적용 (.36,-1.04,1,.49)
        this.updateAccelerationCurve(dt);
        
        // 수명 체크
        if (this.currentLifetime > this.maxLifetime) {
            console.log('⏰ 미사일 수명 만료');
            return this.destroyMissile();
        }
        
        // 타겟 유효성 체크 (예외: WANDERING 상태)
        if (!this.target || !this.target.active) {
            if (this.state !== 'WANDERING') {
                console.log('🎯 타겟 소실 - 방황 모드 전환');
                this.enterWanderingState();
                return;
            }
        }
        
        // 상태별 업데이트
        switch (this.state) {
            case 'LAUNCHING':
                this.updateLaunching(dt);
                break;
            case 'SEEKING':
                this.updateSeeking(dt);
                break;
            case 'WANDERING':
                this.updateWandering(dt);
                break;
            case 'BOUNCING':
                // 바운스 중엔 iFrame 대기
                if (this.hitCooldown <= 0) {
                    this.state = 'SEEKING';
                }
                break;
        }
        
        // 시각 효과 업데이트
        this.updateVisualEffects();
    }
    
    // LAUNCHING 상태 업데이트
    updateLaunching(dt) {
        // 발사 초기엔 단순 직진
        const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        this.scene.physics.velocityFromRotation(targetAngle, this.currentSpeed, this.body.velocity);
        this.rotation = targetAngle;
    }
    
    // SEEKING 상태 업데이트 - 메이플스토리 아델 스타일 무거운 유도 알고리즘
    updateSeeking(dt) {
        // 렘니스케이트 모드 체크 (연속 타격을 위한)
        if (this.isLemniscateMode) {
            this.updateLemniscateMovement(dt);
            return;
        }
        
        // Heavy Curved Aim Point 계산 (무거운 곡선 궤적)
        const aimPoint = this.calculateHeavyTrajectoryAimPoint();
        
        // 현재 속도 벡터
        const currentVelocity = new Phaser.Math.Vector2(this.body.velocity.x, this.body.velocity.y);
        const currentDirection = currentVelocity.normalize();
        
        // 원하는 방향 벡터
        const desiredDirection = new Phaser.Math.Vector2(aimPoint.x - this.x, aimPoint.y - this.y).normalize();
        
        // 내적값을 이용한 정렬도 계산 (핵심!)
        const dotProduct = currentDirection.dot(desiredDirection);
        const alignment = (dotProduct + 1) * 0.5; // 0~1 사이로 정규화
        
        // 내적 기반 속도 조절 (급커브시 감속, 직진시 가속)
        let targetSpeedMultiplier;
        if (alignment > 0.8) {
            // 거의 정렬됨 - 가속
            targetSpeedMultiplier = this.alignmentSpeedMultiplier;
        } else if (alignment < 0.3) {
            // 급격한 방향전환 - 감속
            targetSpeedMultiplier = this.misalignmentSpeedMultiplier;
        } else {
            // 중간 - 선형 보간
            const t = (alignment - 0.3) / 0.5;
            targetSpeedMultiplier = Phaser.Math.Linear(this.misalignmentSpeedMultiplier, this.alignmentSpeedMultiplier, t);
        }
        
        const baseTargetSpeed = Phaser.Math.Linear(this.speedMin, this.speedMax, alignment);
        const targetSpeed = baseTargetSpeed * targetSpeedMultiplier;
        
        // 무게감 있는 속도 전환 (더 부드럽고 무거운 느낌)
        this.currentSpeed = Phaser.Math.Linear(this.currentSpeed, targetSpeed, this.speedTransition);
        
        // 무게감 있는 회전 (관성 적용)
        const desiredAngle = Phaser.Math.Angle.Between(this.x, this.y, aimPoint.x, aimPoint.y);
        const currentAngle = this.body.velocity.angle();
        
        // 관성 벡터 계산 및 적용
        this.momentum.scale(this.momentumDecay);
        const newMomentum = new Phaser.Math.Vector2(
            Math.cos(desiredAngle) * this.currentSpeed * this.trajectoryWeight,
            Math.sin(desiredAngle) * this.currentSpeed * this.trajectoryWeight
        );
        this.momentum.add(newMomentum);
        
        // 최종 방향 = 원래 방향 + 관성
        const finalDirection = new Phaser.Math.Vector2(
            Math.cos(currentAngle) * this.currentSpeed,
            Math.sin(currentAngle) * this.currentSpeed
        );
        finalDirection.add(this.momentum);
        
        const nextAngle = Phaser.Math.Angle.RotateTo(currentAngle, finalDirection.angle(), this.turnRate * dt);
        
        // 물리 적용 (무게감 있는 움직임)
        this.scene.physics.velocityFromRotation(nextAngle, this.currentSpeed, this.body.velocity);
        this.rotation = nextAngle;
    }
    
    // WANDERING 상태 진입 - 렘니스케이트 자유 배회
    enterWanderingState() {
        this.state = 'WANDERING';
        this.wanderingTime = 0; // 타임아웃 초기화
        this.target = null;
        
        // 렘니스케이트 방황 모드 초기화
        this.wanderingLemniscateTime = 0;
        this.wanderingCenter.set(this.x, this.y); // 현재 위치를 중심으로
        this.currentSpeed = this.wanderingSpeed;
        
        // 방황 상태에서도 무게감 유지
        this.momentum.scale(0.5); // 기존 관성 절반 유지
        
        console.log('🌪️ 렘니스케이트 자유 방황 모드 시작 (4초 타임아웃)');
        
        // 방황 시작 효과
        this.createWanderingStartEffect();
    }
    
    // 방황 시작 효과
    createWanderingStartEffect() {
        // 물음표 이펙트
        const questionMark = this.scene.add.text(this.x, this.y - 30, '?', {
            fontSize: '20px',
            color: '#FFFF00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: questionMark,
            y: this.y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power1.easeOut',
            onComplete: () => questionMark.destroy()
        });
    }
    
    // WANDERING 상태 업데이트 - 렘니스케이트 자유 배회
    updateWandering(dt) {
        this.wanderingTime += dt;
        this.wanderingLemniscateTime += dt * 1.5; // 렘니스케이트 속도
        
        // 4초 후 폭발
        if (this.wanderingTime >= this.wanderingTimeout) {
            console.log('💥 방황 타임아웃 - 미사일 폭발');
            this.createWanderingExplosion();
            return this.destroyMissile();
        }
        
        // 새로운 적이 나타나면 리타겟 시도
        const newTarget = this.findNearestEnemy();
        if (newTarget) {
            console.log('🎯 방황 중 새 타겟 발견 - 추적 재개');
            this.target = newTarget;
            this.resetSpeedAndAcceleration(); // 새로운 커브로 추적 시작
            this.state = 'SEEKING';
            return;
        }
        
        // 렘니스케이트(∞) 자유 배회 움직임
        this.updateWanderingLemniscateMovement(dt);
    }
    
    // 과감한 방황 렘니스케이트 움직임
    updateWanderingLemniscateMovement(dt) {
        // 과감한 렘니스케이트 수식: x = a*cos(t)/(1+sin²(t)), y = a*cos(t)*sin(t)/(1+sin²(t))
        const a = this.wanderingRadius; // 160px 대형 방황 반경
        const t = this.wanderingLemniscateTime;
        
        const sinT = Math.sin(t);
        const cosT = Math.cos(t);
        const denominator = 1 + sinT * sinT;
        
        // 더 큰 방황 궤적
        const relativeX = (a * cosT) / denominator;
        const relativeY = (a * cosT * sinT) / denominator;
        
        // 목표 위치 계산 (방황 중심점 기준)
        const targetX = this.wanderingCenter.x + relativeX;
        const targetY = this.wanderingCenter.y + relativeY;
        
        // 과감한 자유 이동 (더 빠르고 역동적)
        const desiredAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        this.scene.physics.velocityFromRotation(desiredAngle, this.wanderingSpeed * 1.3, this.body.velocity); // 30% 빠르게
        this.rotation = desiredAngle;
        
        // 더 자주 중심점 바꾸기 (더 다이내믹한 방황)
        const centerDistance = Phaser.Math.Distance.Between(this.x, this.y, this.wanderingCenter.x, this.wanderingCenter.y);
        if (centerDistance > this.wanderingRadius * 2.5) { // 더 짧은 거리에서 바꾸기
            this.wanderingCenter.set(this.x + (Math.random() - 0.5) * 200, this.y + (Math.random() - 0.5) * 200);
            console.log('🌪️ 방황 중심점 이동 - 더 과감한 방황');
        }
    }
    
    // 방향 전환 타이머 설정
    setupDirectionChangeTimer() {
        // 이미 존재하는 타이머 제거
        if (this.directionChangeTimer) {
            this.directionChangeTimer.destroy();
        }
        
        this.lastDirectionChange = 0;
    }
    
    // 방황 방향 변경
    changeWanderingDirection() {
        // 부드러운 방향 전환 (-45° ~ +45° 범위)
        const angleChange = (Math.random() - 0.5) * Math.PI * 0.5; // ±45도
        this.wanderingDirection = Phaser.Math.Angle.Wrap(this.wanderingDirection + angleChange);
        
        console.log(`🌪️ 방향 변경: ${Math.round(this.wanderingDirection * 180 / Math.PI)}°`);
    }
    
    // 가까운 적 찾기
    findNearestEnemy() {
        const searchRadius = 200; // 방황 중 타겟 탐지 반경
        let nearestEnemy = null;
        let nearestDistance = searchRadius;
        
        this.scene.enemies.children.entries.forEach(enemy => {
            if (enemy.active) {
                const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            }
        });
        
        return nearestEnemy;
    }
    
    // 방황 중 폭발 효과
    createWanderingExplosion() {
        // 타겟이 없어서 터지는 특별한 폭발 효과
        const explosion = this.scene.add.circle(this.x, this.y, 12, 0xFF6600, 1.0);
        
        this.scene.tweens.add({
            targets: explosion,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 500,
            ease: 'Power2.easeOut',
            onComplete: () => explosion.destroy()
        });
        
        // 실망한 연기 효과
        const smoke = this.scene.add.circle(this.x, this.y, 8, 0x666666, 0.6);
        this.scene.tweens.add({
            targets: smoke,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 800,
            ease: 'Power1.easeOut',
            onComplete: () => smoke.destroy()
        });
        
        // 작은 스파크
        this.createSparkParticles(this.x, this.y, 8);
        
        console.log('💨 방황 미사일 소멸');
    }
    
    // Cubic-Bezier 가속도 커브 구현 - 새로운 (.73,-0.41,1,.53)
    updateAccelerationCurve(dt) {
        // 가속 완료 체크
        if (this.accelerationTime >= this.accelerationDuration) {
            return; // 가속 완료됨
        }
        
        // 정규화된 시간 (0 ~ 1)
        const t = Math.min(this.accelerationTime / this.accelerationDuration, 1.0);
        
        let bezierValue;
        if (this.newCubicBezier) {
            // 새로운 Cubic-Bezier 커브: (.73,-0.41,1,.53)
            // B(t) = (1-t)³P₀ + 3(1-t)²t P₁ + 3(1-t)t² P₂ + t³P₃
            const p0 = 0;     // 시작점
            const p1 = 0.73;  // 첫 번째 제어점 x
            const p2 = 1;     // 두 번째 제어점 x  
            const p3 = 1;     // 끝점
            
            const u = 1 - t;
            bezierValue = u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
        } else {
            // 기존 커브
            const p0 = 0, p1 = 0.36, p2 = 1, p3 = 1;
            const u = 1 - t;
            bezierValue = u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
        }
        
        // 속도에 적용 (특수 가속 패턴)
        const speedProgress = this.applyBounceEasing(bezierValue);
        this.currentSpeed = this.speedMin + (this.speedMax - this.speedMin) * speedProgress;
        
        // 회전 속도도 함께 증가 (더 민첩한 움직임)
        this.currentTurnRate = this.turnRate * (0.5 + speedProgress * 0.5);
    }
    
    // 타격 후 속도 초기화 및 새로운 가속 시작
    resetSpeedAndAcceleration() {
        this.accelerationTime = 0;     // 가속 시간 초기화
        this.currentSpeed = this.speedMin; // 속도 초기화
        this.newCubicBezier = true;     // 새로운 커브 사용
        
        console.log('⚡ 미사일 속도 초기화 - 새로운 cubic-bezier(.73,-0.41,1,.53) 가속 시작');
    }
    
    // 탄성적인 이징 함수 (쫀득한 느낌)
    applyBounceEasing(t) {
        // Elastic easing out with bounce
        if (t === 0) return 0;
        if (t === 1) return 1;
        
        const c4 = (2 * Math.PI) / 3;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
    
    // 무거운 궤적을 위한 조준점 계산 (베지어 곡선 + 웨이브)
    calculateHeavyTrajectoryAimPoint() {
        if (this.useBezierTracking) {
            return this.calculateBezierAimPoint();
        } else {
            return this.calculateWobbledAimPoint();
        }
    }
    
    // 베지어 곡선 기반 조준점 (부드러운 추적)
    calculateBezierAimPoint() {
        // 현재 위치에서 타겟까지의 베지어 곡선 생성
        const startPoint = new Phaser.Math.Vector2(this.x, this.y);
        const endPoint = new Phaser.Math.Vector2(this.target.x, this.target.y);
        
        // 제어점들 계산 (곡선을 만들기 위해)
        const distance = startPoint.distance(endPoint);
        const midPoint = new Phaser.Math.Vector2(
            (startPoint.x + endPoint.x) * 0.5,
            (startPoint.y + endPoint.y) * 0.5
        );
        
        // 수직 방향으로 제어점 오프셋
        const perpendicular = new Phaser.Math.Vector2(-(endPoint.y - startPoint.y), endPoint.x - startPoint.x);
        if (perpendicular.length() > 0) {
            perpendicular.normalize();
        }
        
        // 웨이브 효과 적용
        const waveOffset = Math.sin(this.wobbleTime * this.wobbleFreq) * this.wobbleAmp * this.wobbleIntensity;
        const controlPoint = midPoint.clone().add(perpendicular.scale(waveOffset));
        
        // 베지어 곡선상의 다음 점 계산 (약간 앞선 지점을 목표로)
        const t = Math.min(0.3, distance / 200); // 거리에 따른 예측
        const nextPoint = this.getBezierPoint(startPoint, controlPoint, endPoint, t);
        
        return nextPoint;
    }
    
    // 기존 웨이브 조준점 (호환성을 위해 유지)
    calculateWobbledAimPoint() {
        // 기본 타겟 벡터
        const toTarget = new Phaser.Math.Vector2(this.target.x - this.x, this.target.y - this.y);
        
        // 수직 벡터 (S자 궤적용)
        const perpendicular = new Phaser.Math.Vector2(-toTarget.y, toTarget.x);
        if (perpendicular.length() > 0) {
            perpendicular.normalize();
        }
        
        // Wobble 오프셋 계산 (더 무거운 느낌)
        const wobbleOffset = Math.sin(this.wobbleTime * this.wobbleFreq) * this.wobbleAmp * this.wobbleIntensity;
        
        // 최종 에임 포인트
        return new Phaser.Math.Vector2(this.target.x, this.target.y)
            .add(perpendicular.scale(wobbleOffset));
    }
    
    // 베지어 곡선상의 점 계산
    getBezierPoint(p0, p1, p2, t) {
        const u = 1 - t;
        return new Phaser.Math.Vector2(
            u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
            u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
        );
    }
    
    // 강화된 렘니스케이트(∞) 패턴 - 과감한 연속 타격
    updateLemniscateMovement(dt) {
        this.lemniscateTime += dt * 2.5; // 더 빠른 렘니스케이트 속도
        
        // 강화된 랙니스케이트 수식: x = a*cos(t)/(1+sin²(t)), y = a*cos(t)*sin(t)/(1+sin²(t))
        const a = this.lemniscateRadius; // 120px 대형 반경
        const t = this.lemniscateTime;
        
        const sinT = Math.sin(t);
        const cosT = Math.cos(t);
        const denominator = 1 + sinT * sinT;
        
        // 과감한 렘니스케이트 움직임 (더 큰 반경)
        const relativeX = (a * cosT) / denominator;
        const relativeY = (a * cosT * sinT) / denominator;
        
        // 목표 위치 계산 (렘니스케이트 중심점 기준)
        const targetX = this.lemniscateCenter.x + relativeX;
        const targetY = this.lemniscateCenter.y + relativeY;
        
        // 과감한 고속 이동
        const desiredAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        this.scene.physics.velocityFromRotation(desiredAngle, this.speedMax * 1.2, this.body.velocity); // 더 빠르게
        this.rotation = desiredAngle;
        
        // 오래 지속되는 렘니스케이트
        if (this.lemniscateTime > Math.PI * 6) { // 3바퀴로 연장
            this.isLemniscateMode = false;
            this.lemniscateTime = 0;
        }
    }
    
    // 적 타격 처리 - 타겟 전용 + 일반공격 이팩트
    onHit(enemy) {
        if (!this.active || this.hitCooldown > 0 || this.state !== 'SEEKING') return;
        
        // 타겟 전용 데미지 체크 (핵심!)
        if (this.targetOnly && enemy !== this.target) {
            console.log('⚠️ 비타겟 적 타격 - 데미지 없음');
            // 비타겟에게는 시각 효과만 발생시키고 데미지 X
            this.createBulletStyleHitEffect(enemy.x, enemy.y);
            return; // 더 이상 진행 X
        }
        
        console.log(`💥 미사일 타겟 타격! ${enemy.enemyType || 'unknown'}, 남은 바운스: ${this.bounceLeft}`);
        
        // 일반공격과 동일한 타격 이팩트 + 미사일 색상
        this.createBulletStyleHitEffect(enemy.x, enemy.y);
        
        // 데미지 적용
        this.applyDamage(enemy);
        
        // 타임아웃 초기화 (타격시 시간 다시 연장)
        this.wanderingTime = 0;
        
        // 강화된 멤이플스토리 스타일 바운스 처리
        this.handleEnhancedMapleStoryBounce(enemy);
    }
    
    // 일반공격과 동일한 타격 이팩트 (미사일 색상으로)
    createBulletStyleHitEffect(x, y) {
        // 메인 폭발 이팩트 (일반공격과 동일)
        this.scene.createExplosion(x, y);
        
        // 추가 미사일 전용 이팩트 (파란색 계열)
        const missileExplosion = this.scene.add.circle(x, y, 15, 0x00AAFF, 0.8);
        
        this.scene.tweens.add({
            targets: missileExplosion,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 400,
            ease: 'Power2.easeOut',
            onComplete: () => missileExplosion.destroy()
        });
        
        // 미사일 전용 링 이팩트
        const missileRing = this.scene.add.graphics();
        missileRing.lineStyle(4, 0x00DDFF, 1.0);
        missileRing.strokeCircle(x, y, 12);
        
        this.scene.tweens.add({
            targets: missileRing,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 500,
            ease: 'Power1.easeOut',
            onComplete: () => missileRing.destroy()
        });
    }
    
    // 데미지 적용
    applyDamage(enemy) {
        enemy.health -= this.damage;
        
        // 데미지 표시
        if (this.scene.showDamageNumber) {
            this.scene.showDamageNumber(enemy.x, enemy.y - 30, this.damage, 0x00AAFF);
        }
        
        // 감전 효과
        if (this.scene.applyElectrifyEffect) {
            this.scene.applyElectrifyEffect(enemy);
        }
        
        // 적 처치 처리
        if (enemy.health <= 0) {
            this.scene.createExplosion(enemy.x, enemy.y);
            
            // 에너지 오브 생성
            const energyOrb = this.scene.physics.add.sprite(enemy.x, enemy.y, 'energy');
            this.scene.energy.add(energyOrb);
            
            // 점수 추가
            const points = this.scene.getEnemyPoints ? this.scene.getEnemyPoints(enemy.enemyType) : 100;
            this.scene.score += points;
            
            enemy.destroy();
        }
    }
    
    // 바운스 처리
    handleBounce(hitEnemy) {
        // 타격 효과
        this.createHitEffect(hitEnemy.x, hitEnemy.y);
        
        // 바운스 카운트 감소
        this.bounceLeft--;
        this.visitedTargets.add(hitEnemy);
        this.hitCooldown = 120; // 120ms iFrame
        this.state = 'BOUNCING';
        
        // 바운스 종료 조건
        if (this.bounceLeft < 0) {
            console.log('🏀 바운스 완료 - 미사일 소멸');
            return this.destroyMissile();
        }
        
        // 다음 타겟 찾기
        const nextTarget = this.findBounceTarget(hitEnemy);
        
        if (nextTarget) {
            // 바운스 성공
            this.target = nextTarget;
            this.createBounceEffect(hitEnemy.x, hitEnemy.y, nextTarget.x, nextTarget.y);
            console.log(`🏀 바운스! 다음 타겟: ${nextTarget.enemyType || 'unknown'}`);
        } else {
            // 바운스 실패 - 종료
            console.log('🏀 바운스 타겟 없음 - 미사일 소멸');
            this.destroyMissile();
        }
    }
    
    // 강화된 튕김 효과
    createEnhancedBounceBackEffect(x, y, angle) {
        // 강한 튕김 스파크
        for (let i = 0; i < 8; i++) {
            const spark = this.scene.add.circle(x, y, 2, 0x00DDFF, 1.0);
            const sparkAngle = angle + (Math.random() - 0.5) * Math.PI * 0.3;
            const distance = 40 + Math.random() * 60;
            
            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(sparkAngle) * distance,
                y: y + Math.sin(sparkAngle) * distance,
                alpha: 0,
                scaleX: 0.2,
                scaleY: 0.2,
                duration: 300,
                ease: 'Power2.easeOut',
                onComplete: () => spark.destroy()
            });
        }
        
        // 튕김 방향 표시
        const bounceIndicator = this.scene.add.graphics();
        bounceIndicator.lineStyle(3, 0x00AAFF, 1.0);
        bounceIndicator.beginPath();
        bounceIndicator.moveTo(x, y);
        bounceIndicator.lineTo(x + Math.cos(angle) * 50, y + Math.sin(angle) * 50);
        bounceIndicator.strokePath();
        
        this.scene.tweens.add({
            targets: bounceIndicator,
            alpha: 0,
            duration: 400,
            onComplete: () => bounceIndicator.destroy()
        });
    }
    
    // 강화된 메이플스토리 스타일 바운스 처리
    handleEnhancedMapleStoryBounce(hitEnemy) {
        // 아델 스타일 강화 타격 효과
        this.createMapleStoryHitEffect(hitEnemy.x, hitEnemy.y);
        
        // 바운스 카운트 감소
        this.bounceLeft--;
        this.visitedTargets.add(hitEnemy);
        this.hitCooldown = 60; // 짧은 iFrame
        this.state = 'BOUNCING';
        
        // 강화된 반대방향 튕김 효과 (2.5배 강화!)
        const bounceBackAngle = this.body.velocity.angle() + Math.PI; // 180도 반대
        
        // 2.5배 강한 튕김
        this.scene.physics.velocityFromRotation(bounceBackAngle, this.speedMax * this.bounceBackForce, this.body.velocity);
        
        // 튕김 효과 강화
        this.createEnhancedBounceBackEffect(hitEnemy.x, hitEnemy.y, bounceBackAngle);
        
        // 더 오래 후퇴 후 다음 타겟 추적 시작 (과감한 효과)
        this.scene.time.delayedCall(250, () => { // 150 → 250으로 연장
            if (!this.active) return;
            
            // 바운스 종료 조건 체크
            if (this.bounceLeft < 0) {
                console.log('🏀 메이플스토리 바운스 완료 - 미사일 소멸');
                this.createFinalBounceEffect(this.x, this.y);
                return this.destroyMissile();
            }
            
            // 다음 타겟 찾기
            const nextTarget = this.findEnhancedBounceTarget(hitEnemy);
            
            if (nextTarget) {
                // 속도 초기화 및 새로운 cubic-bezier 가속 시작
                this.target = nextTarget;
                this.state = 'SEEKING';
                this.resetSpeedAndAcceleration(); // 핵심!
                
                // 렘니스케이트 모드도 활성화 (연속 타격)
                this.isLemniscateMode = true;
                this.lemniscateTime = 0;
                this.lemniscateCenter.set(nextTarget.x, nextTarget.y);
                
                this.createBounceEffect(hitEnemy.x, hitEnemy.y, nextTarget.x, nextTarget.y);
                console.log(`🏀 메이플스토리 바운스! 다음 타겟: ${nextTarget.enemyType || 'unknown'} - 속도 초기화`);
            } else {
                // 바운스 실패 - 방황 모드로 전환
                console.log('🏀 바운스 타겟 없음 - 렘니스케이트 방황 모드 전환');
                this.enterWanderingState();
            }
        });
    }
    
    // 향상된 바운스 타겟 찾기 (더 적극적)
    findEnhancedBounceTarget(excludeEnemy) {
        const nearbyEnemies = this.scene.enemies.children.entries.filter(enemy => {
            if (!enemy.active || enemy === excludeEnemy) return false;
            
            const distance = Phaser.Math.Distance.Between(
                excludeEnemy.x, excludeEnemy.y, enemy.x, enemy.y
            );
            
            // 더 넓은 바운스 반경으로 더 많은 바운스 기회
            return distance <= this.bounceRadius * 1.2;
        });
        
        if (nearbyEnemies.length === 0) return null;
        
        // 우선순위: 미방문 적 > 방문한 적 > 거리
        const unvisited = nearbyEnemies.filter(e => !this.visitedTargets.has(e));
        const candidates = unvisited.length > 0 ? unvisited : nearbyEnemies;
        
        // 가장 가까운 적 선택 (더 빠른 바운스)
        let closestEnemy = candidates[0];
        let closestDistance = Phaser.Math.Distance.Between(
            excludeEnemy.x, excludeEnemy.y, closestEnemy.x, closestEnemy.y
        );
        
        for (let i = 1; i < candidates.length; i++) {
            const distance = Phaser.Math.Distance.Between(
                excludeEnemy.x, excludeEnemy.y, candidates[i].x, candidates[i].y
            );
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = candidates[i];
            }
        }
        
        return closestEnemy;
    }
    
    // 최종 바운스 효과
    createFinalBounceEffect(x, y) {
        // 큰 폭발 효과
        const finalExplosion = this.scene.add.circle(x, y, 10, 0xFF4400, 1.0);
        
        this.scene.tweens.add({
            targets: finalExplosion,
            scaleX: 5,
            scaleY: 5,
            alpha: 0,
            duration: 500,
            ease: 'Elastic.easeOut',
            onComplete: () => finalExplosion.destroy()
        });
        
        // 확산 링
        const finalRing = this.scene.add.graphics();
        finalRing.lineStyle(4, 0xFFAA00, 1.0);
        finalRing.strokeCircle(x, y, 8);
        
        this.scene.tweens.add({
            targets: finalRing,
            scaleX: 6,
            scaleY: 6,
            alpha: 0,
            duration: 600,
            ease: 'Power2.easeOut',
            onComplete: () => finalRing.destroy()
        });
        
        // 강화된 스파크 파티클
        this.createSparkParticles(x, y, 20);
        
        // 강한 진동
        this.scene.cameras.main.shake(120, 0.008);
    }
    
    // 바운스 타겟 찾기
    findBounceTarget(excludeEnemy) {
        const nearbyEnemies = this.scene.enemies.children.entries.filter(enemy => {
            if (!enemy.active || enemy === excludeEnemy) return false;
            
            const distance = Phaser.Math.Distance.Between(
                excludeEnemy.x, excludeEnemy.y, enemy.x, enemy.y
            );
            
            return distance <= this.bounceRadius;
        });
        
        if (nearbyEnemies.length === 0) return null;
        
        // 우선순위: 미방문 적 > 방문한 적
        const unvisited = nearbyEnemies.filter(e => !this.visitedTargets.has(e));
        const candidates = unvisited.length > 0 ? unvisited : nearbyEnemies;
        
        // 가장 가까운 적 선택
        let closestEnemy = candidates[0];
        let closestDistance = Phaser.Math.Distance.Between(
            excludeEnemy.x, excludeEnemy.y, closestEnemy.x, closestEnemy.y
        );
        
        for (let i = 1; i < candidates.length; i++) {
            const distance = Phaser.Math.Distance.Between(
                excludeEnemy.x, excludeEnemy.y, candidates[i].x, candidates[i].y
            );
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = candidates[i];
            }
        }
        
        return closestEnemy;
    }
    
    // 시각 효과 업데이트
    updateVisualEffects() {
        // 글로우 효과 위치 동기화
        this.glowEffect.setPosition(this.x, this.y);
        
        // 트레일 포인트 추가
        this.trailPoints.push({
            x: this.x,
            y: this.y,
            timestamp: Date.now()
        });
        
        // 오래된 트레일 포인트 제거
        const cutoffTime = Date.now() - 300; // 300ms
        this.trailPoints = this.trailPoints.filter(p => p.timestamp > cutoffTime);
        
        // 트레일 제한
        if (this.trailPoints.length > this.maxTrailPoints) {
            this.trailPoints.shift();
        }
        
        this.renderTrail();
    }
    
    // 트레일 렌더링
    renderTrail() {
        if (this.trailPoints.length < 2) return;
        
        // 기존 트레일 그래픽 정리 (성능 최적화)
        if (this.currentTrailGraphics) {
            this.currentTrailGraphics.destroy();
        }
        
        this.currentTrailGraphics = this.scene.add.graphics();
        
        for (let i = 1; i < this.trailPoints.length; i++) {
            const alpha = i / this.trailPoints.length;
            const width = alpha * 3;
            
            this.currentTrailGraphics.lineStyle(width, 0x00AAFF, alpha * 0.8);
            this.currentTrailGraphics.beginPath();
            this.currentTrailGraphics.moveTo(this.trailPoints[i-1].x, this.trailPoints[i-1].y);
            this.currentTrailGraphics.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
            this.currentTrailGraphics.strokePath();
        }
        
        // 트레일 페이드 아웃
        this.scene.tweens.add({
            targets: this.currentTrailGraphics,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                if (this.currentTrailGraphics) {
                    this.currentTrailGraphics.destroy();
                    this.currentTrailGraphics = null;
                }
            }
        });
    }
    
    // 메이플스토리 아델 스타일 강화 타격 효과
    createMapleStoryHitEffect(x, y) {
        // 주요 폭발 효과 (더욱 강화된 타격감)
        const mainExplosion = this.scene.add.circle(x, y, 12, 0x00DDFF, 1.0);
        
        this.scene.tweens.add({
            targets: mainExplosion,
            scaleX: 6,
            scaleY: 6,
            alpha: 0,
            duration: 600,
            ease: 'Back.easeOut',
            onComplete: () => mainExplosion.destroy()
        });
        
        // 내부 코어 폭발 (더 밝고 강한)
        const coreExplosion = this.scene.add.circle(x, y, 6, 0xFFFFFF, 1.0);
        this.scene.tweens.add({
            targets: coreExplosion,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 400,
            ease: 'Elastic.easeOut',
            onComplete: () => coreExplosion.destroy()
        });
        
        // 메이플스토리 스타일 충격파 링
        for (let i = 0; i < 3; i++) {
            const ring = this.scene.add.graphics();
            const ringColor = i === 0 ? 0x00AAFF : i === 1 ? 0xFFDD00 : 0xFF6600;
            ring.lineStyle(4 - i, ringColor, 0.9 - i * 0.2);
            ring.strokeCircle(x, y, 8 + i * 4);
            
            this.scene.tweens.add({
                targets: ring,
                scaleX: 5 + i,
                scaleY: 5 + i,
                alpha: 0,
                duration: 400 + i * 100,
                ease: 'Power2.easeOut',
                delay: i * 50,
                onComplete: () => ring.destroy()
            });
        }
        
        // 강화된 스파크 파티클 (더 많고 화려하게)
        this.createMapleStorySparkParticles(x, y, 20);
        
        // 강한 진동 효과
        this.scene.cameras.main.shake(150, 0.012);
        
        // 화면 에지 번경 효과
        this.createScreenFlashEffect();
    }
    
    // 메이플스토리 스파크 파티클
    createMapleStorySparkParticles(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            const particle = this.scene.add.circle(x, y, 2 + Math.random() * 3, 0x00DDFF, 1.0);
            
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const distance = 30 + Math.random() * 80;
            const speed = 0.6 + Math.random() * 0.8;
            
            // 타겟 위치
            const targetX = x + Math.cos(angle) * distance;
            const targetY = y + Math.sin(angle) * distance;
            
            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                scaleX: 0.1,
                scaleY: 0.1,
                duration: (200 + Math.random() * 400) * speed,
                ease: 'Power2.easeOut',
                onComplete: () => particle.destroy()
            });
            
            // 색상 변화 효과
            this.scene.tweens.add({
                targets: particle,
                tint: [0x00DDFF, 0xFFDD00, 0xFF6600],
                duration: 300,
                ease: 'Power1.easeOut'
            });
        }
    }
    
    // 화면 번경 효과
    createScreenFlashEffect() {
        const flash = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0xFFFFFF,
            0.3
        );
        flash.setScrollFactor(0); // UI에 고정
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            ease: 'Power2.easeOut',
            onComplete: () => flash.destroy()
        });
    }
    
    // 바운스 효과 (쫀득한 탄성 느낌)
    createBounceEffect(fromX, fromY, toX, toY) {
        // 메인 바운스 폭발
        const bounceExplosion = this.scene.add.circle(fromX, fromY, 6, 0xFF6600, 1.0);
        
        this.scene.tweens.add({
            targets: bounceExplosion,
            scaleX: 3.5,
            scaleY: 3.5,
            alpha: 0,
            duration: 300,
            ease: 'Elastic.easeOut', // 탄성적 이징
            onComplete: () => bounceExplosion.destroy()
        });
        
        // 바운스 링 이팩트
        const bounceRing = this.scene.add.graphics();
        bounceRing.lineStyle(2, 0xFFAA00, 1.0);
        bounceRing.strokeCircle(fromX, fromY, 6);
        
        this.scene.tweens.add({
            targets: bounceRing,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 400,
            ease: 'Back.easeOut',
            onComplete: () => bounceRing.destroy()
        });
        
        // 연결 선 효과 (바운스 방향)
        const connectionLine = this.scene.add.graphics();
        connectionLine.lineStyle(3, 0xFFDD00, 0.8);
        connectionLine.beginPath();
        connectionLine.moveTo(fromX, fromY);
        connectionLine.lineTo(toX, toY);
        connectionLine.strokePath();
        
        this.scene.tweens.add({
            targets: connectionLine,
            alpha: 0,
            duration: 250,
            ease: 'Power2.easeOut',
            onComplete: () => connectionLine.destroy()
        });
        
        // 다이나믹 방향 파티클
        const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);
        this.createBouncyDirectionParticles(fromX, fromY, angle);
        
        // 마이너 진동
        this.scene.cameras.main.shake(60, 0.003);
    }
    
    // 강화된 스파크 파티클
    createSparkParticles(x, y, count = 12) {
        for (let i = 0; i < count; i++) {
            const particle = this.scene.add.circle(x, y, 1 + Math.random() * 2, 0x00DDFF, 1.0);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * 45;
            const speed = 0.8 + Math.random() * 0.4;
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scaleX: 0.1,
                scaleY: 0.1,
                duration: (150 + Math.random() * 250) * speed,
                ease: 'Bounce.easeOut', // 탄성적 이징
                onComplete: () => particle.destroy()
            });
        }
    }
    
    // 쫀득한 방향 파티클
    createBouncyDirectionParticles(x, y, angle) {
        for (let i = 0; i < 5; i++) {
            const particle = this.scene.add.circle(x, y, 1.5, 0xFFDD00, 0.9);
            const distance = 20 + (i * 12);
            const randomOffset = (Math.random() - 0.5) * 0.5; // 약간의 퍽어지
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle + randomOffset) * distance,
                y: y + Math.sin(angle + randomOffset) * distance,
                alpha: 0,
                scaleX: 0.3,
                scaleY: 0.3,
                duration: 180 + (i * 40),
                ease: 'Back.easeOut', // 탄성적 이징
                onComplete: () => particle.destroy()
            });
        }
    }
    
    // 미사일 소멸
    destroyMissile() {
        this.setActive(false).setVisible(false);
        this.glowEffect.setVisible(false);
        this.body.stop();
        
        // 트레일 정리
        if (this.currentTrailGraphics) {
            this.currentTrailGraphics.destroy();
            this.currentTrailGraphics = null;
        }
        
        // 상태 초기화
        this.state = 'INACTIVE';
        this.target = null;
        this.visitedTargets.clear();
        this.trailPoints = [];
        this.currentLifetime = 0;
    }
}

// ===============================
// Missile Skill Manager - 스킬 관리 및 발사 제어
// ===============================
export class MissileSkillManager {
    constructor(gameScene) {
        this.scene = gameScene;
        this.launchStack = 0;        // 미사일 발사 수 (0-10)
        this.bounceStack = 0;        // 바운스 횟수 (0-3)
        this.launchCooldown = 3000;  // 3초 고정
        this.isActive = false;       // 스킬 활성화 상태
        
        this.lastLaunchTime = 0;
        this.setupLaunchTimer();
        
        console.log('🎯 미사일 스킬 매니저 초기화');
    }
    
    // 발사 타이머 설정
    setupLaunchTimer() {
        this.launchTimer = this.scene.time.addEvent({
            delay: this.launchCooldown,
            callback: () => this.attemptLaunch(),
            loop: true
        });
    }
    
    // 스킬 스택 업데이트
    updateStacks(launchStack, bounceStack) {
        this.launchStack = Math.min(launchStack, 10);
        this.bounceStack = Math.min(bounceStack, 3);
        this.isActive = this.launchStack > 0;
        
        console.log(`🚀 미사일 스킬 업데이트: 발사 ${this.launchStack}개, 바운스 ${this.bounceStack}회`);
    }
    
    // 발사 시도
    attemptLaunch() {
        if (!this.isActive || this.launchStack <= 0) return;
        
        // 플레이어와 적 상태 체크
        if (!this.scene.player || !this.scene.player.active || this.scene.isSkillSelectionActive) {
            return;
        }
        
        // 근처 적 찾기
        const targets = this.findLaunchTargets();
        if (targets.length === 0) {
            console.log('🎯 발사 가능한 타겟 없음');
            return;
        }
        
        this.executeLaunch(targets);
        this.lastLaunchTime = Date.now();
    }
    
    // 발사 타겟 찾기
    findLaunchTargets() {
        const playerX = this.scene.player.x;
        const playerY = this.scene.player.y;
        const searchRange = 400; // 발사 사거리
        
        const nearbyEnemies = this.scene.enemies.children.entries.filter(enemy => {
            if (!enemy.active) return false;
            
            const distance = Phaser.Math.Distance.Between(
                playerX, playerY, enemy.x, enemy.y
            );
            
            return distance <= searchRange;
        });
        
        // 거리순으로 정렬
        nearbyEnemies.sort((a, b) => {
            const distA = Phaser.Math.Distance.Between(playerX, playerY, a.x, a.y);
            const distB = Phaser.Math.Distance.Between(playerX, playerY, b.x, b.y);
            return distA - distB;
        });
        
        return nearbyEnemies;
    }
    
    // 미사일 발사 실행
    executeLaunch(targets) {
        const launchCount = Math.min(this.launchStack, targets.length);
        const playerX = this.scene.player.x;
        const playerY = this.scene.player.y;
        
        console.log(`🚀 미사일 발사! ${launchCount}개, 바운스 ${this.bounceStack}회`);
        
        for (let i = 0; i < launchCount; i++) {
            const target = targets[i % targets.length]; // 타겟이 부족하면 순환
            
            // 발사 위치에 약간의 랜덤 오프셋 추가
            const angle = (i / launchCount) * Math.PI * 2;
            const offsetDistance = 20;
            const launchX = playerX + Math.cos(angle) * offsetDistance;
            const launchY = playerY + Math.sin(angle) * offsetDistance;
            
            // 약간의 딜레이를 두고 발사 (동시 발사 방지)
            this.scene.time.delayedCall(i * 50, () => {
                const missile = this.scene.missilePool.spawnMissile(
                    launchX, launchY, target, this.bounceStack
                );
                
                if (missile) {
                    this.createLaunchEffect(launchX, launchY, target.x, target.y);
                }
            });
        }
        
        // 발사 사운드 효과
        this.scene.showAutoSkillText(`미사일 발사! ${launchCount}발`);
    }
    
    // 발사 효과
    createLaunchEffect(x, y, targetX, targetY) {
        // 발사 연기
        const smoke = this.scene.add.circle(x, y, 10, 0x666666, 0.4);
        
        this.scene.tweens.add({
            targets: smoke,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 400,
            onComplete: () => smoke.destroy()
        });
        
        // 방향 표시
        const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
        for (let i = 0; i < 3; i++) {
            const spark = this.scene.add.circle(x, y, 2, 0x00AAFF, 0.8);
            const distance = 15 + (i * 8);
            
            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                duration: 150 + (i * 30),
                onComplete: () => spark.destroy()
            });
        }
    }
    
    // 정리 작업
    cleanup() {
        if (this.launchTimer) {
            this.launchTimer.destroy();
            this.launchTimer = null;
        }
    }
}

// ===============================
// Missile Pool - Object Pooling System
// ===============================
export class MissilePool extends Phaser.Physics.Arcade.Group {
    constructor(scene) {
        super(scene.physics.world, scene, {
            classType: GuidedMissile,
            runChildUpdate: true,
            maxSize: 100,
            createCallback: (missile) => {
                missile.setName('guidedMissile');
            }
        });
        
        this.maxActiveMissiles = 60;
        console.log('🏭 미사일 풀 초기화 완료');
    }
    
    // 미사일 스폰
    spawnMissile(x, y, target, bounceCount) {
        // 활성 미사일 수 체크
        const activeCount = this.countActive();
        if (activeCount >= this.maxActiveMissiles) {
            console.warn(`⚠️ 미사일 풀 한계 도달: ${activeCount}/${this.maxActiveMissiles}`);
            return null;
        }
        
        const missile = this.get(x, y);
        if (missile) {
            const success = missile.launch(target, bounceCount);
            if (success) {
                return missile;
            } else {
                // 발사 실패시 풀에 반환
                this.killAndHide(missile);
            }
        }
        
        return null;
    }
    
    // 강제 정리 (성능 보호)
    forceCleanupOldest(count = 5) {
        const activeMissiles = this.children.entries
            .filter(m => m.active)
            .sort((a, b) => a.currentLifetime - b.currentLifetime);
            
        for (let i = 0; i < Math.min(count, activeMissiles.length); i++) {
            activeMissiles[i].destroyMissile();
        }
        
        console.log(`🧹 오래된 미사일 ${Math.min(count, activeMissiles.length)}개 정리`);
    }
}