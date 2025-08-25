class SweetShooter {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameRunning = false;
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        
        // Player character
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            width: 60,
            height: 80,
            angle: 0
        };
        
        // Game objects
        this.sweets = [];
        this.bullets = [];
        this.particles = [];
        
        // Game settings
        this.sweetsPerWave = 5;
        this.sweetSpeed = 1;
        this.bulletSpeed = 8;
        
        this.bindEvents();
        this.drawStartScreen();
    }
    
    bindEvents() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        this.canvas.addEventListener('click', (e) => this.handleShoot(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
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
        
        // Create bullet
        const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
        this.bullets.push({
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * this.bulletSpeed,
            vy: Math.sin(angle) * this.bulletSpeed,
            size: 4
        });
        
        // Update player angle
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
        const sweetsInWave = this.sweetsPerWave + Math.floor(this.wave / 2);
        
        for (let i = 0; i < sweetsInWave; i++) {
            setTimeout(() => {
                this.spawnSweet();
            }, i * 1000);
        }
        
        // Occasionally spawn dynamite
        if (Math.random() < 0.3) {
            setTimeout(() => {
                this.spawnDynamite();
            }, Math.random() * 5000);
        }
    }
    
    spawnSweet() {
        const types = ['cookie', 'marshmallow', 'cake'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.sweets.push({
            x: Math.random() * (this.canvas.width - 50),
            y: -50,
            vx: (Math.random() - 0.5) * 2,
            vy: this.sweetSpeed + Math.random() * 2,
            type: type,
            size: type === 'cake' ? 40 : 30,
            health: type === 'cake' ? 2 : 1,
            maxHealth: type === 'cake' ? 2 : 1
        });
    }
    
    spawnDynamite() {
        this.sweets.push({
            x: Math.random() * (this.canvas.width - 50),
            y: -50,
            vx: (Math.random() - 0.5) * 4,
            vy: this.sweetSpeed * 2 + Math.random() * 3,
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
                        this.explodeDynamite(sweet.x, sweet.y);
                        this.sweets = [];
                        this.score += 100;
                    } else {
                        sweet.health--;
                        if (sweet.health <= 0) {
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
        
        // Update sweets
        for (let i = this.sweets.length - 1; i >= 0; i--) {
            const sweet = this.sweets[i];
            sweet.x += sweet.vx;
            sweet.y += sweet.vy;
            
            // Remove sweets that fall off screen
            if (sweet.y > this.canvas.height + 50) {
                this.sweets.splice(i, 1);
                if (sweet.type !== 'dynamite') {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameOver();
                        return;
                    }
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
        
        // Check if wave is complete
        if (this.sweets.length === 0) {
            this.wave++;
            this.sweetSpeed += 0.5;
            setTimeout(() => this.spawnWave(), 2000);
        }
        
        this.updateUI();
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
        
        // Draw girl character with red hair
        // Body
        this.ctx.fillStyle = '#FFC0CB';
        this.ctx.fillRect(-15, -20, 30, 40);
        
        // Head
        this.ctx.fillStyle = '#FDBCB4';
        this.ctx.beginPath();
        this.ctx.arc(0, -35, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Red hair
        this.ctx.fillStyle = '#DC143C';
        this.ctx.beginPath();
        this.ctx.arc(0, -35, 18, 0, Math.PI);
        this.ctx.fill();
        
        // Eyes
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(-5, -35, 2, 0, Math.PI * 2);
        this.ctx.arc(5, -35, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw shotgun
        this.ctx.rotate(this.player.angle);
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(0, -3, 40, 6);
        
        // Gun barrel
        this.ctx.fillStyle = '#2F4F4F';
        this.ctx.fillRect(35, -2, 15, 4);
        
        this.ctx.restore();
    }
    
    drawSweets() {
        this.sweets.forEach(sweet => {
            this.ctx.save();
            this.ctx.translate(sweet.x, sweet.y);
            
            switch(sweet.type) {
                case 'cookie':
                    this.ctx.fillStyle = '#D2691E';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, sweet.size/2, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Cookie chips
                    this.ctx.fillStyle = '#8B4513';
                    for(let i = 0; i < 5; i++) {
                        const angle = (i / 5) * Math.PI * 2;
                        const x = Math.cos(angle) * 8;
                        const y = Math.sin(angle) * 8;
                        this.ctx.beginPath();
                        this.ctx.arc(x, y, 3, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    break;
                    
                case 'marshmallow':
                    this.ctx.fillStyle = '#FFB6C1';
                    this.ctx.fillRect(-sweet.size/2, -sweet.size/2, sweet.size, sweet.size);
                    
                    // Marshmallow texture
                    this.ctx.strokeStyle = '#FF69B4';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(-sweet.size/2 + 5, -sweet.size/2 + 5, sweet.size - 10, sweet.size - 10);
                    break;
                    
                case 'cake':
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.fillRect(-sweet.size/2, -sweet.size/2, sweet.size, sweet.size);
                    
                    // Cake layers
                    this.ctx.fillStyle = '#FF69B4';
                    this.ctx.fillRect(-sweet.size/2, -5, sweet.size, 10);
                    
                    // Cherry on top
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.beginPath();
                    this.ctx.arc(0, -sweet.size/2 + 5, 4, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Health indicator for cakes
                    if (sweet.health < sweet.maxHealth) {
                        this.ctx.fillStyle = 'red';
                        this.ctx.fillRect(-sweet.size/2, -sweet.size/2 - 10, 20, 3);
                        this.ctx.fillStyle = 'green';
                        this.ctx.fillRect(-sweet.size/2, -sweet.size/2 - 10, 
                            20 * (sweet.health / sweet.maxHealth), 3);
                    }
                    break;
                    
                case 'dynamite':
                    this.ctx.fillStyle = '#8B0000';
                    this.ctx.fillRect(-sweet.size/2, -sweet.size/2, sweet.size, sweet.size);
                    
                    // Fuse
                    this.ctx.strokeStyle = '#000';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -sweet.size/2);
                    this.ctx.lineTo(0, -sweet.size/2 - 15);
                    this.ctx.stroke();
                    
                    // Spark
                    this.ctx.fillStyle = '#FFA500';
                    this.ctx.beginPath();
                    this.ctx.arc(0, -sweet.size/2 - 15, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // "TNT" text
                    this.ctx.fillStyle = '#FFFF00';
                    this.ctx.font = '12px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('TNT', 0, 5);
                    break;
            }
            
            this.ctx.restore();
        });
    }
    
    drawBullets() {
        this.ctx.fillStyle = '#FFD700';
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.life / 30;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw game objects
        this.drawSweets();
        this.drawBullets();
        this.drawParticles();
        this.drawPlayer();
    }
    
    drawStartScreen() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ff6b9d';
        this.ctx.font = '40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Sweet Shooter', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.fillStyle = '#666';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Click Start to Begin!', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('lives').textContent = this.lives;
    }
    
    gameOver() {
        this.gameRunning = false;
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
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new SweetShooter();
});