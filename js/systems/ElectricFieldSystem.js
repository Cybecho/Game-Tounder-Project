// ⚡ Electric Field System - 전기장판 시스템
class ElectricFieldSystem {
    constructor(gameScene) {
        this.game = gameScene;
        this.electricFields = new Map(); // 활성 전기장판들
        this.fieldIdCounter = 0;
        
        // 기본 전기장판 설정
        this.baseConfig = {
            baseRadius: 80,        // 기본 반지름
            radiusPerStack: 30,    // 스택당 추가 반지름
            damage: 12,            // 초당 데미지
            tickInterval: 500,     // 데미지 틱 간격 (ms)
            duration: 999999999,   // 거의 영구적
            pulseSpeed: 0.02       // 시각 효과 펄스 속도
        };
        
        this.stacks = 0; // 현재 스택 수
        this.isActive = false;
    }
    
    // 전기장판 활성화/업그레이드
    activateElectricField() {
        this.stacks = Math.min(this.stacks + 1, 3);
        
        if (!this.isActive) {
            this.isActive = true;
            this.createElectricField();
        } else {
            this.upgradeElectricField();
        }
        
        console.log(`전기장판 활성화! 스택: ${this.stacks}`);
    }
    
    // 새 전기장판 생성
    createElectricField() {
        const fieldId = this.fieldIdCounter++;
        const radius = this.calculateRadius();
        
        // 시각적 전기장판 생성
        const fieldGraphics = this.game.add.graphics();
        fieldGraphics.setDepth(5); // 플레이어보다 뒤, 적보다 앞
        
        // 전기장판 데이터
        const fieldData = {
            id: fieldId,
            graphics: fieldGraphics,
            radius: radius,
            lastDamageTick: 0,
            pulsePhase: 0
        };
        
        this.electricFields.set(fieldId, fieldData);
        
        // 데미지 틱 타이머 설정
        this.startDamageTicking();
        
        return fieldData;
    }
    
    // 전기장판 업그레이드 (크기 증가)
    upgradeElectricField() {
        const newRadius = this.calculateRadius();
        
        for (let [id, field] of this.electricFields) {
            field.radius = newRadius;
        }
        
        console.log(`전기장판 업그레이드! 새 반지름: ${newRadius}`);
    }
    
    // 현재 스택에 따른 반지름 계산
    calculateRadius() {
        return this.baseConfig.baseRadius + (this.stacks - 1) * this.baseConfig.radiusPerStack;
    }
    
    // 데미지 틱 시작
    startDamageTicking() {
        if (this.damageTickEvent) return; // 이미 실행 중
        
        this.damageTickEvent = this.game.time.addEvent({
            delay: this.baseConfig.tickInterval,
            callback: this.processDamageTick,
            callbackScope: this,
            loop: true
        });
    }
    
    // 데미지 틱 처리
    processDamageTick() {
        if (!this.isActive || this.electricFields.size === 0) return;
        
        const currentTime = this.game.time.now;
        
        for (let [id, field] of this.electricFields) {
            // 플레이어 위치에 전기장판 위치 업데이트
            this.updateFieldPosition(field);
            
            // 범위 내 적들에게 데미지
            this.damageEnemiesInRange(field);
            
            field.lastDamageTick = currentTime;
        }
    }
    
    // 전기장판 위치를 플레이어 위치로 업데이트
    updateFieldPosition(field) {
        if (!this.game.player) return;
        
        field.centerX = this.game.player.x;
        field.centerY = this.game.player.y;
    }
    
    // 범위 내 적들에게 데미지
    damageEnemiesInRange(field) {
        if (!this.game.enemies || !this.game.enemies.children) return;
        
        const enemies = this.game.enemies.children.entries;
        const damagedEnemies = [];
        
        for (let enemy of enemies) {
            if (!enemy.active) continue;
            
            const distance = Phaser.Math.Distance.Between(
                field.centerX, field.centerY,
                enemy.x, enemy.y
            );
            
            if (distance <= field.radius) {
                // 데미지 적용
                const damage = this.baseConfig.damage;
                enemy.health = (enemy.health || enemy.maxHealth || 100) - damage;
                
                // 데미지 표시 (전기 색상으로)
                if (this.game.showDamageNumber) {
                    this.game.showDamageNumber(enemy.x, enemy.y - 20, Math.round(damage), 0x87CEEB);
                }
                
                // 전기 효과 생성
                this.createElectricEffect(enemy.x, enemy.y);
                
                damagedEnemies.push(enemy);
                
                // 적 사망 처리
                if (enemy.health <= 0) {
                    // 폭발 효과 생성
                    this.game.createExplosion(enemy.x, enemy.y);
                    
                    // 에너지 오브 생성
                    const energyOrb = this.game.physics.add.sprite(enemy.x, enemy.y, 'energy');
                    this.game.energy.add(energyOrb);
                    
                    // 점수 추가 (적 타입에 따라)
                    let points = 100;
                    if (enemy.enemyType === 'elite') points = 300;
                    else if (enemy.enemyType === 'star_elite') points = 500;
                    else if (enemy.enemyType === 'pentagon') points = 200;
                    
                    this.game.score += points;
                    
                    // 적 제거
                    enemy.destroy();
                }
            }
        }
        
        return damagedEnemies;
    }
    
    // 전기 효과 생성
    createElectricEffect(x, y) {
        const sparkGraphics = this.game.add.graphics();
        sparkGraphics.setPosition(x, y);
        sparkGraphics.setDepth(15);
        
        // 번개 모양 그리기 (기존 번개 효과와 동일한 색상)
        sparkGraphics.lineStyle(2, 0x87CEEB, 1);
        sparkGraphics.beginPath();
        
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const length = 15 + Math.random() * 10;
            const endX = Math.cos(angle) * length;
            const endY = Math.sin(angle) * length;
            
            sparkGraphics.moveTo(0, 0);
            sparkGraphics.lineTo(endX, endY);
        }
        
        sparkGraphics.strokePath();
        
        // 효과 페이드아웃
        this.game.tweens.add({
            targets: sparkGraphics,
            alpha: 0,
            duration: 300,
            onComplete: () => sparkGraphics.destroy()
        });
    }
    
    // 업데이트 루프 (시각 효과)
    update() {
        if (!this.isActive) return;
        
        for (let [id, field] of this.electricFields) {
            this.updateFieldVisuals(field);
        }
    }
    
    // 전기장판 시각 효과 업데이트
    updateFieldVisuals(field) {
        if (!this.game.player) return;
        
        // 플레이어 위치로 이동
        field.centerX = this.game.player.x;
        field.centerY = this.game.player.y;
        
        // 펄스 효과
        field.pulsePhase += this.baseConfig.pulseSpeed;
        const pulseScale = 1 + Math.sin(field.pulsePhase) * 0.1;
        const alpha = 0.3 + Math.sin(field.pulsePhase * 2) * 0.1;
        
        // 그래픽 업데이트 (기존 번개 효과와 동일한 색상)
        field.graphics.clear();
        field.graphics.lineStyle(3, 0x87CEEB, alpha);
        field.graphics.fillStyle(0x87CEEB, alpha * 0.2);
        
        // 전기장판 원 그리기
        field.graphics.strokeCircle(field.centerX, field.centerY, field.radius * pulseScale);
        field.graphics.fillCircle(field.centerX, field.centerY, field.radius * pulseScale);
        
        // 전기 스파크 효과
        if (Math.random() < 0.1) {
            this.addSparkEffect(field);
        }
        
        // 가장자리 지지직거리는 이펙트
        if (Math.random() < 0.15) {
            this.addEdgeElectricEffect(field);
        }
    }
    
    // 스파크 효과 추가
    addSparkEffect(field) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * field.radius;
        const sparkX = field.centerX + Math.cos(angle) * distance;
        const sparkY = field.centerY + Math.sin(angle) * distance;
        
        this.createElectricEffect(sparkX, sparkY);
    }
    
    // 가장자리 지지직거리는 전기 이펙트
    addEdgeElectricEffect(field) {
        const numSparks = 3 + Math.floor(Math.random() * 3); // 3-5개의 스파크
        
        for (let i = 0; i < numSparks; i++) {
            const angle = Math.random() * Math.PI * 2;
            // 가장자리 근처에 생성 (반지름의 80-100%)
            const distance = field.radius * (0.8 + Math.random() * 0.2);
            const sparkX = field.centerX + Math.cos(angle) * distance;
            const sparkY = field.centerY + Math.sin(angle) * distance;
            
            this.createEdgeElectricSpark(sparkX, sparkY);
        }
    }
    
    // 가장자리 전용 전기 스파크 생성
    createEdgeElectricSpark(x, y) {
        const sparkGraphics = this.game.add.graphics();
        sparkGraphics.setPosition(x, y);
        sparkGraphics.setDepth(16); // 일반 스파크보다 높은 depth
        
        // 더 강렬한 번개 모양 그리기 (기존 번개 효과와 동일한 색상)
        sparkGraphics.lineStyle(3, 0x87CEEB, 1);
        sparkGraphics.beginPath();
        
        // 방사형으로 더 많은 가지 생성
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const length = 20 + Math.random() * 15;
            const endX = Math.cos(angle) * length;
            const endY = Math.sin(angle) * length;
            
            // 지그재그 효과를 위한 중간점
            const midX = endX * 0.5 + (Math.random() - 0.5) * 10;
            const midY = endY * 0.5 + (Math.random() - 0.5) * 10;
            
            sparkGraphics.moveTo(0, 0);
            sparkGraphics.lineTo(midX, midY);
            sparkGraphics.lineTo(endX, endY);
        }
        
        sparkGraphics.strokePath();
        
        // 중심에 밝은 점 추가
        sparkGraphics.fillStyle(0xffffff, 0.8);
        sparkGraphics.fillCircle(0, 0, 3);
        
        // 효과 페이드아웃 (더 빠르게)
        this.game.tweens.add({
            targets: sparkGraphics,
            alpha: 0,
            duration: 200,
            ease: 'Power2.easeOut',
            onComplete: () => sparkGraphics.destroy()
        });
        
        // 추가 깜빡임 효과
        this.game.tweens.add({
            targets: sparkGraphics,
            alpha: { from: 1, to: 0.3 },
            duration: 50,
            yoyo: true,
            repeat: 2,
            ease: 'Power2.easeInOut'
        });
    }
    
    // 시스템 정리
    destroy() {
        if (this.damageTickEvent) {
            this.damageTickEvent.destroy();
            this.damageTickEvent = null;
        }
        
        for (let [id, field] of this.electricFields) {
            if (field.graphics) {
                field.graphics.destroy();
            }
        }
        
        this.electricFields.clear();
        this.isActive = false;
        this.stacks = 0;
    }
}

// 모듈 export (ES6 모듈과 CommonJS 둘 다 지원)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElectricFieldSystem;
}

// 전역 스코프에도 등록 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.ElectricFieldSystem = ElectricFieldSystem;
}