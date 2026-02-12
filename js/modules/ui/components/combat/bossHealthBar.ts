/**
 * Boss Health Bar - Displays boss health at top center of screen
 */

import { debugLog } from '../../../../globals/debug'

export class BossHealthBar {
  private container: HTMLDivElement | null = null
  private healthBar: HTMLDivElement | null = null
  private bossName: HTMLDivElement | null = null
  private healthText: HTMLDivElement | null = null
  private currentBossEid: number = -1

  constructor() {
    this.createUI()
  }

  private createUI(): void {
    // Create container
    this.container = document.createElement('div')
    this.container.id = 'boss-health-bar'
    this.container.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      width: 500px;
      max-width: 90vw;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #ff0000;
      border-radius: 8px;
      padding: 12px;
      display: none;
      z-index: 1000;
      font-family: 'Courier New', monospace;
    `

    // Boss name
    this.bossName = document.createElement('div')
    this.bossName.style.cssText = `
      color: #ff0000;
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 2px;
    `
    this.container.appendChild(this.bossName)

    // Health bar background
    const healthBarBg = document.createElement('div')
    healthBarBg.style.cssText = `
      width: 100%;
      height: 24px;
      background: rgba(50, 0, 0, 0.8);
      border: 1px solid #ff0000;
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    `

    // Health bar fill
    this.healthBar = document.createElement('div')
    this.healthBar.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #ff0000, #ff6600);
      transition: width 0.3s ease;
    `
    healthBarBg.appendChild(this.healthBar)

    // Health text
    this.healthText = document.createElement('div')
    this.healthText.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 14px;
      font-weight: bold;
      text-shadow: 1px 1px 2px black;
      pointer-events: none;
    `
    healthBarBg.appendChild(this.healthText)

    this.container.appendChild(healthBarBg)
    document.body.appendChild(this.container)

    debugLog('Boss health bar UI created')
  }

  /**
   * Show boss health bar
   */
  show(bossEid: number, bossName: string): void {
    if (!this.container) return

    this.currentBossEid = bossEid
    if (this.bossName) {
      this.bossName.textContent = bossName
    }
    this.container.style.display = 'block'
    debugLog(`Showing boss health bar for ${bossName}`)
  }

  /**
   * Hide boss health bar
   */
  hide(): void {
    if (!this.container) return

    this.container.style.display = 'none'
    this.currentBossEid = -1
    debugLog('Hiding boss health bar')
  }

  /**
   * Update boss health display
   */
  update(bossEid: number, currentHealth: number, maxHealth: number): void {
    if (!this.container || !this.healthBar || !this.healthText) return
    if (this.currentBossEid !== bossEid) return

    const healthPercent = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100))
    this.healthBar.style.width = `${healthPercent}%`
    this.healthText.textContent = `${Math.ceil(currentHealth)} / ${Math.ceil(maxHealth)}`

    // Change color based on health
    if (healthPercent > 50) {
      this.healthBar.style.background = 'linear-gradient(90deg, #ff0000, #ff6600)'
    } else if (healthPercent > 25) {
      this.healthBar.style.background = 'linear-gradient(90deg, #ff6600, #ffaa00)'
    } else {
      this.healthBar.style.background = 'linear-gradient(90deg, #ffaa00, #ffff00)'
    }
  }

  /**
   * Get current boss entity ID
   */
  getCurrentBossEid(): number {
    return this.currentBossEid
  }

  /**
   * Dispose UI
   */
  dispose(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
    this.container = null
    this.healthBar = null
    this.bossName = null
    this.healthText = null
    debugLog('Boss health bar disposed')
  }
}
