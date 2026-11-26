import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Trash2, ShieldCheck, Mic, MicOff } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import SpeechButton from '../components/SpeechButton';
import { sendChatMessage } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function ChatbotPage() {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(
    () => () => {
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) {
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onresult = null;
        recognition.abort();
      }
    },
    []
  );

  function toggleVoiceInput() {
    setVoiceError('');
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      setVoiceError(t.chatbot.voiceInputUnsupported);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[event.resultIndex]?.[0]?.transcript?.trim();
      if (transcript) {
        setInput((current) => [current, transcript].filter(Boolean).join(' '));
      }
    };
    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setListening(false);
      if (event.error === 'aborted') return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setVoiceError(t.chatbot.microphoneDenied);
      } else if (event.error === 'no-speech') {
        setVoiceError(t.chatbot.noSpeechDetected);
      } else {
        setVoiceError(t.chatbot.voiceInputError);
      }
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
        setListening(false);
      }
    };
    recognitionRef.current = recognition;

    try {
      recognition.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      setVoiceError(t.chatbot.voiceInputError);
    }
  }

  async function submitQuestion(questionText) {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    setVoiceError('');
    setError('');
    const userMessage = { id: Date.now(), sender: 'user', text: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const data = await sendChatMessage({
        message: trimmed,
        language,
        history: nextMessages,
      });

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'ai', text: data.reply, fallback: data.fallback === true },
      ]);
    } catch (err) {
      setError(
        err.message ||
          'Unable to connect to the backend AI server. Make sure the Node/Express server is running on port 5000 with GEMINI_API_KEY configured.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    submitQuestion(input);
  }

  return (
    <div>
      <PageHeader
        icon={Bot}
        title={t.chatbot.title}
        subtitle={t.chatbot.subtitle}
        badge={
          <span className="badge badge-green">
            <ShieldCheck size={14} /> Backend Gemini Proxy
          </span>
        }
      />

      <section className="page-section">
        <div className="container">
          <AlertBanner variant="info" title={t.common.disclaimerLabel}>
            {t.chatbot.securityNote}
          </AlertBanner>

          {error && (
            <AlertBanner variant="error" title={t.common.errorOccurred}>
              {error}
            </AlertBanner>
          )}

          <div className="card chat-card">
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700 }}>
                <Bot size={20} color="#1B5E20" />
                <span>{t.chatbot.title}</span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setMessages([]);
                  setError('');
                }}
                disabled={messages.length === 0 || loading}
              >
                <Trash2 size={15} />
                <span>{t.chatbot.clearChat}</span>
              </button>
            </div>

            <div className="chat-messages">
              {messages.length === 0 && !loading ? (
                <EmptyState
                  icon={Bot}
                  title={t.chatbot.emptyTitle}
                  description={t.chatbot.emptyDesc}
                />
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-bubble ${
                      msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
                    }`}
                  >
                    {msg.fallback && (
                      <strong style={{ display: 'block', marginBottom: '0.4rem' }}>
                        {t.chatbot.fallbackLabel}
                      </strong>
                    )}
                    {msg.text}
                    {msg.sender === 'ai' && (
                      <div className="chat-voice-actions">
                        <SpeechButton
                          text={msg.text}
                          language={language}
                          listenLabel={t.common.listen}
                          stopLabel={t.common.stopAudio}
                          unsupportedMessage={t.common.voicePlaybackUnsupported}
                          errorMessage={t.common.voicePlaybackError}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}

              {loading && (
                <div className="chat-bubble chat-bubble-ai">
                  <LoadingSpinner text={t.chatbot.thinking} />
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="chat-prompts">
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  alignSelf: 'center',
                  marginRight: '0.25rem',
                }}
              >
                {t.chatbot.promptsLabel}
              </span>
              {t.chatbot.prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="prompt-chip"
                  onClick={() => submitQuestion(prompt)}
                  disabled={loading}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form className="chat-input-bar" onSubmit={handleFormSubmit}>
              <input
                type="text"
                className="form-input"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setVoiceError('');
                }}
                placeholder={t.chatbot.inputPlaceholder}
                disabled={loading}
                aria-label={t.chatbot.inputPlaceholder}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm voice-input-button"
                onClick={toggleVoiceInput}
                disabled={loading}
                aria-label={listening ? t.chatbot.stopVoiceInput : t.chatbot.startVoiceInput}
                aria-pressed={listening}
                title={listening ? t.chatbot.stopVoiceInput : t.chatbot.startVoiceInput}
              >
                {listening ? <MicOff size={17} /> : <Mic size={17} />}
                <span>{listening ? t.chatbot.stopVoiceInput : t.chatbot.startVoiceInput}</span>
              </button>
              <button
                type="submit"
                className="btn btn-primary chat-submit-button"
                disabled={loading || !input.trim()}
              >
                <Send size={17} />
                <span>{t.chatbot.sendBtn}</span>
              </button>
            </form>
            {voiceError && (
              <div className="voice-input-feedback" role="status">
                {voiceError}
              </div>
            )}
            <p className="voice-privacy-note">{t.chatbot.voicePrivacyNotice}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
