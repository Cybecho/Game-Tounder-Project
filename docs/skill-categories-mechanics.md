# 스킬 카테고리 및 메커니즘 상세 문서

## 1. 스킬 카테고리 개요

### 1.1 카테고리별 등장 확률
- **Active (50%)**: 즉시 효과 또는 시간 제한 버프
- **Passive (35%)**: 영구적인 능력치 향상
- **Skill (15%)**: 기존 스킬(대쉬, 파동파) 강화

### 1.2 희귀도 시스템
- **Common (60%)**: 기본적인 스탯 증가
- **Uncommon (25%)**: 특수 효과 포함
- **Rare (12%)**: 강력한 변화 또는 새로운 메커니즘
- **Legendary (3%)**: 게임 플레이를 크게 바꾸는 스킬

## 2. Active 스킬 카테고리 (50%)

### 2.1 즉석 아이템 (25%)

#### 방어 배리어
```javascript
instant_barrier: {
    name: '방어 배리어',
    description: '공격을 1회 막아주는 베리어 생성 (최대 3회 중첩)',
    rarity: 'common',
    stackable: true,
    maxStacks: 3,
    effect: {
        type: 'instant',
        action: 'add_barrier_charge',
        value: 1
    },
    implementation: {
        onSelect: () => {
            this.playerSkills.barrierCharges = Math.min(
                this.playerSkills.barrierCharges + 1, 
                this.playerSkills.maxBarrierCharges
            );
            this.updateBarrierUI();
        },
        onPlayerHit: () => {
            if (this.playerSkills.barrierCharges > 0) {
                this.playerSkills.barrierCharges--;
                this.showBarrierBreakEffect();
                return true; // 피해 무시
            }
            return false;
        }
    }
}
```

#### 즉시 회복
```javascript
instant_heal: {
    name: '응급 치료',
    description: '체력을 1 회복합니다',
    rarity: 'common',
    stackable: false,
    effect: {
        type: 'instant',
        action: 'heal_player',
        value: 1
    },
    implementation: {
        onSelect: () => {
            this.playerHealth = Math.min(this.playerHealth + 1, this.maxPlayerHealth);
            this.updateHealthUI();
            this.showHealEffect();
        }
    }
}
```

### 2.2 버프 아이템 (25%)

#### 민첩성 버프
```javascript
agility_buff: {
    name: '민첩성 강화',
    description: '30초동안 조작감이 매우 민첩해집니다 (미끄러짐 감소)',
    rarity: 'uncommon',
    stackable: false,
    effect: {
        type: 'timed_buff',
        buffId: 'agility_boost',
        duration: 30000,
        modifiers: {
            playerDrag: 1500, // 기본 900에서 1500으로
            playerAcceleration: 1800 // 기본 1200에서 1800으로
        }
    },
    implementation: {
        onActivate: () => {
            const originalDrag = this.playerDrag;
            const originalAccel = this.playerAcceleration;
            
            this.playerDrag = 1500;
            this.playerAcceleration = 1800;
            this.player.setDrag(this.playerDrag);
            
            // 시각적 피드백
            this.player.setTint(0x00ff88);
            
            // 30초 후 원복
            this.time.delayedCall(30000, () => {
                this.playerDrag = originalDrag;
                this.playerAcceleration = originalAccel;
                this.player.setDrag(this.playerDrag);
                this.player.clearTint();
                this.showBuffExpiredText('민첩성 강화 종료');
            });
        }
    }
}
```

#### 속도 증가 버프
```javascript
speed_buff: {
    name: '질주',
    description: '30초동안 이동속도가 50% 증가합니다',
    rarity: 'uncommon',
    stackable: false,
    effect: {
        type: 'timed_buff',
        buffId: 'speed_boost',
        duration: 30000,
        modifiers: {
            playerSpeed: 600 // 기본 400에서 600으로
        }
    }
}
```

## 3. Passive 스킬 카테고리 (35%)

### 3.1 넉백 트리 (8%)

#### 일반 공격 넉백 강화
```javascript
knockback_enhanced: {
    name: '충격파',
    description: '총알의 넉백이 강화됩니다',
    rarity: 'common',
    stackable: true,
    maxStacks: 3,
    effect: {
        type: 'stat_modifier',
        target: 'bulletKnockback',
        operation: 'multiply',
        value: 1.5 // 스택당 1.5배
    },
    implementation: {
        onBulletHit: (bullet, enemy) => {
            const knockbackForce = this.baseBulletKnockback * this.getSkillMultiplier('bulletKnockback');
            const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, enemy.x, enemy.y);
            
            enemy.body.velocity.x += Math.cos(angle) * knockbackForce;
            enemy.body.velocity.y += Math.sin(angle) * knockbackForce;
        }
    }
}
```

#### 스킬 공격 넉백 매우 강화
```javascript
skill_knockback_mega: {
    name: '파동 충격',
    description: '대쉬와 파동파의 넉백이 크게 강화됩니다',
    rarity: 'rare',
    stackable: true,
    maxStacks: 2,
    effect: {
        type: 'multi_modifier',
        modifiers: [
            { target: 'dashKnockback', operation: 'multiply', value: 2.0 },
            { target: 'lightningWaveKnockback', operation: 'multiply', value: 2.5 }
        ]
    }
}
```

### 3.2 총알 트리 (15%)

#### 총알 수 증가
```javascript
bullet_count_increase: {
    name: '다중 사격',
    description: '총알이 +1개 추가됩니다 (최대 8개)',
    rarity: 'common',
    stackable: true,
    maxStacks: 7,
    effect: {
        type: 'stat_modifier',
        target: 'bulletCount',
        operation: 'add',
        value: 1
    }
}
```

#### 관통 능력
```javascript
bullet_penetration: {
    name: '관통탄',
    description: '총알이 적을 관통합니다 (최대 3회)',
    rarity: 'uncommon',
    stackable: true,
    maxStacks: 3,
    effect: {
        type: 'stat_modifier',
        target: 'bulletPenetration',
        operation: 'add',
        value: 1
    },
    implementation: {
        onBulletHit: (bullet, enemy) => {
            if (!bullet.penetrationCount) bullet.penetrationCount = 0;
            bullet.penetrationCount++;
            
            const maxPenetration = this.getSkillStack('bullet_penetration') || 0;
            if (bullet.penetrationCount >= maxPenetration) {
                bullet.destroy();
            }
            // 관통하는 경우 총알이 계속 진행
        }
    }
}
```

#### 고위력 저속도
```javascript
high_damage_slow_fire: {
    name: '중화기',
    description: '공격력 +50%, 발사속도 -15% (최대 3회)',
    rarity: 'rare',
    stackable: true,
    maxStacks: 3,
    effect: {
        type: 'multi_modifier',
        modifiers: [
            { target: 'bulletDamage', operation: 'multiply', value: 1.5 },
            { target: 'fireRate', operation: 'multiply', value: 1.15 }
        ]
    }
}
```

#### 고속도 저위력
```javascript
rapid_fire_low_damage: {
    name: '기관총',
    description: '발사속도 +40%, 공격력 -10% (최대 3회)',
    rarity: 'uncommon',
    stackable: true,
    maxStacks: 3,
    effect: {
        type: 'multi_modifier',
        modifiers: [
            { target: 'fireRate', operation: 'multiply', value: 0.6 },
            { target: 'bulletDamage', operation: 'multiply', value: 0.9 }
        ]
    }
}
```

#### 정확도 향상
```javascript
accuracy_improvement: {
    name: '정조준',
    description: '총알의 정확도가 향상됩니다',
    rarity: 'common',
    stackable: false,
    effect: {
        type: 'stat_modifier',
        target: 'bulletSpread',
        operation: 'multiply',
        value: 0.5 // 확산각 50% 감소
    }
}
```

#### 총알 크기 증가
```javascript
bullet_size_increase: {
    name: '대구경탄',
    description: '총알의 크기가 커집니다',
    rarity: 'uncommon',
    stackable: true,
    maxStacks: 2,
    effect: {
        type: 'stat_modifier',
        target: 'bulletScale',
        operation: 'multiply',
        value: 1.3
    }
}
```

### 3.3 폭발 트리 (3%)

#### 폭발 반경 확대
```javascript
explosion_radius_increase: {
    name: '광역 폭발',
    description: '총알의 폭발 반경이 30% 증가합니다 (최대 3회)',
    rarity: 'rare',
    stackable: true,
    maxStacks: 3,
    effect: {
        type: 'stat_modifier',
        target: 'explosionRadius',
        operation: 'multiply',
        value: 1.3
    }
}
```

#### 파편 폭발
```javascript
fragmentation_explosion: {
    name: '파편 폭발',
    description: '폭발시 3개의 작은 파편으로 나뉘어 추가 폭발합니다',
    rarity: 'legendary',
    stackable: false,
    effect: {
        type: 'special_behavior',
        behavior: 'fragmentation'
    },
    implementation: {
        onExplosion: (x, y) => {
            // 메인 폭발 후 0.5초 뒤 파편 폭발
            this.time.delayedCall(500, () => {
                for (let i = 0; i < 3; i++) {
                    const angle = (Math.PI * 2 / 3) * i;
                    const fragX = x + Math.cos(angle) * 50;
                    const fragY = y + Math.sin(angle) * 50;
                    
                    this.createFragmentExplosion(fragX, fragY);
                }
            });
        }
    }
}
```

### 3.4 번개 트리 (3%)

#### 전기 체인
```javascript
lightning_chain: {
    name: '연쇄 번개',
    description: '50% 확률로 주변 적에게 번개 체인 공격 (최대 3회 전이)',
    rarity: 'rare',
    stackable: true,
    maxStacks: 3,
    effect: {
        type: 'special_behavior',
        behavior: 'lightning_chain',
        chance: 0.5,
        maxChains: 3
    },
    implementation: {
        onEnemyHit: (hitEnemy) => {
            if (Math.random() < 0.5) {
                const chainCount = this.getSkillStack('lightning_chain');
                this.createLightningChain(hitEnemy, chainCount);
            }
        }
    }
}
```

#### 랜덤 번개
```javascript
random_lightning: {
    name: '천둥벼락',
    description: '랜덤 위치에 번개 공격 (중첩시 더 자주 발생, 최대 3회)',
    rarity: 'uncommon',
    stackable: true,
    maxStacks: 3,
    effect: {
        type: 'passive_timer',
        interval: 8000, // 8초마다
        intervalReduction: 2000 // 스택당 2초 단축
    },
    implementation: {
        startTimer: () => {
            const stacks = this.getSkillStack('random_lightning');
            const interval = Math.max(2000, 8000 - (stacks * 2000));
            
            this.randomLightningTimer = this.time.addEvent({
                delay: interval,
                callback: () => {
                    const randomX = Phaser.Math.Between(100, this.worldWidth - 100);
                    const randomY = Phaser.Math.Between(100, this.worldHeight - 100);
                    this.createRandomLightning(randomX, randomY);
                },
                loop: true
            });
        }
    }
}
```

### 3.5 블랙홀 트리 (1%)

#### 블랙홀 생성
```javascript
blackhole_creation: {
    name: '중력 붕괴',
    description: '10% 확률로 적 주위에 3초간 지속되는 블랙홀 생성',
    rarity: 'legendary',
    stackable: false,
    effect: {
        type: 'special_behavior',
        behavior: 'blackhole',
        chance: 0.1
    },
    implementation: {
        onEnemyKill: (enemy) => {
            if (Math.random() < 0.1) {
                this.createBlackhole(enemy.x, enemy.y, 3000);
            }
        }
    }
}
```

### 3.6 얼음 트리 (2%)

#### 빙결 효과
```javascript
freeze_effect: {
    name: '동결탄',
    description: '공격받은 적들이 2초간 얼어붙습니다',
    rarity: 'rare',
    stackable: true,
    maxStacks: 2,
    effect: {
        type: 'special_behavior',
        behavior: 'freeze',
        duration: 2000 // 2초, 스택당 +1초
    },
    implementation: {
        onEnemyHit: (enemy) => {
            const stacks = this.getSkillStack('freeze_effect');
            const freezeDuration = 2000 + (stacks - 1) * 1000;
            
            enemy.setTint(0x88ccff);
            enemy.body.velocity.setTo(0, 0);
            enemy.isFrozen = true;
            
            this.time.delayedCall(freezeDuration, () => {
                enemy.clearTint();
                enemy.isFrozen = false;
            });
        }
    }
}
```

### 3.7 흡혈 트리 (2%)

#### 생명력 흡수
```javascript
life_steal: {
    name: '생명력 흡수',
    description: '적 처치시 5% 확률로 체력 회복 (최대 3회 중첩)',
    rarity: 'uncommon',
    stackable: true,
    maxStacks: 3,
    effect: {
        type: 'special_behavior',
        behavior: 'life_steal',
        chance: 0.05, // 스택당 +5%
        healAmount: 1
    },
    implementation: {
        onEnemyKill: (enemy) => {
            const stacks = this.getSkillStack('life_steal');
            const chance = stacks * 0.05;
            
            if (Math.random() < chance && this.playerHealth < this.maxPlayerHealth) {
                this.playerHealth += 1;
                this.updateHealthUI();
                this.showLifeStealEffect();
            }
        }
    }
}
```

### 3.8 피지컬 트리 (8%)

#### 최대 속도 증가
```javascript
max_speed_increase: {
    name: '신속',
    description: '최대 이동속도가 25% 증가합니다',
    rarity: 'common',
    stackable: true,
    maxStacks: 3,
    effect: {
        type: 'stat_modifier',
        target: 'playerSpeed',
        operation: 'multiply',
        value: 1.25
    }
}
```

#### 즉각적인 컨트롤
```javascript
responsive_control: {
    name: '반응성 향상',
    description: '플레이어 컨트롤이 더욱 즉각적으로 변합니다',
    rarity: 'uncommon',
    stackable: true,
    maxStacks: 2,
    effect: {
        type: 'stat_modifier',
        target: 'playerAcceleration',
        operation: 'multiply',
        value: 1.4
    }
}
```

#### 최대 체력 증가 + 크기 증가
```javascript
health_size_tradeoff: {
    name: '강화 체격',
    description: '최대 체력 +1, 하지만 플레이어 크기가 약간 증가합니다',
    rarity: 'rare',
    stackable: true,
    maxStacks: 2,
    effect: {
        type: 'multi_modifier',
        modifiers: [
            { target: 'maxPlayerHealth', operation: 'add', value: 1 },
            { target: 'playerScale', operation: 'multiply', value: 1.15 }
        ]
    }
}
```

#### 민첩한 조작감
```javascript
agile_movement: {
    name: '민첩성',
    description: '미끄러짐이 크게 줄어듭니다 (영구)',
    rarity: 'uncommon',
    stackable: false,
    effect: {
        type: 'stat_modifier',
        target: 'playerDrag',
        operation: 'multiply',
        value: 1.8 // 드래그 80% 증가
    }
}
```

#### 피격시 파동파 반격
```javascript
counter_shockwave: {
    name: '반격 충격파',
    description: '피격시 주변에 파동파 공격을 가합니다',
    rarity: 'legendary',
    stackable: false,
    effect: {
        type: 'special_behavior',
        behavior: 'counter_attack'
    },
    implementation: {
        onPlayerHit: () => {
            // 파동파와 같은 효과이지만 범위가 더 작음
            this.createCounterShockwave(this.player.x, this.player.y, 400);
        }
    }
}
```

## 4. Skill 스킬 카테고리 (15%)

### 4.1 대쉬 강화 (10%)

#### 대쉬 효율성 개선
```javascript
dash_efficiency: {
    name: '순간이동 숙련',
    description: '대쉬 거리 30% 감소, 쿨타임 20% 단축 (최대 3회)',
    rarity: 'uncommon',
    stackable: true,
    maxStacks: 3,
    effect: {
        type: 'multi_modifier',
        modifiers: [
            { target: 'dashDistance', operation: 'multiply', value: 0.7 },
            { target: 'dashCooldown', operation: 'multiply', value: 0.8 }
        ]
    }
}
```

#### 대쉬 넉백
```javascript
dash_knockback: {
    name: '돌진',
    description: '대쉬 경로의 적들에게 강한 넉백을 줍니다',
    rarity: 'common',
    stackable: false,
    effect: {
        type: 'special_behavior',
        behavior: 'dash_knockback'
    },
    implementation: {
        onDashStart: () => {
            // 대쉬 경로상의 적들을 탐지하고 넉백 적용
            this.addDashKnockbackDetection();
        }
    }
}
```

#### 대쉬 공격
```javascript
dash_attack: {
    name: '돌격',
    description: '대쉬 경로의 적들을 강하게 공격합니다',
    rarity: 'rare',
    stackable: false,
    effect: {
        type: 'special_behavior',
        behavior: 'dash_damage'
    }
}
```

#### 대쉬 폭발
```javascript
dash_explosion: {
    name: '착지 폭발',
    description: '대쉬 끝에 큰 폭발 공격을 가합니다',
    rarity: 'rare',
    stackable: false,
    effect: {
        type: 'special_behavior',
        behavior: 'dash_explosion'
    }
}
```

#### 대쉬 감전
```javascript
dash_lightning: {
    name: '번개 대쉬',
    description: '대쉬 경로의 적들을 감전시킵니다',
    rarity: 'uncommon',
    stackable: false,
    effect: {
        type: 'special_behavior',
        behavior: 'dash_electrify'
    }
}
```

### 4.2 파동파 강화 (5%)

#### 파동파 범위 확대
```javascript
shockwave_range_increase: {
    name: '거대 파동',
    description: '파동파의 범위가 50% 증가합니다',
    rarity: 'uncommon',
    stackable: true,
    maxStacks: 2,
    effect: {
        type: 'stat_modifier',
        target: 'lightningWaveRadius',
        operation: 'multiply',
        value: 1.5
    }
}
```

#### 파동파 넉백 강화
```javascript
shockwave_knockback_increase: {
    name: '충격 강화',
    description: '파동파의 넉백이 2배 강해집니다',
    rarity: 'common',
    stackable: true,
    maxStacks: 2,
    effect: {
        type: 'stat_modifier',
        target: 'lightningWaveKnockback',
        operation: 'multiply',
        value: 2.0
    }
}
```

#### 이중 파동파
```javascript
double_shockwave: {
    name: '이중 충격',
    description: '파동파가 2연속으로 발동됩니다 (첫번째 → 2초 후 두배 크기)',
    rarity: 'legendary',
    stackable: false,
    effect: {
        type: 'special_behavior',
        behavior: 'double_shockwave'
    },
    implementation: {
        onLightningWaveActivate: () => {
            // 첫 번째 파동파
            this.performLightningWave();
            
            // 2초 후 두 번째 파동파 (2배 크기)
            this.time.delayedCall(2000, () => {
                const originalRadius = this.lightningWaveRadius;
                this.lightningWaveRadius *= 2;
                this.performLightningWave();
                this.lightningWaveRadius = originalRadius;
            });
        }
    }
}
```

## 5. 스킬 밸런스 및 확률 시스템

### 5.1 레벨 구간별 스킬 등급 조정

#### 초반 (레벨 1-10)
```javascript
const earlyGameWeights = {
    common: 0.70,
    uncommon: 0.25,
    rare: 0.05,
    legendary: 0.00
};
```

#### 중반 (레벨 11-20)
```javascript
const midGameWeights = {
    common: 0.50,
    uncommon: 0.30,
    rare: 0.17,
    legendary: 0.03
};
```

#### 후반 (레벨 21-30)
```javascript
const lateGameWeights = {
    common: 0.40,
    uncommon: 0.25,
    rare: 0.25,
    legendary: 0.10
};
```

### 5.2 스킬 선택 알고리즘

```javascript
generateRandomSkills(count) {
    const playerLevel = this.weaponLevel;
    const weights = this.getWeightsForLevel(playerLevel);
    
    // 이미 보유한 스킬의 가중치 조정
    const availableSkills = this.filterAvailableSkills();
    
    // 카테고리 균형 유지 (한 카드 세트에 같은 카테고리 2개 이상 방지)
    const selectedSkills = [];
    const usedCategories = new Set();
    
    for (let i = 0; i < count; i++) {
        const skill = this.weightedRandomSkillSelection(
            availableSkills, 
            weights, 
            usedCategories
        );
        selectedSkills.push(skill);
        usedCategories.add(skill.category);
    }
    
    return selectedSkills;
}
```

이 상세한 스킬 시스템을 통해 플레이어는 매 레벨업마다 의미있는 선택을 하게 되고, 다양한 빌드와 플레이 스타일을 실험할 수 있게 됩니다.