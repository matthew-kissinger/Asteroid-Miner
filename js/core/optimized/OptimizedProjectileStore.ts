// OptimizedProjectileStore.ts - TypedArray-backed projectile data

export class OptimizedProjectileStore {
    public capacity: number;
    public count: number;
    public pos: Float32Array;
    public vel: Float32Array;
    public alive: Uint8Array;
    public idToIndex: Map<any, number>;
    public indexToProjectile: any[];

    constructor(capacity: number = 2048) {
        this.capacity = capacity;
        this.count = 0;
        this.pos = new Float32Array(capacity * 3);
        this.vel = new Float32Array(capacity * 3);
        this.alive = new Uint8Array(capacity);
        this.idToIndex = new Map();
        this.indexToProjectile = new Array(capacity);
    }

    private _allocIndex(): number {
        if (this.count >= this.capacity) return -1;
        const idx = this.count++;
        return idx;
    }

    public register(projectile: any): number {
        const idx = this._allocIndex();
        if (idx === -1) return -1;
        this.idToIndex.set(projectile.uuid || projectile.id || idx, idx);
        this.indexToProjectile[idx] = projectile;
        this.alive[idx] = 1;
        // initialize from projectile
        const p = projectile.position;
        if (p) {
            this.pos[idx * 3 + 0] = p.x;
            this.pos[idx * 3 + 1] = p.y;
            this.pos[idx * 3 + 2] = p.z;
        }
        const v = projectile.velocity || { x: 0, y: 0, z: 0 };
        this.vel[idx * 3 + 0] = v.x;
        this.vel[idx * 3 + 1] = v.y;
        this.vel[idx * 3 + 2] = v.z;
        return idx;
    }

    public unregisterByIndex(idx: number): void {
        if (idx < 0 || idx >= this.count) return;
        this.alive[idx] = 0;
        this.indexToProjectile[idx] = null;
    }

    public unregister(projectile: any): void {
        const id = projectile.uuid || projectile.id;
        if (id == null) return;
        const idx = this.idToIndex.get(id);
        if (idx == null) return;
        this.alive[idx] = 0;
        this.indexToProjectile[idx] = null;
        this.idToIndex.delete(id);
    }

    public update(dt: number): void {
        const n = this.count;
        for (let i = 0; i < n; i++) {
            if (!this.alive[i]) continue;
            const pi = i * 3;
            this.pos[pi + 0] += this.vel[pi + 0] * dt;
            this.pos[pi + 1] += this.vel[pi + 1] * dt;
            this.pos[pi + 2] += this.vel[pi + 2] * dt;
            const proj = this.indexToProjectile[i];
            if (proj && proj.position && proj.position.set) {
                proj.position.set(this.pos[pi + 0], this.pos[pi + 1], this.pos[pi + 2]);
            }
        }
    }
}
