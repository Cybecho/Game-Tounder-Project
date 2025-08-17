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
    },
    
    // === 신규 전기 스킬들 ===
    
    electric_field: {
        id: 'electric_field',
        name: '전기장판',
        description: '플레이어 주위에 전기장판을 둡니다. 장판은 주기적으로 적에게 데미지를 입히며, 중첩때마다 장판의 크기가 더 커집니다 (최대 3회 중첩)',
        category: 'skill',
        rarity: 'rare',
        stackable: true,
        maxStacks: 3,
        probability: 0.04,
        effect: {
            type: 'special_behavior',
            action: 'activate_electric_field',
            value: 1
        }
    },
    
    missile_chain_lightning: {
        id: 'missile_chain_lightning',
        name: '미사일 전기 체인',
        description: '유도미사일 활성화시에만 등장합니다. 20% 확률로, 유도미사일이 가격한 적 주변 다른적에게 전기 체인 공격을 1회 전이합니다 (중첩했을때, 최대 2회까지 전이됩니다)',
        category: 'skill',
        rarity: 'epic',
        stackable: true,
        maxStacks: 2,
        probability: 0.03,
        prerequisite: 'guided_missile',
        effect: {
            type: 'special_behavior',
            action: 'activate_missile_chain_lightning',
            value: 1
        }
    },
    
    // === 새로운 총알 스킬들 ===
    
    damage_speed_tradeoff: {
        id: 'damage_speed_tradeoff',
        name: '강력한 총알',
        description: '총알 공격력이 높아지지만, 총알 발사속도는 약간 줄어듭니다 (최대 3회)',
        category: 'passive',
        rarity: 'uncommon',
        stackable: true,
        maxStacks: 3,
        probability: 0.08,
        effect: {
            type: 'stat_modifier',
            target: 'bulletDamage',
            operation: 'multiply',
            value: 1.5,
            secondaryEffect: {
                target: 'fireRate',
                operation: 'multiply',
                value: 1.2 // 발사속도 20% 증가 (더 느려짐)
            }
        }
    },
    
    double_shot: {
        id: 'double_shot',
        name: '연속 사격',
        description: '총알을 발사할때, 연속으로 한번 더 발사합니다. 하지만 총알의 피해가 40% 줄어듭니다',
        category: 'passive',
        rarity: 'rare',
        stackable: false,
        probability: 0.05,
        effect: {
            type: 'special_behavior',
            action: 'enable_double_shot',
            value: 1
        }
    },
    
    enhanced_knockback: {
        id: 'enhanced_knockback',
        name: '강화된 넉백',
        description: '총알의 넉백이 강화됩니다',
        category: 'passive',
        rarity: 'common',
        stackable: false,
        probability: 0.07,
        effect: {
            type: 'stat_modifier',
            target: 'bulletKnockback',
            operation: 'multiply',
            value: 2.0
        }
    },
    
    improved_accuracy: {
        id: 'improved_accuracy',
        name: '정확도 향상',
        description: '총알의 정확도가 더 높아집니다',
        category: 'passive',
        rarity: 'common',
        stackable: false,
        probability: 0.06,
        effect: {
            type: 'stat_modifier',
            target: 'bulletAccuracy',
            operation: 'multiply',
            value: 1.5
        }
    },
    
    larger_bullets: {
        id: 'larger_bullets',
        name: '대형 총알',
        description: '총알의 크기가 더 커집니다',
        category: 'passive',
        rarity: 'common',
        stackable: false,
        probability: 0.06,
        effect: {
            type: 'stat_modifier',
            target: 'bulletSize',
            operation: 'multiply',
            value: 2.5 // 2.0 → 2.5로 더 크게 증가
        }
    },
    
    explosive_bullets: {
        id: 'explosive_bullets',
        name: '폭발 총알',
        description: '총알이 대폭발하며, 주위 반경 적에게 강력한 범위 공격을 가합니다. 범위안에 있는 적은 총알의 60% 데미지를 입습니다',
        category: 'passive',
        rarity: 'rare',
        stackable: false,
        probability: 0.04,
        effect: {
            type: 'special_behavior',
            action: 'enable_explosive_bullets',
            value: 1
        }
    },
    
    // === 폭발 총알 조건부 스킬들 ===
    
    enhanced_explosion_radius: {
        id: 'enhanced_explosion_radius',
        name: '확장된 폭발',
        description: '총알의 폭발 반경이 더 커집니다. 폭발 반경 내 적들에게 기본 공격력의 50% 데미지를 입힙니다 (최대 3회)',
        category: 'passive',
        rarity: 'uncommon',
        stackable: true,
        maxStacks: 3,
        probability: 0.07,
        prerequisite: 'explosive_bullets', // 폭발 총알 스킬 필요
        effect: {
            type: 'stat_modifier',
            target: 'explosionRadiusMultiplier',
            operation: 'add',
            value: 0.3 // 30% 반경 증가
        }
    },
    
    shrapnel_explosion: {
        id: 'shrapnel_explosion',
        name: '파편 폭발',
        description: '총알이 폭발하면, 주위에 3개의 작은 파편으로 나뉘어 잠시 시간 후에 작은 크기로 폭발합니다',
        category: 'passive',
        rarity: 'rare',
        stackable: false,
        probability: 0.05,
        prerequisite: 'explosive_bullets', // 폭발 총알 스킬 필요
        effect: {
            type: 'special_behavior',
            action: 'enable_shrapnel_explosion',
            value: 1
        }
    }
};

// 모듈 export (ES6 모듈과 CommonJS 둘 다 지원)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = skillDefinitions;
}

// 전역 스코프에도 등록 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.skillDefinitions = skillDefinitions;
}