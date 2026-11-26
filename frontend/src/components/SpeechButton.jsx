import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function SpeechButton({
  text,
  language,
  listenLabel,
  stopLabel,
  unsupportedMessage,
  errorMessage,
}) {
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');
  const utteranceRef = useRef(null);

  useEffect(
    () => () => {
      const utterance = utteranceRef.current;
      utteranceRef.current = null;
      if (utterance && typeof window !== 'undefined' && window.speechSynthesis) {
        utterance.onend = null;
        utterance.onerror = null;
        window.speechSynthesis.cancel();
      }
    },
    []
  );

  function handleClick() {
    if (
      typeof window === 'undefined' ||
      !window.speechSynthesis ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      setError(unsupportedMessage);
      return;
    }

    setError('');
    if (speaking) {
      utteranceRef.current = null;
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.onend = () => {
      utteranceRef.current = null;
      setSpeaking(false);
    };
    utterance.onerror = (event) => {
      utteranceRef.current = null;
      setSpeaking(false);
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        setError(errorMessage);
      }
    };

    utteranceRef.current = utterance;
    setSpeaking(true);
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      utteranceRef.current = null;
      setSpeaking(false);
      setError(errorMessage);
    }
  }

  return (
    <span className="speech-control">
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={handleClick}
        aria-label={speaking ? stopLabel : listenLabel}
      >
        {speaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
        <span>{speaking ? stopLabel : listenLabel}</span>
      </button>
      {error && (
        <span className="speech-feedback" role="status">
          {error}
        </span>
      )}
    </span>
  );
}
