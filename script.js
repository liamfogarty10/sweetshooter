class SweetShooter {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameRunning = false;
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        
        this.setupCanvas();
        
        // Player character - positioned at bottom center, only top half visible
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 40, // Only top half visible
            width: 60,
            height: 80,
            angle: -Math.PI / 2 // Facing upward into screen
        };
        
        // Game objects
        this.sweets = [];
        this.bullets = [];
        this.particles = [];
        
        // Game settings
        this.sweetsPerWave = 3; // Start easier
        this.sweetSpeed = 0.5; // Much slower initial speed
        this.bulletSpeed = 10; // Faster bullets to help player
        this.baseWaveDelay = 3000; // 3 second delay between waves
        this.spawningWave = false; // Prevent multiple wave spawning
        this.waveCompleted = false; // Prevent multiple wave increments
        
        // Upgrade system
        this.weaponLevel = 0; // 0=basic, 1=double, 2=triple, 3=spread
        this.nextUpgradeScore = 150; // First upgrade at 150 points
        this.upgradeAvailable = false;
        this.slowMotionActive = false;
        this.slowMotionTimer = 0;
        
        // Sound effects
        this.sounds = {
            shoot: this.createSound([0.5,,169,,.01,.03,,,,,,,,5]),
            cookieHit: this.createSound([1.5,,200,.01,,.1,1,.76,,,,-0.02,,,,.1,.01,.5]),
            marshmallowHit: this.createSound([1.2,,350,.02,,.15,1,1.2,,,,,,,,,.02,.3]),
            cakeHit: this.createSound([1,,150,.05,,.25,1,1.5,,,,-0.1,,,,.2,.05,.6]),
            dynamiteExplode: this.createSound([3,,300,.1,.3,.7,4,,,,,,.5,1,1,,.2,.8]),
            gameOver: this.createSound([2,,100,.2,.3,.5,2,1.5,,,,,1,,,.3,.1,.9])
        };
        
        this.bindEvents();
        this.drawStartScreen();
    }
    
    setupCanvas() {
        // Get actual viewport dimensions  
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate available space with minimal UI overhead
        const titleHeight = 50; // Compact title
        const padding = 20;
        
        const availableWidth = viewportWidth - (padding * 2);
        const availableHeight = viewportHeight - titleHeight - (padding * 2);
        
        // Define aspect ratio (4:3 works well for mobile and desktop)
        const aspectRatio = 4 / 3;
        
        let canvasWidth, canvasHeight;
        
        // Calculate size based on available space
        if (availableWidth / availableHeight > aspectRatio) {
            // Limited by height
            canvasHeight = availableHeight;
            canvasWidth = canvasHeight * aspectRatio;
        } else {
            // Limited by width
            canvasWidth = availableWidth;
            canvasHeight = canvasWidth / aspectRatio;
        }
        
        // Apply maximum sizes for very large screens
        const maxWidth = Math.min(800, viewportWidth * 0.95);
        const maxHeight = Math.min(600, viewportHeight * 0.85);
        
        canvasWidth = Math.min(canvasWidth, maxWidth);
        canvasHeight = Math.min(canvasHeight, maxHeight);
        
        // Ensure minimum playable size
        canvasWidth = Math.max(300, canvasWidth);
        canvasHeight = Math.max(225, canvasHeight);
        
        // Set canvas dimensions
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';
        
        // Update player position based on new canvas size
        if (this.player) {
            this.player.x = this.canvas.width / 2;
            this.player.y = this.canvas.height - 40; // Only top half visible
        }
        
        console.log(`Canvas sized: ${canvasWidth}x${canvasHeight} for viewport: ${viewportWidth}x${viewportHeight}`);
    }
    
    bindEvents() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('upgradeWeapon').addEventListener('click', () => this.upgradeWeapon());
        
        // Mouse events
        this.canvas.addEventListener('click', (e) => this.handleShoot(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchShoot(e);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        });
        
        // Window resize and orientation change events
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.setupCanvas();
                if (!this.gameRunning) {
                    this.drawStartScreen();
                }
            }, 100);
        });
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.setupCanvas();
                if (!this.gameRunning) {
                    this.drawStartScreen();
                }
            }, 200);
        });
        
        // Prevent zoom on double tap (iOS Safari)
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
        });
    }
    
    handleTouchMove(e) {
        if (!this.gameRunning) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // Calculate angle from player to touch
        const dx = touchX - this.player.x;
        const dy = touchY - this.player.y;
        this.player.angle = Math.atan2(dy, dx);
    }
    
    handleTouchShoot(e) {
        if (!this.gameRunning) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const targetX = touch.clientX - rect.left;
        const targetY = touch.clientY - rect.top;
        
        // Play shoot sound
        this.playSound(this.sounds.shoot);
        
        // Create bullets based on weapon level
        this.createBullets(targetX, targetY);
        
        // Update player angle
        const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
        this.player.angle = angle;
    }
    
    handleMouseMove(e) {
        if (!this.gameRunning) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate angle from player to mouse
        const dx = mouseX - this.player.x;
        const dy = mouseY - this.player.y;
        this.player.angle = Math.atan2(dy, dx);
    }
    
    handleShoot(e) {
        if (!this.gameRunning) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const targetX = e.clientX - rect.left;
        const targetY = e.clientY - rect.top;
        
        // Play shoot sound
        this.playSound(this.sounds.shoot);
        
        // Create bullets based on weapon level
        this.createBullets(targetX, targetY);
        
        // Update player angle
        const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
        this.player.angle = angle;
    }
    
    startGame() {
        this.gameRunning = true;
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        this.sweets = [];
        this.bullets = [];
        this.particles = [];
        this.spawningWave = false; // Reset spawning flag
        this.waveCompleted = false; // Reset wave completion flag
        
        // Reset upgrade system
        this.weaponLevel = 0;
        this.nextUpgradeScore = 150;
        this.upgradeAvailable = false;
        this.slowMotionActive = false;
        this.slowMotionTimer = 0;
        document.getElementById('upgradeBtn').style.display = 'none';
        
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'inline-block';
        document.getElementById('gameOver').style.display = 'none';
        
        this.spawnWave();
        this.gameLoop();
    }
    
    pauseGame() {
        this.gameRunning = !this.gameRunning;
        if (this.gameRunning) {
            document.getElementById('pauseBtn').textContent = 'Pause';
            this.gameLoop();
        } else {
            document.getElementById('pauseBtn').textContent = 'Resume';
        }
    }
    
    restartGame() {
        this.startGame();
    }
    
    spawnWave() {
        if (this.spawningWave) return; // Prevent multiple simultaneous waves
        this.spawningWave = true;
        
        // Progressive difficulty - starts easier with fixed spawn delay
        const sweetsInWave = Math.min(this.sweetsPerWave + Math.floor((this.wave - 1) / 3), 10);
        const spawnDelay = 1000; // Fixed 1 second between individual sweets
        
        // Spawn sweets one by one with consistent timing
        for (let i = 0; i < sweetsInWave; i++) {
            setTimeout(() => {
                if (this.gameRunning) {
                    this.spawnSweet();
                }
            }, i * spawnDelay);
        }
        
        // Dynamite appears less frequently early on
        const dynamiteChance = Math.min(0.1 + (this.wave * 0.05), 0.4);
        if (Math.random() < dynamiteChance) {
            setTimeout(() => {
                if (this.gameRunning) {
                    this.spawnDynamite();
                }
            }, Math.random() * (sweetsInWave * spawnDelay));
        }
        
        // Mark spawning complete after all sweets are spawned
        setTimeout(() => {
            this.spawningWave = false;
        }, sweetsInWave * spawnDelay + 500);
    }
    
    spawnSweet() {
        const types = ['cookie', 'marshmallow', 'cake'];
        
        // Early waves have more cookies and marshmallows (easier)
        let type;
        if (this.wave <= 2) {
            type = Math.random() < 0.8 ? (Math.random() < 0.5 ? 'cookie' : 'marshmallow') : 'cake';
        } else {
            type = types[Math.floor(Math.random() * types.length)];
        }
        
        // Progressive speed increase - very gradual
        const currentSpeed = this.sweetSpeed + (this.wave - 1) * 0.2;
        
        this.sweets.push({
            x: Math.random() * (this.canvas.width - 50),
            y: -50,
            vx: (Math.random() - 0.5) * 1.5, // Reduced horizontal movement
            vy: currentSpeed + Math.random() * 1,
            type: type,
            size: type === 'cake' ? 40 : 30,
            health: type === 'cake' ? 2 : 1,
            maxHealth: type === 'cake' ? 2 : 1
        });
    }
    
    spawnDynamite() {
        // Progressive speed increase - very gradual
        const currentSpeed = this.sweetSpeed + (this.wave - 1) * 0.2;
        
        this.sweets.push({
            x: Math.random() * (this.canvas.width - 50),
            y: -50,
            vx: (Math.random() - 0.5) * 4,
            vy: currentSpeed * 2 + Math.random() * 3,
            type: 'dynamite',
            size: 35,
            health: 1,
            maxHealth: 1
        });
    }
    
    update() {
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            
            // Remove bullets that go off screen
            if (bullet.x < 0 || bullet.x > this.canvas.width || 
                bullet.y < 0 || bullet.y > this.canvas.height) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Check collision with sweets
            for (let j = this.sweets.length - 1; j >= 0; j--) {
                const sweet = this.sweets[j];
                const dist = Math.sqrt(
                    Math.pow(bullet.x - sweet.x, 2) + 
                    Math.pow(bullet.y - sweet.y, 2)
                );
                
                if (dist < sweet.size / 2 + bullet.size) {
                    this.bullets.splice(i, 1);
                    
                    if (sweet.type === 'dynamite') {
                        this.playSound(this.sounds.dynamiteExplode);
                        this.explodeDynamite(sweet.x, sweet.y);
                        this.sweets = [];
                        this.score += 100;
                    } else {
                        sweet.health--;
                        if (sweet.health <= 0) {
                            // Play sweet-specific sound
                            if (sweet.type === 'cookie') {
                                this.playSound(this.sounds.cookieHit);
                            } else if (sweet.type === 'marshmallow') {
                                this.playSound(this.sounds.marshmallowHit);
                            } else if (sweet.type === 'cake') {
                                this.playSound(this.sounds.cakeHit);
                            }
                            
                            this.createParticles(sweet.x, sweet.y, sweet.type);
                            this.sweets.splice(j, 1);
                            this.score += sweet.type === 'cake' ? 30 : 
                                         sweet.type === 'cookie' ? 10 : 15;
                        }
                    }
                    break;
                }
            }
        }
        
        // Update slow motion timer
        if (this.slowMotionActive) {
            this.slowMotionTimer--;
            if (this.slowMotionTimer <= 0) {
                this.slowMotionActive = false;
            }
        }
        
        // Update sweets
        const speedMultiplier = this.slowMotionActive ? 0.3 : 1.0; // Slow motion effect
        for (let i = this.sweets.length - 1; i >= 0; i--) {
            const sweet = this.sweets[i];
            sweet.x += sweet.vx * speedMultiplier;
            sweet.y += sweet.vy * speedMultiplier;
            
            // Remove sweets that fall off screen
            if (sweet.y > this.canvas.height + 50) {
                this.sweets.splice(i, 1);
                if (sweet.type !== 'dynamite') {
                    this.loseLife();
                }
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Check if wave is complete (only once per wave)
        if (this.sweets.length === 0 && !this.spawningWave && !this.waveCompleted) {
            this.waveCompleted = true; // Mark wave as completed
            this.wave++;
            // Much more gradual speed increase
            this.sweetSpeed += 0.15;
            const waveDelay = Math.max(this.baseWaveDelay - (this.wave * 100), 2000);
            setTimeout(() => {
                if (this.gameRunning) {
                    this.waveCompleted = false; // Reset for next wave
                    this.spawnWave();
                }
            }, waveDelay);
        }
        
        // Check for upgrade availability
        this.checkUpgradeAvailable();
        
        this.updateUI();
    }
    
    createBullets(targetX, targetY) {
        const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
        
        switch(this.weaponLevel) {
            case 0: // Basic single shot
                this.bullets.push({
                    x: this.player.x,
                    y: this.player.y,
                    vx: Math.cos(angle) * this.bulletSpeed,
                    vy: Math.sin(angle) * this.bulletSpeed,
                    size: 4
                });
                break;
                
            case 1: // Double shot
                for(let i = 0; i < 2; i++) {
                    const offsetAngle = angle + (i - 0.5) * 0.1;
                    this.bullets.push({
                        x: this.player.x + (i - 0.5) * 10,
                        y: this.player.y,
                        vx: Math.cos(offsetAngle) * this.bulletSpeed,
                        vy: Math.sin(offsetAngle) * this.bulletSpeed,
                        size: 4
                    });
                }
                break;
                
            case 2: // Triple shot
                for(let i = 0; i < 3; i++) {
                    const offsetAngle = angle + (i - 1) * 0.15;
                    this.bullets.push({
                        x: this.player.x + (i - 1) * 8,
                        y: this.player.y,
                        vx: Math.cos(offsetAngle) * this.bulletSpeed,
                        vy: Math.sin(offsetAngle) * this.bulletSpeed,
                        size: 4
                    });
                }
                break;
                
            case 3: // Spread shot (5 bullets)
                for(let i = 0; i < 5; i++) {
                    const offsetAngle = angle + (i - 2) * 0.3;
                    this.bullets.push({
                        x: this.player.x + (i - 2) * 6,
                        y: this.player.y,
                        vx: Math.cos(offsetAngle) * this.bulletSpeed,
                        vy: Math.sin(offsetAngle) * this.bulletSpeed,
                        size: 3
                    });
                }
                break;
        }
    }
    
    checkUpgradeAvailable() {
        if (this.score >= this.nextUpgradeScore && !this.upgradeAvailable) {
            this.upgradeAvailable = true;
            
            // Randomly determine upgrade type and update button text
            const willBeSlowMotion = Math.random() < 0.4;
            const upgradeBtn = document.getElementById('upgradeWeapon');
            
            if (willBeSlowMotion) {
                upgradeBtn.textContent = 'SLOW-MO ⏰';
                upgradeBtn.style.background = 'linear-gradient(145deg, #00BFFF 0%, #0080FF 50%, #0040FF 100%)';
            } else if (this.weaponLevel < 3) {
                const weaponNames = ['DOUBLE SHOT 🔫', 'TRIPLE SHOT 🔫', 'SPREAD SHOT 🔫'];
                upgradeBtn.textContent = weaponNames[this.weaponLevel] || 'UPGRADE ⚡';
                upgradeBtn.style.background = 'linear-gradient(145deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)';
            } else {
                upgradeBtn.textContent = 'SLOW-MO ⏰';
                upgradeBtn.style.background = 'linear-gradient(145deg, #00BFFF 0%, #0080FF 50%, #0040FF 100%)';
            }
            
            document.getElementById('upgradeBtn').style.display = 'block';
        }
    }
    
    upgradeWeapon() {
        if (!this.upgradeAvailable) return;
        
        // Random chance for slow-motion vs weapon upgrade
        const useSlowMotion = Math.random() < 0.4; // 40% chance for slow-motion
        
        if (useSlowMotion) {
            // Activate slow motion for 10 seconds
            this.slowMotionActive = true;
            this.slowMotionTimer = 600; // 10 seconds at 60fps
        } else if (this.weaponLevel < 3) {
            // Weapon upgrade
            this.weaponLevel++;
        }
        
        this.nextUpgradeScore += 150; // Next upgrade at +150 points
        this.upgradeAvailable = false;
        document.getElementById('upgradeBtn').style.display = 'none';
        
        // Play upgrade sound
        this.playSound(this.sounds.dynamiteExplode);
        
        // Create upgrade particles
        this.createUpgradeParticles();
    }
    
    createUpgradeParticles() {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.player.x,
                y: this.player.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                color: '#FFD700',
                life: 40
            });
        }
    }
    
    loseLife() {
        this.lives--;
        // Reset upgrades when life is lost
        this.weaponLevel = 0;
        this.nextUpgradeScore = Math.floor(this.score / 150) * 150 + 150;
        this.upgradeAvailable = false;
        this.slowMotionActive = false;
        this.slowMotionTimer = 0;
        document.getElementById('upgradeBtn').style.display = 'none';
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    createParticles(x, y, type) {
        const colors = {
            cookie: '#D2691E',
            marshmallow: '#FFB6C1',
            cake: '#FFD700',
            dynamite: '#FF4500'
        };
        
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: colors[type],
                life: 30
            });
        }
    }
    
    explodeDynamite(x, y) {
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                color: '#FF4500',
                life: 40
            });
        }
    }
    
    drawPlayer() {
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        
        // Add shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetX = 3;
        this.ctx.shadowOffsetY = 3;
        
        // Body (dress)
        const bodyGradient = this.ctx.createLinearGradient(-15, -20, 15, 20);
        bodyGradient.addColorStop(0, '#FFB6C1');
        bodyGradient.addColorStop(0.5, '#FF69B4');
        bodyGradient.addColorStop(1, '#FF1493');
        this.ctx.fillStyle = bodyGradient;
        this.ctx.fillRect(-18, -25, 36, 50);
        
        // Body outline
        this.ctx.strokeStyle = '#C71585';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-18, -25, 36, 50);
        
        // Arms
        this.ctx.fillStyle = '#FDBCB4';
        this.ctx.beginPath();
        this.ctx.arc(-20, -10, 8, 0, Math.PI * 2);
        this.ctx.arc(20, -10, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowColor = 'transparent';
        
        // Head with better shading
        const headGradient = this.ctx.createRadialGradient(-3, -38, 0, 0, -35, 15);
        headGradient.addColorStop(0, '#FFEEE6');
        headGradient.addColorStop(0.7, '#FDBCB4');
        headGradient.addColorStop(1, '#E6A899');
        this.ctx.fillStyle = headGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, -35, 18, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Head outline
        this.ctx.strokeStyle = '#D2A699';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(0, -35, 18, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Red hair with highlights
        const hairGradient = this.ctx.createLinearGradient(-18, -53, 18, -25);
        hairGradient.addColorStop(0, '#FF6B6B');
        hairGradient.addColorStop(0.3, '#DC143C');
        hairGradient.addColorStop(0.7, '#B22222');
        hairGradient.addColorStop(1, '#8B0000');
        this.ctx.fillStyle = hairGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, -35, 22, 0, Math.PI);
        this.ctx.fill();
        
        // Hair strands
        this.ctx.strokeStyle = '#FF4444';
        this.ctx.lineWidth = 2;
        for(let i = -3; i <= 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * 6, -55);
            this.ctx.lineTo(i * 4, -30);
            this.ctx.stroke();
        }
        
        // Eyes with sparkle
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(-7, -35, 4, 0, Math.PI * 2);
        this.ctx.arc(7, -35, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(-7, -35, 2.5, 0, Math.PI * 2);
        this.ctx.arc(7, -35, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye sparkles
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(-6, -36, 1, 0, Math.PI * 2);
        this.ctx.arc(8, -36, 1, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eyelashes
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        for(let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(-9 + i, -39);
            this.ctx.lineTo(-10 + i, -41);
            this.ctx.moveTo(7 + i, -39);
            this.ctx.lineTo(6 + i, -41);
            this.ctx.stroke();
        }
        
        // Smile
        this.ctx.strokeStyle = '#FF1493';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, -30, 8, 0.2, Math.PI - 0.2);
        this.ctx.stroke();
        
        // Draw enhanced shotgun (adjusted for upward facing)
        this.ctx.rotate(this.player.angle);
        
        // Gun shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 6;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // Gun stock
        const stockGradient = this.ctx.createLinearGradient(0, -8, 0, 8);
        stockGradient.addColorStop(0, '#8B4513');
        stockGradient.addColorStop(0.5, '#654321');
        stockGradient.addColorStop(1, '#4A2C17');
        this.ctx.fillStyle = stockGradient;
        this.ctx.fillRect(-5, -8, 45, 16);
        
        // Gun barrel
        const barrelGradient = this.ctx.createLinearGradient(35, -4, 35, 4);
        barrelGradient.addColorStop(0, '#708090');
        barrelGradient.addColorStop(0.5, '#2F4F4F');
        barrelGradient.addColorStop(1, '#1C3333');
        this.ctx.fillStyle = barrelGradient;
        this.ctx.fillRect(35, -4, 20, 8);
        
        // Gun details
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(15, -2, 8, 4);
        
        this.ctx.shadowColor = 'transparent';
        
        this.ctx.restore();
    }
    
    drawSweets() {
        this.sweets.forEach(sweet => {
            this.ctx.save();
            this.ctx.translate(sweet.x, sweet.y);
            
            switch(sweet.type) {
                case 'cookie':
                    // Cookie shadow
                    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                    this.ctx.shadowBlur = 8;
                    this.ctx.shadowOffsetX = 3;
                    this.ctx.shadowOffsetY = 3;
                    
                    // Cookie base with gradient
                    const cookieGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, sweet.size/2);
                    cookieGradient.addColorStop(0, '#F4A460');
                    cookieGradient.addColorStop(0.6, '#D2691E');
                    cookieGradient.addColorStop(1, '#8B4513');
                    this.ctx.fillStyle = cookieGradient;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, sweet.size/2, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Cookie outline
                    this.ctx.shadowColor = 'transparent';
                    this.ctx.strokeStyle = '#654321';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, sweet.size/2, 0, Math.PI * 2);
                    this.ctx.stroke();
                    
                    // Cookie chips with variety
                    const chipColors = ['#4A2C2A', '#654321', '#2F1B14'];
                    for(let i = 0; i < 8; i++) {
                        const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
                        const radius = 4 + Math.random() * 8;
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        this.ctx.fillStyle = chipColors[Math.floor(Math.random() * chipColors.length)];
                        this.ctx.beginPath();
                        this.ctx.arc(x, y, 2 + Math.random() * 2, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    
                    // Cookie texture
                    this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
                    this.ctx.lineWidth = 1;
                    for(let i = 0; i < 3; i++) {
                        this.ctx.beginPath();
                        this.ctx.arc(0, 0, (sweet.size/2) - (i * 4), 0, Math.PI * 2);
                        this.ctx.stroke();
                    }
                    break;
                    
                case 'marshmallow':
                    // Marshmallow shadow
                    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                    this.ctx.shadowBlur = 8;
                    this.ctx.shadowOffsetX = 3;
                    this.ctx.shadowOffsetY = 3;
                    
                    // Marshmallow base with gradient
                    const marshmallowGradient = this.ctx.createLinearGradient(-sweet.size/2, -sweet.size/2, sweet.size/2, sweet.size/2);
                    marshmallowGradient.addColorStop(0, '#FFFFFF');
                    marshmallowGradient.addColorStop(0.3, '#FFE4E6');
                    marshmallowGradient.addColorStop(0.7, '#FFB6C1');
                    marshmallowGradient.addColorStop(1, '#FF91A4');
                    this.ctx.fillStyle = marshmallowGradient;
                    
                    // Rounded rectangle for soft appearance
                    const radius = 8;
                    this.ctx.beginPath();
                    this.ctx.roundRect(-sweet.size/2, -sweet.size/2, sweet.size, sweet.size, radius);
                    this.ctx.fill();
                    
                    // Marshmallow outline
                    this.ctx.shadowColor = 'transparent';
                    this.ctx.strokeStyle = '#FF69B4';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.roundRect(-sweet.size/2, -sweet.size/2, sweet.size, sweet.size, radius);
                    this.ctx.stroke();
                    
                    // Soft texture lines
                    this.ctx.strokeStyle = 'rgba(255, 105, 180, 0.4)';
                    this.ctx.lineWidth = 1;
                    for(let i = 1; i < 4; i++) {
                        this.ctx.beginPath();
                        this.ctx.roundRect(-sweet.size/2 + (i*4), -sweet.size/2 + (i*4), sweet.size - (i*8), sweet.size - (i*8), radius - i);
                        this.ctx.stroke();
                    }
                    
                    // Highlight
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    this.ctx.beginPath();
                    this.ctx.roundRect(-sweet.size/2 + 3, -sweet.size/2 + 3, sweet.size/3, sweet.size/4, 3);
                    this.ctx.fill();
                    break;
                    
                case 'cake':
                    // Cake shadow
                    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowOffsetX = 4;
                    this.ctx.shadowOffsetY = 4;
                    
                    // Cake base (bottom layer)
                    const cakeBaseGradient = this.ctx.createLinearGradient(-sweet.size/2, -sweet.size/2, sweet.size/2, sweet.size/2);
                    cakeBaseGradient.addColorStop(0, '#FFEC8C');
                    cakeBaseGradient.addColorStop(0.5, '#FFD700');
                    cakeBaseGradient.addColorStop(1, '#DAA520');
                    this.ctx.fillStyle = cakeBaseGradient;
                    this.ctx.fillRect(-sweet.size/2, -sweet.size/2 + 5, sweet.size, sweet.size - 5);
                    
                    // Cake middle layer (frosting)
                    const frostingGradient = this.ctx.createLinearGradient(-sweet.size/2, -10, sweet.size/2, 10);
                    frostingGradient.addColorStop(0, '#FFB6C1');
                    frostingGradient.addColorStop(0.5, '#FF69B4');
                    frostingGradient.addColorStop(1, '#FF1493');
                    this.ctx.fillStyle = frostingGradient;
                    this.ctx.fillRect(-sweet.size/2, -8, sweet.size, 16);
                    
                    // Cake top layer
                    this.ctx.fillStyle = cakeBaseGradient;
                    this.ctx.fillRect(-sweet.size/2, -sweet.size/2, sweet.size, 15);
                    
                    this.ctx.shadowColor = 'transparent';
                    
                    // Decorative frosting swirls
                    this.ctx.strokeStyle = '#FF1493';
                    this.ctx.lineWidth = 3;
                    this.ctx.lineCap = 'round';
                    for(let i = 0; i < 3; i++) {
                        this.ctx.beginPath();
                        this.ctx.arc(-sweet.size/3 + (i * sweet.size/3), -2, 4, 0, Math.PI * 2);
                        this.ctx.stroke();
                    }
                    
                    // Cherry on top with stem
                    this.ctx.fillStyle = '#DC143C';
                    this.ctx.beginPath();
                    this.ctx.arc(0, -sweet.size/2 + 3, 6, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Cherry highlight
                    this.ctx.fillStyle = '#FF6B6B';
                    this.ctx.beginPath();
                    this.ctx.arc(-2, -sweet.size/2 + 1, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Cherry stem
                    this.ctx.strokeStyle = '#228B22';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -sweet.size/2 - 3);
                    this.ctx.lineTo(2, -sweet.size/2 - 8);
                    this.ctx.stroke();
                    
                    // Candles
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.fillRect(-3, -sweet.size/2 - 15, 2, 10);
                    this.ctx.fillRect(3, -sweet.size/2 - 15, 2, 10);
                    
                    // Candle flames
                    this.ctx.fillStyle = '#FF4500';
                    this.ctx.beginPath();
                    this.ctx.ellipse(-2, -sweet.size/2 - 16, 2, 4, 0, 0, Math.PI * 2);
                    this.ctx.ellipse(4, -sweet.size/2 - 16, 2, 4, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Health indicator for cakes
                    if (sweet.health < sweet.maxHealth) {
                        // Background
                        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                        this.ctx.fillRect(-sweet.size/2, -sweet.size/2 - 15, sweet.size, 6);
                        
                        // Health bar
                        const healthGradient = this.ctx.createLinearGradient(-sweet.size/2, 0, sweet.size/2, 0);
                        healthGradient.addColorStop(0, '#00FF00');
                        healthGradient.addColorStop(0.6, '#FFFF00');
                        healthGradient.addColorStop(1, '#FF0000');
                        this.ctx.fillStyle = healthGradient;
                        this.ctx.fillRect(-sweet.size/2, -sweet.size/2 - 15, 
                            sweet.size * (sweet.health / sweet.maxHealth), 6);
                        
                        // Health bar border
                        this.ctx.strokeStyle = '#000';
                        this.ctx.lineWidth = 1;
                        this.ctx.strokeRect(-sweet.size/2, -sweet.size/2 - 15, sweet.size, 6);
                    }
                    break;
                    
                case 'dynamite':
                    // Dynamite shadow
                    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    this.ctx.shadowBlur = 12;
                    this.ctx.shadowOffsetX = 4;
                    this.ctx.shadowOffsetY = 4;
                    
                    // Dynamite body with gradient
                    const dynamiteGradient = this.ctx.createLinearGradient(-sweet.size/2, -sweet.size/2, sweet.size/2, sweet.size/2);
                    dynamiteGradient.addColorStop(0, '#DC143C');
                    dynamiteGradient.addColorStop(0.3, '#8B0000');
                    dynamiteGradient.addColorStop(0.7, '#660000');
                    dynamiteGradient.addColorStop(1, '#330000');
                    this.ctx.fillStyle = dynamiteGradient;
                    
                    // Rounded rectangle for dynamite
                    this.ctx.beginPath();
                    this.ctx.roundRect(-sweet.size/2, -sweet.size/2, sweet.size, sweet.size, 8);
                    this.ctx.fill();
                    
                    this.ctx.shadowColor = 'transparent';
                    
                    // Dynamite bands
                    this.ctx.fillStyle = '#4A4A4A';
                    this.ctx.fillRect(-sweet.size/2, -sweet.size/2 + 8, sweet.size, 3);
                    this.ctx.fillRect(-sweet.size/2, sweet.size/2 - 11, sweet.size, 3);
                    
                    // Dynamite outline
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.roundRect(-sweet.size/2, -sweet.size/2, sweet.size, sweet.size, 8);
                    this.ctx.stroke();
                    
                    // Enhanced fuse
                    this.ctx.strokeStyle = '#654321';
                    this.ctx.lineWidth = 4;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -sweet.size/2);
                    this.ctx.quadraticCurveTo(5, -sweet.size/2 - 8, 0, -sweet.size/2 - 20);
                    this.ctx.stroke();
                    
                    // Animated spark with particles
                    const time = Date.now() * 0.01;
                    const sparkSize = 4 + Math.sin(time) * 2;
                    
                    // Spark glow
                    this.ctx.shadowColor = '#FFA500';
                    this.ctx.shadowBlur = 15;
                    this.ctx.fillStyle = '#FFFF00';
                    this.ctx.beginPath();
                    this.ctx.arc(0, -sweet.size/2 - 20, sparkSize, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Spark particles
                    for(let i = 0; i < 6; i++) {
                        const angle = (i / 6) * Math.PI * 2 + time;
                        const px = Math.cos(angle) * 8;
                        const py = Math.sin(angle) * 8;
                        this.ctx.fillStyle = `hsl(${30 + Math.sin(time + i) * 30}, 100%, 60%)`;
                        this.ctx.beginPath();
                        this.ctx.arc(px, -sweet.size/2 - 20 + py, 1, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    
                    this.ctx.shadowColor = 'transparent';
                    
                    // Enhanced "TNT" text
                    this.ctx.fillStyle = '#FFFF00';
                    this.ctx.strokeStyle = '#FF0000';
                    this.ctx.lineWidth = 1;
                    this.ctx.font = 'bold 14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.strokeText('TNT', 0, 5);
                    this.ctx.fillText('TNT', 0, 5);
                    
                    // Warning symbols
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.font = 'bold 8px Arial';
                    this.ctx.fillText('⚠', -sweet.size/3, -5);
                    this.ctx.fillText('⚠', sweet.size/3, -5);
                    break;
            }
            
            this.ctx.restore();
        });
    }
    
    drawBullets() {
        this.bullets.forEach(bullet => {
            this.ctx.save();
            
            // Bullet trail effect
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 8;
            
            // Bullet gradient
            const bulletGradient = this.ctx.createRadialGradient(bullet.x, bullet.y, 0, bullet.x, bullet.y, bullet.size * 2);
            bulletGradient.addColorStop(0, '#FFFF00');
            bulletGradient.addColorStop(0.5, '#FFD700');
            bulletGradient.addColorStop(1, '#DAA520');
            this.ctx.fillStyle = bulletGradient;
            
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Bullet outline
            this.ctx.shadowColor = 'transparent';
            this.ctx.strokeStyle = '#B8860B';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life / 30;
            
            // Particle glow effect
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 6;
            
            // Particle gradient
            const particleGradient = this.ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, 4);
            particleGradient.addColorStop(0, particle.color);
            particleGradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = particleGradient;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3 + Math.random() * 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add slow-motion visual effect
        if (this.slowMotionActive) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 191, 255, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
        
        // Draw game objects
        this.drawSweets();
        this.drawBullets();
        this.drawParticles();
        this.drawPlayer();
        
        // Draw slow-motion timer
        if (this.slowMotionActive) {
            this.drawSlowMotionTimer();
        }
    }
    
    drawSlowMotionTimer() {
        this.ctx.save();
        
        // Timer bar background
        const barWidth = 200;
        const barHeight = 8;
        const barX = this.canvas.width / 2 - barWidth / 2;
        const barY = 30;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Timer bar fill
        const fillWidth = (this.slowMotionTimer / 600) * barWidth;
        const gradient = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        gradient.addColorStop(0, '#00BFFF');
        gradient.addColorStop(1, '#0040FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(barX, barY, fillWidth, barHeight);
        
        // Timer text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SLOW MOTION', this.canvas.width / 2, barY - 5);
        
        this.ctx.restore();
    }
    
    drawStartScreen() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Background stars
        for(let i = 0; i < 50; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 2;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Title with enhanced styling
        this.ctx.shadowColor = '#ff6b9d';
        this.ctx.shadowBlur = 20;
        
        const titleGradient = this.ctx.createLinearGradient(0, this.canvas.height / 2 - 80, 0, this.canvas.height / 2 - 20);
        titleGradient.addColorStop(0, '#ff1493');
        titleGradient.addColorStop(0.5, '#ff6b9d');
        titleGradient.addColorStop(1, '#ff69b4');
        this.ctx.fillStyle = titleGradient;
        this.ctx.font = 'bold 48px Comic Sans MS';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Sweet Shooter', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // Title outline
        this.ctx.shadowColor = 'transparent';
        this.ctx.strokeStyle = '#d1477a';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText('Sweet Shooter', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // Subtitle with glow
        this.ctx.shadowColor = '#ff69b4';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#ff1493';
        this.ctx.font = 'bold 24px Comic Sans MS';
        this.ctx.fillText('Click Start to Begin!', this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        // Decorative elements
        this.ctx.shadowColor = 'transparent';
        const time = Date.now() * 0.005;
        for(let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time;
            const x = this.canvas.width / 2 + Math.cos(angle) * 150;
            const y = this.canvas.height / 2 + Math.sin(angle) * 80;
            const sweetTypes = ['🍪', '🧁', '🍰', '🍭'];
            this.ctx.font = '30px Arial';
            this.ctx.fillText(sweetTypes[i % sweetTypes.length], x, y);
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('lives').textContent = this.lives;
    }
    
    gameOver() {
        this.gameRunning = false;
        this.playSound(this.sounds.gameOver);
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('pauseBtn').style.display = 'none';
        document.getElementById('startBtn').style.display = 'inline-block';
        document.getElementById('startBtn').textContent = 'Play Again';
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // Sound generation using simplified parameters
    createSound(params) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const sampleRate = audioContext.sampleRate;
            const duration = params[4] || 0.3;
            const length = Math.floor(sampleRate * duration);
            const buffer = audioContext.createBuffer(1, length, sampleRate);
            const data = buffer.getChannelData(0);
            
            const [volume, , frequency, attack, decay, sustain] = params;
            
            let phase = 0;
            const freq = frequency || 440;
            const attackTime = (attack || 0.01) * sampleRate;
            const decayTime = (decay || 0.1) * sampleRate;
            const sustainLevel = sustain || 0.3;
            
            for (let i = 0; i < length; i++) {
                let envelope = 1;
                
                if (i < attackTime) {
                    envelope = i / attackTime;
                } else if (i < attackTime + decayTime) {
                    const decayProgress = (i - attackTime) / decayTime;
                    envelope = 1 - decayProgress * (1 - sustainLevel);
                } else {
                    const releaseProgress = (i - attackTime - decayTime) / (length - attackTime - decayTime);
                    envelope = sustainLevel * (1 - releaseProgress);
                }
                
                phase += (freq * Math.PI * 2) / sampleRate;
                let sample = Math.sin(phase) * envelope * (volume || 0.5);
                
                data[i] = Math.max(-1, Math.min(1, sample));
            }
            
            return buffer;
        } catch (e) {
            return null;
        }
    }
    
    playSound(buffer) {
        if (!buffer) return;
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const source = audioContext.createBufferSource();
            const gainNode = audioContext.createGain();
            
            source.buffer = buffer;
            source.connect(gainNode);
            gainNode.connect(audioContext.destination);
            gainNode.gain.value = 0.2;
            
            source.start(0);
        } catch (e) {
            // Silent fail
        }
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new SweetShooter();
});