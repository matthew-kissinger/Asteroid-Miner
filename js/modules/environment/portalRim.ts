// portalRim.ts - simple portal rim scanner and mission hooks (typed events)

import { EVENT } from '../../core/events';

interface PortalLink {
  id: string;
  modifiers: string[];
  opened: boolean;
}

interface MessageBus {
  publish?: (type: string, payload: unknown) => void;
}

export class PortalRim {
  scene: unknown;
  bus: MessageBus | null;
  links: PortalLink[];
  active: boolean;

  constructor(scene: unknown, messageBus?: MessageBus) {
    this.scene = scene;
    this.bus = messageBus ?? null;
    this.links = [];
    this.active = false;
  }

  seedLinks(count: number = 3): void {
    this.links = [];
    for (let i = 0; i < count; i++) {
      this.links.push({ id: `link_${i}`, modifiers: this._randomModifiers(), opened: false });
    }
  }

  _randomModifiers(): string[] {
    const all = ['rich_ores', 'dense_enemies', 'low_visibility', 'high_bounties', 'unstable_physics'];
    return all.sort(() => Math.random() - 0.5).slice(0, 2);
  }

  scanRim(): PortalLink[] {
    if (!this.active) this.active = true;
    if (this.links.length === 0) this.seedLinks(3);
    return this.links;
  }

  tryOpenLink(linkId: string, alignmentScore: number = Math.random()): boolean {
    const link = this.links.find(l => l.id === linkId);
    if (!link || link.opened) return false;
    if (alignmentScore > 0.55) {
      link.opened = true;
      // Publish an event (typed) for system transition or mission availability
      this.bus && this.bus.publish && this.bus.publish(EVENT.VFX_EXPLOSION, {
        position: { x: 0, y: 0, z: 0 }, color: 0x55ffee, size: 30, duration: 1500
      });
      return true;
    }
    return false;
  }
}
