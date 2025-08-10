import { SKILL_CONFIG } from '../utils/Constants.js';

// 스킬 정의
export const skillDefinitions = {
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
    }
};

// 스킬 시스템 클래스
export class SkillSystem {
    constructor(gameScene) {
        this.game = gameScene;
        this.selectedSkills = new Set();
        this.skillStacks = new Map();
        this.specialBehaviors = new Set();
        this.barrierCharges = 0;
        this.maxBarrierCharges = 3;
    }
    
    generateRandomSkills(count = 3) {
        const availableSkills = this.getAvailableSkills();
        const selectedSkills = [];
        const usedCategories = new Set();
        
        for (let i = 0; i < count && availableSkills.length > 0; i++) {
            const skill = this.weightedRandomSkillSelection(availableSkills, usedCategories);
            if (skill) {
                selectedSkills.push(skill);
                usedCategories.add(skill.category);
                // 선택된 스킬을 가용 목록에서 제거 (중복 방지)
                availableSkills.splice(availableSkills.indexOf(skill), 1);
            }
        }
        
        return selectedSkills;
    }
    
    getAvailableSkills() {
        return Object.values(skillDefinitions).filter(skill => {
            if (this.selectedSkills.has(skill.id)) {
                // 이미 선택된 스킬인 경우, 스택 가능하고 최대 스택에 도달하지 않았을 때만 사용 가능
                if (skill.stackable) {
                    const currentStacks = this.skillStacks.get(skill.id) || 0;
                    return currentStacks < (skill.maxStacks || 1);
                }
                return false;
            }
            return true;
        });
    }
    
    weightedRandomSkillSelection(availableSkills, usedCategories) {
        // 카테고리별로 스킬 분류
        const skillsByCategory = {
            active: availableSkills.filter(skill => skill.category === 'active'),
            passive: availableSkills.filter(skill => skill.category === 'passive'), 
            skill: availableSkills.filter(skill => skill.category === 'skill')
        };
        
        // 사용되지 않은 카테고리 중에서 선택
        const availableCategories = Object.keys(skillsByCategory).filter(cat => 
            !usedCategories.has(cat) && skillsByCategory[cat].length > 0
        );
        
        if (availableCategories.length === 0) {
            // 모든 카테고리가 사용된 경우, 남은 스킬 중 랜덤 선택
            return this.randomSkillFromList(availableSkills);
        }
        
        // 카테고리 가중치에 따라 선택
        const categoryWeights = SKILL_CONFIG.CATEGORY_WEIGHTS;
        const category = this.weightedRandomChoice(availableCategories, cat => categoryWeights[cat]);
        
        return this.randomSkillFromList(skillsByCategory[category]);
    }
    
    randomSkillFromList(skillList) {
        if (skillList.length === 0) return null;
        
        // 확률 가중치 기반 선택
        const totalWeight = skillList.reduce((sum, skill) => sum + skill.probability, 0);
        let random = Math.random() * totalWeight;
        
        for (const skill of skillList) {
            random -= skill.probability;
            if (random <= 0) {
                return skill;
            }
        }
        
        return skillList[skillList.length - 1]; // 폴백
    }
    
    weightedRandomChoice(items, weightFunction) {
        const weights = items.map(weightFunction);
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[items.length - 1]; // 폴백
    }
    
    selectSkill(skill) {
        this.selectedSkills.add(skill.id);
        
        if (skill.stackable) {
            const currentStacks = this.skillStacks.get(skill.id) || 0;
            this.skillStacks.set(skill.id, currentStacks + 1);
        } else {
            this.skillStacks.set(skill.id, 1);
        }
    }
    
    getSkillStack(skillId) {
        return this.skillStacks.get(skillId) || 0;
    }
    
    hasSkill(skillId) {
        return this.selectedSkills.has(skillId);
    }
}