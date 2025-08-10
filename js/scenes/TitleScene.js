// 타이틀 화면
export class TitleScene extends Phaser.Scene {
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
        
        // 스페이스바 입력
        this.input.keyboard.on('keydown-SPACE', startGame);
    }
}