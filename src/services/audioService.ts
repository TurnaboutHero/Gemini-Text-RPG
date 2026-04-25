import { Howl, Howler } from 'howler';
import { BgmTrack } from '../types';

// Placeholder URLs for different game states
// In a real production app, these should be replaced with actual local assets in the public/ folder
// or a stable asset CDN.
const TRACKS: Record<Exclude<BgmTrack, 'none'>, string> = {
  main_menu: 'https://storage.googleapis.com/media-session/big-buck-bunny/prelude.mp3',
  character_creation: 'https://storage.googleapis.com/media-session/elephants-dream/the-wires.mp3',
  adventure: 'https://storage.googleapis.com/media-session/big-buck-bunny/prelude.mp3',
  combat: 'https://storage.googleapis.com/media-session/sintel/snow-fight.mp3',
  game_over: 'https://storage.googleapis.com/media-session/elephants-dream/the-wires.mp3', 
};

class AudioService {
  private currentTrackName: BgmTrack | null = null;
  private currentHowl: Howl | null = null;
  private isMuted: boolean = false;
  private globalVolume: number = 0.5;

  constructor() {
    Howler.volume(this.globalVolume);
  }

  public playMusic(track: BgmTrack) {
    if (this.currentTrackName === track) return;

    if (track === 'none') {
        if (this.currentHowl) {
            const oldHowl = this.currentHowl;
            oldHowl.fade(this.globalVolume, 0, 1000);
            oldHowl.once('fade', () => {
                oldHowl.stop();
                oldHowl.unload();
            });
            this.currentHowl = null;
        }
        this.currentTrackName = track;
        return;
    }

    const url = TRACKS[track as Exclude<BgmTrack, 'none'>];
    if (!url) return;

    const newHowl = new Howl({
      src: [url],
      html5: true, // Force HTML5 Audio to avoid CORS issues and allow streaming
      loop: true,
      volume: 0, // Start at 0 for fade in
    });

    // Fade out previous track
    if (this.currentHowl) {
      const oldHowl = this.currentHowl;
      oldHowl.fade(this.globalVolume, 0, 1000);
      oldHowl.once('fade', () => {
        oldHowl.stop();
        oldHowl.unload();
      });
    }

    // Play and fade in new track
    this.currentTrackName = track;
    this.currentHowl = newHowl;
    
    if (!this.isMuted) {
      newHowl.play();
      newHowl.fade(0, this.globalVolume, 1000);
    }
  }

  public playBgm(track: BgmTrack) {
    this.playMusic(track);
  }

  public playSfx(sfxId: string) {
    // SFX playback is unsuppored currently, just a no-op placeholder
    if (this.isMuted) return;
    // console.log("Playing SFX:", sfxId);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.currentHowl) {
        this.currentHowl.fade(this.globalVolume, 0, 500);
        setTimeout(() => this.currentHowl?.pause(), 500);
      }
    } else {
      if (this.currentHowl) {
        this.currentHowl.play();
        this.currentHowl.fade(0, this.globalVolume, 500);
      } else if (this.currentTrackName) {
         this.playMusic(this.currentTrackName);
      }
    }
    return this.isMuted;
  }

  public setVolume(volume: number) {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.globalVolume);
  }

  public getIsMuted() {
    return this.isMuted;
  }
}

export const audioService = new AudioService();
