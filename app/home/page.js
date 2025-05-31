'use client';

import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import styles from './page.module.css';
import UpcomingEvents from '@/components/UpcomingEvents';
import WeatherCard from '@/components/WeatherCard';
import ChatResponse from '@/components/ChatResponse';
import ChatPlaceholder from '@/components/ChatPlaceholder';
import ZenaLoading from '@/components/ZenaLoading';
import { Howl } from 'howler';
import { Base64 } from 'js-base64';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
// import RecordingPlayer from '@/components/RecordingPlayer';
import { checkCallStatus } from '@/lib/checkCallStatus';
import CallConversation from '@/components/CallConversation';
import MailViewer from '@/components/MailsViewer';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const router = useRouter();
  const [settingsFlag, setSettingsFlag] = useState(false);
  const [signOutFlag, setSignOutFlag] = useState(false);
  const eyesRef = useRef(null);
  const [upcomingEventsData, setUpcomingEventsData] = useState();
  const [weather, setWeather] = useState({});
  const [voiceModeToggle, setVoiceModeToggle] = useState(false);
  const [query, setQuery] = useState('');
  const menuRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceInputFlag, setVoiceInputFlag] = useState(false);
  const [greeting, setGreeting] = useState('Good Morning');
  const [value, setValue] = useState('');
  const [reply, setReply] = useState('');
  const [sessionQuery, setSessionQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const sound = new Howl({ src: ['/sounds/tapSound.mp3'] });
  const [messages, setMessages] = useState([]);
  const [audioIsReady, setAudioIsReady] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [emailData, setEmailData] = useState({});
  const [emailProcess, setEmailProcess] = useState(false);
  const [emailIsConfirm, setEmailIsConfirm] = useState(false);
  const [callSid, setCallSid] = useState('');
  const [recordingUrls, setRecordingUrls] = useState([]);
  const [callConvo, setCallConvo] = useState([]);
  const [mails, setMails] = useState([]);
  const [mailQuery, setMailQuery] = useState({});
  const [contacts, setContacts] = useState([]);
  const [mailContacts, setMailContacts] = useState([]);
  const [callData, setCallData] = useState({});
  const [callProcess, setCallProcess] = useState(false);
  const [mailContactsProcessing, setMailContactsProcessing] = useState(true);
  const [whatsappData, setWhatsappData] = useState({});
  const [whatsappProcess, setWhatsappProcess] = useState(false);

  const playElevenLabsAudio = async (text, intent, cabUrl) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
      const voiceId = 'KoVIHoyLDrQyd4pGalbs';
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        },
      );
      // If response is not successful, silently return
      if (!response.ok) {
        console.warn('Audio API error:', response.status, response.statusText);
        return;
      }
      const audioBlob = await response.blob();
      // Ensure the blob is valid (audio/mpeg or audio/mp3)
      if (
        !audioBlob ||
        !audioBlob.size ||
        !audioBlob.type.startsWith('audio')
      ) {
        console.warn('No audio returned or invalid blob type.');
        return;
      }
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      setAudioIsReady(true);
      audio.play().catch((err) => {
        console.warn('Audio playback failed:', err);
        setCurrentAudio(null);
      });
      audio.onended = () => {
        setCurrentAudio(null);
      };
      // If it's a cab intent, open the URL after a short delay
      if (intent === 'book_cab') {
        setTimeout(() => {
          window.open(cabUrl, '_blank');
        }, 1000);
      }
    } catch (error) {
      // Silent catch - e.g., network error, API limit hit, etc.
      console.warn('Text-to-speech failed silently:', error);
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      // console.log('paused');
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
  };

  // const speakText = (text) => {
  //   if ("speechSynthesis" in window) {
  //     const utterance = new SpeechSynthesisUtterance(text);
  //     utterance.lang = "en-US"; // Change to desired language
  //     utterance.rate = 1; // Speaking speed
  //     utterance.pitch = 1; // Voice pitch
  //     window.speechSynthesis.speak(utterance);
  //     setAudioIsReady(true);
  //   } else {
  //     console.warn("Speech Synthesis not supported in this browser.");
  //   }
  // };

  const playSound = () => {
    sound.play();
  };

  const handleVoiceInput = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => {
      setIsRecording(false);
      setVoiceInputFlag(false);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      // console.log(transcript);
      setQuery(transcript);
    };
    recognition.start();
  };

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

  function validatePhoneNumber(number) {
    try {
      const parsed = parsePhoneNumberFromString(number);
      return parsed.isValid() && parsed.number;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    // console.log(messages);
    messages.length !== 0 &&
      sessionStorage.setItem('messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (voiceInputFlag && voiceModeToggle) {
      handleVoiceInput();
    }
  }, [voiceInputFlag]);

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
    const getWeather = async () => {
      // console.log("weather");
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        const { latitude, longitude } = position.coords;
        const apiKey = process.env.NEXT_PUBLIC_WEATHER_API; // Make sure it's public
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`,
        );
        const data = await response.json();
        setWeather(data);
        // console.log("Current Weather:", data);
      } catch (error) {
        console.error('Failed to get location or weather data:', error);
      }
    };
    !voiceInputFlag &&
      !sessionStorage.getItem('query') &&
      !query &&
      getWeather();
    const time = new Date();
    if (time.getHours() < 12) {
      setGreeting('Good Morning');
    } else if (time.getHours() > 12) {
      setGreeting('Good Evening');
    }
  }, [voiceInputFlag, query]);

  useEffect(() => {
    const fetchEvents = async () => {
      // console.log("events");
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          headers: {
            Authorization: `Bearer ${session.provider_token}`,
          },
        },
      );
      const calendarData = await response.json();
      if (calendarData?.items?.length) {
        const now = new Date();
        const upcomingEvents = calendarData.items
          .filter((event) => {
            const start = new Date(event.start?.dateTime || event.start?.date);
            return start >= now;
          })
          .sort((a, b) => {
            const dateA = new Date(a.start?.dateTime || a.start?.date);
            const dateB = new Date(b.start?.dateTime || b.start?.date);
            return dateA - dateB;
          })
          .slice(0, 3); // Keep only the next 3 upcoming events
        setUpcomingEventsData(upcomingEvents);
        // console.log("Next 3 upcoming events:", upcomingEvents);
      } else {
        console.log('No upcoming events found.');
      }
    };
    session?.provider_token &&
      !voiceInputFlag &&
      !sessionStorage.getItem('query') &&
      !query &&
      fetchEvents();
  }, [session, voiceInputFlag, query]);

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
    if (session) {
      setAccessToken(session?.provider_token);
    }
  }, [session]);

  useEffect(() => {
    if (
      accessToken?.length !== 0 &&
      Object.values(emailData).length !== 0 &&
      emailData.missing.length === 0 &&
      emailIsConfirm
    ) {
      const createRawEmail = (to, subject, body) => {
        const email = [
          `To: ${to}`,
          `Subject: ${subject}`,
          'Content-Type: text/plain; charset="UTF-8"',
          '',
          body,
        ].join('\n');
        return Base64.encode(email)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, ''); // Gmail prefers base64url format
      };
      const sendEmail = async (accessToken, to, subject, body) => {
        const rawEmail = createRawEmail(to, subject, body);
        const res = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw: rawEmail }),
          },
        );
        const data = await res.json();
        return data;
      };
      const executeSendEmail = async () => {
        const data = await sendEmail(
          accessToken,
          emailData.to,
          emailData.subject,
          emailData.body,
        );
        // console.log(data);
        if (data.id) {
          const reply =
            "Your email has been sent successfully! Let me know if there's anything else I can help you with.";
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          playElevenLabsAudio(reply);
          setEmailData({});
          setEmailIsConfirm(false);
        } else {
          const reply =
            'Unfortunately, the email could not be sent due to an error. Please verify the information and try again.';
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          playElevenLabsAudio(reply);
          setEmailData({});
          setEmailIsConfirm(false);
        }
      };
      executeSendEmail();
    }
  }, [accessToken, emailData, emailIsConfirm]);

  function buildGmailQueryURL({ time, subject, from, to, before, after }) {
    const baseUrl =
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=';
    const queryParts = [];
    // Handle time
    if (time === 'latest') {
      const oneDayAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
      queryParts.push(`after:${oneDayAgo}`);
    } else if (typeof time === 'number') {
      const since = Math.floor(Date.now() / 1000) - time * 24 * 60 * 60;
      queryParts.push(`after:${since}`);
    }
    if (subject) queryParts.push(`subject:(${subject})`);
    if (from) queryParts.push(`from:(${from})`);
    if (to) queryParts.push(`to:(${to})`);
    if (before) {
      const beforeUnix = Math.floor(new Date(before).getTime() / 1000);
      queryParts.push(`before:${beforeUnix}`);
    }
    if (after) {
      const afterUnix = Math.floor(new Date(after).getTime() / 1000);
      queryParts.push(`after:${afterUnix}`);
    }
    const finalQuery = encodeURIComponent(queryParts.join(' '));
    return `${baseUrl}${finalQuery}`;
  }

  useEffect(() => {
    if (query.length === 0) return;
    setMailQuery({});
    setMails([]);
    setRecordingUrls([]);
    setCallConvo([]);
    setCallSid('');
    setIsProcessing(true);
    setReply('');
    setAudioIsReady(false);
    stopAudio();
    if (!sessionStorage.getItem('query')) {
      sessionStorage.setItem('query', query);
    } else {
      setSessionQuery(sessionStorage.getItem('query'));
    }
    const processQuery = async () => {
      const convo = messages;
      setMessages((prev) => [...prev, { role: 'user', content: query }]);
      if (emailProcess) {
        const res = await fetch('/api/getEmailIntent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userInput: query }),
        });
        const data = await res.json();
        // console.log('Email confirmation intent:', data.intent);
        if (data.error) {
          const reply = `Looks like there is an issue in interpreting your request, please try again later!`;
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          setEmailProcess(false);
          playElevenLabsAudio(reply);
          return;
        }
        if (data.intent === 'decline' || data.intent === 'unknown') {
          const reply = 'Alright, I won’t send the email.';
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          setEmailProcess(false); // exit email flow
          playElevenLabsAudio(reply);
        } else if (data.intent === 'confirm') {
          setEmailData((prev) => prev); // keeps the data, or send directly if you prefer
          setEmailProcess(false);
          setEmailIsConfirm(true);
        }
        setQuery('');
        return;
      } else if (callProcess) {
        const res = await fetch('/api/getCallIntent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput: query }),
        });
        const data = await res.json();
        // console.log(data);
        if (data.error) {
          const reply = `Looks like there is an issue in interpreting your request, please try again later!`;
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          playElevenLabsAudio(reply);
          setCallProcess(false);
          setCallData({});
          return;
        }
        if (data.result) {
          // console.log(callData);
          const reply = `Calling ${callData.name}...`;
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          playElevenLabsAudio(reply);
          const res1 = await fetch('/api/makeCall', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: callData.to,
              message: callData.message,
            }),
          });
          const data1 = await res1.json();
          if (data1.error) {
            const reply = `Looks like there is an issue in interpreting your request, please try again later!`;
            setMessages((prev) => [
              ...prev,
              { role: 'system', content: reply },
            ]);
            setReply(reply);
            setIsProcessing(false);
            playElevenLabsAudio(reply);
            setCallProcess(false);
            setCallData({});
            return;
          }
          setCallSid(data1.callSid);
          setCallProcess(false);
          setCallData({});
          return;
        } else {
          const reply = `Okay i won't make the call`;
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          playElevenLabsAudio(reply);
          setCallProcess(false);
          setCallData({});
          return;
        }
      } else if (whatsappProcess) {
        const res = await fetch('/api/getWhatsappIntent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput: query }),
        });
        const data = await res.json();
        // console.log(data);
        if (data.error) {
          const reply = `Looks like there is an issue in interpreting your request, please try again later!`;
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          playElevenLabsAudio(reply);
          setWhatsappData({});
          setWhatsappProcess(false);
          return;
        }
        if (data.result) {
          // console.log(whatsappData);
          const reply = `Sending message to ${whatsappData.name}...`;
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          playElevenLabsAudio(reply);
          const url = `https://wa.me/${whatsappData.to}?text=${whatsappData.message}`;
          window.open(url, '_blank');
          setWhatsappData({});
          setWhatsappProcess(false);
          return;
        }
      }
      const res = await fetch('/api/getIntent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          convo: [...convo, { role: 'user', content: query }],
        }),
      });
      const data = await res.json();
      if (data.error) {
        const reply = `Looks like there is an issue in interpreting your request, please try again later!`;
        setMessages((prev) => [...prev, { role: 'system', content: reply }]);
        setReply(reply);
        setIsProcessing(false);
        setEmailProcess(false);
        playElevenLabsAudio(reply);
        return;
      }
      setQuery('');
      console.log(data.intent);
      if (data.intent === 'chat') {
        const date = new Date();
        const chatRes = await fetch('/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            query,
            messages,
            currentDate: date.toLocaleDateString(),
          }),
        });
        const { reply } = await chatRes.json();
        setMessages((prev) => [...prev, { role: 'system', content: reply }]);
        setReply(reply);
        setIsProcessing(false);
        playElevenLabsAudio(reply);
      } else if (data.intent === 'send_email') {
        const res = await fetch('/api/extractEmailFields', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userInput: query,
            convo: [...convo, { role: 'user', content: query }],
          }),
        });
        const data = await res.json();
        // console.log(data);
        if (!data.success) {
          const reply = `Looks like there is an issue in interpreting your request, please try again later!`;
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          setEmailProcess(false);
          playElevenLabsAudio(reply);
          return;
        }
        // console.log(data.data);
        if (data.data.missing && data.data.missing?.length !== 0) {
          const reply = `It looks like your email request is missing the following required field${
            data.data.missing.length > 1 ? 's' : ''
          }: ${data.data.missing.join(', ')}.\nPlease try again!`;
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          playElevenLabsAudio(reply);
        } else {
          let email = data.data.to;
          // console.log(email);
          const isValidEmail = (email) =>
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
          // console.log(contacts[291]);
          let match =
            contacts.find((contact) =>
              contact.name?.toLowerCase().includes(email.toLowerCase()),
            ) || null;
          // console.log(match);
          if (!match || !match?.email) {
            if (!mailContactsProcessing) {
              match = mailContacts
                ? mailContacts.find((contact) =>
                    contact.name?.toLowerCase().includes(email.toLowerCase()),
                  )
                : null;
            } else {
              const reply = `Your email contacts sync is still in process, please try again later`;
              setMessages((prev) => [
                ...prev,
                { role: 'system', content: reply },
              ]);
              setReply(reply);
              setIsProcessing(false);
              setEmailProcess(false);
              playElevenLabsAudio(reply);
              return;
            }
          }
          if (
            !data.data.to ||
            (data.data.to && !isValidEmail(data.data.to) && !match?.email)
          ) {
            const reply = `Please provide a valid email address and try again!`;
            setMessages((prev) => [
              ...prev,
              { role: 'system', content: reply },
            ]);
            setReply(reply);
            setIsProcessing(false);
            setEmailProcess(false);
            playElevenLabsAudio(reply);
            return;
          } else if (match?.email) {
            email = match?.email;
          }
          setEmailProcess(true);
          let reply = `📨 Here's the email you've asked me to draft:

            To: ${email}
            Subject: ${data.data.subject}

            ${data.data.body}
          `.trim();
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          playElevenLabsAudio(
            "Here's the email you've asked me to draft. Would you like me to go ahead and send this email?",
          );
          setEmailData({
            to: email,
            subject: data.data.subject,
            body: data.data.body,
            missing: data.data.missing,
          });
        }
      } else if (data.intent === 'book_cab') {
        const res = await fetch('/api/extractCabFields', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: query }),
        });
        const data = await res.json();
        // console.log(data);
        if (data.error) {
          const reply = `Looks like there is an issue in interpreting your request, please try again later!`;
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          playElevenLabsAudio(reply);
          return;
        } else if (data.success) {
          if (data.data.missing.length !== 0) {
            const reply = `It looks like your cab booking request is missing the following required field${
              data.data.missing.length > 1 ? 's' : ''
            }: ${data.data.missing.join(
              ', ',
            )}.\nPlease try again with specific locations!`;
            setMessages((prev) => [
              ...prev,
              { role: 'system', content: reply },
            ]);
            setReply(reply);
            setIsProcessing(false);
            playElevenLabsAudio(reply);
            return;
          }
          const response = await fetch('/api/cabDeepLink', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              origin: data.data.origin,
              destination: data.data.destination,
            }),
          });
          const data1 = await response.json();
          if (!data1.success) {
            const reply =
              data1.message === 'Something went wrong'
                ? `Looks like there is an issue in interpreting your request, please try again later!`
                : 'Your specified location is invalid, please try again with correct location!';
            setMessages((prev) => [
              ...prev,
              { role: 'system', content: reply },
            ]);
            setReply(reply);
            setIsProcessing(false);
            playElevenLabsAudio(reply);
            return;
          } else {
            const reply = `🚗 Redirecting you to the cab booking page with your selected pickup and destination.`;
            setMessages((prev) => [
              ...prev,
              { role: 'system', content: reply },
            ]);
            setReply(reply);
            setIsProcessing(false);
            playElevenLabsAudio(reply, 'book_cab', data1.url);
          }
        }
      } else if (data.intent === 'make_call') {
        const res = await fetch('/api/extractCallFields', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userInput: query,
            name:
              session?.user?.user_metadata?.name.split(' ')[0] || 'My Master',
            convo: [...convo, { role: 'user', content: query }],
          }),
        });
        const data = await res.json();
        // console.log(parseInt(data.to));
        if (data.error) {
          const reply = `Looks like there is an issue in interpreting your request, please try again later!`;
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          playElevenLabsAudio(reply);
          return;
        }
        if (!data.to) {
          const reply = `Please specify the number or the person's name you want to call and try again!`;
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          playElevenLabsAudio(reply);
          return;
        }
        let name = '';
        let phoneNumber = '';
        if (parseInt(data.to)) {
          if (!validatePhoneNumber(data.to)) {
            const reply = `Please provide a valid phone number and try again!`;
            setMessages((prev) => [
              ...prev,
              { role: 'system', content: reply },
            ]);
            setReply(reply);
            setIsProcessing(false);
            playElevenLabsAudio(reply);
            return;
          } else {
            phoneNumber = data.to;
            name = data.to;
          }
        } else {
          if (contacts?.length === 0) {
            const reply = `Your contacts are'nt synced yet, please try again later!`;
            setMessages((prev) => [
              ...prev,
              { role: 'system', content: reply },
            ]);
            setReply(reply);
            setIsProcessing(false);
            playElevenLabsAudio(reply);
            return;
          } else {
            const results = contacts.filter((contact) =>
              contact.name?.toLowerCase().includes(data.to.toLowerCase()),
            );
            // console.log(results);
            if (results.length > 0) {
              phoneNumber = results[0].phone;
              name = results[0].name;
            } else {
              const reply = `No contact found named ${data.to}`;
              setMessages((prev) => [
                ...prev,
                { role: 'system', content: reply },
              ]);
              setReply(reply);
              setIsProcessing(false);
              playElevenLabsAudio(reply);
              return;
            }
          }
        }
        setCallData({
          to: phoneNumber,
          message: data.message,
          name: name,
        });
        setCallProcess(true);
        const reply = `Are you sure you want to call ${name}`;
        setMessages((prev) => [...prev, { role: 'system', content: reply }]);
        setReply(reply);
        setIsProcessing(false);
        playElevenLabsAudio(reply);
        return;
      } else if (data.intent === 'check_mail') {
        const date = new Date();
        const res = await fetch('/api/extractEmailFetchingFields', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userInput: query,
            currentDate: date.toLocaleDateString(),
          }),
        });
        const { fields } = await res.json();
        // console.log(fields);
        setMailQuery({
          time: fields.time || null,
          subject: fields.subject || null,
          from: fields.from || null,
          to: fields.to || null,
          before: fields.before || null,
          after: fields.after || null,
        });
        const url = buildGmailQueryURL({
          time: fields.time || null,
          subject: fields.subject || null,
          from: fields.from || null,
          to: fields.to || null,
          before: fields.before || null,
          after: fields.after || null,
        });
        // console.log(url);
        const res1 = await fetch(url, {
          headers: {
            Authorization: `Bearer ${session?.provider_token}`,
          },
        });
        const { messages } = await res1.json();
        // console.log(messages);
        const mailIds = messages?.map((message) => message.id);
        // console.log(mailIds);
        if (!mailIds) {
          const reply = `No Emails found with your particular query!`;
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          playElevenLabsAudio(reply);
          return;
        }
        const response = await fetch('/api/getMails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.provider_token}`,
          },
          body: JSON.stringify({
            messageIds: mailIds,
          }),
        });
        const result = await response.json();
        // console.log(result.messages);
        if (result.error) {
          const reply = `Looks like there is an issue in interpreting your request, please try again later!`;
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          playElevenLabsAudio(reply);
          return;
        }
        const mailsData = result.messages.map((mail) => mail.data);
        // console.log(mailsData);
        setMails(mailsData);
        const reply = `Here's the list of mails just like you asked`;
        setMessages((prev) => [...prev, { role: 'system', content: reply }]);
        setReply(reply);
        setIsProcessing(false);
        playElevenLabsAudio(reply);
      } else if (data.intent === 'send_whatsapp_message') {
        const res = await fetch('/api/extractWhatsappDetails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userInput: query }),
        });
        const data = await res.json();
        // console.log(data);
        if (!data.success) {
          const reply = `Looks like there is an issue in interpreting your request, please try again later!`;
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          setEmailProcess(false);
          playElevenLabsAudio(reply);
          return;
        }
        if (data.data.to && data.data.message) {
          let number = '';
          let name = '';
          if (parseInt(data.data.to)) {
            if (!validatePhoneNumber(data.to)) {
              const reply = `Please provide a valid phone number and try again!`;
              setMessages((prev) => [
                ...prev,
                { role: 'system', content: reply },
              ]);
              setReply(reply);
              setIsProcessing(false);
              playElevenLabsAudio(reply);
              return;
            } else {
              number = data.data.to;
              name = data.data.to;
            }
          } else {
            if (contacts?.length === 0) {
              const reply = `Your contacts are'nt synced yet, please try again later!`;
              setMessages((prev) => [
                ...prev,
                { role: 'system', content: reply },
              ]);
              setReply(reply);
              setIsProcessing(false);
              playElevenLabsAudio(reply);
              return;
            } else {
              const results = contacts.filter((contact) =>
                contact.name
                  ?.toLowerCase()
                  .includes(data.data.to.toLowerCase()),
              );
              // console.log(results);
              if (results.length > 0) {
                number = results[0].phone;
                name = results[0].name;
              } else {
                const reply = `No contact found named ${data.to}`;
                setMessages((prev) => [
                  ...prev,
                  { role: 'system', content: reply },
                ]);
                setReply(reply);
                setIsProcessing(false);
                playElevenLabsAudio(reply);
                return;
              }
            }
            setWhatsappData({
              to: number,
              message: data.data.message,
              name: name,
            });
            setWhatsappProcess(true);
            const reply = `Are you sure you want to send message "${data.data.message}" to ${name}`;
            setMessages((prev) => [
              ...prev,
              { role: 'system', content: reply },
            ]);
            setReply(reply);
            setIsProcessing(false);
            playElevenLabsAudio(reply);
            return;
          }
        } else {
          const reply = `Your query is missing required field: ${
            !data.data.to ? 'to' : 'message'
          }`;
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          setIsProcessing(false);
          setEmailProcess(false);
          playElevenLabsAudio(reply);
          return;
        }
        setReply('');
        setIsProcessing(false);
      } else {
        setReply('');
        setIsProcessing(false);
      }
    };
    processQuery();
  }, [query, session, contacts, mailContacts]);
  // console.log(session);

  useEffect(() => {
    if (!callSid) return;
    const interval = setInterval(async () => {
      try {
        const result = await checkCallStatus(callSid);
        // console.log(result);
        if (
          result.callStatus === 'not-ready' ||
          result.callStatus === 'unknown'
        ) {
          return; // keep polling
        }
        if (result.callStatus === 'no-answer' || result.callStatus === 'busy') {
          setRecordingUrls([]);
          setIsProcessing(false);
          const reply = `The call was not answered or was busy. Please try again later.`;
          setMessages((prev) => [...prev, { role: 'system', content: reply }]);
          setReply(reply);
          playElevenLabsAudio(reply);
          clearInterval(interval);
        }
        if (result.callStatus === 'completed') {
          const res2 = await fetch('/api/get-recording', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ callSid }),
          });
          const data2 = await res2.json();
          if (data2.recordingUrls && data2.recordingUrls.length > 0) {
            setRecordingUrls(data2.recordingUrls);
            clearInterval(interval);
            return;
          }
        }
      } catch (error) {
        // console.warn('Polling error:', error);
        return;
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [callSid]);

  useEffect(() => {
    if (recordingUrls.length === 0) return;
    const getCallConvo = async () => {
      const res = await fetch(`/api/getCallConversation?sid=${callSid}`);
      const convo = await res.json();
      //console.log(convo);
      setCallConvo(convo);
      await fetch(`/api/clearCallConversation?sid=${callSid}`);
      setMessages((prev) => [...prev, ...convo]);
    };
    getCallConvo();
  }, [recordingUrls]);

  useEffect(() => {
    if (!session) return;
    const saveContacts = async (contacts) => {
      const contactsWithUser = contacts.map((c) => ({
        ...c,
        user_id: session?.user.id,
      }));
      const { data, error } = await supabase
        .from('contacts')
        .insert(contactsWithUser);
      if (error) {
        console.log(`Error saving contacts ${error.message}`);
      }
    };
    const saveEmailContacts = async (emailContacts) => {
      const emailsWithUser = emailContacts.map((e) => ({
        ...e,
        user_id: session?.user.id,
      }));
      // console.log(emailsWithUser);
      const { data, error } = await supabase
        .from('email_contacts')
        .insert(emailsWithUser);
      if (error) {
        console.log(`Error saving email contacts ${error.message}`);
      }
    };
    const fetchContactsFromPeopleAPI = async () => {
      let nextPageToken = null;
      let allContacts = [];
      do {
        const res = await fetch(
          `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=1000${
            nextPageToken ? `&pageToken=${nextPageToken}` : ''
          }`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.provider_token}`,
            },
          },
        );
        const data = await res.json();
        // console.log(data.connections);
        const connections = (data.connections || []).map((connection) => ({
          name: connection.names?.[0]?.displayName || null,
          phone:
            connection.phoneNumbers?.[0]?.canonicalForm ||
            connection.phoneNumbers?.[0]?.value ||
            null,
          email: connection.emailAddresses?.[0]?.value || null,
        }));
        allContacts = [...allContacts, ...connections];
        nextPageToken = data.nextPageToken;
      } while (nextPageToken);
      // console.log(allContacts);
      setContacts(allContacts);
      saveContacts(allContacts);
    };
    const fetchEmailContactsFromGmailAPI = async () => {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=200&q=is:inbox`,
        {
          headers: {
            Authorization: `Bearer ${session?.provider_token}`,
          },
        },
      );
      const messageList = await res.json();
      const messages = messageList.messages || [];
      const uniqueEmails = new Map();
      for (let i = 0; i < messages.length; i++) {
        console.log(Math.floor((i / messages.length) * 100) + '%');
        const msgId = messages[i].id;
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=metadata&metadataHeaders=From`,
          {
            headers: {
              Authorization: `Bearer ${session?.provider_token}`,
            },
          },
        );
        const msgData = await msgRes.json();
        const headers = msgData.payload?.headers || [];
        const fromHeader = headers.find((h) => h.name === 'From');
        if (fromHeader) {
          const raw = fromHeader.value;
          const match = raw.match(/(.*)<(.*)>/);
          const name = match?.[1]?.trim().replace(/"/g, '') || null;
          const email = match?.[2]?.trim() || null;
          if (email && !uniqueEmails.has(email)) {
            uniqueEmails.set(email, { name, email });
          }
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      setMailContacts(Array.from(uniqueEmails.values()));
      saveEmailContacts(Array.from(uniqueEmails.values()));
      setMailContactsProcessing(false);
    };
    const getContacts = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', session?.user.id);
      // console.log(data);
      if (data?.length > 0) {
        setContacts(data);
      } else {
        fetchContactsFromPeopleAPI();
      }
      if (error) {
        console.log(`Error fetching contacts ${error.message}`);
        fetchContactsFromPeopleAPI();
      }
    };
    getContacts();
    const getEmailContacts = async () => {
      const { data, error } = await supabase
        .from('email_contacts')
        .select('*')
        .eq('user_id', session?.user.id);
      // console.log(data);
      if (data?.length > 0) {
        setMailContacts(data);
        setMailContactsProcessing(false);
      } else {
        fetchEmailContactsFromGmailAPI();
      }
      if (error) {
        console.log(`Error fetching email contacts ${error.message}`);
        fetchEmailContactsFromGmailAPI();
      }
    };
    getEmailContacts();
  }, [session]);

  // useEffect(() => {
  //   if (contacts.length === 0 || mailContacts.length === 0) return;
  //   console.log(contacts[0]);
  //   console.log(mailContacts);
  // }, [contacts, mailContacts]);

  if (!loading && !session) return 'Unauthenticated';

  return (
    <div className={`${'wrapper'} ${'container'}`}>
      <ul className={styles.header}>
        <li className={styles.headerElement}>
          <h1>Eva</h1>
        </li>
        <li className={styles.headerElement} ref={menuRef}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="1.8rem"
            height="1.8rem"
            onClick={() => setSettingsFlag(!settingsFlag)}
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
              {/* <li>Preferences</li> */}
              {/* <li>Chat History</li> */}
              <li onClick={() => signOut()}>
                {signOutFlag ? 'Signing out...' : 'Sign Out'}
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
          {session && !query && !sessionStorage.getItem('query') && (
            <div className={styles.greetingsModal}>
              <div className={styles.holder}>
                <h1>
                  {greeting}, {session?.user?.user_metadata?.name.split(' ')[0]}
                </h1>
              </div>
              <div className={styles.holder}>
                <h1>How can I assist you today?</h1>
              </div>
            </div>
          )}
          {upcomingEventsData &&
            !sessionStorage.getItem('query') &&
            !query &&
            Object.keys(weather).length !== 0 &&
            !isRecording && (
              <section className={styles.cardsContainer}>
                {upcomingEventsData.length !== 0 && (
                  <UpcomingEvents events={upcomingEventsData} />
                )}
                <WeatherCard weatherData={weather} />
              </section>
            )}
          {reply.length !== 0 &&
          audioIsReady &&
          callConvo.length === 0 &&
          mails.length === 0 ? (
            <ChatResponse content={reply} />
          ) : reply.length === 0 &&
            sessionQuery.length !== 0 &&
            !isProcessing &&
            callConvo.length === 0 &&
            mails.length === 0 ? (
            <ChatPlaceholder />
          ) : isProcessing || (!audioIsReady && reply.length !== 0) ? (
            <ZenaLoading />
          ) : callConvo.length !== 0 && mails.length === 0 ? (
            // <RecordingPlayer
            //   title="Your last call Recording"
            //   recordingUrl={recordingUrl}
            //   callSid={callSid}
            // />
            <CallConversation
              messages={callConvo}
              recordingUrls={recordingUrls}
            />
          ) : mails.length !== 0 ? (
            <MailViewer emails={mails} queryParams={mailQuery} />
          ) : null}
        </section>
        {voiceModeToggle ? (
          <section
            className={styles.aiListener}
            style={!reply ? { position: 'absolute' } : null}
          >
            {voiceInputFlag ? (
              <div
                className={styles.voiceBeats}
                onDoubleClick={() =>
                  !voiceInputFlag && setVoiceModeToggle(false)
                }
                onClick={() => {
                  setTimeout(() => {
                    setVoiceInputFlag(true);
                  }, 500);
                }}
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
                onDoubleClick={() =>
                  !voiceInputFlag && setVoiceModeToggle(false)
                }
                onClick={() => {
                  setTimeout(() => {
                    setVoiceInputFlag(true);
                    playSound();
                    stopAudio();
                  }, 500);
                }}
              >
                <div></div>
                <div></div>
              </div>
            )}
            <img
              src="/images/aiBackground7.gif"
              alt="AI"
              onDoubleClick={() => !voiceInputFlag && setVoiceModeToggle(false)}
              onClick={() => {
                setTimeout(() => {
                  setVoiceInputFlag(true);
                  playSound();
                  stopAudio();
                }, 500);
              }}
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
                placeholder="Enter your query..."
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
      </div>
    </div>
  );
}
