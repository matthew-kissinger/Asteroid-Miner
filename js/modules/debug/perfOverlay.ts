// perfOverlay.js - Minimal scaffold for performance overlay toggle (F3)
// Feature flag default ON per V07_TIGHTENING

const FEATURE_FLAG = true; // V07_TIGHTENING default ON

export class PerfOverlay {
  constructor() {
    // Global perf sink
    if (!window.__perf) {
      window.__perf = {
        enabled: false,
        fps: 0,
        simMs: 0,
        renderMs: 0,
        drawCalls: 0,
        visibleInstances: 0,
        pools: { hits: 0, misses: 0 },
        gc: 0,
        systems: {},
      };
    }

    this.panel = null;
    this.lastUpdate = 0;
    this.updateHzMs = 500; // ~2Hz

    // optional GC observer (best-effort)
    try {
      if ('PerformanceObserver' in window && performance && performance.observe) {
        // no-op, older API; fallback below
      }
      if ('PerformanceObserver' in window) {
        const obs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'gc') {
              if (!window.__perf.gc) window.__perf.gc = 0;
              window.__perf.gc += 1;
            }
          }
        });
        obs.observe({ entryTypes: ['gc'] });
        this._gcObserver = obs;
      }
    } catch {}

    if (FEATURE_FLAG) {
      // Hook F3 toggle
      document.addEventListener('keydown', (e) => {
        if (e.key === 'F3') {
          this.toggle();
        }
      });
    }
  }

  toggle() {
    window.__perf.enabled = !window.__perf.enabled;
    if (window.__perf.enabled) {
      this.ensurePanel();
      this.renderOnce();
    } else {
      this.destroy();
    }
  }

  ensurePanel() {
    if (this.panel) return;
    const el = document.createElement('div');
    el.id = 'perf-overlay';
    el.style.position = 'fixed';
    el.style.top = '8px';
    el.style.right = '8px';
    el.style.minWidth = '220px';
    el.style.maxWidth = '320px';
    el.style.background = 'rgba(0,0,0,0.6)';
    el.style.color = '#9ef7ff';
    el.style.fontFamily = 'monospace';
    el.style.fontSize = '12px';
    el.style.lineHeight = '1.4';
    el.style.padding = '8px 10px';
    el.style.border = '1px solid rgba(158,247,255,0.3)';
    el.style.borderRadius = '6px';
    el.style.zIndex = '99999';
    el.style.pointerEvents = 'none';
    el.innerHTML = this.renderContent();
    document.body.appendChild(el);
    this.panel = el;

    // Start a lightweight interval to update ~2Hz
    this.interval = setInterval(() => this.renderOnce(), this.updateHzMs);
  }

  renderOnce() {
    if (!this.panel) return;
    this.panel.innerHTML = this.renderContent();
  }

  renderContent() {
    const p = window.__perf;
    const systems = p.systems ? Object.entries(p.systems).slice(0, 8) : [];
    const sysHtml = systems.map(([k,v]) => `<div>${k}: ${Number(v).toFixed(2)} ms</div>`).join('');
    return (
      `<div style=\"opacity:.85\">` +
      `<div><b>Perf Overlay</b> (F3)</div>` +
      `<div>FPS: ${Math.round(p.fps || 0)}</div>` +
      `<div>Sim: ${Number(p.simMs || 0).toFixed(2)} ms</div>` +
      `<div>Render: ${Number(p.renderMs || 0).toFixed(2)} ms</div>` +
      `<div>DrawCalls: ${p.drawCalls || 0}</div>` +
      `<div>Instances: ${p.visibleInstances || 0}</div>` +
      `<div>Pool hits/misses: ${(p.pools?.hits||0)} / ${(p.pools?.misses||0)}</div>` +
      `<div>GC: ${p.gc || 0}</div>` +
      `<div style=\"margin-top:6px; border-top:1px solid rgba(158,247,255,.2)\">` +
      `<div><b>Systems</b></div>` + sysHtml +
      `</div>` +
      `</div>`
    );
  }

  destroy() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this._gcObserver && this._gcObserver.disconnect) {
      this._gcObserver.disconnect();
      this._gcObserver = null;
    }
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
    this.panel = null;
  }
}

export function initPerfOverlay() {
  // Create once, attach to window for future hooks
  if (!window.__perfOverlay) {
    window.__perfOverlay = new PerfOverlay();
  }
  return window.__perfOverlay;
}


