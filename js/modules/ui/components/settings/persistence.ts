// persistence.js - Settings save/load and localStorage handling

export class SettingsPersistence {
    storageKey: string;

    constructor() {
        this.storageKey = 'asteroidMinerSettings';
    }

    /**
     * Gets default settings object
     */
    getDefaultSettings(): {
        graphicalQuality: string;
        postProcessing: boolean;
        asteroidDetail: string;
        lightingQuality: string;
        particleEffects: string;
        resolutionScale: string;
        frameRateCap: string;
        showFPS: boolean;
        spatialAudio: boolean;
        autoQuality: boolean;
        godRaysEnabled: boolean;
        godRaysType: string;
    } {
        return {
            graphicalQuality: 'medium',    // low, medium, high
            postProcessing: true,          // true, false
            asteroidDetail: 'medium',      // low, medium, high
            lightingQuality: 'medium',     // low, medium, high
            particleEffects: 'medium',     // low, medium, high
            resolutionScale: 'medium',     // low, medium, high
            frameRateCap: 'auto',          // 30, 60, auto (monitor refresh rate), 0 (unlimited)
            showFPS: false,                // Show FPS counter
            spatialAudio: true,            // Enable spatial audio
            autoQuality: true,             // Automatically adjust quality based on performance
            godRaysEnabled: false,         // Enable/disable volumetric lighting effects
            godRaysType: 'standard'        // 'standard' (new god rays) or 'claude' (Claude Rays)
        };
    }

    /**
     * Loads settings from localStorage
     */
    loadSettings(): {
        graphicalQuality: string;
        postProcessing: boolean;
        asteroidDetail: string;
        lightingQuality: string;
        particleEffects: string;
        resolutionScale: string;
        frameRateCap: string;
        showFPS: boolean;
        spatialAudio: boolean;
        autoQuality: boolean;
        godRaysEnabled: boolean;
        godRaysType: string;
    } {
        try {
            const savedSettings: string | null = localStorage.getItem(this.storageKey);
            if (savedSettings) {
                const parsedSettings: Record<string, any> = JSON.parse(savedSettings);
                // Merge saved settings with defaults to handle new settings
                const defaultSettings = this.getDefaultSettings();
                const mergedSettings = {...defaultSettings, ...parsedSettings};
                console.log("Settings loaded from localStorage:", mergedSettings);
                return mergedSettings;
            }
        } catch (error: any) {
            console.error("Error loading settings:", error);
        }
        
        // Return defaults if loading fails
        return this.getDefaultSettings();
    }

    /**
     * Saves settings to localStorage
     */
    saveSettings(settings: Record<string, any>): boolean {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(settings));
            console.log("Settings saved to localStorage");
            return true;
        } catch (error: any) {
            console.error("Error saving settings:", error);
            return false;
        }
    }

    /**
     * Validates settings object to ensure all required properties exist
     */
    validateSettings(settings: Record<string, any>): Record<string, any> {
        const defaults = this.getDefaultSettings();
        const validatedSettings: Record<string, any> = {...defaults};
        
        // Only copy valid properties from the input settings
        for (const key in defaults) {
            if (Object.prototype.hasOwnProperty.call(settings, key)) {
                validatedSettings[key] = settings[key];
            }
        }
        
        return validatedSettings;
    }

    /**
     * Clears saved settings (resets to defaults)
     */
    clearSettings(): boolean {
        try {
            localStorage.removeItem(this.storageKey);
            console.log("Settings cleared from localStorage");
            return true;
        } catch (error: any) {
            console.error("Error clearing settings:", error);
            return false;
        }
    }

    /**
     * Exports settings as JSON string
     */
    exportSettings(settings: Record<string, any>): string | null {
        try {
            return JSON.stringify(settings, null, 2);
        } catch (error: any) {
            console.error("Error exporting settings:", error);
            return null;
        }
    }

    /**
     * Imports settings from JSON string
     */
    importSettings(jsonString: string): Record<string, any> | null {
        try {
            const importedSettings: Record<string, any> = JSON.parse(jsonString);
            return this.validateSettings(importedSettings);
        } catch (error: any) {
            console.error("Error importing settings:", error);
            return null;
        }
    }

    /**
     * Backs up current settings with timestamp
     */
    backupSettings(settings: Record<string, any>): string | null {
        const timestamp: string = new Date().toISOString();
        const backupKey: string = `${this.storageKey}_backup_${timestamp}`;
        
        try {
            localStorage.setItem(backupKey, JSON.stringify({
                timestamp,
                settings
            }));
            console.log(`Settings backed up with key: ${backupKey}`);
            return backupKey;
        } catch (error: any) {
            console.error("Error backing up settings:", error);
            return null;
        }
    }

    /**
     * Lists available setting backups
     */
    listBackups(): { key: string; timestamp: string; date: Date }[] {
        const backups: { key: string; timestamp: string; date: Date }[] = [];
        const backupPrefix: string = `${this.storageKey}_backup_`;
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key: string | null = localStorage.key(i);
                if (key && key.startsWith(backupPrefix)) {
                    const backupData = JSON.parse(localStorage.getItem(key) || '{}');
                    backups.push({
                        key,
                        timestamp: backupData.timestamp,
                        date: new Date(backupData.timestamp)
                    });
                }
            }
            
            // Sort by date, newest first
            backups.sort((a, b) => b.date.getTime() - a.date.getTime());
            return backups;
        } catch (error: any) {
            console.error("Error listing backups:", error);
            return [];
        }
    }

    /**
     * Restores settings from a backup
     */
    restoreFromBackup(backupKey: string): Record<string, any> | null {
        try {
            const backupData: string | null = localStorage.getItem(backupKey);
            if (backupData) {
                const parsedBackup: { timestamp: string; settings: Record<string, any> } = JSON.parse(backupData);
                return this.validateSettings(parsedBackup.settings);
            }
        } catch (error: any) {
            console.error("Error restoring from backup:", error);
        }
        return null;
    }

    /**
     * Cleans up old backups (keeps only the most recent N backups)
     */
    cleanupBackups(keepCount: number = 5): void {
        const backups = this.listBackups();
        
        // Remove backups beyond the keep count
        for (let i = keepCount; i < backups.length; i++) {
            try {
                localStorage.removeItem(backups[i].key);
                console.log(`Removed old backup: ${backups[i].key}`);
            } catch (error: any) {
                console.error(`Error removing backup ${backups[i].key}:`, error);
            }
        }
    }
}