class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        const colors = ['blue', 'green', 'pink', 'purple', 'red', 'yellow'];
        const shapes = ['circle', 'rhombus', 'square'];
        for (const color of colors) {
            for (const shape of shapes) {
                if (color != "red" || shape != "square") {
                    this.load.image(`${color}_${shape}`, `assets/${color}_body_${shape}.png`);
                }
            }
        }

        const faceKeys = [
            'face_frown_closed_eye', 'face_frown_closed_eye_2',
            'face_frown_open_eye', 'face_frown_open_eye_2',
            'face_grimace_open_eye',
            'face_smile_closed_eye',
            'face_smile_open_eye', 'face_smile_open_eye_2', 'face_smile_open_eye_3'
        ];
        for (const fk of faceKeys) {
            this.load.image(fk, `assets/${fk}.png`);
        }
    }

    create() {
        this.faceKeys = [
            'face_frown_closed_eye', 'face_frown_closed_eye_2',
            'face_frown_open_eye', 'face_frown_open_eye_2',
            'face_grimace_open_eye',
            'face_smile_closed_eye',
            'face_smile_open_eye', 'face_smile_open_eye_2', 'face_smile_open_eye_3'
        ];
        this.bodyColors = ['blue', 'green', 'pink', 'purple', 'red', 'yellow'];
        this.bodyShapes = ['circle', 'rhombus', 'square'];
        this.showStartScreen();
    }

    showStartScreen() {
        this.state = 'start';
        const cx = 400, cy = 300;

        this.add.image(cx, cy - 80, 'red_circle').setScale(0.5).setTint(0xffffff);
        this.add.image(cx, cy - 80, 'face_smile_open_eye').setScale(0.5);
        this.add.image(cx + 120, cy - 80, 'blue_square').setScale(0.5).setTint(0xffffff);
        this.add.image(cx + 120, cy - 80, 'face_frown_open_eye').setScale(0.5);
        this.add.image(cx - 120, cy - 80, 'green_rhombus').setScale(0.5).setTint(0xffffff);
        this.add.image(cx - 120, cy - 80, 'face_smile_closed_eye').setScale(0.5);

        const title = this.add.text(cx, cy - 160, 'Face Clicker', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const rules = this.add.text(cx, cy + 10, [
            'Click all the RED faces as fast as you can!',
            'Clicking a non-red face adds 1 second penalty.',
            ''
        ].join('\n'), {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#555555',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5);

        const startBtn = this.add.text(cx, cy + 100, 'Click to Start', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#e74c3c',
            padding: { x: 24, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        startBtn.on('pointerover', () => startBtn.setStyle({ backgroundColor: '#c0392b' }));
        startBtn.on('pointerout', () => startBtn.setStyle({ backgroundColor: '#e74c3c' }));
        startBtn.on('pointerdown', () => {
            this.startScreenElements = [title, rules, startBtn];
            this.startGame();
        });

        this.startScreenDecor = this.children.list.filter(c =>
            c !== title && c !== rules && c !== startBtn
        );
    }

    startGame() {
        for (const el of this.startScreenDecor) el.destroy();
        if (this.startScreenElements) {
            for (const el of this.startScreenElements) el.destroy();
        }

        this.state = 'playing';
        this.startTime = this.time.now;
        this.penaltyTime = 0;
        this.faces = [];
        this.redRemaining = 0;
        this.totalRed = 0;

        this.spawnFaces();

        this.timerText = this.add.text(16, 16, 'Time: 0.0s', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#333333',
            fontStyle: 'bold'
        });

        this.redCountText = this.add.text(16, 48, '', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#e74c3c',
            fontStyle: 'bold'
        });
        this.updateRedCount();

        this.penaltyFlash = this.add.text(400, 80, '+1.0s', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#e74c3c',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);
    }

    spawnFaces() {
        const cols = 5, rows = 4;
        const cellW = 140, cellH = 130;
        const offsetX = (800 - cols * cellW) / 2 + cellW / 2;
        const offsetY = (600 - rows * cellH) / 2 + cellH / 2 + 20;
        const jitter = 35;

        const positions = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                positions.push({
                    x: offsetX + c * cellW + Phaser.Math.Between(-jitter, jitter),
                    y: offsetY + r * cellH + Phaser.Math.Between(-jitter, jitter)
                });
            }
        }
        Phaser.Utils.Array.Shuffle(positions);

        const redCount = 6;
        this.totalRed = redCount;
        this.redRemaining = redCount;

        const colorAssignments = [];
        for (let i = 0; i < positions.length; i++) {
            if (i < redCount) {
                colorAssignments.push('red');
            } else {
                const nonRed = this.bodyColors.filter(c => c !== 'red');
                colorAssignments.push(Phaser.Utils.Array.GetRandom(nonRed));
            }
        }
        Phaser.Utils.Array.Shuffle(colorAssignments);

        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            const color = colorAssignments[i];
            const availableShapes = color === 'red'
                ? this.bodyShapes.filter(s => s !== 'square')
                : this.bodyShapes;
            const shape = Phaser.Utils.Array.GetRandom(availableShapes);
            const faceKey = Phaser.Utils.Array.GetRandom(this.faceKeys);
            this.createFaceCharacter(pos.x, pos.y, color, shape, faceKey);
        }
    }

    createFaceCharacter(x, y, color, shape, faceKey) {
        const bodyKey = `${color}_${shape}`;
        const scale = 0.55;

        const container = this.add.container(x, y);

        const body = this.add.image(0, 0, bodyKey).setScale(scale);
        const face = this.add.image(0, -12, faceKey).setScale(scale);

        container.add([body, face]);
        container.setSize(body.displayWidth, body.displayHeight);
        container.setInteractive({ useHandCursor: true });

        const isRed = color === 'red';
        container.getData = () => ({ isRed });
        container.faceColor = color;

        container.on('pointerover', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1.15,
                scaleY: 1.15,
                duration: 100,
                ease: 'Back.easeOut'
            });
        });

        container.on('pointerout', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 100,
                ease: 'Quad.easeInOut'
            });
        });

        container.on('pointerdown', () => {
            if (this.state !== 'playing') return;
            this.onFaceClicked(container);
        });

        this.faces.push(container);
    }

    onFaceClicked(container) {
        const isRed = container.faceColor === 'red';

        if (isRed) {
            this.redRemaining--;
            this.updateRedCount();
            this.tweens.add({
                targets: container,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                duration: 200,
                ease: 'Back.easeIn',
                onComplete: () => {
                    container.destroy();
                    Phaser.Utils.Array.Remove(this.faces, container);
                    if (this.redRemaining <= 0) {
                        this.endGame();
                    }
                }
            });
        } else {
            this.penaltyTime += 1;

            this.penaltyFlash.setAlpha(1);
            this.tweens.add({
                targets: this.penaltyFlash,
                alpha: 0,
                y: this.penaltyFlash.y - 40,
                duration: 800,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    this.penaltyFlash.y = 80;
                }
            });

            this.tweens.add({
                targets: container,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                duration: 200,
                ease: 'Back.easeIn',
                onComplete: () => {
                    container.destroy();
                    Phaser.Utils.Array.Remove(this.faces, container);
                }
            });
        }
    }

    updateRedCount() {
        if (this.redCountText) {
            this.redCountText.setText(`Red remaining: ${this.redRemaining} / ${this.totalRed}`);
        }
    }

    update() {
        if (this.state !== 'playing') return;
        const elapsed = (this.time.now - this.startTime) / 1000;
        const displayTime = elapsed + this.penaltyTime;
        this.timerText.setText(`Time: ${displayTime.toFixed(1)}s`);
    }

    endGame() {
        this.state = 'end';
        const elapsed = (this.time.now - this.startTime) / 1000;
        const totalTime = elapsed + this.penaltyTime;

        for (const face of [...this.faces]) {
            this.tweens.add({
                targets: face,
                alpha: 0,
                scaleX: 0,
                scaleY: 0,
                duration: 300,
                delay: Phaser.Math.Between(0, 200),
                ease: 'Back.easeIn',
                onComplete: () => face.destroy()
            });
        }
        this.faces = [];

        this.tweens.add({
            targets: [this.timerText, this.redCountText, this.penaltyFlash],
            alpha: 0,
            duration: 300
        });

        this.time.delayedCall(500, () => {
            const cx = 400, cy = 300;

            const panel = this.add.rectangle(cx, cy, 420, 300, 0xffffff, 1)
                .setStrokeStyle(3, 0xe74c3c);

            const congrats = this.add.text(cx, cy - 100, 'Nice!', {
                fontSize: '42px',
                fontFamily: 'Arial',
                color: '#e74c3c',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const timeText = this.add.text(cx, cy - 30, `Time: ${totalTime.toFixed(1)}s`, {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#333333',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const breakdown = this.add.text(cx, cy + 20, [
                `Base time: ${elapsed.toFixed(1)}s`,
                `Penalties: +${this.penaltyTime.toFixed(1)}s`
            ].join('\n'), {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#777777',
                align: 'center',
                lineSpacing: 6
            }).setOrigin(0.5);

            const rating = this.getRating(totalTime);
            const ratingText = this.add.text(cx, cy + 75, rating, {
                fontSize: '22px',
                fontFamily: 'Arial',
                color: '#e67e22',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const playAgain = this.add.text(cx, cy + 120, 'Play Again', {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: '#e74c3c',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            playAgain.on('pointerover', () => playAgain.setStyle({ backgroundColor: '#c0392b' }));
            playAgain.on('pointerout', () => playAgain.setStyle({ backgroundColor: '#e74c3c' }));
            playAgain.on('pointerdown', () => {
                panel.destroy();
                congrats.destroy();
                timeText.destroy();
                breakdown.destroy();
                ratingText.destroy();
                playAgain.destroy();
                this.startGame();
            });

            this.tweens.add({
                targets: [panel, congrats, timeText, breakdown, ratingText, playAgain],
                alpha: { from: 0, to: 1 },
                scaleX: { from: 0.8, to: 1 },
                scaleY: { from: 0.8, to: 1 },
                duration: 400,
                ease: 'Back.easeOut'
            });
        });
    }

    getRating(time) {
        if (time < 4) return 'Lightning Fast!';
        if (time < 7) return 'Speed Demon!';
        if (time < 10) return 'Quick Clicks!';
        if (time < 15) return 'Not Bad!';
        if (time < 20) return 'Keep Practicing!';
        return 'Take a Breath!';
    }
}
