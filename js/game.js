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
        
        // 월드 경계 설정
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
        
        // 격자 배경 생성
        this.createGridBackground();
        
        this.player = this.physics.add.sprite(this.worldWidth / 2, this.worldHeight / 2, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDrag(this.playerDrag);
        this.player.setMaxVelocity(this.playerSpeed);
        
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group(); // 적 총알 그룹 추가
        this.energy = this.physics.add.group();
        this.bulletUpgrades = this.physics.add.group();
        this.explosions = this.add.group();
        this.dashEffects = this.add.group();
        
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.lKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
        
        // 마우스 클릭 이벤트 추가
        this.input.on('pointerdown', this.onPointerDown, this);
        
        // 카메라 설정
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        
        this.createUI();
        
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
        
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.energy, this.collectEnergy, null, this);
        this.physics.add.overlap(this.player, this.bulletUpgrades, this.collectBulletUpgrade, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHit, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHitByBullet, null, this);
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
    }

    onPointerDown(pointer) {
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
        
        // 대쉬 효과 지속 시간 (200ms로 단축)
        this.time.delayedCall(200, () => {
            this.isDashing = false;
            if (this.player.active) {
                this.player.setTint(0xffffff);
                this.player.setAlpha(1);
                this.player.setScale(1);
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
        eliteMonster.health = 50; // 10배 이상의 체력
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
        
        console.log(`Elite monster spawned! Current elite count: ${this.currentEliteCount}`);
    }
    
    spawnPentagonMonster() {
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
        pentagonMonster.health = 8; // 중간 정도 체력
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
        
        console.log(`Pentagon monster #${this.pentagonCount} spawned at (${clampedX}, ${clampedY}) with ${pentagonMonster.health} health`);
    }
    
    spawnStarEliteMonster() {
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
        starEliteMonster.health = 45; // 엘리트보다 약간 적은 체력
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
        
        console.log(`Star elite monster spawned! Current elite count: ${this.currentEliteCount}`);
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
        this.gameTime += 1;
        
        // 20초마다 난이도 증가
        if (this.gameTime % 20 === 0) {
            console.log(`Wave ${this.difficultyLevel + 1} starting...`);
            this.increaseDifficulty();
        }
    }

    increaseDifficulty() {
        this.difficultyLevel += 1;
        
        // 스폰 속도 증가 (최소 400ms)
        this.enemySpawnRate = Math.max(400, 1200 - (this.difficultyLevel * 80));
        
        // 웨이브당 적 수 증가 (최대 4마리)
        this.enemiesPerWave = Math.min(4, Math.floor(this.difficultyLevel / 3) + 1);
        
        // 적 기본 속도 증가
        this.baseEnemySpeed = 100 + (this.difficultyLevel * 12);
        
        // 5웨이브마다 오각형 몬스터 스폰
        if (this.difficultyLevel % this.pentagonWaveInterval === 0) {
            console.log(`Pentagon monster should spawn at wave ${this.difficultyLevel}`);
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
            console.log('Lightning wave already active, skipping...'); // 디버그용
            return;
        }
        
        const playerX = this.player.x;
        const playerY = this.player.y;
        
        console.log('Lightning wave activated'); // 디버그용
        
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
                    enemy.health -= 1;
                    
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
        for (let i = 0; i < this.enemiesPerWave; i++) {
            this.time.delayedCall(i * 150, () => {
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
        
        const difficultyMultiplier = 1 + (this.difficultyLevel * 0.15);
        const enemyTypes = ['enemy1', 'enemy2', 'enemy3'];
        const enemyType = enemyTypes[Phaser.Math.Between(0, 2)];
        
        const enemy = this.physics.add.sprite(clampedX, clampedY, enemyType);
        enemy.enemyType = enemyType;
        enemy.health = this.getEnemyHealth(enemyType) * Math.ceil(difficultyMultiplier);
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
            case 'enemy1': return 1;
            case 'enemy2': return 2;
            case 'enemy3': return 3;
            case 'pentagon_monster': return 8;
            case 'elite_monster': return 50;
            case 'star_elite_monster': return 45;
            default: return 1;
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
            
            console.log('Star elite monster started dash!');
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
                console.log('Star elite monster finished dash!');
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
        
        enemy.health -= 1;
        
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
        
        console.log(`Bullet upgrade collected! New bullet count: ${this.bulletCount}`);
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
        this.fireRate = Math.max(80, 200 - (this.weaponLevel - 1) * 15);
        this.fireRange = Math.min(500, 300 + (this.weaponLevel - 1) * 30);
        
        // 10레벨마다 총알 개수 증가 (레벨 10, 20, 30에서 증가)
        if (this.weaponLevel % 10 === 0 && this.weaponLevel <= 30) {
            this.bulletCount += 1;
            console.log(`Level ${this.weaponLevel}: Bullet count increased to ${this.bulletCount}!`);
            
            // 총알 증가 시각적 피드백
            this.tweens.add({
                targets: this.bulletCountText,
                scaleX: 2,
                scaleY: 2,
                duration: 300,
                yoyo: true,
                ease: 'Power2'
            });
        }
        
        console.log(`Level Up! New level: ${this.weaponLevel}`); // 디버그용
        
        // 새로운 레벨업 연출
        this.performLevelUpSequence();
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
        console.log('Level up sequence completed'); // 디버그용
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

    playerHit(player, enemy) {
        // 대쉬 중이나 번개 파동파 사용 중이나 무적 상태에는 피격 무시
        if (this.isDashing || this.isLightningWaveActive || this.isPlayerInvincible) {
            enemy.destroy();
            return;
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

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#0a0a1a',
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: [TitleScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);