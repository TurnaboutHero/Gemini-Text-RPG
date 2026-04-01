import { Howl } from 'howler';
import { BgmTrack, SfxClip } from '../types';

// Stable URLs for SFX (IonDen/ion.sound)
const SFX_BASE_URL = 'https://raw.githubusercontent.com/IonDen/ion.sound/master/sounds';

// Royalty-free assets from Pixabay for BGM (Streaming)
const bgmPaths: Record<BgmTrack, string> = {
    none: '',
    main_menu: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73456.mp3',
    character_creation: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3',
    adventure: 'https://cdn.pixabay.com/audio/2021/11/23/audio_0c1326696d.mp3',
    combat: 'https://cdn.pixabay.com/audio/2022/02/22/audio_d0c6ff1e0b.mp3',
    game_over: 'https://cdn.pixabay.com/audio/2021/08/09/audio_8816d7730d.mp3',
};

// Simple Web Audio API synthesizer for UI sounds
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

const playSynthSound = (type: SfxClip) => {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    switch (type) {
        case 'ui_click':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, now);
            oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.1);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            oscillator.start(now);
            oscillator.stop(now + 0.1);
            break;
        case 'ui_confirm':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(400, now);
            oscillator.frequency.setValueAtTime(600, now + 0.1);
            gainNode.gain.setValueAtTime(0.05, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
            break;
        case 'ui_cancel':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(300, now);
            oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.15);
            gainNode.gain.setValueAtTime(0.05, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
            oscillator.start(now);
            oscillator.stop(now + 0.15);
            break;
        case 'combat_attack':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(150, now);
            oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.2);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
            break;
        case 'combat_skill':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, now);
            oscillator.frequency.linearRampToValueAtTime(800, now + 0.3);
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.1, now + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
            break;
        case 'combat_hit_player':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(100, now);
            oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.3);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
            break;
        case 'combat_hit_enemy':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.15);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            oscillator.start(now);
            oscillator.stop(now + 0.15);
            break;
        case 'event_levelup':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, now);
            oscillator.frequency.setValueAtTime(554, now + 0.1);
            oscillator.frequency.setValueAtTime(659, now + 0.2);
            oscillator.frequency.setValueAtTime(880, now + 0.3);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
            oscillator.start(now);
            oscillator.stop(now + 0.6);
            break;
        case 'event_buy':
        case 'event_sell':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, now);
            oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gainNode.gain.setValueAtTime(0.05, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            oscillator.start(now);
            oscillator.stop(now + 0.1);
            break;
        case 'event_equip':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(300, now);
            oscillator.frequency.linearRampToValueAtTime(400, now + 0.1);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
            oscillator.start(now);
            oscillator.stop(now + 0.15);
            break;
    }
};

class AudioService {
    private bgm: Howl | null = null;
    private isMuted: boolean = false;
    private currentBgm: BgmTrack = 'none';

    constructor() {
    }

    private getSfx(clip: SfxClip): Howl | null {
        return null;
    }

    public playBgm(track: BgmTrack) {
        if (track === 'none') {
            if (this.bgm) {
                this.bgm.stop();
            }
            this.currentBgm = 'none';
            return;
        }

        if (this.currentBgm === track && this.bgm && this.bgm.playing()) {
            return;
        }

        const path = bgmPaths[track];
        if (!path) {
            console.warn(`BGM track '${track}' not found.`);
            if (this.bgm) this.bgm.stop();
            this.currentBgm = 'none';
            return;
        }

        console.log(`Attempting to play BGM: ${track} from ${path}`);

        // Stop current BGM with a fade
        if (this.bgm) {
            const oldBgm = this.bgm;
            oldBgm.fade(oldBgm.volume(), 0, 1000);
            oldBgm.once('fade', () => oldBgm.stop());
        }

        this.currentBgm = track;
        this.bgm = new Howl({
            src: [path],
            format: ['mp3'],
            loop: true,
            volume: 0.3,
            html5: true, // Keep HTML5 for BGM (streaming long files)
            mute: this.isMuted,
            onload: () => {
                console.log(`BGM '${track}' loaded successfully.`);
            },
            onloaderror: (id, error) => {
                console.error(`Error loading BGM track '${track}' at URL '${path}':`, error);
            },
            onplayerror: (id, error) => {
                console.error(`Error playing BGM track '${track}' at URL '${path}':`, error);
                if (this.bgm) {
                    this.bgm.once('unlock', () => this.bgm?.play());
                }
            }
        });

        this.bgm.play();
    }

    public testSound() {
        console.log("Running sound test...");
        this.playSfx('ui_click');
        this.speak("사운드 테스트 중입니다.");
    }

    public playSfx(clip: SfxClip) {
        if (this.isMuted) return;

        try {
            playSynthSound(clip);
        } catch (e) {
            console.error("Failed to play synth sound", e);
        }
    }

    public speak(text: string, lang: string = 'ko-KR') {
        if (this.isMuted || !('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.1;
        utterance.pitch = 1;
        utterance.volume = 0.8;

        const setVoiceAndSpeak = () => {
            const voices = window.speechSynthesis.getVoices();
            const koreanVoice = voices.find(voice => voice.lang === lang);
            if (koreanVoice) {
                utterance.voice = koreanVoice;
            } else {
                const defaultVoice = voices.find(voice => voice.default);
                if (defaultVoice) utterance.voice = defaultVoice;
            }
            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length > 0) {
            setVoiceAndSpeak();
        } else {
            window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
        }
    }

    public toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        
        if (this.bgm) {
            this.bgm.mute(this.isMuted);
        }

        if (this.isMuted && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        
        return this.isMuted;
    }

    public getMuteState(): boolean {
        return this.isMuted;
    }
}

export const audioService = new AudioService();
