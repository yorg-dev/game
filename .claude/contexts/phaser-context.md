## Phaser 3 — 2D Top-Down Game Context

### Architecture
- One Scene per game state (Boot, Preload, Game, UI, Menu)
- Separate UI Scene overlaid on Game Scene (Scene.launch + bringToTop)
- Use Scene.data or a singleton store for cross-scene state

### Rendering
- Renderer: WebGL (default), Canvas fallback
- Camera: setZoom, setBounds, startFollow(player)
- Tilemap: Tiled JSON format, use layers (ground, collision, above-player)
- Sort depth with setDepth() or use scene.sort.on('sort', ...) for y-sort

### Physics
- Use Arcade Physics for top-down (lightweight, no rotation needed)
- Static groups for walls/terrain, dynamic for player/NPCs
- setCollideWorldBounds(true) on player
- Use overlap (not collide) for triggers/pickups

### Tilemaps
- Collision layer: setCollisionByProperty({ collides: true })
- Avoid per-tile collision checks each frame — bake into static group
- Use object layers in Tiled for spawn points, triggers, zones

### Input
- cursors = this.input.keyboard.createCursorKeys()
- WASD: use addKey(Phaser.Input.Keyboard.KeyCodes.W) etc.
- Gamepad: this.input.gamepad.on('connected', ...)
- Normalize diagonal movement (magnitude 1)

### Entities
- Extend Phaser.Physics.Arcade.Sprite for player/NPCs
- Pass scene reference in constructor, call scene.add.existing(this)
- Use preUpdate() for movement logic, not update()

### Animations
- Define once in Preload/Boot scene, reuse by key everywhere
- anims.create({ key, frames, frameRate, repeat })
- Guard with: if (!this.anims.exists(key)) before creating

### Performance
- Use texture atlases (Texture Packer) — minimize draw calls
- Object pool for projectiles/particles (Phaser.GameObjects.Group with maxSize)
- Disable physics bodies on inactive objects
- Cull tiles outside camera with setCullPadding()

### Common Pitfalls
- Never create anims inside a Scene that loads multiple times — guard or use Boot scene
- Destroy event listeners on Scene shutdown (this.events.on('shutdown', cleanup))
- Physics debug: debugGraphic visible — turn off in production
- setImmovable(true) on static bodies pushed by player

### NPC

### Inventory

### Dialogue

### Procedural maps

### Multiplayer
