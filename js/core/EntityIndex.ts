// EntityIndex.ts - track entity lookups and mesh/instance mapping

export interface EntityView {
    meshRef?: any;
    instanceKey?: string;
    instanceId?: number;
    [key: string]: any;
}

export class EntityIndex {
    private entityToView: Map<string | number, EntityView>;
    private tagToEntities: Map<string, Set<string | number>>;

    constructor() {
        this.entityToView = new Map();
        this.tagToEntities = new Map();
    }

    public setView(entityId: string | number, view: EntityView): void {
        this.entityToView.set(entityId, view);
    }

    public getView(entityId: string | number): EntityView | undefined {
        return this.entityToView.get(entityId);
    }

    public clearView(entityId: string | number): void {
        this.entityToView.delete(entityId);
    }

    public addTag(entityId: string | number, tag: string): void {
        let set = this.tagToEntities.get(tag);
        if (!set) {
            set = new Set();
            this.tagToEntities.set(tag, set);
        }
        set.add(entityId);
    }

    public removeTag(entityId: string | number, tag: string): void {
        const set = this.tagToEntities.get(tag);
        if (set) {
            set.delete(entityId);
            if (set.size === 0) this.tagToEntities.delete(tag);
        }
    }

    public getByTag(tag: string): (string | number)[] {
        const set = this.tagToEntities.get(tag);
        return set ? Array.from(set) : [];
    }
}
