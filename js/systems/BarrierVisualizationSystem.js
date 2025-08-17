/**
 * 배리어 시각화 시스템 
 * - 배리어 개수에 따라 캐릭터 주변을 회전하는 방어막 이펙트 생성
 * - 배리어가 소모될 때 시각적 피드백 제공
 */

export class BarrierVisualizationSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.barriers = [];
        this.barrierRadius = 50; // 플레이어로부터의 거리
        this.rotationSpeed = 0.02; // 회전 속도
        
        // 배리어 색상과 크기 설정
        this.barrierColor = 0x00aaff;
        this.barrierSize = 8;
        this.barrierAlpha = 0.8;
        
        // 애니메이션 관련
        this.pulseSpeed = 0.05;
        this.time = 0;
    }
    
    /**
     * 배리어 개수에 따라 시각적 배리어들을 업데이트
     * @param {number} barrierCount - 현재 배리어 개수
     */
    updateBarriers(barrierCount) {
        // 기존 배리어들을 모두 제거
        this.clearAllBarriers();
        
        // 새로운 배리어들을 생성
        for (let i = 0; i < barrierCount; i++) {
            this.createBarrier(i, barrierCount);
        }
    }
    
    /**
     * 개별 배리어 생성
     * @param {number} index - 배리어 인덱스
     * @param {number} totalCount - 전체 배리어 개수
     */
    createBarrier(index, totalCount) {
        // 배리어가 배치될 각도 계산 (균등 분배)
        const angleOffset = (Math.PI * 2) / totalCount;
        const initialAngle = index * angleOffset;
        
        // 배리어 스프라이트 생성 (원형)
        const barrier = this.scene.add.circle(0, 0, this.barrierSize, this.barrierColor, this.barrierAlpha);
        
        // 배리어 속성 설정
        barrier.initialAngle = initialAngle;
        barrier.currentAngle = initialAngle;
        barrier.index = index;
        
        // 테두리 효과 추가
        barrier.setStrokeStyle(2, 0xffffff, 0.6);
        
        // 배리어 배열에 추가
        this.barriers.push(barrier);
        
        // 생성 애니메이션
        this.playSpawnAnimation(barrier);
    }
    
    /**
     * 배리어 생성 애니메이션
     * @param {Phaser.GameObjects.Arc} barrier - 배리어 객체
     */
    playSpawnAnimation(barrier) {
        // 초기 크기를 0으로 설정
        barrier.setScale(0);
        
        // 크기 확대 애니메이션
        this.scene.tweens.add({
            targets: barrier,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
        
        // 반짝이는 효과
        this.scene.tweens.add({
            targets: barrier,
            alpha: 0.4,
            duration: 150,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut'
        });
    }
    
    /**
     * 배리어 소모 애니메이션 (가장 최근에 생성된 것부터)
     */
    removeBarrier() {
        if (this.barriers.length === 0) return;
        
        // 마지막 배리어를 제거
        const barrierToRemove = this.barriers.pop();
        
        // 파괴 애니메이션
        this.playDestructionAnimation(barrierToRemove);
    }
    
    /**
     * 배리어 파괴 애니메이션
     * @param {Phaser.GameObjects.Arc} barrier - 파괴할 배리어 객체
     */
    playDestructionAnimation(barrier) {
        // 크기 축소와 페이드아웃 애니메이션
        this.scene.tweens.add({
            targets: barrier,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 200,
            ease: 'Power2.easeOut',
            onComplete: () => {
                barrier.destroy();
            }
        });
        
        // 파괴 파티클 효과 (간단한 원형 확산)
        this.createDestructionEffect(barrier.x, barrier.y);
    }
    
    /**
     * 파괴 이펙트 생성
     * @param {number} x - X 좌표
     * @param {number} y - Y 좌표
     */
    createDestructionEffect(x, y) {
        const particles = [];
        const particleCount = 6;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const particle = this.scene.add.circle(x, y, 2, this.barrierColor, 0.8);
            
            // 파티클을 방향에 따라 날리기
            const targetX = x + Math.cos(angle) * 30;
            const targetY = y + Math.sin(angle) * 30;
            
            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                duration: 400,
                ease: 'Power2.easeOut',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }
    
    /**
     * 모든 배리어 제거
     */
    clearAllBarriers() {
        this.barriers.forEach(barrier => {
            if (barrier && barrier.active) {
                barrier.destroy();
            }
        });
        this.barriers = [];
    }
    
    /**
     * 매 프레임마다 배리어 위치와 애니메이션 업데이트
     * @param {number} deltaTime - 프레임 간 시간 차이
     */
    update(deltaTime) {
        this.time += deltaTime;
        
        this.barriers.forEach((barrier, index) => {
            if (!barrier || !barrier.active) return;
            
            // 현재 회전 각도 계산
            barrier.currentAngle += this.rotationSpeed;
            
            // 플레이어 중심으로 원형 회전
            const x = this.player.x + Math.cos(barrier.currentAngle) * this.barrierRadius;
            const y = this.player.y + Math.sin(barrier.currentAngle) * this.barrierRadius;
            
            barrier.setPosition(x, y);
            
            // 부드러운 펄스 효과
            const pulseScale = 1 + Math.sin(this.time * this.pulseSpeed + index) * 0.1;
            barrier.setScale(pulseScale);
            
            // 미묘한 투명도 변화
            const alphaVariation = 0.8 + Math.sin(this.time * this.pulseSpeed * 1.5 + index) * 0.1;
            barrier.setAlpha(alphaVariation);
        });
    }
    
    /**
     * 배리어 개수 반환
     * @returns {number} 현재 활성화된 배리어 개수
     */
    getBarrierCount() {
        return this.barriers.length;
    }
    
    /**
     * 시스템 정리
     */
    destroy() {
        this.clearAllBarriers();
    }
}