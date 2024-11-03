const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player, cursors, score = 0, scoreText, gameOver = false, obstacles, powerUps, powerUpActive = false, speedMultiplier = 1;

function preload() {
    // Load images and sprite sheets
    this.load.image('background', 'assets/forest-bg.png');
    this.load.spritesheet('player', 'assets/stick-figure.png', { frameWidth: 50, frameHeight: 50 });
    this.load.image('rock', 'assets/rock.png');
    this.load.image('log', 'assets/log.png');
    this.load.image('powerup', 'assets/powerup.png');
    this.load.image('particle', 'assets/particle.png');
}

function create() {
    // Background setup with parallax effect
    this.background = this.add.tileSprite(400, 300, 800, 600, 'background');
    this.background.setScrollFactor(0);

    // Player setup
    player = this.physics.add.sprite(100, 450, 'player').setScale(1.2);
    player.setCollideWorldBounds(true);

    // Player animations
    this.anims.create({
        key: 'run',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 5 }),
        frameRate: 12,
        repeat: -1
    });
    player.anims.play('run');

    // Groups for obstacles and power-ups
    obstacles = this.physics.add.group();
    powerUps = this.physics.add.group();

    // Timed events for obstacles and power-ups
    this.time.addEvent({ delay: 2000, callback: addObstacle, callbackScope: this, loop: true });
    this.time.addEvent({ delay: 10000, callback: addPowerUp, callbackScope: this, loop: true });

    // Score display
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px', fill: '#FFD700' });

    // Controls
    cursors = this.input.keyboard.createCursorKeys();

    // Collision detection
    this.physics.add.collider(player, obstacles, hitObstacle, null, this);
    this.physics.add.overlap(player, powerUps, collectPowerUp, null, this);

    // Particle effect for power-ups
    this.particles = this.add.particles('particle');
}

function update() {
    if (gameOver) return;

    // Background scrolling
    this.background.tilePositionX += 4 * speedMultiplier;

    // Player movement
    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-500);
    }
    if (cursors.left.isDown) {
        player.setVelocityX(-200 * speedMultiplier);
    } else if (cursors.right.isDown) {
        player.setVelocityX(200 * speedMultiplier);
    } else {
        player.setVelocityX(0);
    }

    // Gradually deactivate power-up effect
    if (powerUpActive && this.time.now > powerUpActive) {
        deactivatePowerUp();
    }
}

function addObstacle() {
    const obstacleType = Phaser.Math.RND.pick(['rock', 'log']);
    const obstacle = obstacles.create(800, 520, obstacleType);
    obstacle.setVelocityX(-200 * speedMultiplier);
    obstacle.setCollideWorldBounds(true);
    obstacle.body.immovable = true;

    // Increase obstacle speed as score increases
    if (score >= 50) {
        obstacle.setVelocityX(-250 * speedMultiplier);
    } else if (score >= 100) {
        obstacle.setVelocityX(-300 * speedMultiplier);
    }
}

function addPowerUp() {
    const powerUp = powerUps.create(800, Phaser.Math.Between(200, 400), 'powerup');
    powerUp.setVelocityX(-150 * speedMultiplier);
}

function collectPowerUp(player, powerUp) {
    powerUp.destroy();
    score += 20;
    scoreText.setText('Score: ' + score);

    // Activate a random power-up effect
    const powerUpEffect = Phaser.Math.RND.pick(['speedBoost', 'invincibility']);
    activatePowerUp(powerUpEffect);

    // Particle effect
    this.particles.createEmitter({
        x: powerUp.x,
        y: powerUp.y,
        speed: { min: -100, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        blendMode: 'ADD',
        lifespan: 500,
        quantity: 10
    });
}

function activatePowerUp(effect) {
    if (effect === 'speedBoost') {
        speedMultiplier = 1.5;
        powerUpActive = this.time.now + 5000;  // Active for 5 seconds
        document.querySelector('.powerup-alert').textContent = 'Speed Boost!';
    } else if (effect === 'invincibility') {
        player.setTint(0x00ff00);
        powerUpActive = this.time.now + 5000;
        document.querySelector('.powerup-alert').textContent = 'Invincibility!';
    }
    document.querySelector('.powerup-alert').style.display = 'block';
}

function deactivatePowerUp() {
    speedMultiplier = 1;
    player.clearTint();
    powerUpActive = false;
    document.querySelector('.powerup-alert').style.display = 'none';
}

function hitObstacle(player, obstacle) {
    if (powerUpActive && document.querySelector('.powerup-alert').textContent === 'Invincibility!') {
        obstacle.destroy();
    } else {
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.stop();
        gameOver = true;
        scoreText.setText('Game Over - Score: ' + score);
    }
}
