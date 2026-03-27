import { BgmTrack, SfxClip } from '../types';

const bgmPaths: Record<BgmTrack, string> = {
    none: '',
    main_menu: 'https://storage.googleapis.com/gemini-codelab-assets/adventure-game/main_menu.mp3',
    character_creation: 'https://storage.googleapis.com/gemini-codelab-assets/adventure-game/character_creation.mp3',
    adventure: 'https://storage.googleapis.com/gemini-codelab-assets/adventure-game/adventure.mp3',
    combat: 'https://storage.googleapis.com/gemini-codelab-assets/adventure-game/combat.mp3',
    game_over: 'https://storage.googleapis.com/gemini-codelab-assets/adventure-game/game_over.mp3',
};

const sfxPaths: Record<SfxClip, string> = {
    ui_click: 'https://storage.googleapis.com/gemini-codelab-assets/adventure-game/ui_click.mp3',
    ui_confirm: 'https://storage.googleapis.com/gemini-codelab-assets/adventure-game/ui_confirm.mp3',
    ui_cancel: 'https://storage.googleapis.com/gemini-codelab-assets/adventure-game/ui_cancel.mp3',
    combat_attack: 'https://storage.googleapis.com/gemini-codelab-assets/adventure-game/combat_attack.mp3',
    combat_skill: 'https://storage.googleapis.com/gemini-codelab-assets/adventure-game/combat_skill.mp3',
    combat_hit_player: 'https://storage.googleapis.com/gemini-codelab-assets/adventure-game/combat_hit_player.mp3',
    combat_hit_enemy: 'https://storage.googleapis.com/gemini-codelab-assets/adventure-game/combat_hit_enemy.mp3',
    event_levelup: 'https://storage.googleapis.com/gemini-codelab-assets/adventure-game/event_levelup.mp3',
    event_buy: 'https://storage.googleapis.com/gemini-codelab-assets/adventure-game/event_buy.mp3',
    event_sell: 'https://storage.googleapis.com/gemini-codelab-assets/adventure-game/event_sell.mp3',
    event_equip: 'https://storage.googleapis.com/gemini-codelab-assets/adventure-game/event_equip.mp3',
};

class AudioService {
    private bgm: HTMLAudioElement | null = null;
    private isMuted: boolean = false;
    private currentBgm: BgmTrack = 'none';
    private sfxPool: HTMLAudioElement[] = [];
    private sfxPoolIndex: number = 0;
    private readonly SFX_POOL_SIZE = 15;

    constructor() {
        // Initialize the audio pool for SFX
        for (let i = 0; i < this.SFX_POOL_SIZE; i++) {
            this.sfxPool.push(new Audio());
        }
    }

    public playBgm(track: BgmTrack) {
        // 1. Handle stopping music
        if (track === 'none') {
            if (this.bgm && !this.bgm.paused) {
                this.bgm.pause();
            }
            this.currentBgm = 'none';
            return;
        }

        // 2. Avoid restarting the same track
        if (this.currentBgm === track && this.bgm && !this.bgm.paused) {
            return;
        }

        // 3. Get the path, ensure it's valid
        const path = bgmPaths[track];
        if (!path) {
            console.warn(`BGM track '${track}' not found.`);
            if (this.bgm && !this.bgm.paused) {
                this.bgm.pause();
            }
            this.currentBgm = 'none';
            return;
        }

        // 4. Initialize player if needed
        if (!this.bgm) {
            this.bgm = new Audio();
            this.bgm.loop = true;
            this.bgm.volume = 0.3;
        }

        // 5. Play the track
        this.currentBgm = track;
        // Only set src if it's different to avoid unnecessary reloads
        if (this.bgm.src !== path) {
            this.bgm.src = path;
        }
        
        this.bgm.muted = this.isMuted;
        if (!this.isMuted) {
            this.bgm.play().catch(e => {
                console.warn("BGM autoplay was blocked. It will start after the first user interaction.", e);
            });
        }
    }

    public playSfx(clip: SfxClip) {
        if (this.isMuted) return;

        try {
            // Use the next audio element in the pool
            const sfx = this.sfxPool[this.sfxPoolIndex];
            this.sfxPoolIndex = (this.sfxPoolIndex + 1) % this.SFX_POOL_SIZE;

            sfx.src = sfxPaths[clip];
            sfx.volume = 0.6;
            sfx.play().catch(error => {
                // AbortError is expected if the same sound is re-triggered quickly. We can ignore it.
                if (error.name !== 'AbortError') {
                    console.error(`Error playing SFX clip '${clip}' at URL '${sfxPaths[clip]}':`, error);
                }
            });
        } catch (e) {
            console.error(`Could not play audio for clip '${clip}'`, e);
        }
    }

    public speak(text: string, lang: string = 'ko-KR') {
        if (this.isMuted || !('speechSynthesis' in window)) return;

        // Stop any currently speaking utterance
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.1; // Slightly faster for game pacing
        utterance.pitch = 1;
        utterance.volume = 0.8;

        // Function to set the voice and speak
        const setVoiceAndSpeak = () => {
            const voices = window.speechSynthesis.getVoices();
            const koreanVoice = voices.find(voice => voice.lang === lang);
            if (koreanVoice) {
                utterance.voice = koreanVoice;
            } else {
                // Fallback if no specific Korean voice is found
                const defaultVoice = voices.find(voice => voice.default);
                if (defaultVoice) utterance.voice = defaultVoice;
            }
            window.speechSynthesis.speak(utterance);
        };

        // Voices might load asynchronously.
        if (window.speechSynthesis.getVoices().length > 0) {
            setVoiceAndSpeak();
        } else {
            window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
        }
    }

    public toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        if (this.bgm) {
            this.bgm.muted = this.isMuted;
            // If unmuting, and music was supposed to be playing, start it.
            if (!this.isMuted && this.bgm.paused && this.currentBgm !== 'none') {
                 this.bgm.play().catch(e => console.error("Error resuming BGM:", e));
            }
        }
        // If muting, stop any currently playing speech synthesis
        if (this.isMuted && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        return this.isMuted;
    }

    public getMuteState(): boolean {
        return this.isMuted;
    }
}

// Export a singleton instance so the same service is used everywhere
export const audioService = new AudioService();