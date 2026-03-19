import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { Agent } from '../entities/Agent'
import { AGENT_TYPES } from '../entities/AgentType'
import type { AgentType, AgentConfig } from '../entities/AgentType'
import { User } from '../entities/User'
import { findAgentTemplate } from '@/game/agentTemplates/agentTemplateStore'
import type { AgentTemplate } from '@/models/AgentTemplate'
import bunnyUrl from '../../assets/characters/bunny.png'
import chickenUrl from '../../assets/characters/chicken_sprites.png'
import cowUrl from '../../assets/characters/cow_sprites.png'
import grassUrl from '../../assets/tilesets/grass.png'
import waterUrl from '../../assets/tilesets/water.png'
import biomUrl from '../../assets/objects/biom.png'
import dirtUrl from '../../assets/tilesets/dirt_01.png'
import fencesUrl from '../../assets/tilesets/fences.png'
import type { LandPlacement } from '@/models/LandPlacement'
import type { Connection } from '@/models/Connection'
import { IndoorScene } from './IndoorScene'
import { TitleScene } from './TitleScene'
import { getActiveMap } from '../maps/index'
import type { MapDefinition } from '../maps/MapDefinition'
import { CharacterSheetFactory } from '../factories/CharacterSheetFactory'
import { MinimapFactory } from '../factories/MinimapFactory'
import { SignFactory } from '../factories/SignFactory'
import { ChestFactory } from '../factories/ChestFactory'
import { ConnectionHouseFactory } from '../factories/ConnectionHouseFactory'
import { QuestFactory } from '../factories/QuestFactory'
import { MultiplayerManager } from '../multiplayer/MultiplayerManager'
import { getActiveLand } from '@/providers/activeLand'
import type { PositionedConnection } from '../factories/ConnectionHouseFactory'
import { agentLevelProvider } from '@/providers/agentLevelProvider'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// The home building is always present on every land — it is a map object,
// not a user-created connection. We construct a minimal Connection-shaped
// value so ConnectionHouseFactory can render it with the grey-brick texture.
const HOME_CONNECTION: Connection = {
  id: 'home',
  app_id: 'home',
  label: 'Home',
  status: 'connected',
  credentials: {},
  connected_at: '',
}

// ---------------------------------------------------------------------------
// Input type
// ---------------------------------------------------------------------------

type WASDKeys = {
  W: Phaser.Input.Keyboard.Key
  A: Phaser.Input.Keyboard.Key
  S: Phaser.Input.Keyboard.Key
  D: Phaser.Input.Keyboard.Key
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export class GameScene extends Phaser.Scene {
  private mapDef!: MapDefinition
  private map!: Phaser.Tilemaps.Tilemap
  private layer!: Phaser.Tilemaps.TilemapLayer
  private waterLayer: Phaser.Tilemaps.TilemapLayer | null = null
  private fenceLayer: Phaser.Tilemaps.TilemapLayer | null = null
  private decorationGroup!: Phaser.Physics.Arcade.StaticGroup
  private agents: Agent[] = []
  private player!: User
  private selectionIndicator!: Phaser.GameObjects.Graphics
  private keys!: WASDKeys
  private chest: ChestFactory = new ChestFactory(this)
  private sign: SignFactory = new SignFactory(this)
  private houses: ConnectionHouseFactory = new ConnectionHouseFactory(this, () => {
    this.isDialogOpen = true
  })
  private isDialogOpen = false
  private doorPrompt!: Phaser.GameObjects.Text
  private agentPrompt!: Phaser.GameObjects.Text
  private eKey!: Phaser.Input.Keyboard.Key
  private spaceKey!: Phaser.Input.Keyboard.Key
  private mMapKey!: Phaser.Input.Keyboard.Key
  private minimap!: MinimapFactory
  private controlledAgent: Agent | null = null
  private quests: QuestFactory = new QuestFactory(this)
  private multiplayer!: MultiplayerManager
  private hasMoved = false
  // Tracked colliders — removed on shutdown to prevent leaks across restarts.
  private colliders: Phaser.Physics.Arcade.Collider[] = []
  // Last indoor scene appId — enables sleep/wake for same-house re-entry.
  private lastIndoorAppId: string | null = null

  constructor() {
    super({ key: 'GameScene' })
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  // Reset per-run state before create() so scene.start() always begins clean.
  init(): void {
    this.agents = []
    this.hasMoved = false
    this.isDialogOpen = false
    this.controlledAgent = null
    this.colliders = []
    this.lastIndoorAppId = null
  }

  preload(): void {
    // Player → bunny sprite sheet: 192×192, frames 48×48 (4 cols × 4 rows: down/left/right/up)
    this.load.spritesheet(User.TEXTURE_KEY, bunnyUrl, { frameWidth: 48, frameHeight: 48 })
    // Engineering → chicken sprite sheet: 64×32, frames 16×16 (4 cols × 2 rows)
    this.load.spritesheet('char-engineering', chickenUrl, { frameWidth: 16, frameHeight: 16 })
    // Marketing → cow sprite sheet: 96×64, frames 32×32 (3 cols × 2 rows)
    this.load.spritesheet('char-marketing', cowUrl, { frameWidth: 32, frameHeight: 32 })
    // Grass tileset: 176×112, frames 16×16 (11 cols × 7 rows = 77 tiles)
    this.load.image('grass-tiles', grassUrl)
    // Water tileset: 64×16, frames 16×16 (4 cols × 1 row = 4 tiles)
    this.load.image('water-tiles', waterUrl)
    // Biom decorations: 144×80, frames 16×16 (9 cols × 5 rows = 45 tiles)
    this.load.spritesheet('biom', biomUrl, { frameWidth: 16, frameHeight: 16 })
    // Dirt/path tileset: 128×128, frames 16×16 (8 cols × 8 rows = 64 tiles)
    this.load.image('dirt-tiles', dirtUrl)
    // Fence tileset: 64×64, frames 16×16 (4 cols × 4 rows = 16 tiles)
    this.load.image('fence-tiles', fencesUrl)
    this.chest.preload()
    this.sign.preload()
    this.houses.preload()
  }

  // create() is an orchestrator — each named method owns a single concern.
  create(): void {
    this.mapDef = getActiveMap()
    this.game.canvas.style.background = this.mapDef.bgColor ?? '#000000'

    this.setupMap()
    this.setupPhysicsBounds()
    this.setupMinimap()
    this.setupAnimations()
    this.setupObjects()
    this.setupPlayer()
    this.setupCamera()
    this.setupInput()
    this.setupHUD()
    this.setupMultiplayer()
    this.setupEventBusListeners()
    EventBus.emit('scene-ready', this)
  }

  update(): void {
    // Redraw the minimap viewport indicator every frame regardless of input state.
    this.minimap.updateViewIndicator()

    // Don't process game input while a modal is open, typing in a form element, or dragging a house/minimap.
    const tag = (document.activeElement?.tagName ?? '').toUpperCase()
    const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    const isModalOpen = !!document.querySelector('[data-modal]') || this.isDialogOpen
    // Disable Phaser pointer events while any modal is visible so clicks don't
    // bleed through to game objects (chest, houses, sign) underneath.
    this.input.enabled = !isModalOpen
    if (isTyping || isModalOpen || this.houses.isDragging || this.minimap.isDragging) {
      ;(this.controlledAgent ?? this.player).stop()
      this.doorPrompt.setVisible(false)
      this.agentPrompt.setVisible(false)
      return
    }

    const { W, A, S, D } = this.keys
    let dx = 0
    let dy = 0
    if (A.isDown) dx -= 1
    if (D.isDown) dx += 1
    if (W.isDown) dy -= 1
    if (S.isDown) dy += 1

    // Re-attach camera to player the moment WASD is pressed after a minimap pan.
    if (this.minimap.isCameraDetached && (dx !== 0 || dy !== 0)) {
      this.cameras.main.startFollow(this.controlledAgent ?? this.player, true, 0.1, 0.1)
      this.minimap.isCameraDetached = false
    }

    // Normalize diagonal so it doesn't move faster than cardinal.
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2
      dy *= Math.SQRT1_2
    }

    const controlled = this.controlledAgent ?? this.player
    if (dx !== 0 || dy !== 0) {
      controlled.move(dx, dy)
      if (!this.hasMoved) {
        this.hasMoved = true
        EventBus.emit('player-moved', undefined)
      }
    } else {
      controlled.stop()
    }

    // Keep player stopped while controlling an agent.
    if (this.controlledAgent) this.player.stop()

    // Keep the selection indicator above the controlled character.
    this.selectionIndicator.setPosition(controlled.x, controlled.y - 14)

    // Door proximity — show [E] Enter prompt and handle entry
    this.updateDoorProximity()

    // Agent proximity — show [Space] Chat prompt and open popover
    this.updateAgentProximity()

    // Broadcast local player position to other players
    // isMoving is false when controlling an agent (player sprite is stopped)
    const isMoving = (dx !== 0 || dy !== 0) && this.controlledAgent === null
    this.multiplayer.tick(this.player.x, this.player.y, this.player.facing, isMoving)

    // Broadcast owner-spawned agent positions
    this.multiplayer.tickAgents(
      this.agents.map((a) => ({
        localId: a.id,
        x: a.x,
        y: a.y,
        facing: a.facing,
        moving: (a.body as Phaser.Physics.Arcade.Body).speed > 0,
      })),
    )
  }

  // ---------------------------------------------------------------------------
  // Setup methods — called once from create()
  // ---------------------------------------------------------------------------

  private setupMap(): void {
    this.createTileset()
    this.layer = this.createMap()
    this.createDecorations()
  }

  private setupPhysicsBounds(): void {
    const worldW = this.mapDef.cols * this.mapDef.tileSize
    const worldH = this.mapDef.rows * this.mapDef.tileSize
    this.physics.world.setBounds(0, 0, worldW, worldH)
    this.cameras.main.setBounds(0, 0, worldW, worldH)
  }

  private setupMinimap(): void {
    this.minimap = new MinimapFactory(this, this.mapDef)
    this.minimap.create()
  }

  private setupAnimations(): void {
    const charFactory = new CharacterSheetFactory(this, this.mapDef.tileSize)
    charFactory.createBunnyAnimations()
    for (const [type, cfg] of Object.entries(AGENT_TYPES) as Array<[AgentType, AgentConfig]>) {
      if (type === 'engineering' || type === 'marketing') {
        charFactory.createAssetSpriteAnimations(type as 'engineering' | 'marketing')
      } else {
        charFactory.createCharacterSheet(`char-${type}`, cfg.shirtColor)
        charFactory.createAnimations(`char-${type}`)
      }
    }
  }

  private setupObjects(): void {
    const { placements, landObjects, connections, canInteract, canManage } = getActiveLand()
    const connPlacements = this.resolveConnectionPlacements(placements, connections)
    const homeObj = landObjects.find((o) => o.object_type === 'home')
    const signObj = landObjects.find((o) => o.object_type === 'bulletin_board')
    const chestObj = landObjects.find((o) => o.object_type === 'chest')

    const allHouses: PositionedConnection[] = [
      ...(homeObj ? [{ connection: HOME_CONNECTION, x: homeObj.x, y: homeObj.y }] : []),
      ...connPlacements,
    ]

    this.houses.create(this.mapDef, allHouses)
    this.chest.createAnimations()
    if (chestObj)
      this.chest.spawn(chestObj.x, chestObj.y, () => {
        this.isDialogOpen = true
      })
    if (signObj) this.sign.spawn(signObj.x, signObj.y)
    this.selectionIndicator = this.createSelectionIndicator()

    // Publish permissions to the registry so factories and helpers can read
    // them without coupling to activeLand directly.
    this.registry.set('land.canInteract', canInteract)
    this.registry.set('land.canManage', canManage)
  }

  private setupPlayer(): void {
    const { col, row } = this.mapDef.spawnTile
    const spawnX = (col + 0.5) * this.mapDef.tileSize
    const spawnY = (row + 0.5) * this.mapDef.tileSize

    this.player = new User(this, spawnX, spawnY)

    // Store all colliders so shutdown can remove them cleanly.
    this.colliders.push(this.physics.add.collider(this.player, this.layer))
    if (this.waterLayer)
      this.colliders.push(this.physics.add.collider(this.player, this.waterLayer))
    if (this.fenceLayer)
      this.colliders.push(this.physics.add.collider(this.player, this.fenceLayer))
    this.colliders.push(this.physics.add.collider(this.player, this.decorationGroup))
    this.colliders.push(this.physics.add.collider(this.player, this.houses.group))
    if (this.chest.sprite)
      this.colliders.push(this.physics.add.collider(this.player, this.chest.sprite))
    if (this.sign.sprite)
      this.colliders.push(this.physics.add.collider(this.player, this.sign.sprite))
  }

  private setupCamera(): void {
    // Zoom in so 16 px tiles appear large enough to read on screen.
    // Each tile renders at 48 CSS px; world size stays 960 × 544, camera scrolls.
    this.cameras.main.setZoom(3)
    // Round sprite positions to the nearest integer pixel before rendering.
    // Without this, sub-pixel positions at zoom × 3 cause the sprite to flicker
    // (blink in and out) as the camera scrolls with lerp.
    this.cameras.main.setRoundPixels(true)
    // Small deadzone so the camera doesn't snap instantly — reduces motion sickness
    // on short steps while still tracking the player tightly.
    this.cameras.main.setDeadzone(20, 16)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
  }

  private setupInput(): void {
    // enableCapture=false: don't preventDefault on WASD so text inputs still receive them.
    // Movement suppression is handled in update() via activeElement / dialog checks.
    this.keys = this.input.keyboard!.addKeys('W,A,S,D', false) as WASDKeys
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E, false)
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE, false)
    this.mMapKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P, false)
    this.mMapKey.on('down', () => this.minimap.toggle())
  }

  private setupHUD(): void {
    // Door entry prompt — hidden until player is near a house door
    this.doorPrompt = this.add
      .text(0, 0, '[E] Enter', {
        fontSize: '6px',
        color: '#ffffff',
        backgroundColor: '#000000cc',
        padding: { x: 3, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(20)
      .setResolution(3)
      .setVisible(false)

    // Agent chat prompt — hidden until player is near an agent
    this.agentPrompt = this.add
      .text(0, 0, '[Space] Chat', {
        fontSize: '6px',
        color: '#ffffff',
        backgroundColor: '#000000cc',
        padding: { x: 3, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(20)
      .setResolution(3)
      .setVisible(false)
  }

  private setupMultiplayer(): void {
    const { col, row } = this.mapDef.spawnTile
    const spawnX = (col + 0.5) * this.mapDef.tileSize
    const spawnY = (row + 0.5) * this.mapDef.tileSize

    this.multiplayer = new MultiplayerManager(this)
    this.multiplayer.init(spawnX, spawnY, 'down', getActiveLand().land.id)
    this.houses.setMultiplayer(this.multiplayer)
  }

  // ---------------------------------------------------------------------------
  // Land placement helpers
  // ---------------------------------------------------------------------------

  private resolveConnectionPlacements(
    placements: LandPlacement[],
    connections: import('@/models/Connection').Connection[],
  ): PositionedConnection[] {
    return placements
      .filter((p) => p.entity_type === 'connection' && p.entity_id !== 'home')
      .flatMap((p) => {
        const connection = connections.find((c) => c.id === p.entity_id)
        return connection ? [{ connection, x: p.world_x, y: p.world_y }] : []
      })
  }

  // ---------------------------------------------------------------------------
  // Agent management
  // ---------------------------------------------------------------------------

  private spawnAgentAt(template: AgentTemplate, x: number, y: number, name: string): Agent {
    const agent = new Agent(this, x, y, template, name)
    this.colliders.push(this.physics.add.collider(agent, this.layer))
    if (this.waterLayer) this.colliders.push(this.physics.add.collider(agent, this.waterLayer))
    this.colliders.push(this.physics.add.collider(agent, this.houses.group))
    if (this.chest.sprite) this.colliders.push(this.physics.add.collider(agent, this.chest.sprite))
    if (this.sign.sprite) this.colliders.push(this.physics.add.collider(agent, this.sign.sprite))
    // Agents are NPCs — clicking opens their dialog/popover, not player control.
    agent.on('pointerdown', () => {
      EventBus.emit('agent-clicked', {
        id: agent.id,
        name: agent.name,
        templateId: agent.template.id,
      })
    })
    this.agents.push(agent)
    this.checkAgentAttention(agent)
    agent.startWander()
    EventBus.emit('agent-spawned', {
      id: agent.id,
      name: agent.name,
      templateId: agent.template.id,
    })
    return agent
  }

  /** Show or clear the attention badge based on whether all required integrations are connected. */
  private checkAgentAttention(agent: Agent): void {
    const missingConnection = agent.template.required_integrations.some(
      (appId) => !this.houses.connectedAppIds.has(appId),
    )
    agent.setNeedsAttention(missingConnection)
  }

  // ---------------------------------------------------------------------------
  // Door proximity + indoor transition
  // ---------------------------------------------------------------------------

  private static readonly DOOR_RADIUS = 26 // world px from house front door
  private static readonly AGENT_RADIUS = 24 // world px from agent centre

  private updateDoorProximity(): void {
    const canInteract = (this.registry.get('land.canInteract') as boolean) ?? false

    const nearest = this.houses.findNearestDoor(this.player.x, this.player.y, GameScene.DOOR_RADIUS)

    if (nearest && canInteract) {
      this.doorPrompt
        .setText('[E] Enter')
        .setPosition(this.player.x, this.player.y - 18)
        .setVisible(true)
    } else {
      this.doorPrompt.setVisible(false)
    }

    if (
      canInteract &&
      nearest &&
      Phaser.Input.Keyboard.JustDown(this.eKey) &&
      !this.houses.isDragging &&
      !this.isDialogOpen
    ) {
      this.enterHouse(nearest)
    }
  }

  private updateAgentProximity(): void {
    let nearest: Agent | null = null
    let nearestDist = GameScene.AGENT_RADIUS

    for (const agent of this.agents) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, agent.x, agent.y)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = agent
      }
    }

    if (nearest) {
      this.agentPrompt.setPosition(this.player.x, this.player.y - 18).setVisible(true)
    } else {
      this.agentPrompt.setVisible(false)
    }

    if (nearest && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      EventBus.emit('agent-clicked', {
        id: nearest.id,
        name: nearest.name,
        templateId: nearest.template.id,
        tab: 'chat',
      })
    }
  }

  private enterHouse(connection: Connection): void {
    this.doorPrompt.setVisible(false)

    const indoorScene = this.scene.get(IndoorScene.KEY)
    const isSameHouse = this.lastIndoorAppId === connection.app_id

    if (isSameHouse && indoorScene?.scene.isSleeping()) {
      // Cheaper path: wake the sleeping IndoorScene instead of stop + re-launch.
      // The wake event fires in IndoorScene to re-emit enter-house to the HUD.
      this.scene.wake(IndoorScene.KEY)
    } else {
      // Different house or scene not yet sleeping — start fresh.
      if (indoorScene?.scene.isActive() || indoorScene?.scene.isSleeping()) {
        this.scene.stop(IndoorScene.KEY)
      }
      this.lastIndoorAppId = connection.app_id
      this.scene.launch(IndoorScene.KEY, { appId: connection.app_id, connection })
    }

    this.scene.sleep()
  }

  // ---------------------------------------------------------------------------
  // EventBus
  // ---------------------------------------------------------------------------

  private setupEventBusListeners(): void {
    const unsubSpawn = EventBus.on(
      'spawn-agent',
      ({ templateId, name, x, y, networkId, remote }) => {
        const template = findAgentTemplate(templateId)
        if (!template) return

        // Skip if this is an echo of our own broadcast
        if (remote && networkId && this.multiplayer.hasAgent(networkId)) return

        const { centerX, centerY } = this.cameras.main.worldView
        const spawnX = x ?? centerX
        const spawnY = y ?? centerY
        const agent = this.spawnAgentAt(template, spawnX, spawnY, name)
        this.colliders.push(this.physics.add.collider(agent, this.player))

        // Assign a stable networkId and register with multiplayer
        const netId = networkId ?? Math.random().toString(36).slice(2, 10)
        this.multiplayer.registerAgent(netId, agent.id, !!remote)

        if (remote) {
          agent.stopWander() // position driven by WS broadcasts, not local AI
        } else {
          this.multiplayer.broadcastAgentAdded(netId, name, templateId, spawnX, spawnY)
        }
      },
    )

    // React may miss events emitted during create() due to StrictMode's
    // mount→unmount→mount cycle.  When GameMenu re-subscribes it sends this
    // event so we can replay the current agent list.
    const unsubSync = EventBus.on('request-agent-sync', () => {
      this.agents.forEach((s) => {
        EventBus.emit('agent-spawned', { id: s.id, name: s.name, templateId: s.template.id })
      })
    })

    const CHAT_RESPONSES: Record<string, string[]> = {
      ecommerce: [
        'Checking the order data now.',
        'Running the refund workflow.',
        "I'll verify the inventory.",
        'On it — pulling Shopify data.',
      ],
      sales: [
        'Queuing that in the outreach pipeline.',
        'Pulling lead data now.',
        "I'll log that to Salesforce.",
        'Searching Apollo for matches.',
      ],
      support: [
        'Opening the ticket queue.',
        "I'll look up the customer history.",
        'Escalating that right away.',
        'Checking Zendesk now.',
      ],
      marketing: [
        "I'll draft that content now.",
        'Scheduling the post to Buffer.',
        'Pulling engagement analytics.',
        'Generating copy with OpenAI.',
      ],
    }

    const unsubMessage = EventBus.on('agent-message', ({ messageId, agentId, text: _text }) => {
      const agent = this.agents.find((s) => s.id === agentId)
      if (!agent) return

      // Show a "thinking" bubble immediately.
      this.showFloatingText(agent.x, agent.y, '…')

      // After a short delay, pick a response and emit it.
      const delay = 700 + Math.random() * 600
      this.time.delayedCall(delay, () => {
        const pool = CHAT_RESPONSES[agent.template.category] ?? CHAT_RESPONSES['sales']
        const response = pool[Math.floor(Math.random() * pool.length)]
        this.showFloatingText(agent.x, agent.y, response)
        EventBus.emit('agent-response', { messageId, agentId, text: response })
        this.awardAgentXp(agent, 'chat')
      })
    })

    const unsubCommand = EventBus.on('command-issued', ({ id: commandId, text }) => {
      if (this.agents.length === 0) return
      this.agents.forEach((agent, index) => {
        this.time.delayedCall(index * 300, () => {
          this.dispatchAgentTask(agent, commandId, text)
          this.awardAgentXp(agent, 'command')
        })
      })
    })

    const unsubVoice = EventBus.on('voice-command', ({ command }) => {
      // Surface the transcript above the player regardless of agent count.
      this.showFloatingText(this.player.x, this.player.y - 8, `🎤 ${command}`)
      if (this.agents.length === 0) return

      const commandId = `voice_${Date.now()}`
      const targeted = this.findCommandTarget(command)
      const targets = targeted ? [targeted] : this.agents

      targets.forEach((agent, index) => {
        this.time.delayedCall(index * 300, () => {
          this.dispatchAgentTask(agent, commandId, command)
          this.awardAgentXp(agent, 'voice')
        })
      })
    })

    const unsubRemove = EventBus.on('remove-agent', ({ id }) => {
      if (this.controlledAgent?.id === id) this.releaseControl()
      const index = this.agents.findIndex((s) => s.id === id)
      if (index === -1) return
      this.multiplayer.broadcastAgentRemoved(id)
      this.multiplayer.unregisterAgent(id)
      const [agent] = this.agents.splice(index, 1)
      agent.destroy()
      EventBus.emit('agent-removed', { id })
    })

    const unsubSelect = EventBus.on('select-agent', ({ id }) => {
      if (this.controlledAgent?.id === id) {
        this.releaseControl()
        return
      }
      const agent = this.agents.find((a) => a.id === id)
      if (!agent) return
      if (this.controlledAgent) this.controlledAgent.startWander()
      agent.stopWander()
      this.controlledAgent = agent
      this.cameras.main.startFollow(agent, true, 0.1, 0.1)
      EventBus.emit('controlled-agent-changed', { id: agent.id, name: agent.name })
    })

    const unsubRelease = EventBus.on('release-agent', () => {
      this.releaseControl()
    })

    const unsubLogout = EventBus.on('logout', () => {
      // Reset indoor state in case the player logs out while inside a house.
      // exit-house is a no-op if already outdoors; emitting it is always safe.
      EventBus.emit('exit-house', undefined)
      // Stop IndoorScene so its EventBus listeners are cleaned up on logout.
      const indoorScene = this.scene.get(IndoorScene.KEY)
      if (indoorScene?.scene.isActive() || indoorScene?.scene.isSleeping()) {
        this.scene.stop(IndoorScene.KEY)
      }
      this.scene.start(TitleScene.KEY)
    })

    const unsubAddConn = EventBus.on('add-connection', ({ worldX, worldY, connection, remote }) => {
      this.houses.add(connection, worldX, worldY)
      if (connection.status === 'connected') {
        this.agents.forEach((s) => this.checkAgentAttention(s))
      }
      if (!remote) {
        this.multiplayer.broadcastPlacementAdded(connection, worldX, worldY)
      }
    })

    const unsubDialogEnd = EventBus.on('dialog-end', () => {
      this.isDialogOpen = false
    })

    const unsubAgentMoved = EventBus.on(
      'agent-remote-moved',
      ({ localId, x, y, facing, moving }) => {
        const agent = this.agents.find((a) => a.id === localId)
        agent?.applyRemoteState(x, y, facing, moving)
      },
    )

    const unsubRemoveConn = EventBus.on('remove-connection', ({ connectionId }) => {
      this.houses.remove(connectionId)
    })

    const unsubMoveConn = EventBus.on('move-connection', ({ connectionId, worldX, worldY }) => {
      this.houses.moveTo(connectionId, worldX, worldY)
    })

    // If the land data resolves after the scene has already created its houses
    // (e.g. API slower than scene creation, or user switches lands), reload all
    // placement-driven entities with the fresh data.
    const unsubConnLoaded = EventBus.on(
      'land-ready',
      ({ placements, landObjects, connections, canInteract, canManage }) => {
        console.debug('[GameScene:land-ready] landObjects:', landObjects)

        // Keep the registry current so updateDoorProximity and the factory
        // always see the latest permissions without coupling to activeLand.
        this.registry.set('land.canInteract', canInteract)
        this.registry.set('land.canManage', canManage)

        const connPlacements = this.resolveConnectionPlacements(placements, connections)
        const homeObj = landObjects.find((o) => o.object_type === 'home')
        // Home position comes from land_objects. Skip if not defined on this land.
        const allHouses: PositionedConnection[] = [
          ...(homeObj ? [{ connection: HOME_CONNECTION, x: homeObj.x, y: homeObj.y }] : []),
          ...connPlacements,
        ]
        this.houses.reload(allHouses)

        // Spawn or reposition the bulletin board and chest
        const signObj = landObjects.find((o) => o.object_type === 'bulletin_board')
        const chestObj = landObjects.find((o) => o.object_type === 'chest')
        if (signObj) {
          if (this.sign.sprite) {
            this.sign.moveTo(signObj.x, signObj.y)
          } else {
            this.sign.spawn(signObj.x, signObj.y)
            if (this.sign.sprite)
              this.colliders.push(this.physics.add.collider(this.player, this.sign.sprite))
          }
        }
        if (chestObj) {
          if (this.chest.sprite) {
            this.chest.moveTo(chestObj.x, chestObj.y)
          } else {
            this.chest.spawn(chestObj.x, chestObj.y, () => {
              this.isDialogOpen = true
            })
            if (this.chest.sprite)
              this.colliders.push(this.physics.add.collider(this.player, this.chest.sprite))
          }
        }
      },
    )

    this.events.once('shutdown', () => {
      unsubSpawn()
      unsubSync()
      unsubRemove()
      unsubSelect()
      unsubRelease()
      unsubLogout()
      unsubCommand()
      unsubVoice()
      unsubMessage()
      unsubAddConn()
      unsubDialogEnd()
      unsubAgentMoved()
      unsubRemoveConn()
      unsubMoveConn()
      unsubConnLoaded()
      this.multiplayer.destroy()

      // Remove all tracked physics colliders to prevent stale callbacks
      // firing if this scene is restarted (e.g. after logout → re-login).
      // Guard with ?. — physics world may already be torn down on full shutdown.
      this.colliders.forEach((c) => this.physics.world?.removeCollider(c))
      this.colliders = []

      // Release keyboard references so re-added keys on restart don't stack.
      this.input.keyboard?.removeAllKeys(true, true)
      this.input.off('pointerdown')
    })

    this.quests.start()
  }

  // ---------------------------------------------------------------------------
  // Agent XP
  // ---------------------------------------------------------------------------

  private awardAgentXp(agent: Agent, xpType: 'command' | 'voice' | 'chat'): void {
    agentLevelProvider.recordXp(agent.template.slug, xpType).then((result) => {
      if (!result) return
      EventBus.emit('agent-xp-gained', {
        agentId: agent.id,
        agentSlug: agent.template.slug,
        xpGained: result.xp_gained,
        level: result.level,
        xp: result.xp,
        xpToNext: result.xp_to_next,
      })
      if (result.leveled_up) {
        agent.showLevelUp(result.level)
        EventBus.emit('agent-leveled-up', {
          agentId: agent.id,
          agentSlug: agent.template.slug,
          newLevel: result.level,
          previousLevel: result.previous_level,
        })
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Selection indicator
  // ---------------------------------------------------------------------------

  private showFloatingText(x: number, y: number, message: string): void {
    const label = this.add.text(x, y - 20, message, {
      fontSize: '7px',
      color: '#ffffff',
      backgroundColor: '#000000cc',
      padding: { x: 4, y: 2 },
    })
    label.setOrigin(0.5, 1).setDepth(20).setResolution(3)

    this.tweens.add({
      targets: label,
      y: y - 44,
      alpha: 0,
      duration: 2200,
      ease: 'Power2',
      onComplete: () => label.destroy(),
    })
  }

  // ---------------------------------------------------------------------------
  // Agent task dispatch
  // ---------------------------------------------------------------------------

  /**
   * Match the start of a command against agent names to allow addressing
   * a specific agent: "Agent 1, do X" → returns that Agent.
   * Returns null when no name is matched (broadcast to all).
   */
  private findCommandTarget(command: string): Agent | null {
    const lower = command.toLowerCase().trim()
    for (const agent of this.agents) {
      const name = agent.name.toLowerCase()
      if (lower.startsWith(name + ',') || lower.startsWith(name + ' ')) {
        return agent
      }
    }
    return null
  }

  /**
   * Full task dispatch loop for a single agent:
   *   walk toward player → acknowledge → emit step progress → complete → resume wander
   */
  private dispatchAgentTask(agent: Agent, commandId: string, command: string): void {
    // Don't interrupt player-controlled agents.
    if (this.controlledAgent?.id === agent.id) return

    agent.walkTo(this.player.x, this.player.y, () => {
      // Guard: agent may have been removed while walking.
      if (!this.agents.some((a) => a.id === agent.id)) return

      this.showFloatingText(agent.x, agent.y, '🎤 Acknowledged!')
      EventBus.emit('command-acknowledged', {
        commandId,
        agentId: agent.id,
        agentName: agent.name,
      })

      const steps = agent.template.skills.map((s) => s.skill_id)

      EventBus.emit('agent-executing', {
        agentId: agent.id,
        agentName: agent.name,
        templateId: agent.template.id,
        command,
        steps,
      })

      // Each step slot: 600 ms running → 300 ms pause before next.
      const STEP_SLOT = 900
      const START_DELAY = 500

      steps.forEach((_skillId, i) => {
        this.time.delayedCall(START_DELAY + i * STEP_SLOT, () => {
          if (!this.agents.some((a) => a.id === agent.id)) return
          EventBus.emit('agent-step-progress', {
            agentId: agent.id,
            stepIndex: i,
            status: 'running',
          })
        })
        this.time.delayedCall(START_DELAY + i * STEP_SLOT + 600, () => {
          if (!this.agents.some((a) => a.id === agent.id)) return
          EventBus.emit('agent-step-progress', {
            agentId: agent.id,
            stepIndex: i,
            status: 'done',
          })
        })
      })

      const doneAt = START_DELAY + steps.length * STEP_SLOT + 300
      this.time.delayedCall(doneAt, () => {
        if (!this.agents.some((a) => a.id === agent.id)) return
        this.showFloatingText(agent.x, agent.y, '✓ Done!')
        EventBus.emit('agent-execution-complete', {
          agentId: agent.id,
          summary: command.length > 50 ? command.slice(0, 50) + '…' : command,
        })
        // Brief pause, then resume wandering.
        this.time.delayedCall(1500, () => {
          if (!this.agents.some((a) => a.id === agent.id)) return
          agent.startWander()
        })
      })
    })
  }

  private createSelectionIndicator(): Phaser.GameObjects.Graphics {
    const g = this.add.graphics()
    g.fillStyle(0xffd700, 1)
    // Small downward-pointing triangle, centred on origin so setPosition works naturally.
    g.fillTriangle(-5, -6, 5, -6, 0, 0)
    g.setDepth(10)
    return g
  }

  // ---------------------------------------------------------------------------
  // Decorations (biom.png sprites)
  // ---------------------------------------------------------------------------

  private createDecorations(): void {
    const S = this.mapDef.tileSize
    this.decorationGroup = this.physics.add.staticGroup()

    for (const { frame, col, row, collides } of this.mapDef.decorations ?? []) {
      const x = (col + 0.5) * S
      const y = (row + 0.5) * S
      if (collides) {
        this.decorationGroup.create(x, y, 'biom', frame).setDepth(1)
      } else {
        this.add.image(x, y, 'biom', frame).setDepth(1)
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Tileset
  // ---------------------------------------------------------------------------

  private createTileset(): void {
    const S = this.mapDef.tileSize
    if (this.textures.exists('tiles')) this.textures.remove('tiles')
    const tex = this.textures.createCanvas('tiles', S * 4, S)!
    const ctx = tex.getContext()

    this.paintTile(ctx, 0 * S, '#3a6b49', '#4a7c59', '#5d9970') // T.GRASS = 1 → frame 0
    this.paintTile(ctx, 1 * S, '#12338a', '#1a4ecc', '#2860e0') // T.WATER = 2 → frame 1
    this.paintTile(ctx, 2 * S, '#6b4a14', '#8b6824', '#a07c38') // T.DIRT  = 3 → frame 2
    this.paintTile(ctx, 3 * S, '#445566', '#556677', '#66788a') // T.STONE = 4 → frame 3

    tex.refresh()
  }

  private paintTile(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    shadow: string,
    base: string,
    highlight: string,
  ): void {
    const S = this.mapDef.tileSize
    ctx.fillStyle = base
    ctx.fillRect(offsetX, 0, S, S)
    ctx.fillStyle = highlight
    ctx.fillRect(offsetX, 0, S, 1)
    ctx.fillRect(offsetX, 0, 1, S)
    ctx.fillStyle = shadow
    ctx.fillRect(offsetX, S - 1, S, 1)
    ctx.fillRect(offsetX + S - 1, 0, 1, S)
  }

  // ---------------------------------------------------------------------------
  // Tilemap
  // ---------------------------------------------------------------------------

  private createMap(): Phaser.Tilemaps.TilemapLayer {
    const { tileSize, groundData, waterData, features, collidingTiles } = this.mapDef

    // --- Grass backdrop ---
    const grassMap = this.make.tilemap({
      data: groundData,
      tileWidth: tileSize,
      tileHeight: tileSize,
    })
    const grassTileset = grassMap.addTilesetImage(
      'grass-tiles',
      'grass-tiles',
      tileSize,
      tileSize,
      0,
      0,
    )!
    grassMap.createLayer(0, grassTileset, 0, 0)!

    // --- Water layer (optional, uses water.png) ---
    if (waterData) {
      const waterMap = this.make.tilemap({
        data: waterData,
        tileWidth: tileSize,
        tileHeight: tileSize,
      })
      const waterTileset = waterMap.addTilesetImage(
        'water-tiles',
        'water-tiles',
        tileSize,
        tileSize,
        0,
        0,
      )!
      this.waterLayer = waterMap.createLayer(0, waterTileset, 0, 0)!
      this.waterLayer.setCollisionByExclusion([-1])
    }

    // --- Dirt/path layer (optional, uses dirt_01.png) ---
    if (this.mapDef.dirtData) {
      const dirtMap = this.make.tilemap({
        data: this.mapDef.dirtData,
        tileWidth: tileSize,
        tileHeight: tileSize,
      })
      const dirtTileset = dirtMap.addTilesetImage(
        'dirt-tiles',
        'dirt-tiles',
        tileSize,
        tileSize,
        0,
        0,
      )!
      dirtMap.createLayer(0, dirtTileset, 0, 0)!
    }

    // --- Fence layer (optional, uses fences.png; all non-empty tiles collide) ---
    if (this.mapDef.fenceData) {
      const fenceMap = this.make.tilemap({
        data: this.mapDef.fenceData,
        tileWidth: tileSize,
        tileHeight: tileSize,
      })
      const fenceTileset = fenceMap.addTilesetImage(
        'fence-tiles',
        'fence-tiles',
        tileSize,
        tileSize,
        0,
        0,
      )!
      this.fenceLayer = fenceMap.createLayer(0, fenceTileset, 0, 0)!
      this.fenceLayer.setCollisionByExclusion([-1])
    }

    // --- Feature overlay: dirt / stone on top ---
    this.map = this.make.tilemap({ data: features, tileWidth: tileSize, tileHeight: tileSize })
    const featureTileset = this.map.addTilesetImage('tiles', 'tiles', tileSize, tileSize, 0, 0)!
    const featureLayer = this.map.createLayer(0, featureTileset, 0, 0)!

    featureLayer.setCollision(collidingTiles)
    return featureLayer
  }

  private releaseControl(): void {
    if (!this.controlledAgent) return
    this.controlledAgent.stop()
    this.controlledAgent.startWander()
    this.controlledAgent = null
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    EventBus.emit('controlled-agent-changed', null)
  }
}
