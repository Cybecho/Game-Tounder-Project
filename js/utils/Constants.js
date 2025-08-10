// 게임 상수 정의
export const GAME_CONFIG = {
    // 화면 크기
    SCREEN_WIDTH: 800,
    SCREEN_HEIGHT: 600,
    
    // 플레이어 기본값
    PLAYER_SPEED: 400,
    PLAYER_ACCELERATION: 1200,
    PLAYER_DRAG: 900,
    PLAYER_MAX_HEALTH: 3,
    
    // 대쉬 시스템
    DASH_CHARGES: 3,
    DASH_COOLDOWN: 4000,
    DASH_DISTANCE: 120,
    
    // 번개 파동파
    LIGHTNING_WAVE_COOLDOWN: 15000,
    LIGHTNING_WAVE_RADIUS: 800,
    LIGHTNING_WAVE_KNOCKBACK: 1400,
    
    // 무기 시스템
    INITIAL_FIRE_RATE: 200,
    INITIAL_BULLET_SPEED: 700,
    INITIAL_BULLET_COUNT: 1,
    INITIAL_FIRE_RANGE: 300,
    MAX_BULLET_COUNT: 8,
    
    // 적 시스템
    INITIAL_ENEMY_SPAWN_RATE: 3000,
    INITIAL_ENEMIES_PER_WAVE: 3,
    MAX_ENEMIES: 50,
    ELITE_SPAWN_CHANCE: 0.20,
    ELITE_SPAWN_INTERVAL: 35000,
    
    // 레벨 시스템
    MAX_LEVEL: 30,
    INITIAL_EXPERIENCE_TO_NEXT: 100,
    EXPERIENCE_SCALING: 75,
    
    // 맵 크기
    WORLD_WIDTH: 1600,
    WORLD_HEIGHT: 1200,
    
    // UI 색상
    COLORS: {
        PRIMARY: 0x4CAF50,
        SECONDARY: 0x2E7D32,
        ACCENT: 0x81C784,
        BACKGROUND: 0x0a0a1a,
        TEXT: 0xffffff,
        TEXT_SECONDARY: 0xcccccc,
        HEALTH_BAR: 0x4CAF50,
        EXPERIENCE_BAR: 0x4CAF50,
        BARRIER: 0x88ff88,
        DAMAGE_TEXT: 0xff4444,
        HEAL_TEXT: 0x4CAF50
    }
};

// 스킬 상수
export const SKILL_CONFIG = {
    CATEGORIES: {
        ACTIVE: 'active',
        PASSIVE: 'passive', 
        SKILL: 'skill'
    },
    
    RARITIES: {
        COMMON: 'common',
        UNCOMMON: 'uncommon',
        RARE: 'rare',
        LEGENDARY: 'legendary'
    },
    
    CATEGORY_WEIGHTS: {
        active: 0.50,
        passive: 0.35,
        skill: 0.15
    },
    
    RARITY_WEIGHTS: {
        common: 0.60,
        uncommon: 0.25,
        rare: 0.12,
        legendary: 0.03
    }
};

// 적 타입 상수
export const ENEMY_CONFIG = {
    TYPES: {
        NORMAL: 'normal',
        ELITE: 'elite', 
        PENTAGON: 'pentagon',
        STAR_ELITE: 'star_elite'
    },
    
    STATS: {
        normal: { health: 3, speed: 100, points: 10 },
        elite: { health: 6, speed: 80, points: 25 },
        pentagon: { health: 8, speed: 60, points: 100 },
        star_elite: { health: 12, speed: 120, points: 50 }
    }
};