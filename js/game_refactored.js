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
            lightningWaveRadius: this.game.lightningWaveRadius
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

// 스킬 정의 객체
const skillDefinitions = {
    // === Active 스킬들 (50%) ===
    
    instant_barrier: {
        id: 'instant_barrier',
        name: '방어 배리어',
        description: '공격을 1회 막아주는 배리어 생성 (최대 3회 중첩)',
        category: 'active',
        rarity: 'common',
        stackable: true,
        maxStacks: 3,
        probability: 0.12,
        effect: {
            type: 'instant',
            action: 'add_barrier_charge',
            value: 1
        }
    },
    
    instant_heal: {
        id: 'instant_heal',
        name: '응급 치료',
        description: '체력을 1 회복합니다',
        category: 'active',
        rarity: 'common',
        stackable: false,
        probability: 0.10,
        effect: {
            type: 'instant',
            action: 'heal_player',
            value: 1
        }
    },
    
    agility_buff: {
        id: 'agility_buff',
        name: '민첩성 강화',
        description: '30초동안 조작감이 매우 민첩해집니다',
        category: 'active',
        rarity: 'uncommon',
        stackable: false,
        probability: 0.08,
        effect: {
            type: 'timed_buff',
            buffId: 'agility_boost',
            duration: 30000,
            modifiers: [
                { target: 'playerDrag', operation: 'multiply', value: 1.67 },
                { target: 'playerAcceleration', operation: 'multiply', value: 1.5 }
            ]
        }
    },
    
    speed_buff: {
        id: 'speed_buff',
        name: '질주',
        description: '30초동안 이동속도가 50% 증가합니다',
        category: 'active',
        rarity: 'uncommon',
        stackable: false,
        probability: 0.08,
        effect: {
            type: 'timed_buff',
            buffId: 'speed_boost',
            duration: 30000,
            modifiers: [
                { target: 'playerSpeed', operation: 'multiply', value: 1.5 }
            ]
        }
    },
    
    collect_all_energy: {
        id: 'collect_all_energy',
        name: '에너지 수확',
        description: '맵에 있는 모든 에너지구슬을 즉시 수집합니다',
        category: 'active',
        rarity: 'uncommon',
        stackable: false,
        probability: 0.06,
        effect: {
            type: 'instant',
            action: 'collect_all_energy',
            value: 0
        }
    },
    
    auto_shockwave_buff: {
        id: 'auto_shockwave_buff',
        name: '자동 파동파',
        description: '30초동안 3초마다 자동으로 파동파를 발동합니다',
        category: 'active',
        rarity: 'rare',
        stackable: false,
        probability: 0.04,
        effect: {
            type: 'timed_buff',
            buffId: 'auto_shockwave',
            duration: 30000,
            modifiers: []
        }
    },
    
    // === Passive 스킬들 (35%) ===
    
    bullet_count_increase: {
        id: 'bullet_count_increase',
        name: '다중 사격',
        description: '총알이 +1개 추가됩니다 (최대 8개)',
        category: 'passive',
        rarity: 'common',
        stackable: true,
        maxStacks: 7,
        probability: 0.10,
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
        description: '발사 속도가 25% 빨라집니다 (최대 5회)',
        category: 'passive',
        rarity: 'common',
        stackable: true,
        maxStacks: 5,
        probability: 0.08,
        effect: {
            type: 'stat_modifier',
            target: 'fireRate',
            operation: 'multiply',
            value: 0.8
        }
    },
    
    max_speed_increase: {
        id: 'max_speed_increase',
        name: '신속',
        description: '최대 이동속도가 25% 증가합니다 (최대 3회)',
        category: 'passive',
        rarity: 'common',
        stackable: true,
        maxStacks: 3,
        probability: 0.06,
        effect: {
            type: 'stat_modifier',
            target: 'playerSpeed',
            operation: 'multiply',
            value: 1.25
        }
    },
    
    fire_range_increase: {
        id: 'fire_range_increase',
        name: '장거리 사격',
        description: '사격 범위가 30% 증가합니다 (최대 3회)',
        category: 'passive',
        rarity: 'common',
        stackable: true,
        maxStacks: 3,
        probability: 0.06,
        effect: {
            type: 'stat_modifier',
            target: 'fireRange',
            operation: 'multiply',
            value: 1.3
        }
    },
    
    responsive_control: {
        id: 'responsive_control',
        name: '반응성 향상',
        description: '플레이어 컨트롤이 더욱 즉각적으로 변합니다',
        category: 'passive',
        rarity: 'uncommon',
        stackable: true,
        maxStacks: 2,
        probability: 0.05,
        effect: {
            type: 'stat_modifier',
            target: 'playerAcceleration',
            operation: 'multiply',
            value: 1.4
        }
    },
    
    // === Skill 스킬들 (15%) ===
    
    dash_knockback: {
        id: 'dash_knockback',
        name: '돌진',
        description: '대쉬 경로의 적들에게 강한 넉백을 줍니다',
        category: 'skill',
        rarity: 'common',
        stackable: false,
        probability: 0.05,
        effect: {
            type: 'special_behavior',
            behavior: 'dash_knockback'
        }
    },
    
    dash_attack: {
        id: 'dash_attack',
        name: '돌격',
        description: '대쉬 경로의 적들을 강하게 공격합니다',
        category: 'skill',
        rarity: 'rare',
        stackable: false,
        probability: 0.03,
        effect: {
            type: 'special_behavior',
            behavior: 'dash_damage'
        }
    },
    
    dash_explosion: {
        id: 'dash_explosion',
        name: '착지 폭발',
        description: '대쉬 끝에 큰 폭발 공격을 가합니다',
        category: 'skill',
        rarity: 'rare',
        stackable: false,
        probability: 0.03,
        effect: {
            type: 'special_behavior',
            behavior: 'dash_explosion'
        }
    },
    
    dash_lightning: {
        id: 'dash_lightning',
        name: '번개 대쉬',
        description: '대쉬 경로의 적들을 감전시킵니다',
        category: 'skill',
        rarity: 'uncommon',
        stackable: false,
        probability: 0.04,
        effect: {
            type: 'special_behavior',
            behavior: 'dash_electrify'
        }
    },
    
    dash_efficiency: {
        id: 'dash_efficiency',
        name: '순간이동 숙련',
        description: '대쉬 쿨타임이 20% 단축됩니다 (최대 3회)',
        category: 'skill',
        rarity: 'uncommon',
        stackable: true,
        maxStacks: 3,
        probability: 0.05,
        effect: {
            type: 'stat_modifier',
            target: 'dashCooldown',
            operation: 'multiply',
            value: 0.8
        }
    },
    
    shockwave_range_increase: {
        id: 'shockwave_range_increase',
        name: '거대 파동',
        description: '파동파의 범위가 25% 증가합니다 (최대 2회)',
        category: 'skill',
        rarity: 'uncommon',
        stackable: true,
        maxStacks: 2,
        probability: 0.04,
        effect: {
            type: 'stat_modifier',
            target: 'lightningWaveRadius',
            operation: 'multiply',
            value: 1.25
        }
    },
    
    lightning_wave_cooldown: {
        id: 'lightning_wave_cooldown',
        name: '파동파 숙련',
        description: '파동파 쿨타임이 20% 단축됩니다 (최대 3회)',
        category: 'skill',
        rarity: 'rare',
        stackable: true,
        maxStacks: 3,
        probability: 0.03,
        effect: {
            type: 'stat_modifier',
            target: 'lightningWaveCooldown',
            operation: 'multiply',
            value: 0.8
        }
    },
    
    double_shockwave: {
        id: 'double_shockwave',
        name: '이중 충격',
        description: '파동파가 2연속으로 발동됩니다 (첫번째 → 1초 후 1.3배 크기)',
        category: 'skill',
        rarity: 'legendary',
        stackable: false,
        probability: 0.02,
        effect: {
            type: 'special_behavior',
            behavior: 'double_shockwave'
        }
    },
    
    // === 미사일 스킬들 (새로 추가) ===
    
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
    
    
    // === 전기 스킬들 (새로 추가) ===
    
    electric_chain: {
        id: 'electric_chain',
        name: '전기 체인',
        description: '50% 확률로 피격된 적 주변 다른 적에 전기 체인 공격을 1회 전이합니다 (최대3회 전이)',
        category: 'skill',
        rarity: 'rare',
        stackable: true,
        maxStacks: 3,
        probability: 0.04,
        effect: {
            type: 'special_behavior',
            action: 'electric_chain_attack',
            value: 1
        }
    },
    
    random_lightning: {
        id: 'random_lightning',
        name: '천둥번개',
        description: '랜덤한 위치에 번개가 내려칩니다. 중첩될때마다 더 자주, 더 많이 발생합니다 (최대 3회)',
        category: 'skill',
        rarity: 'rare',
        stackable: true,
        maxStacks: 3,
        probability: 0.03,
        effect: {
            type: 'timed_buff',
            buffId: 'random_lightning_storm',
            duration: 999999999, // 거의 영구적 (게임오버까지 지속)
            action: 'activate_random_lightning',
            value: 1,
            modifiers: []
        }
    }
};

class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    preload() {
        // 플레이어 이미지 로드 (미리보기용)
        this.load.image('player', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#4CAF50" stroke="#2E7D32" stroke-width="2"/>
                <circle cx="16" cy="16" r="6" fill="#81C784"/>
            </svg>
        `));
    }

    create() {
        // 배경색 설정
        this.cameras.main.setBackgroundColor('#0a0a1a');
        
        // 제목
        const titleText = this.add.text(400, 150, 'GAME TOUNDER', {
            fontSize: '72px',
            color: '#4CAF50',
            stroke: '#000000',
            strokeThickness: 4,
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // 부제목
        const subtitleText = this.add.text(400, 220, 'Survive the Wave', {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // 플레이어 미리보기 스프라이트
        const playerPreview = this.add.sprite(400, 300, 'player');
        playerPreview.setScale(2);
        
        // 펄스 효과
        this.tweens.add({
            targets: playerPreview,
            scaleX: 2.2,
            scaleY: 2.2,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Power2'
        });
        
        // 조작법 안내
        const controlsText = this.add.text(400, 380, [
            'WASD / Arrow Keys - Move',
            'Mouse Click - Dash',
            'SPACE - Lightning Wave',
            'L - Level Up (Test)'
        ], {
            fontSize: '18px',
            color: '#cccccc',
            stroke: '#000000',
            strokeThickness: 1,
            align: 'center'
        }).setOrigin(0.5);
        
        // 시작 버튼
        const startButton = this.add.rectangle(400, 500, 300, 60, 0x4CAF50, 0.9);
        startButton.setStrokeStyle(3, 0xffffff);
        startButton.setInteractive();
        
        const startButtonText = this.add.text(400, 500, 'START GAME', {
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // 시작 안내
        const hintText = this.add.text(400, 570, 'Press SPACE or click START GAME', {
            fontSize: '16px',
            color: '#aaaaaa'
        }).setOrigin(0.5);
        
        // 버튼 이벤트
        const startGame = () => {
            this.scene.start('GameScene');
        };
        
        startButton.on('pointerdown', startGame);
        
        // 호버 효과
        startButton.on('pointerover', () => {
            startButton.setFillStyle(0x66BB6A, 1);
            this.tweens.add({
                targets: [startButton, startButtonText],
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 150
            });
        });
        
        startButton.on('pointerout', () => {
            startButton.setFillStyle(0x4CAF50, 0.9);
            this.tweens.add({
                targets: [startButton, startButtonText],
                scaleX: 1,
                scaleY: 1,
                duration: 150
            });
        });
        
        // 스페이스바로도 시작
        this.input.keyboard.once('keydown-SPACE', startGame);
        
        // 제목 애니메이션
        titleText.setAlpha(0);
        this.tweens.add({
            targets: titleText,
            alpha: 1,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            ease: 'Back.easeOut'
        });
        
        // 순차적으로 요소들 페이드인
        const elementsToFadeIn = [subtitleText, playerPreview, controlsText, startButton, startButtonText, hintText];
        elementsToFadeIn.forEach((element, index) => {
            element.setAlpha(0);
            this.tweens.add({
                targets: element,
                alpha: 1,
                duration: 600,
                delay: 200 + (index * 150)
            });
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.initializeGameVariables();
    }

    initializeGameVariables() {
        // 오브젝트 변수들
        this.player = null;
        this.enemies = null;
        this.bullets = null;
        this.energy = null;
        this.bulletUpgrades = null;
        this.explosions = null;
        this.cursors = null;
        this.wasd = null;
        
        // 게임 상태 변수들
        this.lastFired = 0;
        this.fireRate = 200;
        this.playerSpeed = 400;
        this.bulletSpeed = 700;
        this.baseEnemySpeed = 100;
        this.score = 0;
        this.weaponLevel = 1;
        this.bulletCount = 1;
        this.gameTime = 0;
        this.eliteKills = 0;
        
        // 오각형 몬스터 시스템
        this.pentagonWaveInterval = 5; // 5웨이브마다 등장
        this.pentagonCount = 0; // 오각형 몬스터 카운터 (디버깅용)
        
        // UI 관련
        this.scoreText = null;
        this.weaponLevelText = null;
        this.survivalTimeDisplay = null;
        
        // 물리/이동 관련
        this.playerVelocity = { x: 0, y: 0 };
        this.playerAcceleration = 1200;
        this.playerDrag = 900;
        this.fireRange = 300;
        
        // 월드 크기
        this.worldWidth = 8000;
        this.worldHeight = 6000;
        
        // 플레이어 상태
        this.playerHealth = 3;
        this.maxPlayerHealth = 3;
        this.experience = 0;
        this.experienceToNext = 100;
        this.isPlayerInvincible = false;
        
        // 적 스폰 관련
        this.enemySpawnRate = 1200;
        this.difficultyLevel = 1;
        this.enemiesPerWave = 1;
        this.lastSpawnTime = 0;
        
        // 대쉬 시스템
        this.dashCharges = 3;
        this.maxDashCharges = 3;
        this.dashCooldown = 4000;
        this.dashDistance = 2000;
        this.dashSpeed = 5000;
        this.dashAcceleration = 15000;
        this.isDashing = false;
        this.dashCooldowns = [0, 0, 0];
        this.dashGhosts = [];
        this.dashLightning = null;
        
        // 아이템 시스템
        this.bulletUpgradeSpawnRate = 15000;
        this.lastBulletUpgradeSpawn = 0;
        
        // 엘리트 몬스터 시스템
        this.eliteSpawnRate = 30000; // 30초로 대폭 단축
        this.eliteSpawnChance = 0.70; // 70%로 대폭 증가
        this.lastEliteSpawn = 0;
        this.currentEliteCount = 0; // 현재 맵에 있는 엘리트 몬스터 수
        this.maxEliteCount = 1; // 최대 엘리트 몬스터 수 (10웨이브 이후 2마리)
        
        // 번개 파동파 시스템
        this.lightningWaveCooldown = 15000; // 15초 쿨다운
        this.lightningWaveReady = true;
        this.lightningWaveLastUsed = 0;
        this.lightningWaveRadius = 800; // 800x800 범위 (4배 확대)
        this.isLightningWaveActive = false; // 스킬 사용 중 무적 상태
        
        // 레벨업 시스템 보호 플래그들
        this.isLevelingUp = false; // 레벨업 진행 중 중복 방지
        this.isSkillSelectionActive = false; // 스킬 선택 중 게임 정지
        this.doubleShockwaveActive = false; // 버그 수정: 이중 파동파 중복 실행 방지
        
        // 스킬 시스템
        this.skillSystem = {
            // 선택된 스킬들
            selectedSkills: new Set(),
            skillStacks: new Map(),
            specialBehaviors: new Set(),
            
            // 액티브 스킬 상태
            barrierCharges: 0,
            maxBarrierCharges: 3,
            
            // 시간 제한 버프들
            activeBuffs: new Map(),
            
            // UI 상태
            isCardSelectionActive: false,
            currentCardOptions: [],
            
            // 광고 관련 (추후 구현)
            adRefreshCount: 0,
            maxAdRefreshPerLevel: 1
        };
        
        // 스킬 이벤트 핸들러 시스템
        this.skillEventHandlers = {
            onBulletHit: [],
            onEnemyKill: [],
            onPlayerHit: [],
            onDashStart: [],
            onDashEnd: [],
            onLightningWave: [],
            onLevelUp: []
        };
        
        // 능력치 수정자 엔진 (추후 구현)
        this.statModifierEngine = null;
    }

    preload() {
        // 간단하고 안정적인 이미지들로 교체
        this.load.image('player', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#4CAF50" stroke="#2E7D32" stroke-width="2"/>
                <circle cx="16" cy="16" r="6" fill="#81C784"/>
            </svg>
        `));
        
        this.load.image('enemy1', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="20" height="20" fill="#F44336" stroke="#C62828" stroke-width="2"/>
                <rect x="8" y="8" width="8" height="8" fill="#E57373"/>
            </svg>
        `));
        
        this.load.image('enemy2', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <polygon points="10,2 18,18 10,14 2,18" fill="#FF5722" stroke="#BF360C" stroke-width="2"/>
            </svg>
        `));
        
        this.load.image('enemy3', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="28" height="28" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="14" r="12" fill="#9C27B0" stroke="#4A148C" stroke-width="2"/>
                <circle cx="14" cy="14" r="6" fill="#BA68C8"/>
            </svg>
        `));
        
        this.load.image('bullet', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="8" height="8" xmlns="http://www.w3.org/2000/svg">
                <circle cx="4" cy="4" r="3" fill="#FFD54F" stroke="#FF8F00" stroke-width="1"/>
            </svg>
        `));
        
        this.load.image('energy', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <polygon points="8,1 10,6 15,6 11,9 13,15 8,12 3,15 5,9 1,6 6,6" fill="#9C27B0" stroke="#6A1B9A" stroke-width="1"/>
            </svg>
        `));
        
        this.load.image('explosion', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#FF6B35"/>
                <circle cx="20" cy="20" r="12" fill="#FFE66D"/>
                <circle cx="20" cy="20" r="6" fill="#FFFFFF"/>
            </svg>
        `));
        
        this.load.image('bullet_upgrade', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="16" height="16" fill="#FFC107" stroke="#FF8F00" stroke-width="2" rx="2"/>
                <rect x="8" y="6" width="4" height="2" fill="#FFFFFF"/>
                <rect x="6" y="8" width="8" height="2" fill="#FFFFFF"/>
                <rect x="8" y="10" width="4" height="2" fill="#FFFFFF"/>
            </svg>
        `));
        
        this.load.image('elite_monster', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="35" fill="#8E24AA" stroke="#4A148C" stroke-width="4"/>
                <circle cx="40" cy="40" r="25" fill="#9C27B0"/>
                <circle cx="40" cy="40" r="15" fill="#BA68C8"/>
                <circle cx="40" cy="40" r="8" fill="#E1BEE7"/>
                <polygon points="40,10 45,25 40,22 35,25" fill="#FFD700"/>
                <polygon points="40,70 45,55 40,58 35,55" fill="#FFD700"/>
                <polygon points="10,40 25,45 22,40 25,35" fill="#FFD700"/>
                <polygon points="70,40 55,45 58,40 55,35" fill="#FFD700"/>
            </svg>
        `));
        
        this.load.image('pentagon_monster', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="36" height="36" xmlns="http://www.w3.org/2000/svg">
                <polygon points="18,2 32,12 26,28 10,28 4,12" fill="#FF6B35" stroke="#D84315" stroke-width="2"/>
                <polygon points="18,8 26,16 22,24 14,24 10,16" fill="#FF8A65"/>
                <circle cx="18" cy="18" r="4" fill="#FFAB40"/>
            </svg>
        `));
        
        this.load.image('enemy_bullet', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="6" height="6" xmlns="http://www.w3.org/2000/svg">
                <circle cx="3" cy="3" r="2" fill="#FF1744" stroke="#B71C1C" stroke-width="1"/>
            </svg>
        `));
        
        this.load.image('star_elite_monster', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
                <polygon points="30,5 35,20 50,20 38,30 43,45 30,35 17,45 22,30 10,20 25,20" fill="#FFD700" stroke="#FF8F00" stroke-width="3"/>
                <polygon points="30,10 33,18 40,18 35,23 37,30 30,26 23,30 25,23 20,18 27,18" fill="#FFF176"/>
                <circle cx="30" cy="25" r="4" fill="#FF6F00"/>
            </svg>
        `));
    }

    create() {
        // 게임 재시작시 모든 변수 초기화
        this.initializeGameVariables();
        
        // 능력치 수정자 엔진 초기화
        this.statModifierEngine = new StatModifierEngine(this);
        
        // ⚡ 새로운 전기 시스템들 초기화
        this.chainLightningSystem = new ChainLightningSystem(this);
        
        // 전기 스킬 시스템 (간단한 구현)
        this.electricSkillSystem = {
            activeRandomLightning: null,
            lightningStrikeCount: 0,
            
            // 전기 체인 공격 트리거
            triggerElectricChain: (hitEnemy, skillLevel = 1) => {
                if (Math.random() > 0.5) return false; // 50% 확률
                
                const chainConfig = {
                    maxJumps: Math.min(3, skillLevel + 2),
                    maxRange: 150 + (skillLevel * 25),
                    damage: 8 + (skillLevel * 2),
                    damageDecay: 0.85,
                    duration: 120
                };
                
                return this.chainLightningSystem.executeChainLightning(
                    hitEnemy, hitEnemy.x, hitEnemy.y, chainConfig
                );
            },
            
            // 랜덤 번개 활성화 (타이머 버그 수정)
            activateRandomLightning: (skillLevel = 1, duration = 15000) => {
                if (this.electricSkillSystem.activeRandomLightning) {
                    this.electricSkillSystem.activeRandomLightning.destroy();
                    this.electricSkillSystem.activeRandomLightning = null;
                }
                
                const config = {
                    level: skillLevel,
                    strikeInterval: Math.max(1000, 3000 - (skillLevel * 500)),
                    strikesPerWave: skillLevel,
                    damage: 12 + (skillLevel * 3),
                    range: 80 + (skillLevel * 20)
                };
                
                console.log(`🌩️ 랜덤 번개 활성화! 레벨: ${skillLevel}, 지속시간: ${duration}ms, 간격: ${config.strikeInterval}ms`);
                
                // 단순한 반복 타이머 사용 (내장 반복 종료 기능 활용)
                this.electricSkillSystem.activeRandomLightning = this.time.addEvent({
                    delay: config.strikeInterval,
                    callback: () => {
                        if (this.player && this.player.active && !this.isSkillSelectionActive) {
                            this.createRandomLightningStrike(config);
                        }
                    },
                    loop: true // 무한 반복 (영구적)
                });
                
                // 영구적 스킬로 변경 - 종료 타이머 제거
                console.log('🌩️ 랜덤 번개 영구 활성화! (게임오버까지 지속)');
                
                this.showAutoSkillText(`천둥번개 Lv.${skillLevel} 활성화!`);
                return true;
            }
        };
        
        // 격자 배경 생성
        this.createGridBackground();
        
        // 플레이어 생성
        this.player = this.physics.add.sprite(this.worldWidth / 2, this.worldHeight / 2, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDrag(this.playerDrag);
        this.player.setMaxVelocity(this.playerSpeed);
        
        // 게임 오브젝트 그룹 생성
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.energy = this.physics.add.group();
        this.bulletUpgrades = this.physics.add.group();
        this.explosions = this.add.group();
        this.dashEffects = this.add.group();
        
        // 키보드 입력 설정
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.lKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
        this.mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M); // 미사일 테스트용
        
        // 마우스 클릭 이벤트
        this.input.on('pointerdown', this.onPointerDown, this);
        
        // 카메라 설정
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        
        // UI 생성
        this.createUI();
        
        // 게임 타이머들 설정
        this.setupGameTimers();
        
        // 충돌 감지 설정
        this.setupCollisionDetection();
        
        // 미사일 시스템 초기화 (모든 게임 오브젝트 생성 후)
        this.initializeMissileSystem();
        
        // 미사일 풀이 생성된 후 미사일 충돌 감지 설정
        this.setupMissileCollisions();
        
        // 월드 경계 설정
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    }
    
    // 게임 타이머들 설정
    setupGameTimers() {
        // 적 스폰 타이머
        this.enemySpawnTimer = this.time.addEvent({
            delay: this.enemySpawnRate,
            callback: this.spawnEnemyWave,
            callbackScope: this,
            loop: true
        });
        
        // 게임 시간 및 난이도 타이머
        this.time.addEvent({
            delay: 1000,
            callback: this.updateGameTime,
            callbackScope: this,
            loop: true
        });
        
        // 대쉬 쿨다운 업데이트 타이머
        this.time.addEvent({
            delay: 100,
            callback: this.updateDashCooldowns,
            callbackScope: this,
            loop: true
        });
        
        // 탄환 업그레이드 스폰 타이머
        this.time.addEvent({
            delay: this.bulletUpgradeSpawnRate,
            callback: this.spawnBulletUpgrade,
            callbackScope: this,
            loop: true
        });
        
        // 엘리트 몬스터 스폰 타이머
        this.time.addEvent({
            delay: this.eliteSpawnRate,
            callback: this.trySpawnEliteMonster,
            callbackScope: this,
            loop: true
        });
    }
    
    // 충돌 감지 설정
    setupCollisionDetection() {
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.energy, this.collectEnergy, null, this);
        this.physics.add.overlap(this.player, this.bulletUpgrades, this.collectBulletUpgrade, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHit, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHitByBullet, null, this);
    }
    
    // 미사일 풀 생성 후 미사일 충돌 감지 설정
    setupMissileCollisions() {
        if (this.missilePool) {
            console.log('🚀 미사일 충돌 감지 설정 중...');
            this.physics.add.overlap(this.missilePool, this.enemies, this.missileHitEnemy, null, this);
            console.log('✅ 미사일-적 충돌 감지 설정 완료!');
        } else {
            console.warn('❌ 미사일 풀이 없어서 충돌 감지를 설정할 수 없습니다!');
        }
    }

    // M키 미사일 발사 테스트 메서드
    testMissileFire() {
        console.log('🚀 M키 미사일 테스트 발사!');
        
        if (!this.missilePool) {
            console.warn('❌ 미사일 풀이 없습니다!');
            return;
        }
        
        // 가장 가까운 적 찾기
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.active) {
                const distance = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y, enemy.x, enemy.y
                );
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            }
        });
        
        if (nearestEnemy) {
            console.log(`🎯 타겟 발견: ${nearestEnemy.enemyType || 'unknown'}, 거리: ${Math.round(nearestDistance)}`);
            
            // 미사일 발사
            const missile = this.missilePool.get(this.player.x, this.player.y);
            if (missile) {
                const success = missile.launch(nearestEnemy, 3); // 3번 바운스
                if (success) {
                    console.log('✅ 미사일 발사 성공!');
                } else {
                    console.warn('❌ 미사일 발사 실패!');
                }
            } else {
                console.warn('❌ 미사일 풀에서 객체를 가져올 수 없습니다!');
            }
        } else {
            console.warn('❌ 주변에 적이 없습니다!');
            
            // 테스트용 더미 타겟 생성
            console.log('🎯 테스트용 더미 적 생성');
            const dummyEnemy = this.physics.add.sprite(
                this.player.x + 200, this.player.y, 'enemy'
            );
            dummyEnemy.enemyType = 'test_dummy';
            dummyEnemy.health = 10;
            dummyEnemy.setTint(0xFF0000); // 빨간색으로 표시
            this.enemies.add(dummyEnemy);
            
            // 더미 적에게 미사일 발사
            const missile = this.missilePool.get(this.player.x, this.player.y);
            if (missile) {
                missile.launch(dummyEnemy, 3);
                console.log('✅ 테스트 더미에게 미사일 발사!');
            }
        }
    }

    // 미사일 시스템 초기화
    initializeMissileSystem() {
        // 미사일 클래스 로드 (인라인 구현)
        this.loadMissileClasses();
        
        // 미사일 풀 생성
        this.missilePool = this.physics.add.group({
            classType: this.GuidedMissile,
            runChildUpdate: true,
            maxSize: 100,
            createCallback: (missile) => {
                missile.setName('guidedMissile');
            }
        });
        
        // 미사일 스킬 매니저
        this.missileSkillManager = new this.MissileSkillManager(this);
        
        // 충돌 감지 설정
        this.physics.add.overlap(this.missilePool, this.enemies, (missile, enemy) => {
            console.log('🎯 미사일-적 물리 충돌 감지!', {
                missileActive: missile.active,
                enemyActive: enemy.active,
                missilePos: {x: Math.round(missile.x), y: Math.round(missile.y)},
                enemyPos: {x: Math.round(enemy.x), y: Math.round(enemy.y)}
            });
            
            if (missile.active && enemy.active) {
                missile.onHit(enemy);
            } else {
                console.log('⚠️ 충돌했지만 조건 불만족 - 스킵');
            }
        });
        
        console.log('🚀 미사일 시스템 초기화 완료');
    }
    
    // 미사일 클래스들 로드 (인라인 구현)
    loadMissileClasses() {
        // GuidedMissile 클래스 인라인 구현
        this.GuidedMissile = class GuidedMissile extends Phaser.Physics.Arcade.Sprite {
            constructor(scene, x, y) {
                super(scene, x, y, 'energy');
                
                scene.add.existing(this);
                scene.physics.add.existing(this);
                this.body.setAllowGravity(false);
                this.setActive(false).setVisible(false);
                
                // Navigation System
                this.speedMin = 180;
                this.speedMax = 420;
                this.currentSpeed = 260;
                this.turnRate = 8;
                this.accelerationEasing = 0.15;
                
                // Wobble Effect
                this.wobbleAmp = 45;
                this.wobbleFreq = 8;
                this.wobbleTime = 0;
                
                // Bounce System
                this.bounceLeft = 3;
                this.bounceRadius = 220;
                this.hitCooldown = 0;
                this.visitedTargets = new Set();
                
                // Lifecycle
                this.maxLifetime = 6;
                this.currentLifetime = 0;
                this.damage = 3;
                
                // State
                this.state = 'INACTIVE';
                this.target = null;
                
                // Enhanced Impact System (강화된 타격감)
                this.bounceBackForce = 2.5;    // 반대방향 튕김 강도 2.5배
                this.bounceBackDistance = 120;  // 튕김 거리 2배 증가
                this.targetOnly = true;        // 타겟만 타격 가능
                
                // Wandering System (배회 시스템)
                this.wanderingTime = 0;        // 배회 시간 누적
                this.wanderingTimeout = 4000;  // 4초 타임아웃
                this.lemniscatePhase = 0;      // ∞ 궤적 위상
                this.lemniscateScale = 250;     // ∞ 궤적 크기 (더 크고 역동적)
                this.wanderingBaseX = 0;       // 배회 중심점
                this.wanderingBaseY = 0;
                
                // Target Reacquisition (타겟 재포착)
                this.targetingDelay = 0;       // 2초 딜레이 카운터
                this.targetingDelayDuration = 500; // 0.5초 딜레이
                this.hasFoundNewTarget = false; // 새 타겟 발견 플래그
                
                // Visual
                this.trailPoints = [];
                this.maxTrailPoints = 12;
                
                this.setupVisualEffects();
            }
            
            setupVisualEffects() {
                this.setTint(0x00AAFF);
                this.setScale(0.8);
                
                this.glowEffect = this.scene.add.circle(this.x, this.y, 8, 0x87CEEB, 0.3);
                this.glowEffect.setVisible(false);
            }
            
            launch(target, bounceCount) {
                if (!target || !target.active) return false;
                
                this.setActive(true).setVisible(true);
                this.glowEffect.setVisible(true);
                
                this.target = target;
                this.bounceLeft = bounceCount;
                this.currentLifetime = 0;
                this.wobbleTime = 0;
                this.hitCooldown = 0;
                this.visitedTargets.clear();
                this.trailPoints = [];
                this.state = 'LAUNCHING';
                
                // 배회 시스템 초기화
                this.wanderingTime = 0;
                this.targetingDelay = 0;
                this.hasFoundNewTarget = false;
                this.newTarget = null;
                
                const initialAngle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
                this.scene.physics.velocityFromRotation(initialAngle, this.currentSpeed, this.body.velocity);
                this.rotation = initialAngle;
                
                this.scene.time.delayedCall(200, () => {
                    if (this.active) {
                        this.state = 'SEEKING';
                    }
                });
                
                return true;
            }
            
            preUpdate(time, delta) {
                super.preUpdate(time, delta);
                
                if (!this.active) return;
                
                const dt = delta / 1000;
                this.currentLifetime += dt;
                this.wobbleTime += dt;
                this.hitCooldown = Math.max(0, this.hitCooldown - delta);
                
                // 수명 체크
                if (this.currentLifetime > this.maxLifetime) {
                    return this.destroyMissile();
                }
                
                // 타겟 유효성 체크 (배회 모드가 아닌 경우에만)
                if (this.state !== 'WANDERING' && (!this.target || !this.target.active)) {
                    console.log('🎯 타겟 소실 → 배회 모드 전환');
                    this.enterWanderingMode();
                    return;
                }
                
                switch (this.state) {
                    case 'LAUNCHING':
                        this.updateLaunching(dt);
                        break;
                    case 'SEEKING':
                        this.updateSeeking(dt);
                        break;
                    case 'WANDERING':
                        this.updateWanderingMovement(delta);
                        break;
                    case 'BOUNCING':
                        if (this.hitCooldown <= 0) {
                            this.state = 'SEEKING';
                        }
                        break;
                }
                
                this.updateVisualEffects();
            }
            
            updateLaunching(dt) {
                const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
                this.scene.physics.velocityFromRotation(targetAngle, this.currentSpeed, this.body.velocity);
                this.rotation = targetAngle;
            }
            
            updateSeeking(dt) {
                const aimPoint = this.calculateWobbledAimPoint();
                
                const desiredAngle = Phaser.Math.Angle.Between(this.x, this.y, aimPoint.x, aimPoint.y);
                const currentAngle = this.body.velocity.angle();
                const nextAngle = Phaser.Math.Angle.RotateTo(currentAngle, desiredAngle, this.turnRate * dt);
                
                const alignment = Math.cos(Phaser.Math.Angle.Wrap(desiredAngle - nextAngle));
                const targetSpeed = Phaser.Math.Linear(this.speedMin, this.speedMax, (alignment + 1) * 0.5);
                this.currentSpeed = Phaser.Math.Linear(this.currentSpeed, targetSpeed, this.accelerationEasing);
                
                this.scene.physics.velocityFromRotation(nextAngle, this.currentSpeed, this.body.velocity);
                this.rotation = nextAngle;
            }
            
            calculateWobbledAimPoint() {
                const toTarget = new Phaser.Math.Vector2(this.target.x - this.x, this.target.y - this.y);
                const perpendicular = new Phaser.Math.Vector2(-toTarget.y, toTarget.x);
                if (perpendicular.length() > 0) {
                    perpendicular.normalize();
                }
                
                const wobbleOffset = Math.sin(this.wobbleTime * this.wobbleFreq) * this.wobbleAmp;
                
                return new Phaser.Math.Vector2(this.target.x, this.target.y)
                    .add(perpendicular.scale(wobbleOffset));
            }
            
            
            onHit(enemy) {
                if (!this.active || this.hitCooldown > 0 || this.state !== 'SEEKING') return;
                
                // 디버깅: 충돌 감지 로깅
                console.log('💥 미사일 충돌 감지!', {
                    missileActive: this.active,
                    enemyActive: enemy.active,
                    missileState: this.state,
                    hitCooldown: this.hitCooldown,
                    targetOnly: this.targetOnly,
                    isTarget: enemy === this.target,
                    enemyType: enemy.enemyType || 'unknown'
                });
                
                // 타겟 전용 체크 비활성화 (미사일이 모든 적을 공격할 수 있도록)
                // if (this.targetOnly && enemy !== this.target) {
                //     console.log('⚠️ 비타겟 적 타격 - 데미지 없음');
                //     this.createHitEffect(enemy.x, enemy.y);
                //     return;
                // }
                
                console.log(`💥 미사일 적 타격! ${enemy.enemyType || 'unknown'}, 남은 바운스: ${this.bounceLeft}`);
                
                // 일반공격과 동일한 타격 이팩트 발생 보장
                this.createHitEffect(enemy.x, enemy.y);
                
                this.applyDamage(enemy);
                
                // 타임아웃 초기화 (타격시 시간 다시 연장)
                this.wanderingTime = 0;
                
                this.handleBounce(enemy);
            }
            
            applyDamage(enemy) {
                const previousHealth = enemy.health;
                enemy.health -= this.damage;
                
                // 디버깅: 데미지 적용 로깅
                console.log('🔥 미사일 데미지 적용:', {
                    previousHealth: previousHealth,
                    damage: this.damage,
                    newHealth: enemy.health,
                    enemyType: enemy.enemyType || 'unknown'
                });
                
                // 미사일 데미지 표시 (더 큰 사이즈, 미사일 색상)
                if (this.scene.showDamageNumber) {
                    this.scene.showDamageNumber(enemy.x, enemy.y - 35, this.damage, 0x00AAFF);
                }
                
                // 추가 데미지 표시 (더 눈에 띄게)
                const damageText = this.scene.add.text(enemy.x, enemy.y - 50, `-${this.damage}`, {
                    fontSize: '18px',
                    color: '#00AAFF',
                    stroke: '#003366',
                    strokeThickness: 3,
                    shadow: { offsetX: 2, offsetY: 2, color: '#000000', fill: true }
                }).setOrigin(0.5);
                
                this.scene.tweens.add({
                    targets: damageText,
                    y: enemy.y - 80,
                    alpha: 0,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 1000,
                    ease: 'Power2.easeOut',
                    onComplete: () => damageText.destroy()
                });
                
                if (this.scene.applyElectrifyEffect) {
                    this.scene.applyElectrifyEffect(enemy);
                }
                
                if (enemy.health <= 0) {
                    this.scene.createExplosion(enemy.x, enemy.y);
                    
                    const energyOrb = this.scene.physics.add.sprite(enemy.x, enemy.y, 'energy');
                    this.scene.energy.add(energyOrb);
                    
                    const points = this.scene.getEnemyPoints ? this.scene.getEnemyPoints(enemy.enemyType) : 100;
                    this.scene.score += points;
                    
                    enemy.destroy();
                }
            }
            
            handleBounce(hitEnemy) {
                this.bounceLeft--;
                this.visitedTargets.add(hitEnemy);
                this.hitCooldown = 84; // 30% 빈도 증가 (120ms -> 84ms)
                this.state = 'BOUNCING';
                
                // 강화된 타격감: 반대방향 튕김 효과
                this.performEnhancedBounceBack(hitEnemy);
                
                if (this.bounceLeft < 0) {
                    console.log('💥 미사일 바운스 횟수 소진 → 배회 모드 전환');
                    this.enterWanderingMode();
                    return;
                }
                
                const nextTarget = this.findBounceTarget(hitEnemy);
                
                if (nextTarget) {
                    console.log(`🎯 다음 바운스 타겟 발견: ${nextTarget.enemyType || 'unknown'}`);
                    this.target = nextTarget;
                    this.createBounceEffect(hitEnemy.x, hitEnemy.y, nextTarget.x, nextTarget.y);
                    this.state = 'SEEKING';
                } else {
                    console.log('🔍 바운스 타겟 없음 → 배회 모드 전환');
                    this.enterWanderingMode();
                }
            }
            
            findBounceTarget(excludeEnemy) {
                const nearbyEnemies = this.scene.enemies.children.entries.filter(enemy => {
                    if (!enemy.active || enemy === excludeEnemy) return false;
                    
                    const distance = Phaser.Math.Distance.Between(
                        excludeEnemy.x, excludeEnemy.y, enemy.x, enemy.y
                    );
                    
                    return distance <= this.bounceRadius;
                });
                
                if (nearbyEnemies.length === 0) return null;
                
                const unvisited = nearbyEnemies.filter(e => !this.visitedTargets.has(e));
                const candidates = unvisited.length > 0 ? unvisited : nearbyEnemies;
                
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
            
            updateVisualEffects() {
                this.glowEffect.setPosition(this.x, this.y);
                
                this.trailPoints.push({
                    x: this.x,
                    y: this.y,
                    timestamp: Date.now()
                });
                
                const cutoffTime = Date.now() - 300;
                this.trailPoints = this.trailPoints.filter(p => p.timestamp > cutoffTime);
                
                if (this.trailPoints.length > this.maxTrailPoints) {
                    this.trailPoints.shift();
                }
                
                this.renderTrail();
            }
            
            renderTrail() {
                if (this.trailPoints.length < 2) return;
                
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
            
            createHitEffect(x, y) {
                // 강화된 미사일 타격 이팩트
                const explosion = this.scene.add.circle(x, y, 18, 0x00AAFF, 1.0);
                
                this.scene.tweens.add({
                    targets: explosion,
                    scaleX: 3.2,
                    scaleY: 3.2,
                    alpha: 0,
                    duration: 400,
                    ease: 'Power2.easeOut',
                    onComplete: () => explosion.destroy()
                });
                
                // 추가 글로우 효과
                const glow = this.scene.add.circle(x, y, 30, 0x87CEEB, 0.5);
                
                this.scene.tweens.add({
                    targets: glow,
                    scaleX: 2.0,
                    scaleY: 2.0,
                    alpha: 0,
                    duration: 500,
                    ease: 'Power2.easeOut',
                    onComplete: () => glow.destroy()
                });
                
                this.createSparkParticles(x, y, 12);
                
                // 미니 반짝이 효과
                this.createFlashEffect(x, y);
            }
            
            // 일반공격과 동일한 타격 이팩트 (미사일 색상으로)
            createBulletStyleHitEffect(x, y) {
                // 메인 폭발 (미사일 색상 - 더 크고 강렬하게)
                const explosion = this.scene.add.circle(x, y, 20, 0x00AAFF, 1.0);
                
                this.scene.tweens.add({
                    targets: explosion,
                    scaleX: 3.5,
                    scaleY: 3.5,
                    alpha: 0,
                    duration: 400,
                    ease: 'Power2.easeOut',
                    onComplete: () => explosion.destroy()
                });
                
                // 외부 글로우 (더 크고 지속시간 증가)
                const glow = this.scene.add.circle(x, y, 35, 0x87CEEB, 0.6);
                
                this.scene.tweens.add({
                    targets: glow,
                    scaleX: 2.5,
                    scaleY: 2.5,
                    alpha: 0,
                    duration: 600,
                    ease: 'Power2.easeOut',
                    onComplete: () => glow.destroy()
                });
                
                // 샤크웨이브 (충격파)
                const shockwave = this.scene.add.circle(x, y, 10, 0xFFFFFF, 0.8);
                shockwave.setStrokeStyle(3, 0x00AAFF, 1.0);
                
                this.scene.tweens.add({
                    targets: shockwave,
                    scaleX: 4,
                    scaleY: 4,
                    alpha: 0,
                    duration: 500,
                    ease: 'Power3.easeOut',
                    onComplete: () => shockwave.destroy()
                });
                
                // 미사일 색상 스파크 (더 많이)
                this.createSparkParticles(x, y, 15);
                
                // 추가 반짝이 자극 효과
                this.createFlashEffect(x, y);
                
                // 카메라 살짝 흔들기
                if (this.scene.cameras && this.scene.cameras.main) {
                    this.scene.cameras.main.shake(100, 0.008);
                }
            }
            
            createBounceEffect(fromX, fromY, toX, toY) {
                // 유도미사일 노란색 트레일 효과 제거 (사용자 요청)
                // 바운스 효과를 파란색으로 변경하여 yellow 제거
                const spark = this.scene.add.circle(fromX, fromY, 8, 0x00AAFF, 0.8);
                
                this.scene.tweens.add({
                    targets: spark,
                    scaleX: 2,
                    scaleY: 2,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => spark.destroy()
                });
                
                const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);
                this.createDirectionParticles(fromX, fromY, angle);
            }
            
            createSparkParticles(x, y, count = 8) {
                for (let i = 0; i < count; i++) {
                    const particle = this.scene.add.circle(x, y, 3, 0x00AAFF, 0.9);
                    
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 30 + Math.random() * 50;
                    
                    this.scene.tweens.add({
                        targets: particle,
                        x: x + Math.cos(angle) * distance,
                        y: y + Math.sin(angle) * distance,
                        alpha: 0,
                        scaleX: 0.1,
                        scaleY: 0.1,
                        duration: 300 + Math.random() * 400,
                        ease: 'Power2.easeOut',
                        onComplete: () => particle.destroy()
                    });
                }
            }
            
            // 반짝이는 자극 효과
            createFlashEffect(x, y) {
                const flash = this.scene.add.circle(x, y, 25, 0xFFFFFF, 0.9);
                
                this.scene.tweens.add({
                    targets: flash,
                    alpha: 0,
                    duration: 150,
                    ease: 'Power3.easeOut',
                    onComplete: () => flash.destroy()
                });
            }
            
            // 반대방향 튕김 시각 효과
            createBounceBackEffect(x, y, bounceAngle) {
                // 튕김 방향 표시 주황색 에너지
                const bounceIndicator = this.scene.add.circle(x, y, 15, 0x00AAFF, 0.9); // 노란색 제거
                const targetX = x + Math.cos(bounceAngle) * 40;
                const targetY = y + Math.sin(bounceAngle) * 40;
                
                this.scene.tweens.add({
                    targets: bounceIndicator,
                    x: targetX,
                    y: targetY,
                    scaleX: 0.3,
                    scaleY: 0.3,
                    alpha: 0,
                    duration: 300,
                    ease: 'Power2.easeOut',
                    onComplete: () => bounceIndicator.destroy()
                });
                
                // 튕김 충격파
                const bounceWave = this.scene.add.circle(x, y, 8, 0x00AAFF, 0.7); // 노란색 제거
                bounceWave.setStrokeStyle(2, 0xFF6600, 1.0);
                
                this.scene.tweens.add({
                    targets: bounceWave,
                    scaleX: 3,
                    scaleY: 3,
                    alpha: 0,
                    duration: 400,
                    ease: 'Power3.easeOut',
                    onComplete: () => bounceWave.destroy()
                });
            }
            
            // 튕김 트레일 효과
            createBounceTrailEffect(startX, startY, endX, endY) {
                const trail = this.scene.add.graphics();
                trail.lineStyle(6, 0x00AAFF, 0.8); // 노란색 제거
                trail.beginPath();
                trail.moveTo(startX, startY);
                trail.lineTo(endX, endY);
                trail.strokePath();
                
                this.scene.tweens.add({
                    targets: trail,
                    alpha: 0,
                    duration: 500,
                    ease: 'Power2.easeOut',
                    onComplete: () => trail.destroy()
                });
            }
            
            createDirectionParticles(x, y, angle) {
                for (let i = 0; i < 3; i++) {
                    const particle = this.scene.add.circle(x, y, 1, 0x00AAFF, 0.6); // 노란색 제거
                    const distance = 15 + (i * 10);
                    
                    this.scene.tweens.add({
                        targets: particle,
                        x: x + Math.cos(angle) * distance,
                        y: y + Math.sin(angle) * distance,
                        alpha: 0,
                        duration: 150 + (i * 50),
                        ease: 'Power1.easeOut',
                        onComplete: () => particle.destroy()
                    });
                }
            }
            
            destroyMissile() {
                // 미사일 소멸 시 폭발 효과 생성
                if (this.active && this.scene && this.scene.createExplosion) {
                    this.scene.createExplosion(this.x, this.y);
                    console.log('💥 미사일 소멸 폭발 효과 생성');
                }
                
                this.setActive(false).setVisible(false);
                this.glowEffect.setVisible(false);
                this.body.stop();
                
                if (this.currentTrailGraphics) {
                    this.currentTrailGraphics.destroy();
                    this.currentTrailGraphics = null;
                }
                
                this.state = 'INACTIVE';
                this.target = null;
                this.visitedTargets.clear();
                this.trailPoints = [];
                this.currentLifetime = 0;
                this.wanderingTime = 0;
                this.targetingDelay = 0;
                this.hasFoundNewTarget = false;
                this.newTarget = null;
            }
            
            // 강화된 반대방향 튕김 효과 (MapleStory 스타일)
            performEnhancedBounceBack(hitEnemy) {
                // 피격된 적 방향의 반대로 강하게 튕김
                const hitDirection = Phaser.Math.Angle.Between(this.x, this.y, hitEnemy.x, hitEnemy.y);
                const bounceAngle = hitDirection + Math.PI; // 반대 방향
                
                // 큐빅 베지어 속도 리셋 + 강화된 튕김 (더 강하게)
                this.currentSpeed = this.speedMax * (this.bounceBackForce + 0.5); // 3배 가속
                
                // 물리 속도 즉시 적용
                this.scene.physics.velocityFromRotation(bounceAngle, this.currentSpeed, this.body.velocity);
                this.rotation = bounceAngle;
                
                // 반대방향 튕김 시각 효과
                this.createBounceBackEffect(this.x, this.y, bounceAngle);
                
                // 대시 참조점 저장 (시각적 지연 효과용)
                const bounceStartX = this.x;
                const bounceStartY = this.y;
                
                // 0.4초 동안 튕김 상태 유지
                this.scene.time.delayedCall(100, () => {
                    if (this.active) {
                        // 유도미사일 노란색 트레일 효과 제거 (사용자 요청)
                        // this.createBounceTrailEffect(bounceStartX, bounceStartY, this.x, this.y);
                    }
                });
                
                // 0.4초 후 서서히 정상 속도로 복귀
                this.scene.time.delayedCall(400, () => {
                    if (this.active && (this.state === 'SEEKING' || this.state === 'BOUNCING')) {
                        this.currentSpeed = this.speedMin;
                    }
                });
            }
            
            // 배회 모드 진입
            enterWanderingMode() {
                this.state = 'WANDERING';
                this.wanderingTime = 0;
                this.targetingDelay = 0;
                this.hasFoundNewTarget = false;
                this.newTarget = null;
                
                // 배회 중심점 설정 (현재 위치)
                this.wanderingBaseX = this.x;
                this.wanderingBaseY = this.y;
                this.lemniscatePhase = Math.random() * Math.PI * 2; // 랜덤 시작 위상
                
                console.log(`🌀 미사일 배회 모드 진입: (${Math.round(this.x)}, ${Math.round(this.y)})`);
            }
            
            // Lemniscate (∞자 궤적) 배회 패턴
            updateWanderingMovement(delta) {
                const dt = delta / 1000;
                this.wanderingTime += dt;
                
                // ∞자 궤적 계산 (Lemniscate of Bernoulli)
                this.lemniscatePhase += dt * 2; // 위상 증가 속도
                const t = this.lemniscatePhase;
                
                // x = a*cos(t)/(1+sin²(t)), y = a*cos(t)*sin(t)/(1+sin²(t))
                const sinT = Math.sin(t);
                const cosT = Math.cos(t);
                const denominator = 1 + sinT * sinT;
                
                const lemniscateX = this.lemniscateScale * cosT / denominator;
                const lemniscateY = this.lemniscateScale * cosT * sinT / denominator;
                
                // 목표 위치 계산
                const targetX = this.wanderingBaseX + lemniscateX;
                const targetY = this.wanderingBaseY + lemniscateY;
                
                // 목표를 향한 부드럽지만 눈에 띄는 이동
                const desiredAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
                const currentAngle = this.body.velocity.angle();
                const nextAngle = Phaser.Math.Angle.RotateTo(currentAngle, desiredAngle, this.turnRate * dt * 0.9); // 조금 더 민첩하게
                
                // 배회 중에도 적당한 속도 유지 (더 역동적)
                const baseSpeed = this.speedMin * 0.9;
                const speedVariation = Math.sin(this.lemniscatePhase * 0.5) * 30; // 속도 변화
                const wanderingSpeed = baseSpeed + speedVariation;
                this.scene.physics.velocityFromRotation(nextAngle, wanderingSpeed, this.body.velocity);
                this.rotation = nextAngle;
                
                // 새로운 타겟 탐색 (0.5초마다)
                if (Math.floor(this.wanderingTime * 2) > Math.floor((this.wanderingTime - dt) * 2)) {
                    this.searchForNewTarget();
                }
                
                // 4초 타임아웃 체크
                if (this.wanderingTime > this.wanderingTimeout / 1000) {
                    console.log('⏱️ 배회 타임아웃 → 미사일 소멸');
                    this.destroyMissile();
                }
            }
            
            // 새로운 타겟 탐색 (2초 딜레이 시스템 포함)
            searchForNewTarget() {
                if (this.hasFoundNewTarget) {
                    // 이미 타겟을 찾은 상태에서 2초 딜레이 처리
                    this.targetingDelay += 500; // 0.5초씩 증가
                    
                    if (this.targetingDelay >= this.targetingDelayDuration) {
                        console.log(`🎯 2초 딜레이 완료 → 새 타겟 공격 시작: ${this.newTarget.enemyType || 'unknown'}`);
                        this.target = this.newTarget;
                        this.state = 'SEEKING';
                        this.wanderingTime = 0;
                        this.targetingDelay = 0;
                        this.hasFoundNewTarget = false;
                        this.newTarget = null;
                    }
                    return;
                }
                
                // 새로운 타겟 탐색
                const nearbyEnemies = this.scene.enemies.children.entries.filter(enemy => {
                    if (!enemy.active || this.visitedTargets.has(enemy)) return false;
                    
                    const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                    return distance <= 300; // 300px 반경 내
                });
                
                if (nearbyEnemies.length > 0) {
                    // 가장 가까운 적 선택
                    const closestEnemy = nearbyEnemies.reduce((closest, enemy) => {
                        const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                        const closestDistance = Phaser.Math.Distance.Between(this.x, this.y, closest.x, closest.y);
                        return distance < closestDistance ? enemy : closest;
                    });
                    
                    console.log(`🔍 배회 중 새 타겟 발견: ${closestEnemy.enemyType || 'unknown'} → 2초 후 공격 시작`);
                    this.newTarget = closestEnemy;
                    this.hasFoundNewTarget = true;
                    this.targetingDelay = 0;
                }
            }
        };
        
        // MissileSkillManager 클래스 인라인 구현
        this.MissileSkillManager = class MissileSkillManager {
            constructor(gameScene) {
                this.scene = gameScene;
                this.launchStack = 0;
                this.bounceStack = 0;
                this.launchCooldown = 3000;
                this.isActive = false;
                this.lastLaunchTime = 0;
                
                this.setupLaunchTimer();
            }
            
            setupLaunchTimer() {
                this.launchTimer = this.scene.time.addEvent({
                    delay: this.launchCooldown,
                    callback: () => this.attemptLaunch(),
                    loop: true
                });
            }
            
            updateStacks(launchStack, bounceStack) {
                this.launchStack = Math.min(launchStack, 10);
                this.bounceStack = Math.min(bounceStack, 3);
                this.isActive = this.launchStack > 0;
            }
            
            attemptLaunch() {
                if (!this.isActive || this.launchStack <= 0) return;
                
                if (!this.scene.player || !this.scene.player.active || this.scene.isSkillSelectionActive) {
                    return;
                }
                
                const targets = this.findLaunchTargets();
                if (targets.length === 0) return;
                
                this.executeLaunch(targets);
                this.lastLaunchTime = Date.now();
            }
            
            findLaunchTargets() {
                const playerX = this.scene.player.x;
                const playerY = this.scene.player.y;
                const searchRange = 400;
                
                const nearbyEnemies = this.scene.enemies.children.entries.filter(enemy => {
                    if (!enemy.active) return false;
                    
                    const distance = Phaser.Math.Distance.Between(
                        playerX, playerY, enemy.x, enemy.y
                    );
                    
                    return distance <= searchRange;
                });
                
                nearbyEnemies.sort((a, b) => {
                    const distA = Phaser.Math.Distance.Between(playerX, playerY, a.x, a.y);
                    const distB = Phaser.Math.Distance.Between(playerX, playerY, b.x, b.y);
                    return distA - distB;
                });
                
                return nearbyEnemies;
            }
            
            executeLaunch(targets) {
                const launchCount = Math.min(this.launchStack, targets.length, 10);
                const playerX = this.scene.player.x;
                const playerY = this.scene.player.y;
                
                for (let i = 0; i < launchCount; i++) {
                    const target = targets[i % targets.length];
                    
                    // 각 타겟에 대해 2개의 미사일을 발사 (듀얼 미사일 시스템)
                    for (let dualIndex = 0; dualIndex < 2; dualIndex++) {
                        const angle = (i / launchCount) * Math.PI * 2;
                        const dualOffset = (dualIndex - 0.5) * 25; // 좌우로 약간 간격을 둠
                        const offsetDistance = 20;
                        const launchX = playerX + Math.cos(angle) * offsetDistance + Math.cos(angle + Math.PI/2) * dualOffset;
                        const launchY = playerY + Math.sin(angle) * offsetDistance + Math.sin(angle + Math.PI/2) * dualOffset;
                        
                        const delay = i * 50 + dualIndex * 100; // 듀얼 미사일 간격
                        this.scene.time.delayedCall(delay, () => {
                            const missile = this.scene.missilePool.get(launchX, launchY);
                            if (missile) {
                                const success = missile.launch(target, this.bounceStack);
                                if (success) {
                                    this.createLaunchEffect(launchX, launchY, target.x, target.y);
                                }
                            }
                        });
                    }
                }
                
                this.scene.showAutoSkillText(`듀얼 미사일 발사! ${launchCount}×2발`);
            }
            
            createLaunchEffect(x, y, targetX, targetY) {
                const smoke = this.scene.add.circle(x, y, 10, 0x666666, 0.4);
                
                this.scene.tweens.add({
                    targets: smoke,
                    scaleX: 2,
                    scaleY: 2,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => smoke.destroy()
                });
                
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
            
            cleanup() {
                if (this.launchTimer) {
                    this.launchTimer.destroy();
                    this.launchTimer = null;
                }
            }
        };
    }
    
    // 미사일 스킬 업데이트
    updateMissileStacks() {
        if (!this.missileSkillManager) return;
        
        const launchStack = this.skillSystem.skillStacks.get('guided_missile') || 0;
        this.missileSkillManager.updateStacks(launchStack, 0); // bouncing_missile 스킬 제거됨
    }
    
    // 미사일 스킬 처리
    handleMissileSkills(skill) {
        if (skill.effect && skill.effect.action === 'activate_guided_missile') {
            this.updateMissileStacks();
            return true;
        } else if (skill.effect && skill.effect.action === 'enhance_missile_bounce') {
            this.updateMissileStacks();
            return true;
        }
        return false;
    }

    createGridBackground() {
        // 블루프린트 스타일 격자 배경
        this.gridGraphics = this.add.graphics();
        this.gridGraphics.lineStyle(1, 0x1a2a3a, 0.6); // 어두운 청색, 60% 투명도
        
        const gridSize = 100; // 격자 크기
        const lineWidth = this.worldWidth;
        const lineHeight = this.worldHeight;
        
        // 세로 격자선
        for (let x = 0; x <= this.worldWidth; x += gridSize) {
            this.gridGraphics.moveTo(x, 0);
            this.gridGraphics.lineTo(x, this.worldHeight);
        }
        
        // 가로 격자선
        for (let y = 0; y <= this.worldHeight; y += gridSize) {
            this.gridGraphics.moveTo(0, y);
            this.gridGraphics.lineTo(this.worldWidth, y);
        }
        
        this.gridGraphics.strokePath();
        
        // 더 두꺼운 메인 격자선 (500px 간격)
        this.gridGraphics.lineStyle(2, 0x2a4a5a, 0.8);
        
        for (let x = 0; x <= this.worldWidth; x += 500) {
            this.gridGraphics.moveTo(x, 0);
            this.gridGraphics.lineTo(x, this.worldHeight);
        }
        
        for (let y = 0; y <= this.worldHeight; y += 500) {
            this.gridGraphics.moveTo(0, y);
            this.gridGraphics.lineTo(this.worldWidth, y);
        }
        
        this.gridGraphics.strokePath();
        this.gridGraphics.setDepth(-1); // 배경으로 설정
    }

    createModernAbilityUI(x, y, size, color, keyText) {
        // 배경 원 (다크 테마)
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a1a, 0.8);
        bg.fillCircle(x, y, size);
        bg.lineStyle(2, 0x333333, 0.6);
        bg.strokeCircle(x, y, size);
        
        // 진행률 원 (비활성화 상태)
        const progress = this.add.graphics();
        progress.x = x;
        progress.y = y;
        
        // 키 텍스트 (중앙 배치)
        const icon = this.add.text(x, y, keyText, {
            fontSize: `${Math.floor(size * 0.6)}px`,
            color: color,
            fontWeight: '600'
        }).setOrigin(0.5, 0.5);
        
        return { bg, progress, icon, size, color };
    }

    createUI() {
        // 중앙 생존시간 UI
        this.survivalTimeDisplay = this.add.text(400, 50, '00:00', {
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            fontWeight: 'bold'
        }).setOrigin(0.5).setScrollFactor(0);
        
        // 생존시간 배경
        this.survivalBg = this.add.rectangle(400, 50, 200, 60, 0x000000, 0.7).setScrollFactor(0);
        this.survivalBg.setStrokeStyle(2, 0xffffff);
        this.survivalTimeDisplay.setDepth(1);
        
        // 점수
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0);
        
        // 난이도
        this.difficultyText = this.add.text(16, 46, 'Wave: 1', {
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0);
        
        // 총알 개수 표시
        this.bulletCountText = this.add.text(16, 76, 'Bullets: 1', {
            fontSize: '18px',
            color: '#FFD54F',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0);
        
        // 체력 하트
        this.healthDisplay = [];
        for (let i = 0; i < this.maxPlayerHealth; i++) {
            const heart = this.add.text(650 + i * 30, 16, '♥', {
                fontSize: '24px',
                color: '#ff0000'
            }).setScrollFactor(0);
            this.healthDisplay.push(heart);
        }
        
        // 현대적인 능력 UI 컨테이너 - 같은 라인 배치
        const abilityContainer = this.add.container(590, 60).setScrollFactor(0);
        
        // 대쉬 능력 UI - 하나로 통일
        const dashUI = this.createModernAbilityUI(0, 0, 28, '#00BCD4', 'D');
        abilityContainer.add([dashUI.bg, dashUI.progress, dashUI.icon]);
        this.dashUI = dashUI;
        
        // 대쉬 카운터 텍스트
        this.dashCountText = this.add.text(590, 85, '3', {
            fontSize: '16px',
            color: '#00BCD4',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold'
        }).setScrollFactor(0).setOrigin(0.5);
        
        // 에너지 웨이브 능력 UI - 같은 크기, 같은 라인
        const waveUI = this.createModernAbilityUI(80, 0, 28, '#4a90e2', '⚡');
        abilityContainer.add([waveUI.bg, waveUI.progress, waveUI.icon]);
        this.energyWaveUI = waveUI;
        
        // 현대적이고 깔끔한 능력 설명
        this.add.text(680, 55, 'DASH', {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold'
        }).setScrollFactor(0);
        
        this.add.text(680, 70, 'Click', {
            fontSize: '10px',
            color: '#aaaaaa',
            fontFamily: 'Arial, sans-serif'
        }).setScrollFactor(0);
        
        this.add.text(740, 55, 'ENERGY BURST', {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold'
        }).setScrollFactor(0);
        
        this.add.text(740, 70, 'Space', {
            fontSize: '10px',
            color: '#aaaaaa',
            fontFamily: 'Arial, sans-serif'
        }).setScrollFactor(0);
        
        // 대쉬 안내 텍스트
        this.add.text(16, 106, 'Click to Dash (Super Long!)', {
            fontSize: '14px',
            color: '#aaaaaa',
            stroke: '#000000',
            strokeThickness: 1
        }).setScrollFactor(0);
        
        // UI 바들의 배경
        this.uiBackground = this.add.rectangle(400, 565, 780, 70, 0x000000, 0.7).setScrollFactor(0);
        this.uiBackground.setStrokeStyle(2, 0x333333);
        
        // 경험치 바 배경  
        this.expBarBg = this.add.rectangle(200, 575, 350, 20, 0x444444).setScrollFactor(0);
        this.expBarBg.setStrokeStyle(2, 0xaaaaaa);
        
        // 경험치 바
        this.expBar = this.add.rectangle(25, 575, 0, 16, 0x0088ff).setScrollFactor(0);
        this.expBar.setOrigin(0, 0.5);
        
        // 경험치 텍스트
        this.expText = this.add.text(570, 575, '0/100 EXP', {
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setScrollFactor(0);
        
        // 배리어 상태 표시 (왼쪽 하단)
        this.barrierText = this.add.text(16, 550, 'Barriers: 0', {
            fontSize: '16px',
            color: '#00aaff',
            stroke: '#000000',
            strokeThickness: 1,
            fontWeight: 'bold'
        }).setScrollFactor(0);
    }

    onPointerDown(pointer) {
        // 스킬 선택 중이면 대쉬 차단
        if (this.isSkillSelectionActive) return;
        
        if (this.isDashing || this.dashCharges <= 0) return;
        
        // 월드 좌표로 변환
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        
        // 플레이어에서 클릭 위치로의 방향 계산
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        
        this.performDash(angle);
    }

    performDash(angle) {
        this.isDashing = true;
        this.dashCharges -= 1;
        
        // 대쉬 쿨다운 설정
        for (let i = 0; i < 3; i++) {
            if (this.dashCooldowns[i] <= 0) {
                this.dashCooldowns[i] = this.dashCooldown;
                break;
            }
        }
        
        // 시작 위치 저장
        const startX = this.player.x;
        const startY = this.player.y;
        
        // 목표 위치 계산 (즉시 이동할 거리)
        const dashDistance = 400; // 더 짧고 정확한 거리
        const targetX = startX + Math.cos(angle) * dashDistance;
        const targetY = startY + Math.sin(angle) * dashDistance;
        
        // 월드 경계 내로 제한
        const clampedTargetX = Phaser.Math.Clamp(targetX, 50, this.worldWidth - 50);
        const clampedTargetY = Phaser.Math.Clamp(targetY, 50, this.worldHeight - 50);
        
        // 번개 이펙트 생성 (시작점에서 목표점까지)
        this.createInstantLightningEffect(startX, startY, clampedTargetX, clampedTargetY);
        
        // 강력한 화면 플래시
        const flashRect = this.add.rectangle(400, 300, 800, 600, 0xffffff, 1.0).setScrollFactor(0);
        this.tweens.add({
            targets: flashRect,
            alpha: 0,
            duration: 100,
            onComplete: () => flashRect.destroy()
        });
        
        // 즉시 위치 이동 (파팟!)
        this.player.setPosition(clampedTargetX, clampedTargetY);
        this.player.setVelocity(0, 0); // 속도 0으로 초기화
        
        // 강력한 화면 흔들림
        this.cameras.main.shake(300, 0.06);
        
        // 시원한 잔상 효과
        this.createInstantDashTrail(startX, startY, clampedTargetX, clampedTargetY);
        
        // 플레이어 강조 효과
        this.player.setTint(0x00ffff);
        this.player.setAlpha(0.8);
        this.player.setScale(1.3);
        
        // 착지 폭발 효과
        this.createExplosion(clampedTargetX, clampedTargetY);
        
        // 대쉬 스킬 효과 발동
        this.triggerDashSkillEffects(startX, startY, clampedTargetX, clampedTargetY, angle);
        
        // 대쉬 효과 지속 시간 (200ms로 단축)
        this.time.delayedCall(200, () => {
            this.isDashing = false;
            if (this.player.active) {
                this.player.setTint(0xffffff);
                this.player.setAlpha(1);
                this.player.setScale(1);
                
                // 버그 수정: 완전한 물리 상태 복구
                this.restorePlayerPhysics();
            }
        });
    }

    createInstantLightningEffect(startX, startY, endX, endY) {
        // 직선 번개 (즉시 이동이므로)
        const lightning = this.add.graphics();
        lightning.lineStyle(12, 0x00ffff, 1);
        lightning.moveTo(startX, startY);
        lightning.lineTo(endX, endY);
        lightning.strokePath();
        
        // 번개 외곽선
        const outerLightning = this.add.graphics();
        outerLightning.lineStyle(20, 0xffffff, 0.6);
        outerLightning.moveTo(startX, startY);
        outerLightning.lineTo(endX, endY);
        outerLightning.strokePath();
        
        // 번개 사라지는 효과
        this.tweens.add({
            targets: [lightning, outerLightning],
            alpha: 0,
            duration: 150,
            onComplete: () => {
                lightning.destroy();
                outerLightning.destroy();
            }
        });
    }

    createInstantDashTrail(startX, startY, endX, endY) {
        // 시작점에서 끝점까지의 잔상들
        const trailCount = 8;
        for (let i = 0; i < trailCount; i++) {
            const progress = i / (trailCount - 1);
            const trailX = startX + (endX - startX) * progress;
            const trailY = startY + (endY - startY) * progress;
            
            const trail = this.add.sprite(trailX, trailY, 'player');
            trail.setTint(0x00ffff);
            trail.setAlpha(0.8 - (i * 0.1));
            trail.setScale(1.2 - (i * 0.1));
            
            this.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0.3,
                duration: 300 + (i * 50),
                onComplete: () => trail.destroy()
            });
        }
    }

    createLightningEffect(angle) {
        // 번개 경로 생성
        const startX = this.player.x;
        const startY = this.player.y;
        const endX = startX + Math.cos(angle) * this.dashDistance;
        const endY = startY + Math.sin(angle) * this.dashDistance;
        
        const lightning = this.add.graphics();
        lightning.lineStyle(8, 0x00ffff, 1);
        lightning.moveTo(startX, startY);
        
        // 지그재그 번개 경로
        const segments = 12;
        for (let i = 1; i <= segments; i++) {
            const progress = i / segments;
            const baseX = startX + (endX - startX) * progress;
            const baseY = startY + (endY - startY) * progress;
            
            // 번개의 지그재그 효과
            const zigzag = Math.sin(progress * Math.PI * 6) * 30 * (1 - progress * 0.5);
            const perpAngle = angle + Math.PI / 2;
            const zigzagX = baseX + Math.cos(perpAngle) * zigzag;
            const zigzagY = baseY + Math.sin(perpAngle) * zigzag;
            
            lightning.lineTo(zigzagX, zigzagY);
        }
        
        lightning.strokePath();
        
        // 번개 사라지는 효과
        this.tweens.add({
            targets: lightning,
            alpha: 0,
            duration: 300,
            onComplete: () => lightning.destroy()
        });
        
        // 추가 번개 줄기들
        for (let branch = 0; branch < 3; branch++) {
            this.time.delayedCall(branch * 50, () => {
                const branchLightning = this.add.graphics();
                branchLightning.lineStyle(4, 0x88ffff, 0.8);
                
                const branchProgress = 0.3 + branch * 0.2;
                const branchStartX = startX + (endX - startX) * branchProgress;
                const branchStartY = startY + (endY - startY) * branchProgress;
                
                const branchAngle = angle + (Math.random() - 0.5) * Math.PI * 0.5;
                const branchLength = 150;
                const branchEndX = branchStartX + Math.cos(branchAngle) * branchLength;
                const branchEndY = branchStartY + Math.sin(branchAngle) * branchLength;
                
                branchLightning.moveTo(branchStartX, branchStartY);
                branchLightning.lineTo(branchEndX, branchEndY);
                branchLightning.strokePath();
                
                this.tweens.add({
                    targets: branchLightning,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => branchLightning.destroy()
                });
            });
        }
    }

    createLightningGhosts() {
        const ghostCount = 25; // 더 많은 잔상
        const ghostInterval = 15;
        
        for (let i = 0; i < ghostCount; i++) {
            this.time.delayedCall(i * ghostInterval, () => {
                if (this.isDashing && this.player.active) {
                    const ghost = this.add.sprite(this.player.x, this.player.y, 'player');
                    ghost.setTint(0x00ffff);
                    ghost.setAlpha(0.9 - (i * 0.03));
                    ghost.setScale(1.5 - (i * 0.04));
                    
                    this.tweens.add({
                        targets: ghost,
                        alpha: 0,
                        scale: 0.2,
                        duration: 400,
                        onComplete: () => {
                            ghost.destroy();
                        }
                    });
                }
            });
        }
    }

    createDashGhosts() {
        // 기존 함수는 createLightningGhosts로 대체됨
        this.createLightningGhosts();
    }

    updateDashCooldowns() {
        let availableCharges = 0;
        
        for (let i = 0; i < 3; i++) {
            if (this.dashCooldowns[i] > 0) {
                this.dashCooldowns[i] -= 100;
            }
            if (this.dashCooldowns[i] <= 0) {
                availableCharges++;
            }
        }
        
        this.dashCharges = Math.min(availableCharges, this.maxDashCharges);
    }

    spawnBulletUpgrade() {
        // 스킬 선택 중이면 스폰 차단
        if (this.isSkillSelectionActive) return;
        
        // 매우 낮은 확률로 스폰 (30% 확률)
        if (Math.random() > 0.3) return;
        
        // 플레이어로부터 멀리 스폰
        const spawnRadius = 800;
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(spawnRadius, spawnRadius + 300);
        
        const x = this.player.x + Math.cos(angle) * distance;
        const y = this.player.y + Math.sin(angle) * distance;
        
        // 월드 경계 내에서만 스폰
        const clampedX = Phaser.Math.Clamp(x, 50, this.worldWidth - 50);
        const clampedY = Phaser.Math.Clamp(y, 50, this.worldHeight - 50);
        
        const bulletUpgrade = this.physics.add.sprite(clampedX, clampedY, 'bullet_upgrade');
        bulletUpgrade.setScale(1.2);
        bulletUpgrade.fleeSpeed = 150; // 도망 속도
        bulletUpgrade.detectionRange = 200; // 플레이어 감지 범위
        
        // 반짝이는 효과
        this.tweens.add({
            targets: bulletUpgrade,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        this.bulletUpgrades.add(bulletUpgrade);
    }

    trySpawnEliteMonster() {
        // 엘리트 몬스터 수 제한 체크
        if (this.currentEliteCount >= this.maxEliteCount) {
            return;
        }
        
        // 높은 확률로 엘리트 몬스터 스폰
        if (Math.random() < this.eliteSpawnChance) {
            // 50% 확률로 일반 엘리트 또는 스타 엘리트 스폰
            if (Math.random() < 0.5) {
                this.spawnEliteMonster();
            } else {
                this.spawnStarEliteMonster();
            }
        }
    }

    spawnEliteMonster() {
        // 스킬 선택 중이면 스폰 차단
        if (this.isSkillSelectionActive) return;
        
        // 플레이어로부터 멀리 스폰
        const spawnRadius = 1000;
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(spawnRadius, spawnRadius + 400);
        
        const x = this.player.x + Math.cos(angle) * distance;
        const y = this.player.y + Math.sin(angle) * distance;
        
        // 월드 경계 내에서만 스폰
        const clampedX = Phaser.Math.Clamp(x, 100, this.worldWidth - 100);
        const clampedY = Phaser.Math.Clamp(y, 100, this.worldHeight - 100);
        
        const eliteMonster = this.physics.add.sprite(clampedX, clampedY, 'elite_monster');
        eliteMonster.enemyType = 'elite_monster';
        eliteMonster.health = 100; // 2배 증가: 50 → 100
        eliteMonster.maxHealth = eliteMonster.health;
        eliteMonster.speed = this.baseEnemySpeed * 0.3; // 느린 속도
        eliteMonster.isHit = false;
        eliteMonster.isFlashing = false;
        eliteMonster.knockbackX = 0;
        eliteMonster.knockbackY = 0;
        eliteMonster.isElite = true;
        
        // 엘리트 몬스터는 더 큰 바디 사이즈
        eliteMonster.setScale(1.0);
        eliteMonster.body.setSize(100, 100);
        
        // 반짝이는 효과
        this.tweens.add({
            targets: eliteMonster,
            alpha: 0.7,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
        
        // 체력 바 생성
        this.createEliteHealthBar(eliteMonster);
        
        this.enemies.add(eliteMonster);
        this.currentEliteCount++;
        
        // Elite monster spawned
    }
    
    spawnPentagonMonster() {
        // 스킬 선택 중이면 스폰 차단
        if (this.isSkillSelectionActive) return;
        
        // 플레이어로부터 멀리 스폰 (엘리트보다는 가까이)
        const spawnRadius = 500;
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(spawnRadius, spawnRadius + 200);
        
        const x = this.player.x + Math.cos(angle) * distance;
        const y = this.player.y + Math.sin(angle) * distance;
        
        // 월드 경계 내에서만 스폰
        const clampedX = Phaser.Math.Clamp(x, 80, this.worldWidth - 80);
        const clampedY = Phaser.Math.Clamp(y, 80, this.worldHeight - 80);
        
        const pentagonMonster = this.physics.add.sprite(clampedX, clampedY, 'pentagon_monster');
        pentagonMonster.enemyType = 'pentagon_monster';
        pentagonMonster.health = 16; // 2배 증가: 8 → 16
        pentagonMonster.maxHealth = pentagonMonster.health;
        pentagonMonster.speed = this.baseEnemySpeed * 0.6; // 느린 속도
        pentagonMonster.isHit = false;
        pentagonMonster.isFlashing = false;
        pentagonMonster.knockbackX = 0;
        pentagonMonster.knockbackY = 0;
        pentagonMonster.isPentagon = true;
        
        // 오각형 몬스터 특별 속성
        pentagonMonster.orbitAngle = Phaser.Math.FloatBetween(0, Math.PI * 2); // 랜덤한 시작 각도
        pentagonMonster.orbitRadius = 250; // 공전 반지름
        pentagonMonster.orbitSpeed = 1.5; // 공전 속도
        pentagonMonster.lastShot = this.time.now; // 현재 시간으로 초기화
        pentagonMonster.shootInterval = 2500; // 2.5초마다 발사
        pentagonMonster.rotationSpeed = 0.02; // 회전 속도
        
        // 크기 조정
        pentagonMonster.setScale(1.0);
        pentagonMonster.body.setSize(32, 32);
        
        this.enemies.add(pentagonMonster);
        this.pentagonCount++;
        
        // Pentagon monster spawned
    }
    
    spawnStarEliteMonster() {
        // 스킬 선택 중이면 스폰 차단
        if (this.isSkillSelectionActive) return;
        
        // 플레이어로부터 멀리 스폰
        const spawnRadius = 1000;
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(spawnRadius, spawnRadius + 400);
        
        const x = this.player.x + Math.cos(angle) * distance;
        const y = this.player.y + Math.sin(angle) * distance;
        
        // 월드 경계 내에서만 스폰
        const clampedX = Phaser.Math.Clamp(x, 100, this.worldWidth - 100);
        const clampedY = Phaser.Math.Clamp(y, 100, this.worldHeight - 100);
        
        const starEliteMonster = this.physics.add.sprite(clampedX, clampedY, 'star_elite_monster');
        starEliteMonster.enemyType = 'star_elite_monster';
        starEliteMonster.health = 90; // 2배 증가: 45 → 90
        starEliteMonster.maxHealth = starEliteMonster.health;
        starEliteMonster.speed = this.baseEnemySpeed * 0.4; // 느린 기본 속도
        starEliteMonster.isHit = false;
        starEliteMonster.isFlashing = false;
        starEliteMonster.knockbackX = 0;
        starEliteMonster.knockbackY = 0;
        starEliteMonster.isElite = true;
        starEliteMonster.isStarElite = true;
        
        // 대시 시스템
        starEliteMonster.isDashing = false;
        starEliteMonster.dashSpeed = 800; // 빠른 대시 속도
        starEliteMonster.lastDash = this.time.now;
        starEliteMonster.dashCooldown = Phaser.Math.Between(3000, 10000); // 3-10초 랜덤
        starEliteMonster.dashDuration = 300; // 0.3초 대시
        starEliteMonster.dashDirection = { x: 0, y: 0 };
        
        // 크기 조정
        starEliteMonster.setScale(0.8);
        starEliteMonster.body.setSize(80, 80);
        
        // 반짝이는 효과
        this.tweens.add({
            targets: starEliteMonster,
            alpha: 0.7,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        // 체력 바 생성
        this.createEliteHealthBar(starEliteMonster, 'STAR ELITE');
        
        this.enemies.add(starEliteMonster);
        this.currentEliteCount++;
        
        // Star elite monster spawned
    }

    createEliteHealthBar(elite, label = 'ELITE') {
        // 체력 바 배경
        const healthBarBg = this.add.rectangle(elite.x, elite.y - 80, 120, 12, 0x660000);
        healthBarBg.setStrokeStyle(2, 0xffffff);
        
        // 체력 바
        const healthBar = this.add.rectangle(elite.x - 60, elite.y - 80, 0, 8, 0xff0000);
        healthBar.setOrigin(0, 0.5);
        
        // 엘리트 이름 태그
        const nameTag = this.add.text(elite.x, elite.y - 100, label, {
            fontSize: '14px',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 2,
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        elite.healthBarBg = healthBarBg;
        elite.healthBar = healthBar;
        elite.nameTag = nameTag;
    }

    update(time, delta) {
        // L키로 레벨업 치트 (테스트용)
        if (Phaser.Input.Keyboard.JustDown(this.lKey)) {
            this.levelUp();
        }
        
        // M키로 미사일 발사 테스트 (디버깅용)
        if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
            this.testMissileFire();
        }
        
        // 스킬 선택 중이면 게임 로직 실행 중단
        if (this.isSkillSelectionActive) {
            return;
        }
        
        this.movePlayer(delta);
        this.fireWeapon(time);
        this.handleLightningWave(time);
        this.moveEnemies(delta);
        this.moveBullets();
        this.moveEnemyBullets();
        this.moveEnergy();
        this.moveBulletUpgrades(delta);
        this.updateExplosions();
        this.updateUI();
    }

    moveBulletUpgrades(delta) {
        this.bulletUpgrades.children.entries.forEach(upgrade => {
            if (upgrade.active) {
                const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, upgrade.x, upgrade.y);
                
                // 플레이어가 감지 범위에 들어오면 도망
                if (distance < upgrade.detectionRange) {
                    const fleeAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, upgrade.x, upgrade.y);
                    const velocityX = Math.cos(fleeAngle) * upgrade.fleeSpeed;
                    const velocityY = Math.sin(fleeAngle) * upgrade.fleeSpeed;
                    upgrade.setVelocity(velocityX, velocityY);
                } else {
                    // 천천히 랜덤하게 움직임
                    const randomAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                    const randomSpeed = 30;
                    const velocityX = Math.cos(randomAngle) * randomSpeed;
                    const velocityY = Math.sin(randomAngle) * randomSpeed;
                    upgrade.setVelocity(velocityX, velocityY);
                }
                
                // 월드 경계에서 튕김
                if (upgrade.x < 50 || upgrade.x > this.worldWidth - 50) {
                    upgrade.setVelocityX(-upgrade.body.velocity.x);
                }
                if (upgrade.y < 50 || upgrade.y > this.worldHeight - 50) {
                    upgrade.setVelocityY(-upgrade.body.velocity.y);
                }
            }
        });
    }

    updateGameTime() {
        // 스킬 선택 중이면 게임 시간 업데이트 중지
        if (this.isSkillSelectionActive) return;
        
        this.gameTime += 1;
        
        // 20초마다 난이도 증가
        if (this.gameTime % 20 === 0) {
            // Wave starting
            this.increaseDifficulty();
        }
    }

    increaseDifficulty() {
        this.difficultyLevel += 1;
        
        // 스폰 속도 증가 (최소 400ms)
        this.enemySpawnRate = Math.max(400, 1200 - (this.difficultyLevel * 80));
        
        // 웨이브당 적 수 증가 (최대 4마리)
        this.enemiesPerWave = Math.min(4, Math.floor(this.difficultyLevel / 3) + 1);
        
        // 적 기본 속도 증가 (더욱 완만하게 조정 - 플레이어 요청)
        // 기본 속도 증가율 절반으로 감소
        if (this.difficultyLevel <= 15) {
            this.baseEnemySpeed = 100 + (this.difficultyLevel * 1.5); // 1.5씩 증가 (100 -> 122.5)
        } else {
            this.baseEnemySpeed = 145 + ((this.difficultyLevel - 15) * 2); // 2씩 증가
        }
        
        // 최대 속도 제한 (180까지만)
        this.baseEnemySpeed = Math.min(this.baseEnemySpeed, 180);
        
        // 5웨이브마다 오각형 몬스터 스폰
        if (this.difficultyLevel % this.pentagonWaveInterval === 0) {
            // Pentagon monster wave
            this.spawnPentagonMonster();
        }
        
        // 10웨이브 이후 엘리트 몬스터 최대 개수 증가
        if (this.difficultyLevel >= 10) {
            this.maxEliteCount = 2;
        }
        
        // 스폰 타이머 재설정
        this.enemySpawnTimer.destroy();
        this.enemySpawnTimer = this.time.addEvent({
            delay: this.enemySpawnRate,
            callback: this.spawnEnemyWave,
            callbackScope: this,
            loop: true
        });
        
        console.log(`Difficulty increased! Level: ${this.difficultyLevel}, Spawn rate: ${this.enemySpawnRate}ms, Enemies per wave: ${this.enemiesPerWave}`);
    }

    updateUI() {
        // 중앙 생존시간 업데이트
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;
        this.survivalTimeDisplay.setText(
            String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0')
        );
        
        this.difficultyText.setText('Wave: ' + this.difficultyLevel);
        this.bulletCountText.setText('Bullets: ' + this.bulletCount);
        
        // 체력 업데이트
        for (let i = 0; i < this.maxPlayerHealth; i++) {
            if (i < this.playerHealth) {
                this.healthDisplay[i].setColor('#ff0000');
                this.healthDisplay[i].setAlpha(1);
            } else {
                this.healthDisplay[i].setColor('#666666');
                this.healthDisplay[i].setAlpha(0.5);
            }
        }
        
        // 통합된 대쉬 능력 UI 업데이트
        const dashAbility = this.dashUI;
        const { progress: dashProgress, icon: dashIcon, size: dashSize, color: dashColor } = dashAbility;
        
        dashProgress.clear();
        
        // 대쉬 카운터 업데이트
        this.dashCountText.setText(this.dashCharges.toString());
        
        if (this.dashCharges > 0) {
            // 사용 가능 상태
            dashIcon.setColor(dashColor).setAlpha(1);
            this.dashCountText.setColor('#00BCD4').setAlpha(1);
            
            // 활성화된 외곽선
            dashProgress.lineStyle(3, Phaser.Display.Color.HexStringToColor(dashColor).color, 0.8);
            dashProgress.strokeCircle(0, 0, dashSize);
            
            // 내부 글로우 효과
            dashProgress.lineStyle(1, 0xffffff, 0.3);
            dashProgress.strokeCircle(0, 0, dashSize - 3);
            
        } else {
            // 모든 차지가 쿨다운 중
            const oldestCooldown = Math.max(...this.dashCooldowns);
            const cooldownProgress = Math.max(0, 1 - (oldestCooldown / this.dashCooldown));
            
            dashIcon.setColor('#666666').setAlpha(0.4 + (cooldownProgress * 0.6));
            this.dashCountText.setColor('#666666').setAlpha(0.5);
            
            // 진행률 호
            if (cooldownProgress > 0) {
                const startAngle = -Math.PI / 2;
                const endAngle = startAngle + (cooldownProgress * Math.PI * 2);
                
                dashProgress.lineStyle(4, Phaser.Display.Color.HexStringToColor(dashColor).color, 0.9);
                dashProgress.beginPath();
                dashProgress.arc(0, 0, dashSize, startAngle, endAngle);
                dashProgress.strokePath();
                
                dashProgress.lineStyle(2, 0xffffff, 0.4);
                dashProgress.beginPath();
                dashProgress.arc(0, 0, dashSize - 2, startAngle, endAngle);
                dashProgress.strokePath();
            }
        }
        
        // 현대적인 에너지 버스트 UI 업데이트
        const waveAbility = this.energyWaveUI;
        const { progress: waveProgress, icon: waveIcon, size: waveSize, color: waveColor } = waveAbility;
        
        waveProgress.clear();
        
        if (this.lightningWaveReady) {
            // 사용 가능 - 펄스 효과
            waveIcon.setColor(waveColor).setAlpha(1);
            
            // 활성화된 외곽선 (펄스 효과)
            const pulseAlpha = 0.6 + Math.sin(this.time.now * 0.008) * 0.2;
            waveProgress.lineStyle(4, Phaser.Display.Color.HexStringToColor(waveColor).color, pulseAlpha);
            waveProgress.strokeCircle(0, 0, waveSize);
            
            // 내부 글로우
            waveProgress.lineStyle(2, 0xffffff, 0.4);
            waveProgress.strokeCircle(0, 0, waveSize - 3);
            
        } else {
            // 쿨다운 중
            const currentTime = this.time.now;
            const elapsed = currentTime - this.lightningWaveLastUsed;
            const cooldownProgress = Math.max(0, elapsed / this.lightningWaveCooldown);
            
            waveIcon.setColor('#666666').setAlpha(0.4 + (cooldownProgress * 0.6));
            
            if (cooldownProgress > 0) {
                const startAngle = -Math.PI / 2;
                const endAngle = startAngle + (cooldownProgress * Math.PI * 2);
                
                // 메인 진행률 호 (더 두껍게)
                waveProgress.lineStyle(5, Phaser.Display.Color.HexStringToColor(waveColor).color, 0.9);
                waveProgress.beginPath();
                waveProgress.arc(0, 0, waveSize, startAngle, endAngle);
                waveProgress.strokePath();
                
                // 내부 하이라이트
                waveProgress.lineStyle(3, 0xffffff, 0.5);
                waveProgress.beginPath();
                waveProgress.arc(0, 0, waveSize - 2, startAngle, endAngle);
                waveProgress.strokePath();
            }
        }
        
        // 경험치 바 업데이트
        const expProgress = (this.experience / this.experienceToNext) * 350;
        this.expBar.width = Math.max(0, expProgress);
        this.expText.setText(`${this.experience}/${this.experienceToNext} EXP`);
        
        // 배리어 상태 업데이트
        if (this.barrierText) {
            const barriers = this.skillSystem.barrierCharges || 0;
            this.barrierText.setText(`Barriers: ${barriers}`);
            
            // 배리어가 있을 때 색상 변경
            if (barriers > 0) {
                this.barrierText.setColor('#00aaff');
                this.barrierText.setAlpha(1);
            } else {
                this.barrierText.setColor('#666666');
                this.barrierText.setAlpha(0.7);
            }
        }
    }

    movePlayer(delta) {
        if (this.isDashing) return;
        
        let accelerationX = 0;
        let accelerationY = 0;

        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            accelerationX = -this.playerAcceleration;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            accelerationX = this.playerAcceleration;
        }

        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            accelerationY = -this.playerAcceleration;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            accelerationY = this.playerAcceleration;
        }

        this.player.setAcceleration(accelerationX, accelerationY);
    }

    handleLightningWave(time) {
        // 쿨다운 업데이트
        if (!this.lightningWaveReady && time > this.lightningWaveLastUsed + this.lightningWaveCooldown) {
            this.lightningWaveReady = true;
        }
        
        // 스킬 선택 중이면 파동파 차단
        if (this.isSkillSelectionActive) return;
        
        // 스페이스바 입력 체크
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.lightningWaveReady) {
            this.performLightningWave();
            this.lightningWaveReady = false;
            this.lightningWaveLastUsed = time;
        }
    }

    performLightningWave() {
        // 스킬이 이미 활성 상태이면 중복 실행 방지
        if (this.isLightningWaveActive) {
            // Lightning wave already active, skipping
            return;
        }
        
        const playerX = this.player.x;
        const playerY = this.player.y;
        
        // Lightning wave activated
        
        // 스킬 사용 중 잠깐 무적 상태
        this.isLightningWaveActive = true;
        
        // 대쉬와 동일한 강력한 화면 플래시 효과
        const flashRect = this.add.rectangle(400, 300, 800, 600, 0xffffff, 1.0).setScrollFactor(0);
        this.tweens.add({
            targets: flashRect,
            alpha: 0,
            duration: 100,
            onComplete: () => flashRect.destroy()
        });
        
        // 원형 밀쳐내기 이펙트 애니메이션
        this.createPushWaveEffect(playerX, playerY);
        
        // 가벼운 화면 흔들림
        this.cameras.main.shake(200, 0.03);
        
        // 반경 내 적들을 즉시 넉백
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.active) {
                const distance = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
                
                if (distance <= this.lightningWaveRadius) {
                    const angle = Phaser.Math.Angle.Between(playerX, playerY, enemy.x, enemy.y);
                    
                    // 강화된 넉백력 - 더 멀리 밀쳐냄
                    const knockbackForce = 1400;
                    enemy.knockbackX = Math.cos(angle) * knockbackForce;
                    enemy.knockbackY = Math.sin(angle) * knockbackForce;
                    
                    // 약간의 데미지
                    enemy.health -= 0.5;
                    
                    // 간단한 피격 효과
                    enemy.setTint(0xffcccc);
                    this.time.delayedCall(200, () => {
                        if (enemy.active) {
                            enemy.clearTint();
                        }
                    });
                    
                    // 적이 죽었으면 처리
                    if (enemy.health <= 0) {
                        this.createExplosion(enemy.x, enemy.y);
                        const energyOrb = this.physics.add.sprite(enemy.x, enemy.y, 'energy');
                        this.energy.add(energyOrb);
                        enemy.destroy();
                        
                        const points = this.getEnemyPoints(enemy.enemyType);
                        this.score += points;
                    }
                }
            }
        });
        
        // 반경 내 적 총알도 제거
        this.enemyBullets.children.entries.forEach(bullet => {
            if (bullet.active) {
                const distance = Phaser.Math.Distance.Between(playerX, playerY, bullet.x, bullet.y);
                if (distance <= this.lightningWaveRadius) {
                    this.createExplosion(bullet.x, bullet.y);
                    bullet.destroy();
                }
            }
        });
        
        // 파동파 스킬 효과 발동
        this.triggerLightningWaveSkillEffects(playerX, playerY);
        
        // 0.3초 후 무적 해제
        this.time.delayedCall(300, () => {
            this.isLightningWaveActive = false;
        });
    }

    createPushWaveEffect(centerX, centerY) {
        // 단일 원형 파동 이펙트 - 깔끔하고 간단하게
        const waveRing = this.add.graphics();
        waveRing.x = centerX;
        waveRing.y = centerY;
        waveRing.lineStyle(8, 0xffffff, 0.9);
        waveRing.strokeCircle(0, 0, 30);
        
        // 파동 확산 애니메이션
        this.tweens.add({
            targets: waveRing,
            scaleX: 6,
            scaleY: 6,
            alpha: 0,
            duration: 400,
            ease: 'Power2.easeOut',
            onComplete: () => {
                if (waveRing.active) waveRing.destroy();
            }
        });
    }
    

    fireWeapon(time) {
        if (time > this.lastFired + this.fireRate) {
            const nearestEnemy = this.findNearestEnemyToPlayer();
            
            if (nearestEnemy && Phaser.Math.Distance.Between(
                this.player.x, this.player.y, 
                nearestEnemy.x, nearestEnemy.y
            ) <= this.fireRange) {
                
                // 총알 개수에 따른 발사 패턴
                const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, nearestEnemy.x, nearestEnemy.y);
                
                for (let i = 0; i < this.bulletCount; i++) {
                    let bulletAngle;
                    let offsetX = 0;
                    let offsetY = 0;
                    
                    if (this.bulletCount === 1) {
                        // 1발: 정확히 적을 향해
                        bulletAngle = baseAngle;
                    } else if (this.bulletCount === 2) {
                        // 2발: 같은 방향으로 촘촘하게 나란히
                        bulletAngle = baseAngle;
                        const sideOffset = (i === 0) ? -8 : 8; // 좌우로 8픽셀 간격
                        offsetX = Math.cos(baseAngle + Math.PI / 2) * sideOffset;
                        offsetY = Math.sin(baseAngle + Math.PI / 2) * sideOffset;
                    } else {
                        // 3발 이상: 촘촘한 방사형 패턴
                        const spreadAngle = Math.PI / 6; // 30도 전체 확산각 (이전보다 더 좁음)
                        const angleStep = spreadAngle / (this.bulletCount - 1);
                        const startAngle = baseAngle - spreadAngle / 2;
                        bulletAngle = startAngle + (i * angleStep);
                    }
                    
                    this.createBulletWithAngle(
                        this.player.x + offsetX, 
                        this.player.y + offsetY, 
                        bulletAngle
                    );
                }
                
                this.lastFired = time;
            }
        }
    }

    createBulletWithAngle(x, y, angle) {
        const bullet = this.physics.add.sprite(x, y, 'bullet');
        this.bullets.add(bullet);
        
        const velocityX = Math.cos(angle) * this.bulletSpeed;
        const velocityY = Math.sin(angle) * this.bulletSpeed;
        bullet.setVelocity(velocityX, velocityY);
    }

    createBullet(x, y, target) {
        const bullet = this.physics.add.sprite(x, y, 'bullet');
        this.bullets.add(bullet);
        
        const angle = Phaser.Math.Angle.Between(x, y, target.x, target.y);
        const velocityX = Math.cos(angle) * this.bulletSpeed;
        const velocityY = Math.sin(angle) * this.bulletSpeed;
        bullet.setVelocity(velocityX, velocityY);
    }

    spawnEnemyWave() {
        // 스킬 선택 중이면 스폰 차단
        if (this.isSkillSelectionActive) return;
        
        for (let i = 0; i < this.enemiesPerWave; i++) {
            this.time.delayedCall(i * 150, () => {
                // 스폰 시점에도 다시 체크
                if (this.isSkillSelectionActive) return;
                this.spawnEnemy();
            });
        }
    }

    spawnEnemy() {
        // 플레이어 주변 범위에서 스폰
        const spawnRadius = 600;
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(spawnRadius, spawnRadius + 200);
        
        const x = this.player.x + Math.cos(angle) * distance;
        const y = this.player.y + Math.sin(angle) * distance;
        
        // 월드 경계 내에서만 스폰
        const clampedX = Phaser.Math.Clamp(x, 50, this.worldWidth - 50);
        const clampedY = Phaser.Math.Clamp(y, 50, this.worldHeight - 50);
        
        // 적 속도 증가율 더욱 감소 (0.08 -> 0.04로 절반 감소 - 플레이어 요청)
        const difficultyMultiplier = 1 + (this.difficultyLevel * 0.04);
        const enemyTypes = ['enemy1', 'enemy2', 'enemy3'];
        const enemyType = enemyTypes[Phaser.Math.Between(0, 2)];
        
        const enemy = this.physics.add.sprite(clampedX, clampedY, enemyType);
        enemy.enemyType = enemyType;
        // 적 체력 점진적 증가 (Math.ceil 대신 부드럽게)
        const healthMultiplier = 1 + (this.difficultyLevel * 0.12); // 12% 점진적 증가
        enemy.health = Math.round(this.getEnemyHealth(enemyType) * healthMultiplier);
        enemy.maxHealth = enemy.health;
        enemy.speed = this.getEnemySpeed(enemyType) * (0.9 + Math.random() * 0.2) * difficultyMultiplier;
        enemy.isHit = false;
        enemy.isFlashing = false;
        enemy.knockbackX = 0;
        enemy.knockbackY = 0;
        
        this.enemies.add(enemy);
    }

    getEnemyHealth(type) {
        switch(type) {
            case 'enemy1': return 2;  // 2배 증가: 1 → 2
            case 'enemy2': return 4;  // 2배 증가: 2 → 4
            case 'enemy3': return 6;  // 2배 증가: 3 → 6
            case 'pentagon_monster': return 16; // 2배 증가: 8 → 16
            case 'elite_monster': return 100;   // 2배 증가: 50 → 100
            case 'star_elite_monster': return 90; // 2배 증가: 45 → 90
            default: return 2; // 기본값도 2배
        }
    }

    getEnemySpeed(type) {
        switch(type) {
            case 'enemy1': return this.baseEnemySpeed;
            case 'enemy2': return this.baseEnemySpeed * 1.3;
            case 'enemy3': return this.baseEnemySpeed * 0.8;
            case 'pentagon_monster': return this.baseEnemySpeed * 0.6;
            case 'elite_monster': return this.baseEnemySpeed * 1.3; // 더욱 빠르게
            case 'star_elite_monster': return this.baseEnemySpeed * 1.5; // 가장 빠르게
            default: return this.baseEnemySpeed;
        }
    }
    
    handlePentagonMovement(enemy, baseAngle, delta) {
        // 항상 회전
        enemy.rotation += enemy.rotationSpeed;
        
        // 플레이어와의 거리 계산
        const distanceToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        
        // 목표 거리에 따른 이동 결정
        const targetDistance = enemy.orbitRadius;
        const distanceDiff = distanceToPlayer - targetDistance;
        
        if (Math.abs(distanceDiff) > 50) {
            // 목표 거리와 차이가 클 때는 플레이어 쪽으로/멀어지는 방향으로 이동
            if (distanceDiff > 0) {
                // 너무 가까우면 멀어지기
                const escapeAngle = baseAngle + Math.PI; // 반대 방향
                enemy.setVelocity(
                    Math.cos(escapeAngle) * enemy.speed * 0.8,
                    Math.sin(escapeAngle) * enemy.speed * 0.8
                );
            } else {
                // 너무 멀면 접근하기
                enemy.setVelocity(
                    Math.cos(baseAngle) * enemy.speed * 0.8,
                    Math.sin(baseAngle) * enemy.speed * 0.8
                );
            }
        } else {
            // 적절한 거리에서는 원을 그리며 공전
            enemy.orbitAngle += enemy.orbitSpeed * 0.01;
            
            // 공전 중심점 (플레이어 위치)
            const orbitX = this.player.x + Math.cos(enemy.orbitAngle) * targetDistance;
            const orbitY = this.player.y + Math.sin(enemy.orbitAngle) * targetDistance;
            
            // 공전 궤도를 향해 이동
            const orbitAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, orbitX, orbitY);
            enemy.setVelocity(
                Math.cos(orbitAngle) * enemy.speed * 0.5,
                Math.sin(orbitAngle) * enemy.speed * 0.5
            );
        }
        
        // 넉백 효과 적용
        if (enemy.knockbackX !== 0 || enemy.knockbackY !== 0) {
            enemy.setVelocity(
                enemy.body.velocity.x + enemy.knockbackX,
                enemy.body.velocity.y + enemy.knockbackY
            );
            
            enemy.knockbackX *= 0.92;
            enemy.knockbackY *= 0.92;
            
            if (Math.abs(enemy.knockbackX) < 1) enemy.knockbackX = 0;
            if (Math.abs(enemy.knockbackY) < 1) enemy.knockbackY = 0;
        }
    }
    
    handlePentagonShooting(enemy) {
        const currentTime = this.time.now;
        
        if (currentTime > enemy.lastShot + enemy.shootInterval) {
            // 랜덤한 방향으로 총알 발사
            const shootAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            this.createEnemyBullet(enemy.x, enemy.y, shootAngle);
            enemy.lastShot = currentTime;
        }
    }
    
    createEnemyBullet(x, y, angle) {
        const bullet = this.physics.add.sprite(x, y, 'enemy_bullet');
        this.enemyBullets.add(bullet);
        
        // 매우 느린 속도
        const bulletSpeed = 100;
        const velocityX = Math.cos(angle) * bulletSpeed;
        const velocityY = Math.sin(angle) * bulletSpeed;
        bullet.setVelocity(velocityX, velocityY);
        
        // 5초 후 자동 제거
        this.time.delayedCall(5000, () => {
            if (bullet.active) {
                bullet.destroy();
            }
        });
    }
    
    moveEnemyBullets() {
        this.enemyBullets.children.entries.forEach(bullet => {
            if (bullet.active) {
                // 월드 경계를 벗어나면 제거
                if (bullet.x < 0 || bullet.x > this.worldWidth || 
                    bullet.y < 0 || bullet.y > this.worldHeight) {
                    bullet.destroy();
                }
            }
        });
    }
    
    playerHitByBullet(player, bullet) {
        // 기존 playerHit 함수와 동일한 로직
        if (this.isDashing || this.isLightningWaveActive || this.isPlayerInvincible) {
            bullet.destroy();
            return;
        }
        
        this.playerHealth -= 1;
        
        this.shakeCamera(300, 0.03); // 좀 더 약한 흔들림
        this.createExplosion(bullet.x, bullet.y);
        
        // 무적 상태 시작
        this.isPlayerInvincible = true;
        this.createPlayerInvincibilityEffect(player);
        
        bullet.destroy();
        
        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }
    
    handleStarEliteDash(enemy, baseAngle) {
        const currentTime = this.time.now;
        
        // 대시 쿨다운 체크
        if (!enemy.isDashing && currentTime > enemy.lastDash + enemy.dashCooldown) {
            // 대시 시작
            enemy.isDashing = true;
            enemy.lastDash = currentTime;
            
            // 새로운 랜덤 쿨다운 설정 (다음 대시까지)
            enemy.dashCooldown = Phaser.Math.Between(3000, 10000);
            
            // 대시 방향 결정 (70% 확률로 플레이어 방향, 30% 확률로 현재 방향 유지)
            if (Math.random() < 0.7) {
                // 플레이어를 향해 대시
                enemy.dashDirection.x = Math.cos(baseAngle);
                enemy.dashDirection.y = Math.sin(baseAngle);
            } else {
                // 현재 진행 방향으로 대시 (기존 속도 방향)
                const currentVelX = enemy.body.velocity.x;
                const currentVelY = enemy.body.velocity.y;
                const magnitude = Math.sqrt(currentVelX * currentVelX + currentVelY * currentVelY);
                
                if (magnitude > 0) {
                    enemy.dashDirection.x = currentVelX / magnitude;
                    enemy.dashDirection.y = currentVelY / magnitude;
                } else {
                    // 속도가 0이면 랜덤 방향
                    const randomAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                    enemy.dashDirection.x = Math.cos(randomAngle);
                    enemy.dashDirection.y = Math.sin(randomAngle);
                }
            }
            
            // 대시 시각 효과
            this.createStarEliteDashEffect(enemy);
            
            // Star elite dash started
        }
        
        if (enemy.isDashing) {
            // 대시 중 이동
            enemy.rotation += 0.3; // 빠른 회전
            enemy.setVelocity(
                enemy.dashDirection.x * enemy.dashSpeed,
                enemy.dashDirection.y * enemy.dashSpeed
            );
            
            // 대시 지속시간 체크
            if (currentTime > enemy.lastDash + enemy.dashDuration) {
                enemy.isDashing = false;
                // Star elite dash finished
            }
        } else {
            // 일반 이동 (천천히)
            enemy.rotation = baseAngle;
            
            let wobble = Math.sin(this.time.now * 0.001 + enemy.x * 0.005) * 0.1;
            const angle = baseAngle + wobble;
            
            let velocityX = Math.cos(angle) * enemy.speed;
            let velocityY = Math.sin(angle) * enemy.speed;
            
            // 넉백 효과 적용
            if (enemy.knockbackX !== 0 || enemy.knockbackY !== 0) {
                velocityX += enemy.knockbackX;
                velocityY += enemy.knockbackY;
                
                enemy.knockbackX *= 0.92;
                enemy.knockbackY *= 0.92;
                
                if (Math.abs(enemy.knockbackX) < 1) enemy.knockbackX = 0;
                if (Math.abs(enemy.knockbackY) < 1) enemy.knockbackY = 0;
            }
            
            enemy.setVelocity(velocityX, velocityY);
        }
        
        // 엘리트 몬스터 체력바 업데이트
        if (enemy.healthBar) {
            enemy.healthBarBg.x = enemy.x;
            enemy.healthBarBg.y = enemy.y - 80;
            
            const healthPercent = enemy.health / enemy.maxHealth;
            enemy.healthBar.width = 120 * healthPercent;
            enemy.healthBar.x = enemy.x - 60;
            enemy.healthBar.y = enemy.y - 80;
            
            enemy.nameTag.x = enemy.x;
            enemy.nameTag.y = enemy.y - 100;
        }
    }
    
    createStarEliteDashEffect(enemy) {
        // 대시 시작 시 황금빛 폭발 효과
        const startExplosion = this.add.graphics();
        startExplosion.fillStyle(0xFFD700, 0.8);
        startExplosion.fillCircle(enemy.x, enemy.y, 60);
        
        this.tweens.add({
            targets: startExplosion,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => startExplosion.destroy()
        });
        
        // 대시 궤적 효과
        const trailCount = 8;
        for (let i = 0; i < trailCount; i++) {
            this.time.delayedCall(i * 40, () => {
                if (enemy.active && enemy.isDashing) {
                    const trail = this.add.sprite(enemy.x, enemy.y, 'star_elite_monster');
                    trail.setTint(0xFFD700);
                    trail.setAlpha(0.6 - (i * 0.07));
                    trail.setScale(0.8 - (i * 0.08));
                    
                    this.tweens.add({
                        targets: trail,
                        alpha: 0,
                        scale: 0.2,
                        duration: 300,
                        onComplete: () => trail.destroy()
                    });
                }
            });
        }
        
        // 대시 중 파티클 효과
        this.time.delayedCall(0, () => {
            for (let i = 0; i < 5; i++) {
                this.time.delayedCall(i * 60, () => {
                    if (enemy.active && enemy.isDashing) {
                        const particle = this.add.graphics();
                        particle.fillStyle(0xFFF176, 0.9);
                        
                        const offsetX = Phaser.Math.Between(-20, 20);
                        const offsetY = Phaser.Math.Between(-20, 20);
                        particle.fillCircle(enemy.x + offsetX, enemy.y + offsetY, 3);
                        
                        this.tweens.add({
                            targets: particle,
                            alpha: 0,
                            scaleX: 0,
                            scaleY: 0,
                            duration: 200,
                            onComplete: () => particle.destroy()
                        });
                    }
                });
            }
        });
    }

    moveEnemies(delta) {
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.active) {
                const baseAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                
                let velocityX = 0;
                let velocityY = 0;
                
                if (enemy.enemyType === 'pentagon_monster') {
                    // 오각형 몬스터는 특별한 이동 패턴
                    this.handlePentagonMovement(enemy, baseAngle, delta);
                    // 오각형 몬스터의 총알 발사 처리
                    this.handlePentagonShooting(enemy);
                    return; // 일반 이동 로직 건너뛰기
                } else if (enemy.enemyType === 'star_elite_monster') {
                    // 스타 엘리트 몬스터는 대시 시스템을 가짐
                    this.handleStarEliteDash(enemy, baseAngle);
                    return; // 일반 이동 로직 건너뛰기
                } else if (enemy.enemyType === 'enemy2') {
                    // 삼각형 몬스터(enemy2)는 뾰족한 부분이 플레이어를 향하도록 회전
                    enemy.rotation = baseAngle + Math.PI / 2; // 90도 보정 (삼각형의 진짜 머리 부분이 향하도록)
                } else {
                    // 다른 적들은 플레이어를 바라보도록 회전
                    enemy.rotation = baseAngle;
                }
                
                let wobble = 0;
                if (enemy.enemyType !== 'elite_monster') {
                    wobble = Math.sin(this.time.now * 0.003 + enemy.x * 0.01) * 0.2;
                } else {
                    // 엘리트 몬스터는 더 천천히, 직선적으로 이동
                    wobble = Math.sin(this.time.now * 0.001 + enemy.x * 0.005) * 0.1;
                }
                
                const angle = baseAngle + wobble;
                
                velocityX = Math.cos(angle) * enemy.speed;
                velocityY = Math.sin(angle) * enemy.speed;
                
                // 바둑알처럼 강한 넉백 슬라이드 효과
                if (enemy.knockbackX !== 0 || enemy.knockbackY !== 0) {
                    velocityX += enemy.knockbackX;
                    velocityY += enemy.knockbackY;
                    
                    // 바둑알처럼 더 천천히 감속 (더 멀리 밀려남)
                    enemy.knockbackX *= 0.92;
                    enemy.knockbackY *= 0.92;
                    
                    if (Math.abs(enemy.knockbackX) < 1) enemy.knockbackX = 0;
                    if (Math.abs(enemy.knockbackY) < 1) enemy.knockbackY = 0;
                }
                
                enemy.setVelocity(velocityX, velocityY);
                
                // 엘리트 몬스터 체력바 업데이트
                if (enemy.enemyType === 'elite_monster' && enemy.healthBar) {
                    enemy.healthBarBg.x = enemy.x;
                    enemy.healthBarBg.y = enemy.y - 80;
                    
                    const healthPercent = enemy.health / enemy.maxHealth;
                    enemy.healthBar.width = 120 * healthPercent;
                    enemy.healthBar.x = enemy.x - 60;
                    enemy.healthBar.y = enemy.y - 80;
                    
                    enemy.nameTag.x = enemy.x;
                    enemy.nameTag.y = enemy.y - 100;
                }
                
                // isHit 처리는 createHitFlashEffect에서 자동 처리됨
            }
        });
    }

    moveBullets() {
        this.bullets.children.entries.forEach(bullet => {
            if (bullet.active) {
                const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, bullet.x, bullet.y);
                if (distance > 800) {
                    bullet.destroy();
                }
            }
        });
    }

    moveEnergy() {
        this.energy.children.entries.forEach(energyOrb => {
            if (energyOrb.active) {
                const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, energyOrb.x, energyOrb.y);
                if (distance < 150) {
                    const angle = Phaser.Math.Angle.Between(energyOrb.x, energyOrb.y, this.player.x, this.player.y);
                    const attractForce = 500 + (150 - distance) * 10;
                    const velocityX = Math.cos(angle) * attractForce;
                    const velocityY = Math.sin(angle) * attractForce;
                    energyOrb.setVelocity(velocityX, velocityY);
                } else {
                    energyOrb.setVelocity(0, 0);
                }
            }
        });
    }

    updateExplosions() {
        this.explosions.children.entries.forEach(explosion => {
            if (explosion.active) {
                explosion.scaleX += 0.08;
                explosion.scaleY += 0.08;
                explosion.alpha -= 0.06;
                
                if (explosion.alpha <= 0) {
                    explosion.destroy();
                }
            }
        });
    }

    findNearestEnemyToPlayer() {
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.active) {
                const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            }
        });
        
        return nearestEnemy;
    }

    hitEnemy(bullet, enemy) {
        this.createExplosion(enemy.x, enemy.y);
        
        enemy.health -= 0.5;
        
        // 피격 효과가 이미 실행 중이 아닐 때만 실행
        if (!enemy.isFlashing) {
            enemy.isFlashing = true;
            this.createHitFlashEffect(enemy);
        }
        
        // 바둑알처럼 강한 넉백 효과
        const knockbackForce = enemy.enemyType === 'elite_monster' ? 100 : 200;
        const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, enemy.x, enemy.y);
        enemy.knockbackX = Math.cos(angle) * knockbackForce;
        enemy.knockbackY = Math.sin(angle) * knockbackForce;
        
        // 전기 체인 스킬 확인 및 발동
        if (this.skillSystem.selectedSkills.has('electric_chain') && this.electricSkillSystem) {
            const skillLevel = this.skillSystem.skillStacks.get('electric_chain') || 1;
            this.electricSkillSystem.triggerElectricChain(enemy, skillLevel);
        }
        
        bullet.destroy();
        
        if (enemy.health <= 0) {
            // 엘리트 몬스터 특별 처리
            if (enemy.enemyType === 'elite_monster' || enemy.enemyType === 'star_elite_monster') {
                // 체력바와 태그 제거
                if (enemy.healthBarBg) enemy.healthBarBg.destroy();
                if (enemy.healthBar) enemy.healthBar.destroy();
                if (enemy.nameTag) enemy.nameTag.destroy();
                
                // 엘리트 카운터 감소
                this.currentEliteCount--;
                console.log(`Elite monster destroyed! Current elite count: ${this.currentEliteCount}`);
                
                // 더 많은 에너지 드롭
                const energyCount = enemy.enemyType === 'star_elite_monster' ? 6 : 8;
                for (let i = 0; i < energyCount; i++) {
                    const angle = (i / energyCount) * Math.PI * 2;
                    const distance = 60;
                    const energyX = enemy.x + Math.cos(angle) * distance;
                    const energyY = enemy.y + Math.sin(angle) * distance;
                    
                    const energyOrb = this.physics.add.sprite(energyX, energyY, 'energy');
                    this.energy.add(energyOrb);
                }
                
                // 엘리트 죽음 효과
                const shakeIntensity = enemy.enemyType === 'star_elite_monster' ? 0.04 : 0.05;
                this.cameras.main.shake(800, shakeIntensity);
                
                const explosionCount = enemy.enemyType === 'star_elite_monster' ? 4 : 5;
                for (let i = 0; i < explosionCount; i++) {
                    this.time.delayedCall(i * 100, () => {
                        this.createExplosion(
                            enemy.x + (Math.random() - 0.5) * 100,
                            enemy.y + (Math.random() - 0.5) * 100
                        );
                    });
                }
            } else {
                const energyOrb = this.physics.add.sprite(enemy.x, enemy.y, 'energy');
                this.energy.add(energyOrb);
            }
            
            // 디버깅: 오각형 몬스터 죽음 로그
            if (enemy.enemyType === 'pentagon_monster') {
                console.log(`Pentagon monster destroyed!`);
            }
            
            enemy.destroy();
            
            const points = this.getEnemyPoints(enemy.enemyType);
            this.score += points;
            
            // 엘리트 킬 카운트
            if (enemy.enemyType === 'elite_monster' || enemy.enemyType === 'star_elite_monster') {
                this.eliteKills++;
            }
        }
    }

    getEnemyPoints(type) {
        switch(type) {
            case 'enemy1': return 10;
            case 'enemy2': return 20;
            case 'enemy3': return 30;
            case 'pentagon_monster': return 100;
            case 'elite_monster': return 500;
            case 'star_elite_monster': return 400;
            default: return 10;
        }
    }

    createHitFlashEffect(enemy) {
        // 깜빡깜빡 효과 (3번 깜빡)
        const flashCount = 6;
        const flashDuration = 80;
        
        for (let i = 0; i < flashCount; i++) {
            this.time.delayedCall(i * flashDuration, () => {
                if (enemy.active && enemy.isFlashing) {
                    if (i % 2 === 0) {
                        enemy.setTint(0xffffff); // 흰색
                    } else {
                        enemy.clearTint(); // 원래 색상
                    }
                }
            });
        }
        
        // 마지막에 원래 색상으로 복원하고 플래시 상태 해제
        this.time.delayedCall(flashCount * flashDuration, () => {
            if (enemy.active) {
                enemy.clearTint();
                enemy.isFlashing = false;
            }
        });
    }

    createExplosion(x, y) {
        const explosion = this.add.sprite(x, y, 'explosion');
        explosion.setScale(0.1);
        explosion.setAlpha(1);
        this.explosions.add(explosion);
    }

    shakeCamera(duration, intensity) {
        this.cameras.main.shake(duration, intensity);
    }

    collectEnergy(player, energyOrb) {
        energyOrb.destroy();
        
        // 레벨 30 이후에는 경험치 획득 중단
        if (this.weaponLevel < 30) {
            this.experience += 20;
        }
        
        // 번개 파동파 쿨타임 0.1초 감소
        if (!this.lightningWaveReady) {
            this.lightningWaveCooldown -= 100; // 0.1초 = 100ms
            // 최소 1초는 유지
            if (this.lightningWaveCooldown < 1000) {
                this.lightningWaveCooldown = 1000;
            }
        }
        
        if (this.experience >= this.experienceToNext) {
            this.levelUp();
        }
    }

    collectBulletUpgrade(player, bulletUpgrade) {
        bulletUpgrade.destroy();
        
        // 탄환 개수 증가
        this.bulletCount += 1;
        
        // 특별한 이펙트
        this.shakeCamera(200, 0.015);
        this.createExplosion(player.x, player.y);
        
        // 사운드 효과 대신 시각적 피드백
        this.tweens.add({
            targets: this.bulletCountText,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 200,
            yoyo: true,
            ease: 'Power2'
        });
        
        // Bullet upgrade collected
    }

    levelUp() {
        // 레벨업이 이미 진행 중이면 중복 실행 방지
        if (this.isLevelingUp || this.weaponLevel >= 30) {
            return;
        }
        
        // 레벨업 시작 - 중복 실행 방지 플래그 설정
        this.isLevelingUp = true;
        
        this.weaponLevel += 1;
        this.experience = 0;
        this.experienceToNext = 100 + (this.weaponLevel * 75);
        
        // Level up to ${this.weaponLevel}
        
        // 1. 즉시 파동파 발동 (쿨타임 무시)
        this.performLightningWave();
        
        // 2. 레벨업 시각 효과 표시
        this.showLevelUpText();
        
        // 3. 2초 후 스킬 카드 선택 화면 표시 (파동파 효과 완료 대기)
        this.time.delayedCall(2000, () => {
            this.showSkillCardSelection();
        });
    }

    performLevelUpSequence() {
        // 1. 파동파 스킬 강제 발동 (쿨타임 무시)
        this.performLightningWave();
        
        // 2. 간단한 레벨업 메시지
        this.showLevelUpText();
        
        // 3. 레벨업 완료
        this.completeLevelUpSequence();
    }

    completeLevelUpSequence() {
        // 레벨업 프로세스 완전 완료
        this.isLevelingUp = false;
        // Level up sequence completed
    }

    showLevelUpText() {
        // 간단한 Level Up! 텍스트
        const levelUpText = this.add.text(400, 300, `LEVEL ${this.weaponLevel}!`, {
            fontSize: '48px',
            fontFamily: 'Arial, sans-serif',
            fill: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0);
        
        // 부드러운 등장과 사라짐 애니메이션
        this.tweens.add({
            targets: levelUpText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            ease: 'Back.easeOut',
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                this.tweens.add({
                    targets: levelUpText,
                    alpha: 0,
                    duration: 1000,
                    delay: 500,
                    onComplete: () => levelUpText.destroy()
                });
            }
        });
    }
    
    // 미사일과 적 충돌 처리 (누락되었던 메서드 추가!)
    missileHitEnemy(missile, enemy) {
        if (!missile.active || !enemy.active) return;
        
        console.log('🚀💥 미사일-적 충돌 감지!', {
            missileActive: missile.active,
            enemyActive: enemy.active,
            enemyType: enemy.enemyType || 'unknown',
            enemyHealth: enemy.health
        });
        
        // 미사일의 onHit 메서드 호출
        if (missile.onHit && typeof missile.onHit === 'function') {
            missile.onHit(enemy);
        }
    }

    playerHit(player, enemy) {
        // 대쉬 중이나 번개 파동파 사용 중이나 무적 상태에는 피격 무시
        if (this.isDashing || this.isLightningWaveActive || this.isPlayerInvincible) {
            enemy.destroy();
            return;
        }
        
        // 배리어 체크
        if (this.skillSystem.barrierCharges > 0) {
            this.skillSystem.barrierCharges--;
            this.showBarrierBreakEffect();
            console.log(`배리어로 공격 차단! 남은 배리어: ${this.skillSystem.barrierCharges}`);
            
            enemy.destroy();
            return; // 피해 무시
        }
        
        this.playerHealth -= 1;
        
        // 피격시에만 화면 흔들림!
        this.shakeCamera(500, 0.04);
        this.createExplosion(player.x, player.y);
        
        // 무적 상태 시작
        this.isPlayerInvincible = true;
        
        // 투명한 회색으로 깜빡이는 효과 (2초간)
        this.createPlayerInvincibilityEffect(player);
        
        if (this.playerHealth <= 0) {
            this.gameOver();
        } else {
            // 적을 밀어내기
            enemy.destroy();
        }
    }

    createPlayerInvincibilityEffect(player) {
        // 깜빡이는 횟수 (2초 동안 0.2초 간격으로 10번)
        const blinkCount = 10;
        const blinkInterval = 200; // 0.2초
        
        for (let i = 0; i < blinkCount; i++) {
            this.time.delayedCall(i * blinkInterval, () => {
                if (player.active && this.isPlayerInvincible) {
                    if (i % 2 === 0) {
                        // 투명한 회색으로 설정
                        player.setTint(0x808080); // 회색
                        player.setAlpha(0.5); // 반투명
                    } else {
                        // 원래 상태로 복원 (잠깐 보이기)
                        player.setTint(0xffffff);
                        player.setAlpha(1);
                    }
                }
            });
        }
        
        // 2초 후 무적 상태 해제 및 완전 복원
        this.time.delayedCall(blinkCount * blinkInterval, () => {
            if (player.active) {
                player.setTint(0xffffff);
                player.setAlpha(1);
                this.isPlayerInvincible = false;
            }
        });
    }
    
    showBarrierBreakEffect() {
        // 플레이어 주위에 배리어가 깨지는 이펙트
        const barrierEffect = this.add.circle(this.player.x, this.player.y, 0, 0x00aaff, 0.7);
        
        this.tweens.add({
            targets: barrierEffect,
            radius: 50,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                barrierEffect.destroy();
            }
        });
        
        // 배리어 차단 텍스트 표시
        const barrierText = this.add.text(this.player.x, this.player.y - 40, '배리어!', {
            fontSize: '16px',
            color: '#00aaff',
            stroke: '#ffffff',
            strokeThickness: 1,
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: barrierText,
            y: this.player.y - 80,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                barrierText.destroy();
            }
        });
    }

    gameOver() {
        this.scene.pause();
        this.scene.launch('GameOverScene', { 
            score: this.score, 
            time: this.gameTime,
            level: this.weaponLevel,
            wave: this.difficultyLevel,
            bulletCount: this.bulletCount,
            eliteKills: this.eliteKills
        });
    }
    
    // === 스킬 카드 시스템 메서드들 ===
    
    showSkillCardSelection() {
        // 게임 일시정지
        this.pauseGameForSkillSelection();
        
        // 스킬 카드 선택 활성화
        this.skillSystem.isCardSelectionActive = true;
        
        // 3장의 랜덤 스킬 생성
        const randomSkills = this.generateRandomSkills(3);
        this.skillSystem.currentCardOptions = randomSkills;
        
        // UI 생성
        this.createSkillCardSelectionUI(randomSkills);
    }
    
    pauseGameForSkillSelection() {
        // 물리 시뮬레이션 일시정지
        this.physics.world.pause();
        
        // 모든 중요한 타이머들 일시정지
        if (this.enemySpawnTimer) {
            this.enemySpawnTimer.paused = true;
        }
        
        if (this.autoShockwaveTimer) {
            this.autoShockwaveTimer.paused = true;
        }
        
        // ⚠️ Scene.pause() 제거 - 데드락 방지
        // 대신 게임 업데이트만 차단
        
        // 게임 화면 어둡게 하기
        this.gameOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.5)
            .setScrollFactor(0)
            .setDepth(999);
            
        // 스킬 선택 중임을 표시하는 플래그
        this.isSkillSelectionActive = true;
        
        console.log('🔄 게임 일시정지: 스킬 선택 중');
    }
    
    generateRandomSkills(count = 3) {
        const availableSkills = Object.values(skillDefinitions)
            .filter(skill => this.canSelectSkill(skill));
            
        const selectedSkills = [];
        const usedSkillIds = new Set();
        
        // 카테고리별 가중치
        const categoryWeights = {
            active: 0.50,
            passive: 0.35,
            skill: 0.15
        };
        
        // 만약 선택 가능한 스킬이 count보다 적으면 모든 스킬 반환
        if (availableSkills.length <= count) {
            return availableSkills;
        }
        
        // count 만큼 반복하되, 중복 제거
        for (let i = 0; i < count && i < availableSkills.length; i++) {
            // 아직 선택되지 않은 스킬들만 필터링
            const remainingSkills = availableSkills.filter(skill => 
                !usedSkillIds.has(skill.id)
            );
            
            if (remainingSkills.length === 0) break;
            
            // 가중치 기반 랜덤 선택
            const skill = this.weightedRandomSelection(remainingSkills, categoryWeights);
            if (skill) {
                selectedSkills.push(skill);
                usedSkillIds.add(skill.id);
            }
        }
        
        console.log(`Generated ${selectedSkills.length} skills:`, selectedSkills.map(s => s.name));
        return selectedSkills;
    }
    
    canSelectSkill(skill) {
        // 일회성 스킬 (stackable: false)인 경우 한 번만 선택 가능
        if (!skill.stackable) {
            return !this.skillSystem.selectedSkills.has(skill.id);
        }
        
        // 스택 가능한 스킬인 경우 최대 스택 수 확인
        const currentStacks = this.skillSystem.skillStacks.get(skill.id) || 0;
        const maxStacks = skill.maxStacks || 1;
        
        // 최대 스택에 도달했으면 선택 불가
        if (currentStacks >= maxStacks) {
            return false;
        }
        
        return true;
    }
    
    weightedRandomSelection(skills, categoryWeights) {
        if (skills.length === 0) return null;
        
        // 확률 기반 선택 (현재는 단순 랜덤)
        return skills[Math.floor(Math.random() * skills.length)];
    }
    
    createSkillCardSelectionUI(skills) {
        // 모달 배경
        this.skillModal = {
            background: this.add.rectangle(400, 300, 700, 400, 0x1a1a1a, 0.95)
                .setScrollFactor(0)
                .setDepth(1000)
                .setStrokeStyle(4, 0x4CAF50),
                
            title: this.add.text(400, 180, '스킬 선택', {
                fontSize: '36px',
                color: '#4CAF50',
                stroke: '#000000',
                strokeThickness: 3,
                fontWeight: 'bold'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(1001),
            
            cards: []
        };
        
        // 3장의 카드 생성
        skills.forEach((skill, index) => {
            this.createSkillCard(skill, index);
        });
        
        // 페이드인 애니메이션
        this.skillModal.background.setAlpha(0);
        this.skillModal.title.setAlpha(0);
        
        this.tweens.add({
            targets: [this.skillModal.background, this.skillModal.title],
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
    }
    
    createSkillCard(skill, index) {
        const cardX = 250 + (index * 150); // 250, 400, 550
        const cardY = 300;
        
        // 희귀도에 따른 색상
        const rarityColors = {
            common: 0x9E9E9E,     // 회색
            uncommon: 0x4CAF50,   // 녹색  
            rare: 0x2196F3,       // 파랑
            legendary: 0xFF9800   // 주황
        };
        
        const card = {
            // 카드 배경
            background: this.add.rectangle(cardX, cardY, 120, 180, 0x2a2a2a, 0.9)
                .setScrollFactor(0)
                .setDepth(1002)
                .setStrokeStyle(2, rarityColors[skill.rarity])
                .setInteractive(),
                
            // 스킬 이름
            name: this.add.text(cardX, cardY - 60, skill.name, {
                fontSize: '14px',
                color: '#ffffff',
                fontWeight: 'bold',
                align: 'center',
                wordWrap: { width: 100 }
            }).setOrigin(0.5).setScrollFactor(0).setDepth(1003),
            
            // 스킬 설명
            description: this.add.text(cardX, cardY - 10, skill.description, {
                fontSize: '10px',
                color: '#cccccc',
                align: 'center',
                wordWrap: { width: 100 }
            }).setOrigin(0.5).setScrollFactor(0).setDepth(1003),
            
            // 선택 버튼
            selectButton: this.add.rectangle(cardX, cardY + 60, 80, 25, 0x4CAF50, 0.8)
                .setScrollFactor(0)
                .setDepth(1003)
                .setStrokeStyle(1, 0xffffff)
                .setInteractive(),
                
            selectText: this.add.text(cardX, cardY + 60, '선택', {
                fontSize: '12px',
                color: '#ffffff',
                fontWeight: 'bold'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(1004)
        };
        
        // 호버 효과
        card.background.on('pointerover', () => {
            this.tweens.add({
                targets: card.background,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 150
            });
        });
        
        card.background.on('pointerout', () => {
            this.tweens.add({
                targets: card.background,
                scaleX: 1.0,
                scaleY: 1.0,
                duration: 150
            });
        });
        
        // 선택 이벤트
        const selectSkill = () => {
            this.selectSkillCard(skill);
        };
        
        card.selectButton.on('pointerdown', selectSkill);
        card.background.on('pointerdown', selectSkill);
        
        this.skillModal.cards.push(card);
        
        // 카드 등장 애니메이션
        card.background.setAlpha(0);
        card.name.setAlpha(0);
        card.description.setAlpha(0);
        card.selectButton.setAlpha(0);
        card.selectText.setAlpha(0);
        
        this.time.delayedCall(100 + (index * 100), () => {
            this.tweens.add({
                targets: [card.background, card.name, card.description, card.selectButton, card.selectText],
                alpha: 1,
                duration: 300,
                ease: 'Power2'
            });
        });
    }
    
    selectSkillCard(skill) {
        console.log(`스킬 선택: ${skill.name}`);
        
        // 스킬 효과 적용
        this.applySkillEffect(skill);
        
        // UI 제거
        this.hideSkillCardSelection();
        
        // 게임 재개
        this.resumeGameAfterSkillSelection();
    }
    
    applySkillEffect(skill) {
        // 스킬 획득 기록
        this.skillSystem.selectedSkills.add(skill.id);
        
        if (skill.stackable) {
            const currentStacks = this.skillSystem.skillStacks.get(skill.id) || 0;
            this.skillSystem.skillStacks.set(skill.id, currentStacks + 1);
        }
        
        switch(skill.effect.type) {
            case 'stat_modifier':
                this.applyStatModifier(skill);
                break;
            case 'instant':
                this.applyInstantEffect(skill);
                break;
            case 'timed_buff':
                this.applyTimedBuff(skill);
                break;
            case 'special_behavior':
                this.applySpecialBehavior(skill);
                break;
        }
        
        // 선택 피드백
        this.showSkillAcquiredText(skill);
    }
    
    applyStatModifier(skill) {
        const modifierId = `${skill.id}_${Date.now()}`;
        this.statModifierEngine.addModifier(
            skill.effect.target,
            modifierId,
            skill.effect.operation,
            skill.effect.value
        );
    }
    
    applyInstantEffect(skill) {
        switch(skill.effect.action) {
            case 'add_barrier_charge':
                this.skillSystem.barrierCharges = Math.min(
                    this.skillSystem.barrierCharges + 1,
                    this.skillSystem.maxBarrierCharges
                );
                console.log(`배리어 충전: ${this.skillSystem.barrierCharges}`);
                break;
            case 'heal_player':
                this.playerHealth = Math.min(this.playerHealth + 1, this.maxPlayerHealth);
                this.updateUI(); // UI 전체 업데이트
                console.log(`체력 회복: ${this.playerHealth}`);
                break;
            case 'collect_all_energy':
                this.collectAllEnergyOrbs();
                break;
        }
    }
    
    applyTimedBuff(skill) {
        const effect = skill.effect;
        const buffId = effect.buffId;
        
        // 기존 버프 제거
        if (this.skillSystem.activeBuffs.has(buffId)) {
            this.removeTimedBuff(buffId);
        }
        
        const buffData = {
            startTime: this.time.now,
            duration: effect.duration,
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
        
        // 시각적 피드백 및 특별 버프 처리
        if (buffId === 'agility_boost') {
            this.player.setTint(0x00ff88);
        } else if (buffId === 'speed_boost') {
            this.player.setTint(0x00aaff);
        } else if (buffId === 'auto_shockwave') {
            this.player.setTint(0xffaa00);
            this.startAutoShockwaveTimer(effect.duration);
        } else if (buffId === 'random_lightning_storm') {
            this.player.setTint(0xffff00);
            // 랜덤 번개 스킬 활성화
            if (this.electricSkillSystem && effect.action === 'activate_random_lightning') {
                const skillLevel = this.skillSystem.skillStacks.get(skill.id) || 1;
                this.electricSkillSystem.activateRandomLightning(skillLevel, effect.duration);
            }
        }
        
        // 만료 타이머 설정
        this.time.delayedCall(effect.duration, () => {
            this.removeTimedBuff(buffId);
        });
        
        console.log(`버프 적용: ${buffId} (${effect.duration}ms)`);
    }
    
    removeTimedBuff(buffId) {
        const buffData = this.skillSystem.activeBuffs.get(buffId);
        if (!buffData) return;
        
        // 모든 모디파이어 제거
        buffData.modifiers.forEach(modifierId => {
            const [, , target] = modifierId.split('_');
            this.statModifierEngine.removeModifier(target, modifierId);
        });
        
        // 버그 수정: 자동 파동파 버프 종료 시 타이머 정리
        if (buffId === 'auto_shockwave' && this.autoShockwaveTimer) {
            this.autoShockwaveTimer.destroy();
            this.autoShockwaveTimer = null;
            console.log('자동 파동파 타이머 정리됨');
        }
        
        // 번개 스킬 버프 종료 시 타이머 정리
        if (buffId === 'random_lightning_storm' && this.electricSkillSystem?.activeRandomLightning) {
            this.electricSkillSystem.activeRandomLightning.destroy();
            this.electricSkillSystem.activeRandomLightning = null;
            console.log('랜덤 번개 타이머 정리됨');
        }
        
        this.skillSystem.activeBuffs.delete(buffId);
        
        // 시각적 효과 제거
        this.player.clearTint();
        
        console.log(`버프 만료: ${buffId}`);
    }
    
    showSkillAcquiredText(skill) {
        const acquiredText = this.add.text(400, 150, `${skill.name} 획득!`, {
            fontSize: '24px',
            color: '#4CAF50',
            stroke: '#000000',
            strokeThickness: 2,
            fontWeight: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1500);
        
        // 애니메이션
        this.tweens.add({
            targets: acquiredText,
            y: 100,
            alpha: 0,
            duration: 2000,
            ease: 'Power2'
        });
        
        this.time.delayedCall(2000, () => {
            acquiredText.destroy();
        });
    }
    
    hideSkillCardSelection() {
        if (this.skillModal) {
            // 모든 UI 요소 제거
            this.skillModal.background.destroy();
            this.skillModal.title.destroy();
            this.skillModal.cards.forEach(card => {
                Object.values(card).forEach(element => {
                    if (element.destroy) element.destroy();
                });
            });
            this.skillModal = null;
        }
        
        this.skillSystem.isCardSelectionActive = false;
        this.skillSystem.currentCardOptions = [];
    }
    
    resumeGameAfterSkillSelection() {
        // 스킬 선택 종료 플래그
        this.isSkillSelectionActive = false;
        
        // 오버레이 제거
        if (this.gameOverlay) {
            this.gameOverlay.destroy();
            this.gameOverlay = null;
        }
        
        // 모든 타이머들 재개
        if (this.enemySpawnTimer) {
            this.enemySpawnTimer.paused = false;
        }
        
        if (this.autoShockwaveTimer) {
            this.autoShockwaveTimer.paused = false;
        }
        
        // 물리 시뮬레이션 재개
        this.physics.world.resume();
        
        console.log('▶️ 게임 재개: 스킬 선택 완료');
        
        // 레벨업 완료
        this.time.delayedCall(1000, () => {
            this.isLevelingUp = false;
        });
    }
    
    // 에너지 구슬 전체 수집 기능 (자석 효과)
    collectAllEnergyOrbs() {
        let collectedCount = 0;
        const playerX = this.player.x;
        const playerY = this.player.y;
        
        // 자석 시각 효과 생성
        this.createMagneticFieldEffect(playerX, playerY);
        
        // 모든 에너지 구슬에 자석 효과 적용
        this.energy.children.entries.forEach((orb, index) => {
            if (orb.active) {
                collectedCount++;
                
                // 각 구슬에 지연 시간을 두어 순차적으로 끌어당김
                const delay = index * 50; // 50ms 간격
                
                this.time.delayedCall(delay, () => {
                    if (orb.active) {
                        this.attractOrbToPlayer(orb, playerX, playerY);
                    }
                });
            }
        });
        
        // 시각적 피드백
        if (collectedCount > 0) {
            this.showSkillAcquiredText({
                name: `자석 효과: ${collectedCount}개 구슬 흡수!`
            });
            
            // 카메라 흔들림 효과
            this.shakeCamera(300, 0.02);
            
            // 자석 소리 효과 (시뮬레이션)
            console.log('🧲 자석 효과음 재생');
        }
        
        console.log(`🧲 자석으로 에너지 구슬 ${collectedCount}개 흡수 시작`);
    }
    
    // 자기장 시각 효과
    createMagneticFieldEffect(x, y) {
        // 동심원 자기장 라인들
        for (let i = 1; i <= 4; i++) {
            const radius = 100 * i;
            const magneticField = this.add.graphics();
            magneticField.lineStyle(2, 0x00ff88, 0.6 - (i * 0.1));
            magneticField.strokeCircle(x, y, 30);
            
            // 확산 애니메이션
            this.tweens.add({
                targets: magneticField,
                scaleX: radius / 30,
                scaleY: radius / 30,
                alpha: 0,
                duration: 800 + (i * 200),
                ease: 'Power2',
                onComplete: () => magneticField.destroy()
            });
        }
    }
    
    // 구슬을 플레이어에게 끌어당기기
    attractOrbToPlayer(orb, playerX, playerY) {
        // 구슬에 반짝임 효과
        orb.setTint(0x88ff88);
        
        // 곡선 경로로 플레이어에게 끌려감
        const startX = orb.x;
        const startY = orb.y;
        
        // 중간점 계산 (약간 곡선 효과)
        const midX = (startX + playerX) / 2 + Phaser.Math.Between(-50, 50);
        const midY = (startY + playerY) / 2 + Phaser.Math.Between(-50, 50);
        
        // 곡선 이동 애니메이션
        const path = { t: 0 };
        this.tweens.add({
            targets: path,
            t: 1,
            duration: 600,
            ease: 'Power2',
            onUpdate: () => {
                if (orb.active) {
                    const t = path.t;
                    // 베지어 곡선 계산
                    const x = Math.pow(1-t, 2) * startX + 2*(1-t)*t * midX + Math.pow(t, 2) * playerX;
                    const y = Math.pow(1-t, 2) * startY + 2*(1-t)*t * midY + Math.pow(t, 2) * playerY;
                    orb.setPosition(x, y);
                }
            },
            onComplete: () => {
                if (orb.active) {
                    // 수집 완료
                    this.collectEnergy(this.player, orb);
                    
                    // 작은 반짝임 효과
                    const sparkle = this.add.graphics();
                    sparkle.fillStyle(0x88ff88, 1);
                    sparkle.fillCircle(playerX, playerY, 15);
                    
                    this.tweens.add({
                        targets: sparkle,
                        scaleX: 2,
                        scaleY: 2,
                        alpha: 0,
                        duration: 200,
                        onComplete: () => sparkle.destroy()
                    });
                }
            }
        });
    }
    
    // 자동 파동파 타이머 시작
    startAutoShockwaveTimer(duration) {
        // 이미 자동 파동파가 있다면 제거
        if (this.autoShockwaveTimer) {
            this.autoShockwaveTimer.destroy();
        }
        
        let remainingTime = duration;
        const interval = 3000; // 3초마다
        
        this.autoShockwaveTimer = this.time.addEvent({
            delay: interval,
            callback: () => {
                // 버그 수정: 스킬 선택 중에는 자동 파동파 비활성화
                if (this.lightningWaveReady && this.player && this.player.active && !this.isSkillSelectionActive) {
                    this.performLightningWave();
                    
                    // 자동 발동 시각적 효과
                    this.showAutoSkillText('자동 파동파!');
                }
                
                remainingTime -= interval;
                if (remainingTime <= 0) {
                    this.autoShockwaveTimer.destroy();
                    this.autoShockwaveTimer = null;
                }
            },
            repeat: Math.floor(duration / interval) - 1
        });
        
        console.log(`자동 파동파 시작: ${duration}ms 동안`);
    }
    
    // 자동 스킬 텍스트 표시
    showAutoSkillText(text) {
        const autoText = this.add.text(
            this.player.x, 
            this.player.y - 50, 
            text, 
            {
                fontSize: '16px',
                color: '#ffaa00',
                stroke: '#000000',
                strokeThickness: 2,
                fontWeight: 'bold'
            }
        ).setOrigin(0.5);
        
        // 애니메이션
        this.tweens.add({
            targets: autoText,
            y: autoText.y - 30,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => autoText.destroy()
        });
    }
    
    // 특별 행동 스킬 처리
    applySpecialBehavior(skill) {
        // 미사일 스킬 처리
        if (skill.effect.action === 'activate_guided_missile' || skill.effect.action === 'enhance_missile_bounce') {
            this.updateMissileStacks();
            console.log(`미사일 스킬 활성화: ${skill.name}`);
            return;
        }
        
        // 기존 behavior 처리
        const behavior = skill.effect.behavior;
        if (behavior) {
            // 스킬 시스템에 저장
            if (!this.skillSystem.specialBehaviors) {
                this.skillSystem.specialBehaviors = new Set();
            }
            this.skillSystem.specialBehaviors.add(behavior);
            
            console.log(`특별 행동 스킬 활성화: ${behavior}`);
        }
    }
    
    // 대쉬 스킬 효과 처리 (완전 재설계)
    triggerDashSkillEffects(startX, startY, endX, endY, angle) {
        if (!this.skillSystem.specialBehaviors) {
            console.log('🚫 대쉬 스킬: specialBehaviors가 초기화되지 않음');
            return;
        }
        
        const behaviors = this.skillSystem.specialBehaviors;
        console.log('🎯 대쉬 스킬 체크:', Array.from(behaviors));
        
        let skillActivated = false;
        
        // 대쉬 넉백 스킬
        if (behaviors.has('dash_knockback')) {
            this.applyDashKnockback(startX, startY, endX, endY);
            this.showDashSkillActivation('넉백 대쉬!', 0x00ff00);
            skillActivated = true;
        }
        
        // 대쉬 공격 스킬
        if (behaviors.has('dash_damage')) {
            this.applyDashDamage(startX, startY, endX, endY);
            this.showDashSkillActivation('공격 대쉬!', 0xff4444);
            skillActivated = true;
        }
        
        // 대쉬 폭발 스킬
        if (behaviors.has('dash_explosion')) {
            this.applyDashExplosion(endX, endY);
            this.showDashSkillActivation('폭발 대쉬!', 0xff6600);
            skillActivated = true;
        }
        
        // 대쉬 번개 스킬
        if (behaviors.has('dash_electrify')) {
            this.applyDashElectrify(startX, startY, endX, endY);
            this.showDashSkillActivation('번개 대쉬!', 0x00aaff);
            skillActivated = true;
        }
        
        if (!skillActivated) {
            console.log('⚠️ 대쉬 스킬이 하나도 활성화되지 않음');
        }
    }
    
    // 파동파 스킬 효과 처리
    triggerLightningWaveSkillEffects(playerX, playerY) {
        if (!this.skillSystem.specialBehaviors) return;
        
        const behaviors = this.skillSystem.specialBehaviors;
        
        // 이중 파동파 스킬
        if (behaviors.has('double_shockwave')) {
            this.applyDoubleShockwave(playerX, playerY);
        }
    }
    
    // 대쉬 넉백 스킬 구현 (완전 재설계)
    applyDashKnockback(startX, startY, endX, endY) {
        console.log('🚀 대쉬 넉백 스킬 발동!');
        
        // 대쉬 경로에 시각적 트레일 생성
        this.createDashTrail(startX, startY, endX, endY, 0x00ff00, '넉백');
        
        const hitEnemies = new Set();
        const segments = 15; // 더 세밀한 체크
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const checkX = startX + (endX - startX) * t;
            const checkY = startY + (endY - startY) * t;
            
            // 경로 주변의 적들 찾기
            this.enemies.children.entries.forEach(enemy => {
                if (!enemy || !enemy.active || hitEnemies.has(enemy)) return;
                
                const distance = Phaser.Math.Distance.Between(checkX, checkY, enemy.x, enemy.y);
                if (distance <= 80) { // 더 넓은 판정 범위
                    hitEnemies.add(enemy);
                    
                    // 파동파와 동일한 넉백 적용
                    const knockbackAngle = Phaser.Math.Angle.Between(checkX, checkY, enemy.x, enemy.y);
                    const knockbackForce = 1400; // 파동파와 동일한 넉백력
                    
                    // 파동파와 동일한 넉백 적용 방식
                    enemy.knockbackX = Math.cos(knockbackAngle) * knockbackForce;
                    enemy.knockbackY = Math.sin(knockbackAngle) * knockbackForce;
                    
                    // 강화된 시각 효과
                    this.createEnhancedKnockbackEffect(enemy.x, enemy.y, knockbackAngle);
                }
            });
        }
        
        console.log(`✅ 대쉬 넉백: ${hitEnemies.size}명 적중`);
    }
    
    // 대쉬 공격 스킬 구현 (완전 재설계)
    applyDashDamage(startX, startY, endX, endY) {
        console.log('⚔️ 대쉬 공격 스킬 발동!');
        
        // 공격 트레일 생성
        this.createDashTrail(startX, startY, endX, endY, 0xff4444, '공격');
        
        const hitEnemies = new Set();
        const segments = 15;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const checkX = startX + (endX - startX) * t;
            const checkY = startY + (endY - startY) * t;
            
            this.enemies.children.entries.forEach(enemy => {
                if (!enemy || !enemy.active || hitEnemies.has(enemy)) return;
                
                const distance = Phaser.Math.Distance.Between(checkX, checkY, enemy.x, enemy.y);
                if (distance <= 75) {
                    hitEnemies.add(enemy);
                    
                    // 강한 대미지 적용
                    const damage = 4;
                    enemy.health -= damage;
                    
                    // 강화된 공격 효과
                    this.createSlashEffect(enemy.x, enemy.y);
                    this.showDamageNumber(enemy.x, enemy.y - 30, damage, 0xff4444);
                    
                    // 적 번쩍임 효과
                    enemy.setTint(0xff4444);
                    this.time.delayedCall(200, () => {
                        if (enemy.active) enemy.clearTint();
                    });
                    
                    if (enemy.health <= 0) {
                        // 적 제거 및 점수/에너지 처리
                        this.createExplosion(enemy.x, enemy.y);
                        const energyOrb = this.physics.add.sprite(enemy.x, enemy.y, 'energy');
                        this.energy.add(energyOrb);
                        
                        const points = this.getEnemyPoints(enemy.enemyType);
                        this.score += points;
                        
                        enemy.destroy();
                    }
                }
            });
        }
        
        console.log(`✅ 대쉬 공격: ${hitEnemies.size}명 ${hitEnemies.size * 4} 데미지`);
    }
    
    // 대쉬 폭발 스킬 구현 (완전 재설계)
    applyDashExplosion(endX, endY) {
        console.log('💥 대쉬 폭발 스킬 발동!');
        
        const explosionRadius = 180; // 더 큰 폭발 범위
        let hitCount = 0;
        let totalDamage = 0;
        
        // 메인 폭발 효과 먼저 생성
        this.createMegaExplosion(endX, endY, explosionRadius);
        
        // 50% 크기 파동파 이펙트 추가
        this.createExplosionLightningWave(endX, endY);
        
        // 화면 흔들림
        this.cameras.main.shake(500, 0.08);
        
        // 폭발 범위 내 적들에게 데미지
        this.enemies.children.entries.forEach(enemy => {
            if (!enemy || !enemy.active) return;
            
            const distance = Phaser.Math.Distance.Between(endX, endY, enemy.x, enemy.y);
            if (distance <= explosionRadius) {
                hitCount++;
                
                // 거리에 비례하여 데미지 감소
                const damage = Math.ceil(6 * (1 - distance / explosionRadius)) + 1;
                enemy.health -= damage;
                totalDamage += damage;
                
                // 폭발 넉백
                const knockbackForce = 800 * (1 - distance / explosionRadius);
                const angle = Phaser.Math.Angle.Between(endX, endY, enemy.x, enemy.y);
                
                if (enemy.body && enemy.body.velocity) {
                    enemy.setVelocity(
                        enemy.body.velocity.x + Math.cos(angle) * knockbackForce,
                        enemy.body.velocity.y + Math.sin(angle) * knockbackForce
                    );
                }
                
                // 개별 폭발 효과
                this.time.delayedCall(Phaser.Math.Between(0, 200), () => {
                    this.createExplosion(enemy.x, enemy.y);
                });
                
                // 데미지 표시
                this.showDamageNumber(enemy.x, enemy.y - 40, damage, 0xff6600);
                
                if (enemy.health <= 0) {
                    // 적 제거 및 점수/에너지 처리 (표준 패턴)
                    this.createExplosion(enemy.x, enemy.y);
                    const energyOrb = this.physics.add.sprite(enemy.x, enemy.y, 'energy');
                    this.energy.add(energyOrb);
                    
                    const points = this.getEnemyPoints(enemy.enemyType);
                    this.score += points;
                    
                    enemy.destroy();
                }
            }
        });
        
        // 적 총알도 제거
        if (this.enemyBullets) {
            this.enemyBullets.children.entries.forEach(bullet => {
                if (bullet && bullet.active) {
                    const distance = Phaser.Math.Distance.Between(endX, endY, bullet.x, bullet.y);
                    if (distance <= explosionRadius) {
                        this.createExplosion(bullet.x, bullet.y);
                        bullet.destroy();
                    }
                }
            });
        }
        
        console.log(`✅ 대쉬 폭발: ${hitCount}명 적중, ${totalDamage} 총 데미지`);
    }
    
    // 대쉬 번개 스킬 구현 (완전 재설계)
    applyDashElectrify(startX, startY, endX, endY) {
        console.log('⚡ 대쉬 번개 스킬 발동!');
        
        // 향상된 번개 대쉬 트레일 생성
        this.createLightningDashTrail(startX, startY, endX, endY);
        
        const hitEnemies = new Set();
        const segments = 12;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const checkX = startX + (endX - startX) * t;
            const checkY = startY + (endY - startY) * t;
            
            this.enemies.children.entries.forEach(enemy => {
                if (!enemy || !enemy.active || hitEnemies.has(enemy)) return;
                
                const distance = Phaser.Math.Distance.Between(checkX, checkY, enemy.x, enemy.y);
                if (distance <= 85) {
                    hitEnemies.add(enemy);
                    
                    // 번개 데미지
                    const damage = 3;
                    enemy.health -= damage;
                    
                    // 강화된 번개 효과
                    this.createEnhancedLightningEffect(checkX, checkY, enemy.x, enemy.y);
                    this.showDamageNumber(enemy.x, enemy.y - 30, damage, 0x00aaff);
                    
                    // 감전 효과 (번쩍이는 효과)
                    this.applyElectrifyEffect(enemy);
                    
                    // 대쉬 번개에서 체인 라이트닝 발동
                    if (this.chainLightningSystem) {
                        const chainConfig = {
                            maxJumps: 3,
                            maxRange: 150,
                            damage: damage + 2, // 대쉬 번개 체인은 약간 더 강함
                            damageDecay: 0.8,
                            duration: 120
                        };
                        this.chainLightningSystem.executeChainLightning(enemy, checkX, checkY, chainConfig);
                    }
                    
                    if (enemy.health <= 0) {
                        // 적 제거 및 점수/에너지 처리
                        this.createExplosion(enemy.x, enemy.y);
                        const energyOrb = this.physics.add.sprite(enemy.x, enemy.y, 'energy');
                        this.energy.add(energyOrb);
                        
                        const points = this.getEnemyPoints(enemy.enemyType);
                        this.score += points;
                        
                        enemy.destroy();
                    }
                }
            });
        }
        
        // 체인 라이트닝 효과 (히트된 적들 간에 번개 연결)
        if (hitEnemies.size > 1) {
            this.createChainLightning(Array.from(hitEnemies));
        }
        
        console.log(`✅ 대쉬 번개: ${hitEnemies.size}명 감전, ${hitEnemies.size * 3} 데미지`);
    }
    
    // 이중 파동파 스킬 구현
    applyDoubleShockwave(playerX, playerY) {
        // 버그 수정: 중복 실행 방지 및 게임 상태 체크 추가
        if (!this.player || !this.player.active || this.isSkillSelectionActive || this.doubleShockwaveActive) {
            return;
        }
        
        // 중복 실행 방지 플래그 설정
        this.doubleShockwaveActive = true;
        
        console.log('이중 파동파 스킬 시작 (1초 후 두 번째 발동 예약)');
        
        // 1초 후 두 번째 파동파 (1.3배 크기)
        this.time.delayedCall(1000, () => {
            // 버그 수정: 다시 한번 게임 상태 체크
            if (!this.player || !this.player.active || this.isSkillSelectionActive || this.scene.isPaused()) {
                this.doubleShockwaveActive = false; // 플래그 리셋
                return;
            }
            
            const secondPlayerX = this.player.x;
            const secondPlayerY = this.player.y;
            const enhancedRadius = this.lightningWaveRadius * 1.3; // 1.3배 크기 (적정)
            
            console.log('이중 파동파 두 번째 발동');
            
            // 강화된 화면 플래시
            const flashRect = this.add.rectangle(400, 300, 800, 600, 0xff9900, 0.8).setScrollFactor(0);
            this.tweens.add({
                targets: flashRect,
                alpha: 0,
                duration: 150,
                onComplete: () => flashRect.destroy()
            });
            
            // 확대된 원형 효과
            this.createEnhancedPushWaveEffect(secondPlayerX, secondPlayerY, enhancedRadius);
            
            // 강한 흔들림
            this.cameras.main.shake(400, 0.1);
            
            // 버그 수정: try-catch로 에러 방지
            try {
                // 범위 내 적들 제거 (더 강력한 데미지)
                this.enemies.children.entries.forEach(enemy => {
                    if (!enemy || !enemy.active) return;
                    
                    const distance = Phaser.Math.Distance.Between(secondPlayerX, secondPlayerY, enemy.x, enemy.y);
                    if (distance <= enhancedRadius) {
                        // 거리에 비례하여 더 강한 데미지
                        const damage = Math.ceil(4 * (1 - distance / enhancedRadius));
                        enemy.health -= damage;
                        
                        // 강한 넉백
                        const knockbackForce = 1200;
                        const angle = Phaser.Math.Angle.Between(secondPlayerX, secondPlayerY, enemy.x, enemy.y);
                        
                        if (enemy.body && enemy.body.velocity) {
                            enemy.setVelocity(
                                enemy.body.velocity.x + Math.cos(angle) * knockbackForce,
                                enemy.body.velocity.y + Math.sin(angle) * knockbackForce
                            );
                        }
                        
                        this.createExplosion(enemy.x, enemy.y);
                        
                        if (enemy.health <= 0) {
                            // 적 제거 및 점수/에너지 처리
                            this.createExplosion(enemy.x, enemy.y);
                            const energyOrb = this.physics.add.sprite(enemy.x, enemy.y, 'energy');
                            this.energy.add(energyOrb);
                            
                            const points = this.getEnemyPoints(enemy.enemyType);
                            this.score += points;
                            
                            enemy.destroy();
                        }
                    }
                });
                
                // 적 총알도 제거
                if (this.enemyBullets && this.enemyBullets.children) {
                    this.enemyBullets.children.entries.forEach(bullet => {
                        if (bullet && bullet.active) {
                            const distance = Phaser.Math.Distance.Between(secondPlayerX, secondPlayerY, bullet.x, bullet.y);
                            if (distance <= enhancedRadius) {
                                this.createExplosion(bullet.x, bullet.y);
                                bullet.destroy();
                            }
                        }
                    });
                }
            } catch (error) {
                console.error('이중 파동파 실행 중 오류:', error);
            }
            
            // 실행 완료 후 플래그 리셋
            this.doubleShockwaveActive = false;
        });
    }
    
    // 대형 폭발 효과 생성
    createMassiveExplosion(x, y, radius) {
        // 여러 개의 동심원 폭발 효과
        for (let i = 0; i < 5; i++) {
            const explosionGraphics = this.add.graphics();
            const randomRadius = radius * (0.6 + Math.random() * 0.4);
            
            explosionGraphics.fillStyle(0xff6600, 0.8 - i * 0.15);
            explosionGraphics.fillCircle(x, y, 20);
            
            this.tweens.add({
                targets: explosionGraphics,
                scaleX: randomRadius / 20,
                scaleY: randomRadius / 20,
                alpha: 0,
                duration: 800 + i * 100,
                delay: i * 50,
                ease: 'Power2',
                onComplete: () => explosionGraphics.destroy()
            });
        }
    }
    
    // 확대된 파동 효과 생성
    createEnhancedPushWaveEffect(centerX, centerY, radius) {
        const waveRing = this.add.graphics();
        waveRing.x = centerX;
        waveRing.y = centerY;
        waveRing.lineStyle(12, 0xff9900, 1.0);
        waveRing.strokeCircle(0, 0, 40);
        
        this.tweens.add({
            targets: waveRing,
            scaleX: radius / 40,
            scaleY: radius / 40,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => waveRing.destroy()
        });
    }
    
    // 번개 볼트 이효과 생성
    createLightningBolt(startX, startY, endX, endY) {
        const lightning = this.add.graphics();
        lightning.lineStyle(3, 0x00aaff, 1);
        
        // 지그재그 번개 볼트
        const segments = 8;
        lightning.beginPath();
        lightning.moveTo(startX, startY);
        
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const x = startX + (endX - startX) * t + (Math.random() - 0.5) * 30;
            const y = startY + (endY - startY) * t + (Math.random() - 0.5) * 30;
            lightning.lineTo(x, y);
        }
        
        lightning.lineTo(endX, endY);
        lightning.strokePath();
        
        // 번개 사라지기
        this.tweens.add({
            targets: lightning,
            alpha: 0,
            duration: 200,
            onComplete: () => lightning.destroy()
        });
    }
    
    // ==================== 대쉬 스킬 물리 복구 시스템 ====================
    
    // 플레이어 물리 상태 완전 복구
    restorePlayerPhysics() {
        if (!this.player || !this.player.active) return;
        
        console.log('🔧 플레이어 물리 상태 복구 중...');
        
        try {
            // 속도 완전 초기화
            this.player.setVelocity(0, 0);
            this.player.setAcceleration(0, 0); // 가속도도 초기화
            this.player.setAngularVelocity(0);
            
            // 드래그 및 최대 속도 복구
            this.player.body.setDrag(this.playerDrag || 900);
            this.player.body.setMaxVelocity(this.playerSpeed || 400);
            
            // 충돌 감지 복구
            this.player.body.setEnable(true);
            
            // 물리 바디 활성화
            if (!this.player.body.enable) {
                this.physics.world.enableBody(this.player);
            }
            
            // 플레이어 상태 정리
            this.player.clearTint();
            this.player.setAlpha(1);
            this.player.setScale(1);
            
            // 입력 처리 복구 (중요!)
            if (this.cursors) this.cursors.enabled = true;
            if (this.wasd) this.wasd.enabled = true;
            
            console.log('✅ 플레이어 물리 상태 복구 완료');
            
        } catch (error) {
            console.error('❌ 플레이어 물리 복구 중 오류:', error);
            
            // 페일세이프: 기본값으로 강제 설정
            this.player.setVelocity(0, 0);
            this.player.setAcceleration(0, 0);
            this.player.body.setDrag(900);
            this.player.body.setMaxVelocity(400);
            this.player.clearTint();
            this.player.setAlpha(1);
            this.player.setScale(1);
        }
    }
    
    // 대쉬 스킬 활성화 알림 (간단한 버전)
    showDashSkillActivation(text, color) {
        const skillText = this.add.text(
            this.player.x, 
            this.player.y - 80, 
            text, 
            {
                fontSize: '24px',
                color: `#${color.toString(16).padStart(6, '0')}`,
                stroke: '#000000',
                strokeThickness: 4,
                fontWeight: 'bold'
            }
        ).setOrigin(0.5).setDepth(1000);

        // 텍스트 애니메이션
        this.tweens.add({
            targets: skillText,
            y: skillText.y - 60,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => skillText.destroy()
        });
    }
    
    // 대쉬 트레일 효과 (간단한 버전)
    createDashTrail(startX, startY, endX, endY, color, type) {
        const trail = this.add.graphics();
        trail.lineStyle(8, color, 0.8);
        trail.beginPath();
        trail.moveTo(startX, startY);
        trail.lineTo(endX, endY);
        trail.strokePath();
        
        this.tweens.add({
            targets: trail,
            alpha: 0,
            duration: 600,
            onComplete: () => trail.destroy()
        });
    }
    
    // 강화된 넉백 효과 (간단한 버전)
    createEnhancedKnockbackEffect(x, y, angle) {
        const impact = this.add.graphics();
        impact.lineStyle(6, 0x00ff00, 1);
        impact.strokeCircle(x, y, 20);
        
        this.tweens.add({
            targets: impact,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 400,
            onComplete: () => impact.destroy()
        });
    }
    
    // 슬래시 효과 (간단한 버전)
    createSlashEffect(x, y) {
        const slash = this.add.graphics();
        slash.lineStyle(6, 0xff4444, 1);
        slash.beginPath();
        slash.moveTo(x - 25, y - 25);
        slash.lineTo(x + 25, y + 25);
        slash.moveTo(x + 25, y - 25);
        slash.lineTo(x - 25, y + 25);
        slash.strokePath();
        
        this.tweens.add({
            targets: slash,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => slash.destroy()
        });
    }
    
    // 메가 폭발 효과 (간단한 버전)
    createMegaExplosion(x, y, radius) {
        const explosion = this.add.graphics();
        explosion.fillStyle(0xff6600, 0.8);
        explosion.fillCircle(x, y, 30);
        
        this.tweens.add({
            targets: explosion,
            scaleX: radius / 30,
            scaleY: radius / 30,
            alpha: 0,
            duration: 600,
            onComplete: () => explosion.destroy()
        });
    }
    
    // 폭발 착지용 간단한 파동 이펙트
    createExplosionLightningWave(x, y) {
        const waveRadius = 200; // 고정 크기로 단순화
        
        // 간단한 동그란 파동 이펙트
        const wave = this.add.graphics();
        wave.lineStyle(4, 0x00aaff, 0.8);
        wave.strokeCircle(x, y, 15);
        
        // 확산 애니메이션
        this.tweens.add({
            targets: wave,
            scaleX: waveRadius / 15,
            scaleY: waveRadius / 15,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => wave.destroy()
        });
        
        console.log(`✅ 간단한 폭발 파동 이펙트 생성: ${waveRadius}px 반경`);
    }
    
    // 강화된 번개 효과 (간단한 버전)
    createEnhancedLightningEffect(startX, startY, endX, endY) {
        const lightning = this.add.graphics();
        lightning.lineStyle(4, 0x00aaff, 1);
        lightning.beginPath();
        lightning.moveTo(startX, startY);
        lightning.lineTo(endX, endY);
        lightning.strokePath();
        
        this.tweens.add({
            targets: lightning,
            alpha: 0,
            duration: 200,
            onComplete: () => lightning.destroy()
        });
    }
    
    // 랜덤 번개 내리치기
    createRandomLightningStrike(config) {
        const playerX = this.player.x;
        const playerY = this.player.y;
        
        for (let i = 0; i < config.strikesPerWave; i++) {
            this.time.delayedCall(i * 100, () => {
                // 최적 위치 선택
                let strikeX, strikeY;
                const nearbyEnemies = this.enemies.children.entries.filter(enemy => 
                    enemy.active && Phaser.Math.Distance.Between(
                        playerX, playerY, enemy.x, enemy.y
                    ) <= 300
                );
                
                if (nearbyEnemies.length > 0) {
                    const target = nearbyEnemies[Math.floor(Math.random() * nearbyEnemies.length)];
                    strikeX = target.x + (Math.random() - 0.5) * 60;
                    strikeY = target.y + (Math.random() - 0.5) * 60;
                } else {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 100 + Math.random() * 200;
                    strikeX = playerX + Math.cos(angle) * distance;
                    strikeY = playerY + Math.sin(angle) * distance;
                }
                
                // 바로 번개 실행 (경고 효과 제거)
                this.time.delayedCall(100, () => {
                    // 실제 번개
                    this.createLightningStrikeEffect(strikeX, strikeY);
                    
                    // 범위 내 적들에게 데미지
                    this.enemies.children.entries.forEach(enemy => {
                        if (enemy.active) {
                            const distance = Phaser.Math.Distance.Between(strikeX, strikeY, enemy.x, enemy.y);
                            if (distance <= config.range) {
                                enemy.health -= config.damage;
                                this.showDamageNumber(enemy.x, enemy.y - 30, config.damage, 0x00aaff); // 체인라이트닝과 같은 파란색
                                this.applyElectrifyEffect(enemy);
                                
                                if (enemy.health <= 0) {
                                    this.createExplosion(enemy.x, enemy.y);
                                    const energyOrb = this.physics.add.sprite(enemy.x, enemy.y, 'energy');
                                    this.energy.add(energyOrb);
                                    const points = this.getEnemyPoints(enemy.enemyType);
                                    this.score += points;
                                    enemy.destroy();
                                }
                            }
                        }
                    });
                });
            });
        }
    }
    
    // 번개 내리치기 시각 효과
    createLightningStrikeEffect(x, y) {
        // 메인 번개 기둥 (체인라이트닝과 같은 파란상)
        const lightning = this.add.graphics();
        lightning.lineStyle(6, 0x87CEEB, 1.0);
        
        const startY = y - 300;
        const points = [{x: x, y: startY}];
        
        // 지그재그 포인트들 생성
        for (let i = 1; i < 6; i++) {
            const progress = i / 6;
            const currentY = startY + (y - startY) * progress;
            const randomX = x + (Math.random() - 0.5) * 25 * (1 - progress);
            points.push({x: randomX, y: currentY});
        }
        points.push({x: x, y: y});
        
        // 번개 그리기
        lightning.beginPath();
        lightning.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            lightning.lineTo(points[i].x, points[i].y);
        }
        lightning.strokePath();
        
        // 글로우 효과 (체인라이트닝과 같은 진한 파란색)
        const glow = this.add.graphics();
        glow.lineStyle(15, 0x4169E1, 0.4);
        glow.beginPath();
        glow.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            glow.lineTo(points[i].x, points[i].y);
        }
        glow.strokePath();
        
        // 타격 지점 폭발 (체인라이트닝과 같은 파란색)
        const explosion = this.add.circle(x, y, 20, 0x00aaff, 0.8);
        
        // 애니메이션
        this.tweens.add({
            targets: [lightning, glow],
            alpha: 0,
            duration: 400,
            onComplete: () => {
                lightning.destroy();
                glow.destroy();
            }
        });
        
        this.tweens.add({
            targets: explosion,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 500,
            onComplete: () => explosion.destroy()
        });
        
        // 스파크 파티클
        for (let i = 0; i < 15; i++) {
            const particle = this.add.circle(x, y, 3, 0xffff00, 0.9);
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scaleX: 0.2,
                scaleY: 0.2,
                duration: 300 + Math.random() * 300,
                ease: 'Power2.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    // 감전 효과 (간단한 버전)
    applyElectrifyEffect(enemy) {
        if (!enemy.active) return;
        
        // 번쩍이는 효과
        let flickerCount = 0;
        const flickerTimer = this.time.addEvent({
            delay: 100,
            callback: () => {
                if (enemy.active) {
                    enemy.setTint(flickerCount % 2 === 0 ? 0x00aaff : 0xffffff);
                    flickerCount++;
                    if (flickerCount >= 6) {
                        enemy.clearTint();
                        flickerTimer.destroy();
                    }
                }
            },
            repeat: 5
        });
    }
    
    // 번개 대쉬 트레일 효과
    createLightningDashTrail(startX, startY, endX, endY) {
        const totalDistance = Phaser.Math.Distance.Between(startX, startY, endX, endY);
        const segments = Math.max(8, Math.floor(totalDistance / 25)); // 거리에 따른 세그먼트 수
        
        // 메인 번개 경로
        const mainLightning = this.add.graphics();
        mainLightning.lineStyle(6, 0x87CEEB, 1.0);
        
        // 글로우 효과
        const glowLightning = this.add.graphics();
        glowLightning.lineStyle(12, 0x4169E1, 0.4);
        
        const points = [{x: startX, y: startY}];
        
        // 지그재그 번개 경로 생성
        for (let i = 1; i < segments; i++) {
            const progress = i / segments;
            const baseX = startX + (endX - startX) * progress;
            const baseY = startY + (endY - startY) * progress;
            
            // 수직 방향으로 랜덤 지그재그
            const perpX = -(endY - startY);
            const perpY = (endX - startX);
            const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
            
            if (perpLength > 0) {
                const normalizedPerpX = perpX / perpLength;
                const normalizedPerpY = perpY / perpLength;
                const deviation = (Math.random() - 0.5) * 30; // 지그재그 강도
                
                points.push({
                    x: baseX + normalizedPerpX * deviation,
                    y: baseY + normalizedPerpY * deviation
                });
            } else {
                points.push({x: baseX, y: baseY});
            }
        }
        
        points.push({x: endX, y: endY});
        
        // 번개 그리기
        mainLightning.beginPath();
        glowLightning.beginPath();
        mainLightning.moveTo(points[0].x, points[0].y);
        glowLightning.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            mainLightning.lineTo(points[i].x, points[i].y);
            glowLightning.lineTo(points[i].x, points[i].y);
        }
        
        mainLightning.strokePath();
        glowLightning.strokePath();
        
        // 경로를 따라 간단한 스파크 효과 생성
        for (let i = 0; i < points.length - 1; i++) {
            if (i % 2 === 0) { // 간헐적으로만 스파크 생성
                const spark = this.add.circle(points[i].x, points[i].y, 2, 0xFFFF00, 0.8);
                
                this.tweens.add({
                    targets: spark,
                    alpha: 0,
                    scaleX: 0.3,
                    scaleY: 0.3,
                    duration: 200,
                    delay: i * 50,
                    ease: 'Power2.easeOut',
                    onComplete: () => spark.destroy()
                });
            }
        }
        
        // 시작점과 끝점에 강한 번개 효과
        this.createLightningBurst(startX, startY, 15);
        this.createLightningBurst(endX, endY, 20);
        
        // 번개 애니메이션 (깜빡이며 사라짐)
        this.tweens.add({
            targets: [mainLightning, glowLightning],
            alpha: 0,
            duration: 600,
            ease: 'Power2.easeOut',
            onComplete: () => {
                mainLightning.destroy();
                glowLightning.destroy();
            }
        });
    }
    
    // 번개 폭발 효과
    createLightningBurst(x, y, radius) {
        const burst = this.add.circle(x, y, radius, 0x87CEEB, 0.8);
        
        // 폭발 애니메이션
        this.tweens.add({
            targets: burst,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 400,
            ease: 'Power2.easeOut',
            onComplete: () => burst.destroy()
        });
        
        // 간단한 번개 링 효과 (8방향 가지 제거)
        const ring = this.add.circle(x, y, radius * 1.5, 0x87CEEB, 0);
        ring.setStrokeStyle(2, 0x87CEEB, 0.6);
        
        this.tweens.add({
            targets: ring,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 300,
            ease: 'Power2.easeOut',
            onComplete: () => ring.destroy()
        });
    }
    
    // 데미지 숫자 표시 (간단한 버전)
    showDamageNumber(x, y, damage, color) {
        const damageText = this.add.text(x, y, `-${damage}`, {
            fontSize: '16px',
            color: `#${color.toString(16).padStart(6, '0')}`,
            stroke: '#000000',
            strokeThickness: 2,
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: damageText,
            y: y - 40,
            alpha: 0,
            duration: 800,
            onComplete: () => damageText.destroy()
        });
    }
    
    // 체인 라이트닝 효과 (간단한 버전)
    createChainLightning(enemies) {
        if (!enemies || enemies.length < 2) return;
        
        for (let i = 0; i < enemies.length - 1; i++) {
            const current = enemies[i];
            const next = enemies[i + 1];
            
            if (current && current.active && next && next.active) {
                this.time.delayedCall(i * 100, () => {
                    this.createEnhancedLightningEffect(current.x, current.y, next.x, next.y);
                });
            }
        }
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score;
        this.finalTime = data.time;
        this.finalLevel = data.level;
        this.finalWave = data.wave;
        this.finalBulletCount = data.bulletCount;
        this.finalEliteKills = data.eliteKills;
    }

    create() {
        // 검은색 반투명 전체 배경
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85);
        
        // 게임오버 메인 텍스트
        const gameOverText = this.add.text(400, 150, 'GAME OVER', {
            fontSize: '64px',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 4,
            fontWeight: 'bold'
        }).setOrigin(0.5).setAlpha(0);
        
        // 게임오버 텍스트 애니메이션
        this.tweens.add({
            targets: gameOverText,
            alpha: 1,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 800,
            ease: 'Power2.easeOut'
        });
        
        // 통계 컨테이너
        const statsContainer = this.add.container(400, 280);
        
        // 간단한 통계 표시
        const mainStats = [
            `Score: ${this.finalScore.toLocaleString()}`,
            `Time: ${Math.floor(this.finalTime / 60)}m ${this.finalTime % 60}s`,
            `Wave: ${this.finalWave}   Bullets: ${this.finalBulletCount}   Elites: ${this.finalEliteKills}`
        ];
        
        mainStats.forEach((stat, index) => {
            const statText = this.add.text(0, index * 30, stat, {
                fontSize: index === 2 ? '16px' : '22px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setAlpha(0);
            
            statsContainer.add(statText);
            
            // 통계 텍스트 페이드인 애니메이션
            this.tweens.add({
                targets: statText,
                alpha: 1,
                duration: 600,
                delay: 400 + (index * 200)
            });
        });
        
        // 큰 Replay 버튼
        const replayButton = this.add.rectangle(400, 450, 200, 60, 0x4CAF50, 0.9);
        replayButton.setStrokeStyle(3, 0xffffff);
        replayButton.setInteractive();
        replayButton.setAlpha(0);
        
        const replayText = this.add.text(400, 450, 'REPLAY', {
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            fontWeight: 'bold'
        }).setOrigin(0.5).setAlpha(0);
        
        // Replay 버튼 애니메이션
        this.tweens.add({
            targets: [replayButton, replayText],
            alpha: 1,
            duration: 600,
            delay: 1200
        });
        
        // 작은 안내 텍스트
        const hintText = this.add.text(400, 520, 'Press SPACE or click REPLAY', {
            fontSize: '16px',
            color: '#aaaaaa',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5).setAlpha(0);
        
        this.tweens.add({
            targets: hintText,
            alpha: 1,
            duration: 600,
            delay: 1400
        });
        
        // 버튼 이벤트
        const restartGame = () => {
            this.scene.stop();
            this.scene.stop('GameScene');
            this.scene.start('GameScene');
        };
        
        replayButton.on('pointerdown', restartGame);
        
        // 호버 효과
        replayButton.on('pointerover', () => {
            replayButton.setFillStyle(0x66BB6A, 1);
            this.tweens.add({
                targets: [replayButton, replayText],
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 150,
                ease: 'Power2.easeOut'
            });
        });
        
        replayButton.on('pointerout', () => {
            replayButton.setFillStyle(0x4CAF50, 0.9);
            this.tweens.add({
                targets: [replayButton, replayText],
                scaleX: 1,
                scaleY: 1,
                duration: 150,
                ease: 'Power2.easeOut'
            });
        });
        
        // 스페이스바로도 재시작
        this.input.keyboard.once('keydown-SPACE', restartGame);
        
        // 마우스 클릭으로도 재시작 (아무 곳이나)
        this.input.once('pointerdown', restartGame);
    }
}

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
        
        console.log(`⚡ 체인 라이트닝 시작: ID=${chainId}, 타겟=${initialTarget.enemyType || 'unknown'}`);
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
            
            // 점수 추가
            const points = this.game.getEnemyPoints ? this.game.getEnemyPoints(target.enemyType) : 100;
            this.game.score += points;
            
            // 적 제거
            target.destroy();
        }
    }
    
    // 체인 종료 처리
    endChain(chainId) {
        const chainData = this.activeChains.get(chainId);
        if (!chainData) return;
        
        console.log(`⚡ 체인 라이트닝 종료: ID=${chainId}, 총 ${chainData.targets.length}개 타겟`);
        
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
}

// Export main classes for modular use
export { StatModifierEngine, TitleScene, GameScene, GameOverScene, skillDefinitions, ChainLightningSystem };

// 게임 인스턴스 생성은 main.js에서 담당
// 이곳에서는 클래스 정의만 export