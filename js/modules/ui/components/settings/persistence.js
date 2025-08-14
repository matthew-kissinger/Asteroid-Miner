// persistence.js - Settings save/load and localStorage handling

export class SettingsPersistence {
    constructor() {
        this.storageKey = 'asteroidMinerSettings';
    }

    /**
     * Gets default settings object
     */
    getDefaultSettings() {
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
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem(this.storageKey);
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                // Merge saved settings with defaults to handle new settings
                const defaultSettings = this.getDefaultSettings();
                const mergedSettings = {...defaultSettings, ...parsedSettings};
                console.log("Settings loaded from localStorage:", mergedSettings);
                return mergedSettings;
            }
        } catch (error) {
            console.error("Error loading settings:", error);
        }
        
        // Return defaults if loading fails
        return this.getDefaultSettings();
    }

    /**
     * Saves settings to localStorage
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(settings));
            console.log("Settings saved to localStorage");
            return true;
        } catch (error) {
            console.error("Error saving settings:", error);
            return false;
        }
    }

    /**
     * Validates settings object to ensure all required properties exist
     */
    validateSettings(settings) {
        const defaults = this.getDefaultSettings();
        const validatedSettings = {...defaults};
        
        // Only copy valid properties from the input settings
        for (const key in defaults) {
            if (settings.hasOwnProperty(key)) {
                validatedSettings[key] = settings[key];
            }
        }
        
        return validatedSettings;
    }

    /**
     * Clears saved settings (resets to defaults)
     */
    clearSettings() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log("Settings cleared from localStorage");
            return true;
        } catch (error) {
            console.error("Error clearing settings:", error);
            return false;
        }
    }

    /**
     * Exports settings as JSON string
     */
    exportSettings(settings) {
        try {
            return JSON.stringify(settings, null, 2);
        } catch (error) {
            console.error("Error exporting settings:", error);
            return null;
        }
    }

    /**
     * Imports settings from JSON string
     */
    importSettings(jsonString) {
        try {
            const importedSettings = JSON.parse(jsonString);
            return this.validateSettings(importedSettings);
        } catch (error) {
            console.error("Error importing settings:", error);
            return null;
        }
    }

    /**
     * Backs up current settings with timestamp
     */
    backupSettings(settings) {
        const timestamp = new Date().toISOString();
        const backupKey = `${this.storageKey}_backup_${timestamp}`;
        
        try {
            localStorage.setItem(backupKey, JSON.stringify({
                timestamp,
                settings
            }));
            console.log(`Settings backed up with key: ${backupKey}`);
            return backupKey;
        } catch (error) {
            console.error("Error backing up settings:", error);
            return null;
        }
    }

    /**
     * Lists available setting backups
     */
    listBackups() {
        const backups = [];
        const backupPrefix = `${this.storageKey}_backup_`;
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(backupPrefix)) {
                    const backupData = JSON.parse(localStorage.getItem(key));
                    backups.push({
                        key,
                        timestamp: backupData.timestamp,
                        date: new Date(backupData.timestamp)
                    });
                }
            }
            
            // Sort by date, newest first
            backups.sort((a, b) => b.date - a.date);
            return backups;
        } catch (error) {
            console.error("Error listing backups:", error);
            return [];
        }
    }

    /**
     * Restores settings from a backup
     */
    restoreFromBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (backupData) {
                const parsedBackup = JSON.parse(backupData);
                return this.validateSettings(parsedBackup.settings);
            }
        } catch (error) {
            console.error("Error restoring from backup:", error);
        }
        return null;
    }

    /**
     * Cleans up old backups (keeps only the most recent N backups)
     */
    cleanupBackups(keepCount = 5) {
        const backups = this.listBackups();
        
        // Remove backups beyond the keep count
        for (let i = keepCount; i < backups.length; i++) {
            try {
                localStorage.removeItem(backups[i].key);
                console.log(`Removed old backup: ${backups[i].key}`);
            } catch (error) {
                console.error(`Error removing backup ${backups[i].key}:`, error);
            }
        }
    }
}