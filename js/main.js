import { GAME_CONFIG } from './utils/Constants.js';
import { TitleScene } from './scenes/TitleScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

// Temporarily import GameScene from the original refactored file
// TODO: Fully extract GameScene into modular components
import { GameScene } from './game_refactored.js';

// Phaser 게임 설정
const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.SCREEN_WIDTH,
    height: GAME_CONFIG.SCREEN_HEIGHT,
    parent: 'game-container',
    backgroundColor: GAME_CONFIG.COLORS.BACKGROUND,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [TitleScene, GameScene, GameOverScene]
};

// 게임 인스턴스 생성
const game = new Phaser.Game(config);

// 게임 인스턴스를 전역으로 내보내기 (필요한 경우)
window.game = game;