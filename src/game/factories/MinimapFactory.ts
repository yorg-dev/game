import Phaser from 'phaser'
import type { MapDefinition } from '../maps/MapDefinition'

// ---------------------------------------------------------------------------
// MinimapFactory
//
// Owns everything minimap-related: camera creation, border, viewport
// indicator, pointer interaction, and camera-detach state.
// Extracted from GameScene to keep that file focused on scene coordination.
// ---------------------------------------------------------------------------

export class MinimapFactory {
  private readonly scene:   Phaser.Scene
  private readonly mapDef:  MapDefinition

  private cam!:             Phaser.Cameras.Scene2D.Camera
  private viewIndicator!:   Phaser.GameObjects.Graphics
  private _isDragging       = false
  private _isCameraDetached = false

  constructor(scene: Phaser.Scene, mapDef: MapDefinition) {
    this.scene  = scene
    this.mapDef = mapDef
  }

  get isDragging(): boolean        { return this._isDragging }
  get isCameraDetached(): boolean  { return this._isCameraDetached }
  set isCameraDetached(v: boolean) { this._isCameraDetached = v }

  // Toggle minimap camera visibility on/off.
  toggle(): void {
    this.cam.setVisible(!this.cam.visible)
    this.viewIndicator.setVisible(this.cam.visible)
  }

  // Called once from GameScene.create() after the map and cameras are set up.
  create(): void {
    const { cols, rows, tileSize } = this.mapDef
    const mapW = cols * tileSize
    const mapH = rows * tileSize

    // Preserve map aspect ratio; fit within a ~160 px wide minimap.
    const mW   = 160
    const mH   = Math.round(mW * mapH / mapW)
    const zoom  = mW / mapW

    // Create the minimap camera.
    // NOTE: do NOT call setRoundPixels — at zoom < 1 it causes a sub-pixel
    // shift that moves world (0,0) away from the minimap's top-left corner.
    this.cam = this.scene.cameras.add(0, 0, mW, mH)
    this.cam.setZoom(zoom)
    this.cam.setScroll(0, 0)
    this.cam.setBackgroundColor(0x0d1f2d)
    this.cam.setVisible(false)

    // Use cameras.main dimensions rather than scale.width/height.
    // this.scale is not yet fully resolved during create() with RESIZE mode,
    // so scale.width can return 0 and land the minimap at (0,0).
    const positionMinimap = (): void => {
      const cW = this.scene.cameras.main.width
      const cH = this.scene.cameras.main.height
      this.cam.setViewport(cW - mW - 10, cH - mH - 10, mW, mH)
    }
    // Defer one tick so the canvas has been fully laid out.
    this.scene.time.delayedCall(0, positionMinimap)
    this.scene.scale.on('resize', positionMinimap)

    // Border: drawn in world space along the map boundary.
    // Main camera ignores it so it only appears on the minimap.
    const lw = 1.5 / zoom   // world units → 1.5 screen pixels on minimap
    const border = this.scene.add.graphics()
    border.lineStyle(lw, 0x7799bb, 1)
    border.strokeRect(lw / 2, lw / 2, mapW - lw, mapH - lw)
    border.setDepth(102)
    this.scene.cameras.main.ignore(border)

    // Viewport indicator: world-space rect redrawn each frame in updateViewIndicator().
    // Main camera ignores it; minimap shows it.
    this.viewIndicator = this.scene.add.graphics()
    this.viewIndicator.setDepth(103).setVisible(false)
    this.scene.cameras.main.ignore(this.viewIndicator)

    // Click / drag inside the minimap to pan the main camera.
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isPointerInMinimap(pointer)) {
        this._isDragging = true
        this.panCamera(pointer)
      }
    })
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this._isDragging && pointer.isDown) {
        this.panCamera(pointer)
      }
    })
    this.scene.input.on('pointerup', () => { this._isDragging = false })
  }

  // Called every frame from GameScene.update() to redraw the viewport rect.
  updateViewIndicator(): void {
    const cam = this.scene.cameras.main
    const lw  = 1.5 / this.cam.zoom
    this.viewIndicator.clear()
    this.viewIndicator.lineStyle(lw, 0xffffff, 0.9)
    this.viewIndicator.strokeRect(cam.scrollX, cam.scrollY, cam.width / cam.zoom, cam.height / cam.zoom)
  }

  private isPointerInMinimap(pointer: Phaser.Input.Pointer): boolean {
    const { x, y, width, height } = this.cam
    return (
      pointer.x >= x && pointer.x <= x + width &&
      pointer.y >= y && pointer.y <= y + height
    )
  }

  private panCamera(pointer: Phaser.Input.Pointer): void {
    const { x: mx, y: my, zoom: mZoom } = this.cam
    // Convert screen position within the minimap viewport to world coordinates.
    // The minimap camera has scroll (0,0), so world = (screen offset from minimap origin) / zoom.
    const worldX = (pointer.x - mx) / mZoom
    const worldY = (pointer.y - my) / mZoom

    const cam  = this.scene.cameras.main
    const vw   = cam.width  / cam.zoom
    const vh   = cam.height / cam.zoom
    const mapW = this.mapDef.cols * this.mapDef.tileSize
    const mapH = this.mapDef.rows * this.mapDef.tileSize

    cam.stopFollow()
    this._isCameraDetached = true
    cam.setScroll(
      Phaser.Math.Clamp(worldX - vw / 2, 0, mapW - vw),
      Phaser.Math.Clamp(worldY - vh / 2, 0, mapH - vh),
    )
  }
}
