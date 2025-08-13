// 능력치 수정자 엔진
class StatModifierEngine {
    constructor(gameScene) {
        this.game = gameScene;
        this.baseStats = {};
        this.modifiers = new Map();
        this.captureBaseStats();
    }
    
    captureBaseStats() {
        this.baseStats = {
            playerSpeed: this.game.playerSpeed,
            playerAcceleration: this.game.playerAcceleration,
            playerDrag: this.game.playerDrag,
            fireRate: this.game.fireRate,
            bulletSpeed: this.game.bulletSpeed,
            bulletCount: this.game.bulletCount,
            fireRange: this.game.fireRange,
            playerHealth: this.game.playerHealth,
            maxPlayerHealth: this.game.maxPlayerHealth,
            dashCooldown: this.game.dashCooldown,
            lightningWaveCooldown: this.game.lightningWaveCooldown,
            lightningWaveRadius: this.game.lightningWaveRadius,
            bulletDamage: this.game.bulletDamage,
            bulletKnockback: this.game.bulletKnockback,
            bulletAccuracy: this.game.bulletAccuracy,
            bulletSize: this.game.bulletSize,
            explosionRadiusMultiplier: this.game.explosionRadiusMultiplier
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
        
        // 게임 객체에 적용 (최소값 보장)
        this.game[statName] = Math.max(1, finalValue);
        
        // 물리 엔진에도 적용 (필요한 경우)
        this.applyToPhysicsEngine(statName, finalValue);
    }
    
    applyToPhysicsEngine(statName, value) {
        if (!this.game.player) return;
        
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

// 모듈 export (ES6 모듈과 CommonJS 둘 다 지원)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatModifierEngine;
}

// 전역 스코프에도 등록 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.StatModifierEngine = StatModifierEngine;
}