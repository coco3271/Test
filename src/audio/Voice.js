import { TextToSpeech } from '@capacitor-community/text-to-speech';

// The coach voice. Uses the phone's native text-to-speech on iOS/Android
// (Android web views have no speechSynthesis) and the browser's on the web.
export const Voice = {
  enabled: true,
  lastText: '',
  async say(text, { rate = 1.0, pitch = 1.25, interrupt = true } = {}) {
    if (!this.enabled || !text) return;
    this.lastText = text;
    try {
      if (interrupt) await TextToSpeech.stop().catch(() => {});
      // 'ambient' lets the voice play on top of the music on iOS.
      await TextToSpeech.speak({ text, lang: 'en-US', rate, pitch, volume: 1, category: 'ambient' });
    } catch {
      // No voice available: the on-screen text still tells the child what to do.
    }
  },
  stop() {
    TextToSpeech.stop().catch(() => {});
  },
};
