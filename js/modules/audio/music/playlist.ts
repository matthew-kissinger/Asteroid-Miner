// playlist.ts - Music queue management and shuffling
import { getAbsolutePath } from '../../../utils/pathUtils.js';

export class MusicPlaylist {
    private music: HTMLAudioElement[] = []; // Store all background music tracks
    private musicVolume: number = 0.21; // Reduced by 30% from 0.3
    
    constructor() {}
    
    // Helper method to handle paths correctly for both local and GitHub Pages deployment
    getPath(relativePath: string): string {
        return getAbsolutePath(relativePath);
    }
    
    // Fisher-Yates shuffle algorithm for arrays
    shuffleArray<T>(array: T[]): T[] {
        let currentIndex = array.length, randomIndex;
        
        // While there remain elements to shuffle
        while (currentIndex > 0) {
            // Pick a remaining element
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            
            // Swap it with the current element
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        
        return array;
    }
    
    // Helper method to check if a file exists
    async checkFileExists(path: string): Promise<{ path: string; exists: boolean }> {
        console.log(`Checking if file/directory exists: ${path}`);
        try {
            // Try to fetch the resource
            const response = await fetch(path, { 
                method: 'HEAD',
                cache: 'no-cache' // Avoid caching issues
            });
            
            console.log(`Fetch response for ${path}: status=${response.status}, ok=${response.ok}`);
            
            return { 
                path, 
                exists: response.ok 
            };
        } catch (err) {
            console.error(`Error checking if file exists (${path}):`, err);
            return { path, exists: false };
        }
    }
    
    // Load all music files from the soundtrack folder
    async loadBackgroundMusic(): Promise<void> {
        try {
            console.log("Loading soundtrack files...");
            
            // Directly use the exact soundtrack files from the user's folder
            const soundtrackFiles = [
                this.getPath('sounds/soundtrack/The Sound of Lightyears.wav'),
                this.getPath('sounds/soundtrack/Aurora Drifts.wav'),
                this.getPath('sounds/soundtrack/Tidal Lock.wav'),
                this.getPath('sounds/soundtrack/Solar Drift.wav'),
                this.getPath('sounds/soundtrack/Orbital Resonance.wav'),
                this.getPath('sounds/soundtrack/Starlight Trails.wav'),
                this.getPath('sounds/soundtrack/Orbit Bloom.wav')
            ];
            
            console.log(`Loading ${soundtrackFiles.length} soundtrack files...`);
            
            // Load the music files
            await this.loadMusicFiles(soundtrackFiles);
            
        } catch (error) {
            console.error("Error loading background music:", error);
            
            // Create a dummy audio element if loading fails
            console.warn("Falling back to a dummy silent track");
            this.createDummyTrack();
        }
    }
    
    // Helper method to load music files
    async loadMusicFiles(files: string[]): Promise<void> {
        // Note: Currently keeping music as HTML5 Audio for compatibility
        // Could be updated to Web Audio API in the future
        console.log(`Found ${files.length} music files:`, files);
        
        // Create a copy of the files array and shuffle it to randomize the order
        const shuffledFiles = [...files];
        this.shuffleArray(shuffledFiles);
        
        console.log(`Randomized playlist order:`, shuffledFiles.map(file => file.split('/').pop()));
        
        // Check if any files exist before trying to load them
        let anyFilesExist = false;
        for (const file of shuffledFiles) {
            const fileExists = await this.checkFileExists(file);
            if (fileExists.exists) {
                anyFilesExist = true;
                break;
            }
        }
        
        if (!anyFilesExist) {
            console.warn("None of the music files could be found. Using fallback audio.");
            this.createDummyTrack();
            return;
        }
        
        // Load each music track in the randomized order
        for (const file of shuffledFiles) {
            try {
                console.log(`Attempting to load audio file: ${file}`);
                const audio = new Audio(file);
                audio.loop = false; // We'll handle looping manually for playlist functionality
                audio.volume = this.musicVolume;
                
                // Add error handler
                audio.addEventListener('error', (e) => {
                    console.error(`Error loading music file ${file}:`, e);
                });
                
                // Add a load event to confirm successful loading
                audio.addEventListener('canplaythrough', () => {
                    console.log(`Successfully loaded music file: ${file}`);
                });
                
                this.music.push(audio);
                console.log(`Added music track to playlist: ${file}`);
            } catch (err) {
                console.error(`Failed to load music file ${file}:`, err);
            }
        }
        
        console.log(`Loaded ${this.music.length} music tracks in randomized order`);
        
        // If we haven't found any music, create a dummy audio element
        // so that the music system doesn't break
        if (this.music.length === 0) {
            console.warn("No music files could be loaded, creating a dummy track");
            this.createDummyTrack();
        }
    }
    
    // Create dummy track if loading fails
    createDummyTrack(): void {
        const dummyAudio = new Audio();
        dummyAudio.loop = true;
        this.music.push(dummyAudio);
    }
    
    // Play the next music track in the playlist
    playNextTrack(): HTMLAudioElement | null {
        if (this.music.length === 0) return null;
        
        // Move current track to the end of the playlist
        const currentTrack = this.music.shift();
        if (currentTrack) {
            this.music.push(currentTrack);
        }
        
        // Return the next track
        return this.getCurrentTrack();
    }
    
    // Get the current track (first in queue)
    getCurrentTrack(): HTMLAudioElement | null {
        return this.music.length > 0 ? this.music[0] : null;
    }
    
    // Get all tracks
    getTracks(): HTMLAudioElement[] {
        return this.music;
    }
    
    // Set volume for all tracks
    setVolume(volume: number): void {
        this.musicVolume = volume;
        for (const track of this.music) {
            track.volume = volume;
        }
    }
    
    // Get current volume
    getVolume(): number {
        return this.musicVolume;
    }
    
    // Check if playlist has tracks
    hasTracks(): boolean {
        return this.music.length > 0;
    }
}
