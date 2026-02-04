// SpatialHash.ts - simple 3D spatial hash grid for proximity queries

interface Vector3Like {
    x: number;
    y: number;
    z: number;
}

export class SpatialHash {
    private cellSize: number;
    private map: Map<string, Set<string | number>>; // key -> Set(entityId)
    private entityToCells: Map<string | number, string[]>; // entityId -> array of keys

    constructor(cellSize: number = 200) {
        this.cellSize = cellSize;
        this.map = new Map();
        this.entityToCells = new Map();
    }

    private _key(ix: number, iy: number, iz: number): string {
        return `${ix}|${iy}|${iz}`;
    }

    private _cellIndex(v: number): number {
        return Math.floor(v / this.cellSize) | 0;
    }

    private _computeKeysForAABB(min: Vector3Like, max: Vector3Like): string[] {
        const ix0 = this._cellIndex(min.x), iy0 = this._cellIndex(min.y), iz0 = this._cellIndex(min.z);
        const ix1 = this._cellIndex(max.x), iy1 = this._cellIndex(max.y), iz1 = this._cellIndex(max.z);
        const keys: string[] = [];
        for (let ix = ix0; ix <= ix1; ix++)
            for (let iy = iy0; iy <= iy1; iy++)
                for (let iz = iz0; iz <= iz1; iz++)
                    keys.push(this._key(ix, iy, iz));
        return keys;
    }

    public insert(entityId: string | number, position: Vector3Like, radius: number = 1): void {
        const min = { x: position.x - radius, y: position.y - radius, z: position.z - radius };
        const max = { x: position.x + radius, y: position.y + radius, z: position.z + radius };
        const keys = this._computeKeysForAABB(min, max);
        this.entityToCells.set(entityId, keys);
        for (const k of keys) {
            let set = this.map.get(k);
            if (!set) {
                set = new Set();
                this.map.set(k, set);
            }
            set.add(entityId);
        }
    }

    public update(entityId: string | number, position: Vector3Like, radius: number = 1): void {
        this.remove(entityId);
        this.insert(entityId, position, radius);
    }

    public remove(entityId: string | number): void {
        const keys = this.entityToCells.get(entityId);
        if (!keys) return;
        for (const k of keys) {
            const set = this.map.get(k);
            if (set) {
                set.delete(entityId);
                if (set.size === 0) this.map.delete(k);
            }
        }
        this.entityToCells.delete(entityId);
    }

    public querySphere(center: Vector3Like, radius: number): (string | number)[] {
        const min = { x: center.x - radius, y: center.y - radius, z: center.z - radius };
        const max = { x: center.x + radius, y: center.y + radius, z: center.z + radius };
        const keys = this._computeKeysForAABB(min, max);
        const result = new Set<string | number>();
        for (const k of keys) {
            const set = this.map.get(k);
            if (set) {
                for (const id of set) result.add(id);
            }
        }
        return Array.from(result);
    }
}
