// 게임 오버 화면
import { GAME_CONFIG } from '../utils/Constants.js';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }
    
    init(data) {
        this.finalScore = data.score || 0;
        this.finalTime = data.time || 0;
        this.finalLevel = data.level || 1;
        this.finalWave = data.wave || 1;
        this.finalBulletCount = data.bulletCount || 1;
        this.finalEliteKills = data.eliteKills || 0;
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