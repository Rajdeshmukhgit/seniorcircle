"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Voice for the assistant, using what the browser already provides: speech
 * recognition for the question and speech synthesis for the answer. No API key
 * and no audio ever leaves the browser except through the browser's own
 * recognition service.
 *
 * Adapted from the Reflex Loop voice agent: answers are spoken sentence by
 * sentence as they stream in, and talking over the assistant stops it.
 */

/** Speech recognition is still vendor-prefixed in Chrome, so it is typed here. */
interface SRAlternative {
  readonly transcript: string;
}
interface SRResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SRAlternative;
}
interface SRResultList {
  readonly length: number;
  readonly [index: number]: SRResult;
}
interface SREvent extends Event {
  readonly resultIndex: number;
  readonly results: SRResultList;
}
interface SRErrorEvent extends Event {
  readonly error: string;
}
interface SRInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SREvent) => void) | null;
  onerror: ((event: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type SRConstructor = new () => SRInstance;

/** Indian English, so names like "GATE" and "Infosys" are recognised better. */
const LANGUAGE = "en-IN";

/** Loudness and consecutive frames needed to count as someone talking over the reply. */
const BARGE_IN_LEVEL = 0.045;
const BARGE_IN_FRAMES = 4;

function recognitionClass(): SRConstructor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

function speechErrorMessage(code: string): string {
  if (code === "not-allowed" || code === "service-not-allowed") {
    return "Microphone access is blocked. Allow it in your browser's address bar to speak.";
  }
  if (code === "audio-capture") return "No microphone was found.";
  if (code === "network") return "Speech recognition needs an internet connection, and your browser could not reach it.";
  return "";
}

/** Markdown markers would otherwise be read out loud. */
function speakable(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** End of the last finished sentence in the text, or -1 when there is none. */
function lastSentenceEnd(text: string): number {
  const pattern = /[.!?…]+["')\]]*(\s|$)|\n+/g;
  let end = -1;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) end = match.index + match[0].length;
  return end;
}

interface UseSpeechOptions {
  /** Called once the person has finished speaking a question. */
  onQuestion: (text: string) => void;
  /** Called when they talk over a reply, so the chat can start listening again. */
  onBargeIn?: () => void;
}

export function useSpeech({ onQuestion, onBargeIn }: UseSpeechOptions) {
  const [canListen, setCanListen] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");

  const recognition = useRef<SRInstance | null>(null);
  const finalText = useRef("");
  const spokenChars = useRef(0);
  const utterances = useRef(0);
  const voice = useRef<SpeechSynthesisVoice | null>(null);
  const microphone = useRef<{ stream: MediaStream; context: AudioContext; frame: number } | null>(null);

  // Keep the callbacks in refs so the speech objects never hold a stale copy.
  const questionHandler = useRef(onQuestion);
  const bargeInHandler = useRef(onBargeIn);
  useEffect(() => {
    questionHandler.current = onQuestion;
    bargeInHandler.current = onBargeIn;
  });

  // Both features are detected in the browser, so the server renders the same
  // markup either way and the buttons appear once support is confirmed.
  useEffect(() => {
    setCanListen(recognitionClass() !== null);
    const synthesis = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synthesis) return;
    setCanSpeak(true);

    const choose = () => {
      const voices = synthesis.getVoices();
      voice.current =
        voices.find((option) => option.lang === LANGUAGE) ??
        voices.find((option) => option.lang.startsWith("en-")) ??
        null;
    };
    choose();
    // The list is often empty until the browser has loaded its voices.
    synthesis.addEventListener("voiceschanged", choose);
    return () => synthesis.removeEventListener("voiceschanged", choose);
  }, []);

  const stopMicrophoneWatch = useCallback(() => {
    const open = microphone.current;
    if (!open) return;
    microphone.current = null;
    cancelAnimationFrame(open.frame);
    open.stream.getTracks().forEach((track) => track.stop());
    void open.context.close().catch(() => {});
  }, []);

  const cancelSpeech = useCallback(() => {
    stopMicrophoneWatch();
    utterances.current = 0;
    setSpeaking(false);
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Nothing was being spoken.
    }
  }, [stopMicrophoneWatch]);

  /**
   * Listens for the person talking while the reply is being read out, and
   * stops the reply when they do. Only armed once they have already allowed
   * the microphone, so nobody is asked for permission out of the blue.
   */
  const watchForBargeIn = useCallback(async () => {
    if (!bargeInHandler.current || microphone.current || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const permission = await navigator.permissions.query({ name: "microphone" as PermissionName });
      if (permission.state !== "granted") return;
    } catch {
      return; // Browsers that cannot report the permission are left alone.
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // Echo cancellation keeps the assistant's own voice from triggering this.
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      context.createMediaStreamSource(stream).connect(analyser);

      const samples = new Float32Array(analyser.fftSize);
      let loudFrames = 0;

      const check = () => {
        if (!microphone.current) return;
        analyser.getFloatTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) sum += sample * sample;
        const level = Math.sqrt(sum / samples.length);

        loudFrames = level > BARGE_IN_LEVEL ? loudFrames + 1 : 0;
        if (loudFrames >= BARGE_IN_FRAMES) {
          loudFrames = 0;
          cancelSpeech();
          bargeInHandler.current?.();
          return;
        }
        microphone.current.frame = requestAnimationFrame(check);
      };

      microphone.current = { stream, context, frame: requestAnimationFrame(check) };
    } catch {
      // No microphone available. The reply is still spoken.
    }
  }, [cancelSpeech]);

  /** Speaks one piece of the reply and tracks when the whole queue is finished. */
  const enqueue = useCallback(
    (text: string) => {
      const words = speakable(text);
      if (!words) return;

      const utterance = new SpeechSynthesisUtterance(words);
      utterance.lang = LANGUAGE;
      if (voice.current) utterance.voice = voice.current;
      utterance.rate = 1.05;

      const finish = () => {
        utterances.current = Math.max(0, utterances.current - 1);
        if (utterances.current === 0) {
          setSpeaking(false);
          stopMicrophoneWatch();
        }
      };
      utterance.onend = finish;
      utterance.onerror = finish;

      utterances.current += 1;
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
      void watchForBargeIn();
    },
    [stopMicrophoneWatch, watchForBargeIn],
  );

  /** Starts a fresh reply, so nothing from the previous one is spoken. */
  const startReply = useCallback(() => {
    cancelSpeech();
    spokenChars.current = 0;
  }, [cancelSpeech]);

  /**
   * Speaks whatever new complete sentences have arrived. Called repeatedly
   * while the answer streams in, then once more with `final` at the end.
   */
  const speakReply = useCallback(
    (fullText: string, final = false) => {
      const pending = fullText.slice(spokenChars.current);
      if (!pending.trim()) {
        if (final) spokenChars.current = fullText.length;
        return;
      }
      if (final) {
        spokenChars.current = fullText.length;
        enqueue(pending);
        return;
      }
      const end = lastSentenceEnd(pending);
      if (end <= 0) return;
      spokenChars.current += end;
      enqueue(pending.slice(0, end));
    },
    [enqueue],
  );

  /** Speaks one finished message on its own, for the replay button. */
  const speakMessage = useCallback(
    (text: string) => {
      cancelSpeech();
      spokenChars.current = text.length;
      enqueue(text);
    },
    [cancelSpeech, enqueue],
  );

  const stopListening = useCallback(() => {
    try {
      recognition.current?.stop();
    } catch {
      // It had already stopped.
    }
  }, []);

  const startListening = useCallback(() => {
    const Recognition = recognitionClass();
    if (!Recognition || recognition.current) return;

    cancelSpeech();
    setError("");
    setInterim("");
    finalText.current = "";

    const instance = new Recognition();
    instance.lang = LANGUAGE;
    instance.interimResults = true;
    instance.continuous = false;
    instance.maxAlternatives = 1;

    instance.onresult = (event) => {
      let live = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) finalText.current += text;
        else live += text;
      }
      setInterim(live);
    };

    instance.onerror = (event) => {
      if (event.error !== "aborted" && event.error !== "no-speech") setError(speechErrorMessage(event.error));
    };

    instance.onend = () => {
      recognition.current = null;
      setListening(false);
      setInterim("");
      const question = finalText.current.trim();
      finalText.current = "";
      if (question) questionHandler.current(question);
    };

    try {
      instance.start();
      recognition.current = instance;
      setListening(true);
    } catch {
      recognition.current = null;
      setListening(false);
      setError("The microphone could not be started.");
    }
  }, [cancelSpeech]);

  // Never leave the microphone open or a voice talking after the chat closes.
  useEffect(
    () => () => {
      try {
        recognition.current?.abort();
      } catch {
        // Already stopped.
      }
      recognition.current = null;
      stopMicrophoneWatch();
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Nothing was being spoken.
      }
    },
    [stopMicrophoneWatch],
  );

  return {
    canListen,
    canSpeak,
    listening,
    speaking,
    interim,
    error,
    startListening,
    stopListening,
    startReply,
    speakReply,
    speakMessage,
    cancelSpeech,
  };
}
