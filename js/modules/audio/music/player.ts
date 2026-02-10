// player.ts - Music playback control and volume management
import { MusicPlaylist } from './playlist.ts';

interface ExtendedAudioElement extends HTMLAudioElement {
    hasEndedListener?: boolean;
}

export class MusicPlayer {
    public playlist: MusicPlaylist;
    private currentMusic: ExtendedAudioElement | null = null;
    private muted: boolean = false;
    
    constructor(playlist: MusicPlaylist) {
        this.playlist = playlist;
    }
    
    // Start playing background music
    playBackgroundMusic(userHasInteracted: boolean): void {
        if (!this.playlist.hasTracks() || this.muted) return;
        
        // Only attempt to play if the user has interacted with the page
        if (!userHasInteracted) {
            console.log("Deferring music playback until user interaction");
            return;
        }
        
        // Get the track at the front of the queue
        const track = this.playlist.getCurrentTrack() as ExtendedAudioElement;
        if (!track) return;
        
        console.log(`Starting to play track: ${track.src.split('/').pop()}`);
        
        // Set up ended event listener for this track if not already set
        if (!track.hasEndedListener) {
            track.addEventListener('ended', () => this.playNextTrack(userHasInteracted));
            track.hasEndedListener = true;
        }
        
        // Reset the track to the beginning
        track.currentTime = 0;
        
        // Attempt to play the track
        const playPromise = track.play();
        
        // Handle play promise (modern browsers return a promise from play())
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log("Started playing background music");
                    this.currentMusic = track;
                })
                .catch(err => {
                    if (err.name === 'NotAllowedError') {
                        console.log("Autoplay prevented by browser. Music will play after user interaction.");
                    } else {
                        console.error("Error playing background music:", err);
                    }
                });
        } else {
            this.currentMusic = track;
        }
    }
    
    // Play the next track in the playlist
    playNextTrack(userHasInteracted: boolean): void {
        const nextTrack = this.playlist.playNextTrack();
        if (nextTrack && userHasInteracted) {
            this.playBackgroundMusic(userHasInteracted);
        }
    }
    
    // Toggle mute for music
    toggleMute(): boolean {
        this.muted = !this.muted;
        
        // Adjust music volume
        const tracks = this.playlist.getTracks();
        for (const track of tracks) {
            track.volume = this.muted ? 0 : this.playlist.getVolume();
        }
        
        console.log(`Music ${this.muted ? 'muted' : 'unmuted'}`);
        return this.muted;
    }
    
    // Set music volume
    setVolume(volume: number): void {
        this.playlist.setVolume(this.muted ? 0 : volume);
    }
    
    // Get current music volume
    getVolume(): number {
        return this.playlist.getVolume();
    }
    
    // Check if music is muted
    isMuted(): boolean {
        return this.muted;
    }
    
    // Pause all music
    pauseAll(): void {
        const tracks = this.playlist.getTracks();
        for (const track of tracks) {
            track.pause();
        }
        this.currentMusic = null;
    }
    
    // Get current playing track
    getCurrentTrack(): ExtendedAudioElement | null {
        return this.currentMusic;
    }
}
