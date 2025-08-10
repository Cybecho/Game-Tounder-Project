// GameEngine.js - Main game logic export
// For now, we'll import and re-export the GameScene from the original file
// This allows us to use the modular structure while keeping the complex GameScene intact

// Import the new modular components
import { GAME_CONFIG, SKILL_CONFIG, ENEMY_CONFIG } from '../utils/Constants.js';
import { StatModifierEngine } from './StatModifier.js';
import { skillDefinitions, SkillSystem } from '../systems/SkillSystem.js';

// Re-export everything for use in main.js
export { GAME_CONFIG, SKILL_CONFIG, ENEMY_CONFIG, StatModifierEngine, skillDefinitions, SkillSystem };

// For now, we'll keep the GameScene in the original file until full extraction
// This allows gradual migration to the modular structure
// TODO: Extract GameScene into separate modular components

// Temporary: GameScene will be imported by main.js directly from game_refactored.js