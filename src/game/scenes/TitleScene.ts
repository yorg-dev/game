import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import logoUrl from '../../assets/objects/logo.jpeg'

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const C = {
  bg: 0x080818,
  star: 0xffffff,
  accent: 0xc8974c, // wood/tan — matches toolbar palette
  menuNormal: '#8aa8c0',
  menuHover: '#c0d8ec',
  menuSelected: '#f0e0c0', // warm cream
  tagline: '#a0b8c8',
  hint: '#6a8a9a',
  divider: 0x1a2535,
  cursorGlow: 0xc8974c,
}

// ---------------------------------------------------------------------------
// MenuItem record
// ---------------------------------------------------------------------------

interface MenuItem {
  label: string
  subLabel: string
  text: Phaser.GameObjects.Text | null
  onSelect: () => void
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export class TitleScene extends Phaser.Scene {
  static readonly KEY = 'TitleScene'

  private selectedIndex = 0
  private menuItems: MenuItem[] = []
  private cursor!: Phaser.GameObjects.Text
  private isTransitioning = false

  private upKey!: Phaser.Input.Keyboard.Key
  private downKey!: Phaser.Input.Keyboard.Key
  private enterKey!: Phaser.Input.Keyboard.Key
  private spaceKey!: Phaser.Input.Keyboard.Key

  constructor() {
    super({ key: TitleScene.KEY })
  }

  // ---------------------------------------------------------------------------
  // Phaser lifecycle
  // ---------------------------------------------------------------------------

  preload(): void {
    this.load.image('title-logo', logoUrl)
  }

  create(): void {
    this.cameras.main.setBackgroundColor(C.bg)
    this.isTransitioning = false
    this.menuItems = []

    // Skip the menu only for returning users (had a token before this page load).
    // New guest sessions created during init() must still see the title screen.
    // sessionStorage._returningUser is set synchronously in App.tsx init() before
    // any async work, so it reliably reflects pre-load auth state.
    if (localStorage.getItem('token') && sessionStorage.getItem('_returningUser') === '1') {
      this.startGame()
      return
    }

    this.cameras.main.fadeIn(900, 0, 0, 0)

    this.createStars()
    this.createLogo()
    this.createMenu()
    this.createHint()
    this.setupInput()

    // Auto-start only for invite-link visitors (?landId=...) once their
    // guest session is ready. Direct visits always stay on the title screen.
    const hasInviteLink = new URLSearchParams(window.location.search).has('landId')
    const unsubSession = EventBus.on('session-ready', () => {
      unsubSession()
      if (!this.isTransitioning && localStorage.getItem('token') && hasInviteLink) {
        this.startGame()
      }
    })

    // Reposition on window resize by restarting the scene
    this.scale.once('resize', () => {
      if (!this.isTransitioning) this.scene.restart()
    })
  }

  update(): void {
    if (this.isTransitioning) return

    if (Phaser.Input.Keyboard.JustDown(this.upKey)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length
      this.refreshSelection()
    }
    if (Phaser.Input.Keyboard.JustDown(this.downKey)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length
      this.refreshSelection()
    }
    if (
      Phaser.Input.Keyboard.JustDown(this.enterKey) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey)
    ) {
      this.activateSelected()
    }
  }

  // ---------------------------------------------------------------------------
  // Stars
  // ---------------------------------------------------------------------------

  private createStars(): void {
    const { width: w, height: h } = this.scale

    for (let i = 0; i < 90; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      const size = Math.random() < 0.65 ? 1 : 2
      const alpha = 0.15 + Math.random() * 0.55

      const star = this.add.rectangle(x, y, size, size, C.star, 1).setAlpha(alpha)

      // Each star twinkles independently
      this.tweens.add({
        targets: star,
        alpha: { from: alpha * 0.25, to: Math.min(1, alpha + 0.3) },
        duration: 1200 + Math.random() * 2800,
        repeat: -1,
        yoyo: true,
        delay: Math.random() * 3000,
        ease: 'Sine.easeInOut',
      })
    }
  }

  // ---------------------------------------------------------------------------
  // Logo + tagline
  // ---------------------------------------------------------------------------

  private createLogo(): void {
    const cx = this.scale.width / 2
    const cy = this.scale.height / 2

    // Logo image
    /*
    const logo = this.add.image(cx, cy - 110, 'title-logo')
      .setDisplaySize(180, 180)
      .setAlpha(0)

    this.tweens.add({
      targets:  logo,
      alpha:    1,
      y:        cy - 100,
      duration: 700,
      delay:    150,
      ease:     'Power2',
    })
    */

    // Tagline
    const tag = this.add
      .text(cx, cy + 44, 'Build your world. Command your agents.', {
        fontFamily: '"Courier New", monospace',
        fontSize: '13px',
        color: C.tagline,
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setAlpha(0)

    this.tweens.add({ targets: tag, alpha: 1, duration: 500, delay: 450, ease: 'Power2' })

    // Divider line
    const div = this.add.graphics().setAlpha(0)
    div.fillStyle(C.divider, 1)
    div.fillRect(cx - 100, cy + 66, 200, 1)

    this.tweens.add({ targets: div, alpha: 1, duration: 400, delay: 550 })
  }

  // ---------------------------------------------------------------------------
  // Menu
  // ---------------------------------------------------------------------------

  private createMenu(): void {
    const cx = this.scale.width / 2
    const cy = this.scale.height / 2

    const defs: Array<Pick<MenuItem, 'label' | 'subLabel' | 'onSelect'>> = [
      {
        label: 'NEW GAME',
        subLabel: 'Start a fresh world',
        onSelect: () => this.startGame(),
      },
      {
        label: 'LOAD WORLD',
        subLabel: 'Continue from a save',
        onSelect: () => this.requestLogin(),
      },
    ]

    // Cursor glyph — repositioned by refreshSelection()
    this.cursor = this.add
      .text(0, 0, '▶', {
        fontFamily: '"Courier New", monospace',
        fontSize: '14px',
        color: '#c8974c',
      })
      .setOrigin(1, 0.5)
      .setDepth(10)
      .setAlpha(0)

    defs.forEach((def, i) => {
      const y = cy + 96 + i * 44

      const txt = this.add
        .text(cx + 14, y, def.label, {
          fontFamily: '"Courier New", monospace',
          fontSize: '16px',
          color: C.menuNormal,
          letterSpacing: 3,
        })
        .setOrigin(0, 0.5)
        .setAlpha(0)
        .setInteractive({ useHandCursor: true })

      const sub = this.add
        .text(cx + 14, y + 14, def.subLabel, {
          fontFamily: '"Courier New", monospace',
          fontSize: '9px',
          color: C.hint,
          letterSpacing: 1,
        })
        .setOrigin(0, 0.5)
        .setAlpha(0)

      txt.on('pointerover', () => {
        if (!this.isTransitioning && this.selectedIndex !== i) {
          this.selectedIndex = i
          this.refreshSelection()
        }
      })
      txt.on('pointerdown', () => {
        if (!this.isTransitioning) this.activateSelected()
      })

      this.tweens.add({
        targets: [txt, sub],
        alpha: 1,
        duration: 400,
        delay: 650 + i * 110,
        ease: 'Power2',
      })

      this.menuItems.push({ ...def, text: txt })
      void sub
    })

    // Cursor fades in after items
    this.tweens.add({ targets: this.cursor, alpha: 1, duration: 300, delay: 900 })

    this.time.delayedCall(950, () => this.refreshSelection())
  }

  private refreshSelection(): void {
    this.menuItems.forEach((item, i) => {
      if (!item.text) return
      const selected = i === this.selectedIndex
      item.text.setColor(selected ? C.menuSelected : C.menuNormal)
    })

    const active = this.menuItems[this.selectedIndex]?.text
    if (active) {
      this.cursor.setPosition(active.x - 10, active.y)

      // Pulse the cursor
      this.tweens.killTweensOf(this.cursor)
      this.tweens.add({
        targets: this.cursor,
        alpha: { from: 1, to: 0.3 },
        duration: 540,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut',
      })
    }
  }

  private activateSelected(): void {
    if (this.isTransitioning) return

    // Flash the selected item, then execute
    const item = this.menuItems[this.selectedIndex]
    if (!item?.text) return

    this.tweens.add({
      targets: item.text,
      alpha: { from: 1, to: 0.2 },
      duration: 80,
      repeat: 3,
      yoyo: true,
      onComplete: () => item.onSelect(),
    })
  }

  // ---------------------------------------------------------------------------
  // Keyboard hint
  // ---------------------------------------------------------------------------

  private createHint(): void {
    const cx = this.scale.width / 2
    const cy = this.scale.height / 2

    this.add
      .text(cx, cy + 210, '↑  ↓  ARROWS   ·   ENTER TO SELECT', {
        fontFamily: '"Courier New", monospace',
        fontSize: '8px',
        color: C.hint,
        letterSpacing: 2,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      // fade in last
      .setAlpha(0)

    // Use a tween since we set alpha 0 twice above — create a local ref
    const hint = this.add
      .text(cx, cy + 210, '↑  ↓  ARROWS   ·   ENTER TO SELECT', {
        fontFamily: '"Courier New", monospace',
        fontSize: '8px',
        color: C.hint,
        letterSpacing: 2,
      })
      .setOrigin(0.5)
      .setAlpha(0)

    this.tweens.add({ targets: hint, alpha: 1, duration: 400, delay: 1000 })

    // Version tag bottom-right
    const vTag = this.add
      .text(this.scale.width - 12, this.scale.height - 10, 'v0.1.0', {
        fontFamily: '"Courier New", monospace',
        fontSize: '8px',
        color: C.hint,
      })
      .setOrigin(1, 1)
      .setAlpha(0)

    this.tweens.add({ targets: vTag, alpha: 1, duration: 400, delay: 1200 })
  }

  // ---------------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------------

  private setupInput(): void {
    this.upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP)
    this.downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
  }

  // ---------------------------------------------------------------------------
  // Transitions
  // ---------------------------------------------------------------------------

  private requestLogin(): void {
    if (this.isTransitioning) return
    this.isTransitioning = true

    const unsubConfirmed = EventBus.on('login-confirmed', () => {
      unsubConfirmed()
      unsubCancelled()
      this.startGame()
    })

    const unsubCancelled = EventBus.on('login-cancelled', () => {
      unsubConfirmed()
      unsubCancelled()
      this.isTransitioning = false
    })

    EventBus.emit('show-login', undefined)
  }

  private startGame(): void {
    // Guard double-calls from NEW GAME; skip guard when called after login
    // (isTransitioning already true from requestLogin)
    if (!this.isTransitioning) this.isTransitioning = true

    this.cameras.main.fadeOut(600, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, t: number) => {
      if (t === 1) {
        EventBus.emit('game-started', undefined)
        this.scene.start('GameScene')
      }
    })
  }
}
