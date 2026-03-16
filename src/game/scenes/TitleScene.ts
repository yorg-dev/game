import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import logoUrl from '../../assets/objects/logo.jpeg'
import landBackgroundUrl from '../../assets/land_background.png'
import yorgLogoUrl from '../../assets/yorg_logo.png'

// ---------------------------------------------------------------------------
// Palette — matches Tailwind theme in index.css
// ---------------------------------------------------------------------------

const C = {
  // Backdrop card
  cardFill: 0x1e0e04,      // soil-950
  cardBorder: 0x3d2414,    // soil-800

  // Text
  menuNormal: '#f8eecc',   // wood-100
  menuSelected: '#a0d45e', // grass-300 — bright, pops on dark card
  tagline: '#f0d890',      // wood-200
  hint: '#e8c878',         // wood-300
  divider: 0x3d2414,       // soil-800

  // Cursor / accent
  accent: '#c4924a',       // wood-500
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
    this.load.image('land-background', landBackgroundUrl)
    this.load.image('yorg-logo', yorgLogoUrl)
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x000000)
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

    this.createBackground()
    this.createCard()
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
  // Background — blurred via postFX
  // ---------------------------------------------------------------------------

  private createBackground(): void {
    const { width: w, height: h } = this.scale

    const bg = this.add.image(w / 2, h / 2, 'land-background').setDepth(-2)

    // Scale to cover the full canvas (cover, not stretch)
    const scaleX = w / bg.width
    const scaleY = h / bg.height
    bg.setScale(Math.max(scaleX, scaleY))

    // Blur the background image so the card content stays crisp
    try {
      bg.postFX.addBlur(0, 2, 2, 1)
    } catch {
      // postFX not available (Canvas renderer fallback) — skip blur
    }

    // Light global dim so the card reads against any background region
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.25).setDepth(-1)
  }

  // ---------------------------------------------------------------------------
  // Frosted card backdrop
  // ---------------------------------------------------------------------------

  private createCard(): void {
    const cx = this.scale.width / 2
    const cy = this.scale.height / 2

    const cardW = 380
    const cardH = 410
    const cardY = cy + 20 // slightly below centre to account for logo above

    const g = this.add.graphics().setDepth(0).setAlpha(0)

    // Fill
    g.fillStyle(C.cardFill, 0.82)
    g.fillRoundedRect(cx - cardW / 2, cardY - cardH / 2, cardW, cardH, 12)

    // Border
    g.lineStyle(1, C.cardBorder, 0.9)
    g.strokeRoundedRect(cx - cardW / 2, cardY - cardH / 2, cardW, cardH, 12)

    this.tweens.add({ targets: g, alpha: 1, duration: 500, delay: 100, ease: 'Power2' })
  }

  // ---------------------------------------------------------------------------
  // Logo + tagline
  // ---------------------------------------------------------------------------

  private createLogo(): void {
    const cx = this.scale.width / 2
    const cy = this.scale.height / 2

    // Logo image
    const logo = this.add
      .image(cx, cy - 60, 'yorg-logo')
      .setDisplaySize(220, 220)
      .setAlpha(0)
      .setDepth(1)

    this.tweens.add({
      targets: logo,
      alpha: 1,
      y: cy - 50,
      duration: 700,
      delay: 150,
      ease: 'Power2',
    })

    // Tagline
    const tag = this.add
      .text(cx, cy + 76, 'Build your business while having fun', {
        fontFamily: '"Courier New", monospace',
        fontSize: '13px',
        color: C.tagline,
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(1)

    this.tweens.add({ targets: tag, alpha: 1, duration: 500, delay: 450, ease: 'Power2' })

    // Divider line
    const div = this.add.graphics().setAlpha(0).setDepth(1)
    div.fillStyle(C.divider, 1)
    div.fillRect(cx - 100, cy + 98, 200, 1)

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
        label: 'NEW WORLD',
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
        color: C.accent,
      })
      .setOrigin(1, 0.5)
      .setDepth(10)
      .setAlpha(0)

    defs.forEach((def, i) => {
      const y = cy + 116 + i * 50

      const txt = this.add
        .text(cx + 14, y, def.label, {
          fontFamily: '"Courier New", monospace',
          fontSize: '16px',
          color: C.menuNormal,
          letterSpacing: 3,
        })
        .setOrigin(0, 0.5)
        .setAlpha(0)
        .setDepth(1)
        .setInteractive({ useHandCursor: true })

      const sub = this.add
        .text(cx + 14, y + 16, def.subLabel, {
          fontFamily: '"Courier New", monospace',
          fontSize: '10px',
          color: C.hint,
          letterSpacing: 1,
        })
        .setOrigin(0, 0.5)
        .setAlpha(0)
        .setDepth(1)

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

    const hint = this.add
      .text(cx, cy + 230, '↑  ↓  ARROWS   ·   ENTER TO SELECT', {
        fontFamily: '"Courier New", monospace',
        fontSize: '10px',
        color: C.hint,
        letterSpacing: 2,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(1)

    this.tweens.add({ targets: hint, alpha: 0.7, duration: 400, delay: 1000 })

    // Version tag bottom-right
    const vTag = this.add
      .text(this.scale.width - 12, this.scale.height - 10, 'v0.1.0', {
        fontFamily: '"Courier New", monospace',
        fontSize: '10px',
        color: C.hint,
      })
      .setOrigin(1, 1)
      .setAlpha(0)
      .setDepth(1)

    this.tweens.add({ targets: vTag, alpha: 0.5, duration: 400, delay: 1200 })
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
