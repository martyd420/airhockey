export class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initSounds();
        } catch (e) {
            console.warn('Web Audio API not supported in this browser');
        }
    }

    initSounds() {
        this.createSound('paddle', [0.0, 0.1, 0.2, 0.3, 0.4], 0.1, 220, 0, 0.05, 0.1);
        this.createSound('wall', [0.0, 0.1, 0.2, 0.3, 0.4], 0.1, 180, 0, 0.05, 0.1);
        this.createSound('goal', [0.0, 0.2, 0.4, 0.2, 0.0], 0.3, 320, 0.1, 0.1, 0.5);
        this.createSound('ownGoal', [0.0, 0.2, 0.4, 0.2, 0.0], 0.3, 180, 0.1, 0.1, 0.5);
        this.createSound('bonus', [0.0, 0.2, 0.4, 0.6, 0.4, 0.2, 0.0], 0.2, 440, 0.05, 0.05, 0.3);
    }

    createSound(name, envelope, duration, frequency, detune, delay, volume) {
        this.sounds[name] = { envelope, duration, frequency, detune, delay, volume };
    }

    playSound(sound) {
        if (!this.audioContext || !this.sounds[sound]) {
            console.log('Playing sound:', sound);
            return;
        }
        
        const soundDef = this.sounds[sound];
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sine';

        // Pitch variation for paddle and wall hits
        if (sound === 'paddle' || sound === 'wall') {
            oscillator.frequency.value = soundDef.frequency + (Math.random() * 30 - 15); // +/- 15 Hz variation
        } else {
            oscillator.frequency.value = soundDef.frequency;
        }

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0;
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        const now = this.audioContext.currentTime + soundDef.delay;
        const duration = soundDef.duration;
        
        for (let i = 0; i < soundDef.envelope.length; i++) {
            const time = now + (i / (soundDef.envelope.length - 1)) * duration;
            // Ensure gain doesn't go below a very small positive number for setValueAtTime
            const gainValue = Math.max(0.0001, soundDef.envelope[i] * soundDef.volume);
            
            // Use linearRampToValueAtTime for smoother transitions between envelope points
            if (i === 0) {
                gainNode.gain.setValueAtTime(gainValue, time);
            } else {
                gainNode.gain.linearRampToValueAtTime(gainValue, time);
            }
        }
        
        oscillator.start(now);
        oscillator.stop(now + duration + 0.1); // Stop slightly after envelope finishes
    }
}