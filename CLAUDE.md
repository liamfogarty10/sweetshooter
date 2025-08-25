# Claude Code Configuration

## 🍭 Aoife and Annes Sweet Shooter

### Game Overview
A browser-based shooting game where you control a girl with red hair armed with a shotgun, defending against falling sweets. Built with HTML5 Canvas, CSS3, and vanilla JavaScript.

### 🎮 Live Game
**Play Now:** https://liamfogarty10.github.io/sweetshooter/

### 📁 Project Structure
```
sweetshooter/
├── index.html      # Main game HTML with overlay HUD design
├── style.css       # Responsive CSS with mobile-first approach
├── script.js       # Core game logic and mechanics
├── README.md       # Comprehensive game documentation
└── CLAUDE.md       # This configuration file
```

### 🎯 Game Mechanics

#### Player Character
- **Design**: Girl with distinctive red hair holding shotgun
- **Position**: Bottom center, only top half visible (`y: canvas.height - 40`)
- **Aiming**: Character faces upward into screen (`angle: -Math.PI/2`)
- **Control**: Mouse/touch controls for aiming and shooting

#### Sweet Targets
- **🍪 Cookies**: 1 hit, 10 points, brown with chocolate chips
- **🧀 Marshmallows**: 1 hit, 15 points, pink squares with soft texture
- **🍰 Cakes**: 2 hits, 30 points, layered with cherry on top, shows health bar
- **🧨 Dynamite**: 1 hit, 100 points, destroys all sweets on screen

#### Difficulty Progression
- **Wave System**: Progressive difficulty with more sweets per wave
- **Speed Increase**: Gradual speed increase (`sweetSpeed += 0.15` per wave)
- **Spawn Timing**: Fixed at `2000ms - (wave * 100)` with 800ms minimum
- **Sweet Distribution**: Early waves favor easier targets (cookies/marshmallows)

### 🛠️ Technical Details

#### Canvas Sizing
- **Responsive**: Auto-sizes based on device viewport
- **Aspect Ratio**: 4:3 for optimal mobile/desktop compatibility
- **Max Dimensions**: 800x600 on large screens
- **Min Dimensions**: 300x225 for small devices
- **Mobile Support**: Dynamic viewport units (dvh/dvw)

#### Sound System
- **Web Audio API**: Custom sound generation using simplified parameters
- **Sound Effects**: Unique sounds for each sweet type and game events
- **Mobile Compatibility**: Handles suspended audio context automatically

#### UI Design
- **Overlay HUD**: Score/wave/lives positioned over canvas (not separate containers)
- **Game Controls**: Buttons overlaid at bottom of game area
- **Mobile Responsive**: Comprehensive breakpoints for all device sizes
- **Touch Support**: Full touch event handling with preventDefault

### 🎨 Visual Features

#### Character Art
- **Enhanced Graphics**: Detailed girl sprite with red hair gradient
- **Shotgun Design**: Wood stock with metal barrel and gold details
- **Animation**: Character rotates to aim at mouse/touch position

#### Sweet Graphics
- **Gradient Effects**: Radial/linear gradients for realistic appearance
- **Shadow Effects**: Drop shadows for depth
- **Texture Details**: Chocolate chips, frosting swirls, decorative elements
- **Health Indicators**: Visual health bars for multi-hit sweets

#### Particle System
- **Destruction Effects**: Color-coded particles for each sweet type
- **Explosion Effects**: Enhanced particle burst for dynamite
- **Bullet Trails**: Glowing bullet effects with gradients

### 🚀 Deployment

#### GitHub Repository
- **URL**: https://github.com/liamfogarty10/sweetshooter
- **Branch**: master
- **Pages**: Automatically deployed from master branch

#### Build Commands
```bash
# No build process required - static files only
# Deploy by pushing to master branch
git add .
git commit -m "Update game"
git push origin master
```

### 🐛 Known Issues & Fixes

#### Critical Fixes (Latest)
1. **Wave Progression Bug**: Fixed critical bug where wave counter incremented 60+ times per frame
   - Added `waveCompleted` flag to prevent multiple wave increments
   - Wave now increments exactly once per completion
   - Prevents jumping from wave 2 to wave 63+ causing massive sweet spawns
2. **Spawn Timing Control**: Implemented proper wave spawning management
   - Added `spawningWave` flag to prevent overlapping waves
   - Fixed consistent 1-second intervals between individual sweets
   - Added game state checks in all setTimeout callbacks
3. **Character Position**: Moved to bottom center with only top half visible (`y: canvas.height - 40`)
4. **Mobile Display**: Complete responsive rewrite for all device sizes
5. **Audio Context**: Proper Web Audio API implementation with error handling

#### Performance Optimizations
- **Efficient Collision Detection**: Optimized distance calculations
- **Memory Management**: Proper cleanup of bullets/particles/sweets arrays
- **Canvas Optimization**: RequestAnimationFrame for smooth 60fps gameplay

### 🎮 Controls
- **Desktop**: Mouse movement (aim) + Left click (shoot)
- **Mobile**: Touch movement (aim) + Touch (shoot)
- **UI**: Start/Pause/Restart buttons with overlay positioning

### 📱 Mobile Support
- **Auto-sizing**: Canvas automatically adjusts to device screen
- **Touch Events**: Full touch support with proper event handling
- **Responsive Design**: CSS breakpoints for phones/tablets/desktop
- **Orientation**: Support for both portrait and landscape modes
- **Performance**: Optimized for mobile browsers and touch devices

### 🔧 Development Notes
- **No Dependencies**: Pure HTML/CSS/JavaScript implementation
- **Modern Browser Support**: Requires Canvas and Web Audio API support
- **Progressive Enhancement**: Graceful fallback for audio issues
- **Cross-platform**: Works on iOS, Android, Windows, Mac, Linux browsers

This game demonstrates advanced HTML5 Canvas techniques, responsive web design, Web Audio API usage, and mobile-first development practices.