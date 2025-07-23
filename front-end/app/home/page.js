'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import styles from './page.module.css';
import ChatResponse from '@/components/ChatResponse';
import ChatPlaceholder from '@/components/ChatPlaceholder';
import ZenaLoading from '@/components/ZenaLoading';
import { createClient } from '@/utils/supabase/client';
import MaintenancePage from '@/components/notFound';
import PagesComponent from '@/components/PagesComponent';
import { Howl } from 'howler';

export const useClickHandlers = ({
  onSingleClick,
  onDoubleClick,
  delay = 250,
}) => {
  const clickTimeout = useRef(null);
  const handleClick = () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }
    clickTimeout.current = setTimeout(() => {
      onSingleClick();
      clickTimeout.current = null;
    }, delay);
  };
  const handleDoubleClick = () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }
    onDoubleClick();
  };
  return {
    onClick: handleClick,
    onDoubleClick: handleDoubleClick,
  };
};

export default function HomePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const router = useRouter();
  const [settingsFlag, setSettingsFlag] = useState(false);
  const [signOutFlag, setSignOutFlag] = useState(false);
  const [query, setQuery] = useState('');
  const menuRef = useRef(null);
  const [greeting, setGreeting] = useState('Good Morning');
  const [value, setValue] = useState('');
  const [reply, setReply] = useState('');
  const [sessionQuery, setSessionQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [pages, setPages] = useState([]);
  const [showPages, setShowPages] = useState(false);
  const [voiceModeToggle, setVoiceModeToggle] = useState(false);
  const [noAudio, SetNoAudio] = useState(true);
  const [audioIsReady, setAudioIsReady] = useState(false);
  const [audioHasEnded, setAudioHasEnded] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceInputFlag, setVoiceInputFlag] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [voiceId, setVoiceId] = useState('KoVIHoyLDrQyd4pGalbs');
  const sound = new Howl({ src: ['/sounds/tapSound.mp3'] });
  const eyesRef = useRef(null);
  const { onClick, onDoubleClick } = useClickHandlers({
    onSingleClick: () => {
      if (isRecording || isProcessing) return;
      setVoiceInputFlag(true);
      playSound();
      stopAudio();
    },
    onDoubleClick: () => {
      if (!voiceInputFlag) {
        setVoiceModeToggle(false);
      }
    },
  });

  const playElevenLabsAudio = async (text, intent, url) => {
    SetNoAudio(false);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voiceId }),
      });
      if (!res.ok) {
        console.warn('TTS API Error:', res.statusText);
        SetNoAudio(true);
        return;
      }
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      setAudioIsReady(true);
      audio.play().catch((err) => {
        console.warn('Audio playback failed:', err);
        setCurrentAudio(null);
        setAudioHasEnded(true);
        if (intent === 'book_cab') {
          window.open(url, '_blank');
        } else if (intent === 'send_message') {
          window.open(url, '_blank');
          setWhatsappData({});
          setWhatsappProcess(false);
        }
      });
      audio.onended = () => {
        setCurrentAudio(null);
        setAudioHasEnded(true);
        if (intent === 'book_cab') {
          window.open(url, '_blank');
        } else if (intent === 'send_message') {
          window.open(url, '_blank');
          setWhatsappData({});
          setWhatsappProcess(false);
        }
      };
    } catch (err) {
      SetNoAudio(true);
      console.warn('Text-to-speech failed:', err);
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setAudioHasEnded(true);
    }
  };

  const playSound = () => {
    sound.play();
  };

  const handleVoiceInput = () => {
    setAudioHasEnded(false);
    let gotResult = false;
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      gotResult = true;
      const transcript = event.results[0][0].transcript;
      // console.log(transcript);
      setQuery(transcript);
    };
    recognition.onend = () => {
      setIsRecording(false);
      if (!gotResult) {
        setVoiceInputFlag(false);
        setAudioHasEnded(true);
      }
      // setVoiceInputFlag(false);
    };
    recognition.start();
  };

  useEffect(() => {
    // console.log('******************************');
    // console.log('audioHasEnded: ', audioHasEnded);
    // console.log('isRecording: ', isRecording);
    // console.log('voiceInputFlag: ', voiceInputFlag);
    // console.log('isProcessing: ', isProcessing);
    // console.log('******************************');
    // if (audioHasEnded && !isRecording && voiceInputFlag && !isProcessing) {
    if (!isRecording && voiceInputFlag && !isProcessing) {
      // console.log('execute');
      playSound();
      handleVoiceInput();
    }
  }, [isRecording, voiceInputFlag, isProcessing]);
  // }, [audioHasEnded, isRecording, voiceInputFlag, isProcessing]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!eyesRef.current) return;
      // Get bounding rect of the eyes container
      const rect = eyesRef.current.getBoundingClientRect();
      // Calculate the center of the eyes container
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      // Calculate the relative mouse position from the center (range -1 to 1)
      let deltaX = (event.clientX - centerX) / (rect.width / 2);
      let deltaY = (event.clientY - centerY) / (rect.height / 2);
      // Clamp the delta between -1 and 1 for smooth max movement
      deltaX = Math.max(-1, Math.min(1, deltaX));
      deltaY = Math.max(-1, Math.min(1, deltaY));
      // Max translation in pixels for the eyes movement
      const maxTranslate = 16;
      // Calculate final translation
      const translateX = deltaX * maxTranslate;
      const translateY = deltaY * maxTranslate;
      // Apply transform to each eye div
      const eyes = eyesRef.current.querySelectorAll('div');
      eyes.forEach((eye) => {
        eye.style.transform = `translate(${translateX}px, ${translateY}px)`;
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setSettingsFlag(false);
    }
  };

  const signOut = async () => {
    setSignOutFlag(true);
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign-out error:', error.message);
    } else {
      setSession(null);
      router.push('/');
    }
  };

  function handleSubmit(e) {
    e.preventDefault();
    setQuery(e.target.query.value);
    setValue('');
  }

  useEffect(() => {
    messages.length !== 0 &&
      sessionStorage.setItem('messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (settingsFlag) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [settingsFlag]);

  useEffect(() => {
    const time = new Date();
    if (time.getHours() < 12) {
      setGreeting(() => 'Good Morning');
    } else if (time.getHours() > 12) {
      setGreeting(() => 'Good Evening');
    }
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
      setLoading(false);
      if (error) {
        console.error('Session fetch error:', error.message);
      }
    };
    getSession();
    setSessionQuery(sessionStorage.getItem('query') || '');
    setMessages(JSON.parse(sessionStorage.getItem('messages')) || []);
  }, []);

  useEffect(() => {
    if (query.length === 0) return;
    setIsProcessing(true);
    setReply('');
    if (!sessionStorage.getItem('query')) {
      sessionStorage.setItem('query', query);
    } else {
      setSessionQuery(sessionStorage.getItem('query'));
    }
    const processQuery = async () => {
      const convo = messages;
      // console.log(convo);
      setMessages((prev) => [...prev, { role: 'user', content: query }]);
      const chatRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ask`, {
        method: 'POST',
        body: JSON.stringify({
          question: query,
          // messages: [...convo, { role: 'user', content: query }],
          conversation: convo,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const { answer, pages } = await chatRes.json();
      setPages(pages);
      // console.log(answer,pages);
      setMessages((prev) => [...prev, { role: 'system', content: answer }]);
      setReply(answer);
      // playElevenLabsAudio(answer);
      setIsProcessing(false);
    };
    processQuery();
  }, [query, session]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('code')) {
      router.replace('/home');
    }
  }, []);

  // if (true) {
  //   return <MaintenancePage />;
  // }
  if (!loading && !session) return 'Unauthenticated';

  return (
    <div className={`${'wrapper'} ${'container'}`}>
      {showPages && <PagesComponent pages={pages} func={setShowPages} />}
      <div className={styles.logoSection}>
        <img
          src="/images/curvedText.png"
          alt="ICED"
          className={styles.curved}
        />
        <img src="/images/logo.gif" alt="IITR logo" className={styles.logo} />
      </div>
      <ul className={styles.header}>
        <li className={styles.headerElement}>
          <h1>Varuna</h1>
        </li>
        <li className={styles.headerElement} ref={menuRef}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="1.8rem"
            height="1.8rem"
            onClick={() => {
              setSettingsFlag(!settingsFlag);
            }}
          >
            <g fill="none">
              <path
                fill="currentColor"
                d="M4 18a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2"
                opacity=".16"
              ></path>
              <path
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 18a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"
              ></path>
              <circle
                cx="12"
                cy="7"
                r="3"
                stroke="currentColor"
                strokeWidth="2"
              ></circle>
            </g>
          </svg>
          {settingsFlag && (
            <ul className={styles.options}>
              <li onClick={() => signOut()} className={styles.lastChild}>
                {signOutFlag ? 'Signing out...' : 'Sign out'}
              </li>
            </ul>
          )}
        </li>
      </ul>
      <div
        className={styles.whiteSection}
        style={!reply ? { overflow: 'hidden' } : null}
      >
        <section className={styles.chatScreen}>
          {session &&
            query.length === 0 &&
            sessionQuery.length === 0 &&
            !isProcessing &&
            reply.length === 0 && (
              <div className={styles.greetingsModal}>
                <div className={styles.holder}>
                  <h1>
                    {greeting},{' '}
                    {session?.user?.user_metadata?.name.split(' ')[0]}
                  </h1>
                </div>
                <div className={styles.holder}>
                  <h1>How can I assist you today?</h1>
                </div>
              </div>
            )}
          {(sessionQuery.length !== 0 || messages.length !== 0) && (
            <ChatResponse
              conversation={messages}
              pages={pages}
              func={setShowPages}
              isProcessing={isProcessing}
            />
          )}
        </section>
        <section>
          {voiceModeToggle ? (
            <section
              className={styles.aiListener}
              style={!reply ? { position: 'absolute' } : null}
            >
              {voiceInputFlag ? (
                <div
                  className={styles.voiceBeats}
                  onDoubleClick={() => {
                    !voiceInputFlag && setVoiceModeToggle(false);
                    // playSound();
                  }}
                  onClick={onClick}
                  key={voiceInputFlag}
                >
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              ) : (
                <div
                  className={styles.eyes}
                  ref={eyesRef}
                  onDoubleClick={onDoubleClick}
                  onClick={onClick}
                >
                  <div></div>
                  <div></div>
                </div>
              )}
              <img
                src="/images/aiBackground7.gif"
                alt="AI"
                onDoubleClick={onDoubleClick}
                onClick={onClick}
                style={isRecording ? { transform: 'scale(1.3)' } : null}
              />
            </section>
          ) : (
            <section
              className={styles.textInput}
              key={voiceModeToggle}
              style={!reply ? { position: 'absolute' } : null}
            >
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder={'Enter your query...'}
                  name="query"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
                <div className={styles.buttonContainer}>
                  <button type="submit">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="2.5rem"
                      height="2.5rem"
                    >
                      <path
                        fill="black"
                        fillRule="evenodd"
                        d="M12 1.25C6.063 1.25 1.25 6.063 1.25 12S6.063 22.75 12 22.75S22.75 17.937 22.75 12S17.937 1.25 12 1.25m1.03 6.72l3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 1 1-1.06-1.06l2.22-2.22H8a.75.75 0 0 1 0-1.5h6.19l-2.22-2.22a.75.75 0 0 1 1.06-1.06"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceModeToggle(true);
                      setVoiceInputFlag(false);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 26 26"
                      width="2.5rem"
                      height="2.5rem"
                    >
                      <g fill="black">
                        <path
                          d="M26 14c0 6.627-5.373 12-12 12S2 20.627 2 14S7.373 2 14 2s12 5.373 12 12"
                          opacity=".2"
                        ></path>
                        <path
                          fillRule="evenodd"
                          d="M10.75 7.25a2.25 2.25 0 0 1 4.5 0v3.5a2.25 2.25 0 0 1-4.5 0z"
                          clipRule="evenodd"
                        ></path>
                        <path d="M13 20c-2.48 0-4-.217-4-1s1.52-1 4-1s4 .217 4 1s-1.52 1-4 1"></path>
                        <path d="M12.5 15.5h1V19h-1z"></path>
                        <path d="M17 10.5a.5.5 0 0 1 1 0v1.65c0 2.421-2.254 4.35-5 4.35s-5-1.929-5-4.35V10.5a.5.5 0 0 1 1 0v1.65c0 1.831 1.775 3.35 4 3.35s4-1.519 4-3.35z"></path>
                        <path
                          fillRule="evenodd"
                          d="M13 24.5c6.351 0 11.5-5.149 11.5-11.5S19.351 1.5 13 1.5S1.5 6.649 1.5 13S6.649 24.5 13 24.5m0 1c6.904 0 12.5-5.596 12.5-12.5S19.904.5 13 .5S.5 6.096.5 13S6.096 25.5 13 25.5"
                          clipRule="evenodd"
                        ></path>
                      </g>
                    </svg>
                  </button>
                </div>
              </form>
            </section>
          )}
        </section>
      </div>
    </div>
  );
}
