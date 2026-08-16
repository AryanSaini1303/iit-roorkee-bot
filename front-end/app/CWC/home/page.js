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
import ChatListModal from '@/components/ChatListModal';
import OnboardingModal from '@/components/OnboardingModal';
import Link from 'next/link';

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
  const supabase = createClient('CWC');
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
  const [pagesList, setPagesList] = useState([]);
  const [showPages, setShowPages] = useState(false);
  const [voiceModeToggle, setVoiceModeToggle] = useState(false);
  // const [noAudio, SetNoAudio] = useState(true);
  // const [audioIsReady, setAudioIsReady] = useState(false);
  const [audioHasEnded, setAudioHasEnded] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceInputFlag, setVoiceInputFlag] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  // const [voiceId, setVoiceId] = useState('KoVIHoyLDrQyd4pGalbs');
  const [conversationId, setConversationId] = useState(null);
  const [chats, setChats] = useState([]);
  const sound = new Howl({ src: ['/sounds/tapSound.mp3'] });
  const eyesRef = useRef(null);
  const [showChats, setShowChats] = useState(false);
  const [pageData, setPageData] = useState({});
  const [isVerified, setIsVerified] = useState(true);
  const [context, setContext] = useState([]);
  const [contextList, setContextList] = useState([]);
  const [exportingFlag, setExportingFlag] = useState(false);
  const { onClick, onDoubleClick } = useClickHandlers({
    onSingleClick: () => {
      if (!isVerified) return;
      if (isRecording || isProcessing) return;
      setVoiceInputFlag(true);
      playSound();
      stopAudio();
      handleVoiceInput(); // remove this too if you want continuous voice input
    },
    onDoubleClick: () => {
      if (!isVerified) return;
      if (!voiceInputFlag) {
        setVoiceModeToggle(false);
      }
    },
  });

  // const playElevenLabsAudio = async (text, intent, url) => {
  //   SetNoAudio(false);
  //   try {
  //     const res = await fetch('/api/tts', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ text, voiceId }),
  //     });
  //     if (!res.ok) {
  //       console.warn('TTS API Error:', res.statusText);
  //       SetNoAudio(true);
  //       return;
  //     }
  //     const audioBlob = await res.blob();
  //     const audioUrl = URL.createObjectURL(audioBlob);
  //     const audio = new Audio(audioUrl);
  //     setCurrentAudio(audio);
  //     setAudioIsReady(true);
  //     audio.play().catch((err) => {
  //       console.warn('Audio playback failed:', err);
  //       setCurrentAudio(null);
  //       setAudioHasEnded(true);
  //       if (intent === 'book_cab') {
  //         window.open(url, '_blank');
  //       } else if (intent === 'send_message') {
  //         window.open(url, '_blank');
  //         setWhatsappData({});
  //         setWhatsappProcess(false);
  //       }
  //     });
  //     audio.onended = () => {
  //       setCurrentAudio(null);
  //       setAudioHasEnded(true);
  //       if (intent === 'book_cab') {
  //         window.open(url, '_blank');
  //       } else if (intent === 'send_message') {
  //         window.open(url, '_blank');
  //         setWhatsappData({});
  //         setWhatsappProcess(false);
  //       }
  //     };
  //   } catch (err) {
  //     SetNoAudio(true);
  //     console.warn('Text-to-speech failed:', err);
  //   }
  // };

  // Drop this in as the new handleExportChat inside page.js (HomePage).
  // Replaces the html2canvas-based version entirely — no DOM capture at all.
  // You can `npm uninstall html2canvas` once this is in, jsPDF is the only dependency left.

  // Drop this in as the new handleExportChat inside page.js (HomePage).
  // Replaces the html2canvas-based version entirely — no DOM capture at all.
  // You can `npm uninstall html2canvas` once this is in, jsPDF is the only dependency left.

  // Drop this in as the new handleExportChat inside page.js (HomePage).
  // Replaces the html2canvas-based version entirely — no DOM capture at all.
  // You can `npm uninstall html2canvas` once this is in, jsPDF is the only dependency left.

  const handleExportChat = async () => {
    if (messages.length === 0) return;
    setExportingFlag(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      const bottomLimit = pageHeight - margin;

      // ---- Cover page ----
      const centerX = pageWidth / 2;

      // Title, roughly a third of the way down for real cover-page presence
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(28);
      pdf.setTextColor(15, 42, 74);
      pdf.text('DamChat', centerX, 90, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(13);
      pdf.setTextColor(90, 90, 90);
      pdf.text('Conversation Export', centerX, 100, { align: 'center' });

      // Accent rule under the title block
      pdf.setDrawColor(26, 111, 209);
      pdf.setLineWidth(0.8);
      pdf.line(centerX - 25, 108, centerX + 25, 108);

      // Meta block — bold labels, regular values, generous spacing
      let metaY = 130;
      const drawMetaRow = (label, value) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(15, 42, 74);
        pdf.text(label, centerX, metaY, { align: 'center' });
        metaY += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        const wrappedValue = pdf.splitTextToSize(value, pageWidth - 50);
        pdf.text(wrappedValue, centerX, metaY, { align: 'center' });
        metaY += wrappedValue.length * 6 + 10;
      };

      if (sessionQuery) drawMetaRow('Topic', sessionQuery);
      drawMetaRow('Exported On', new Date().toLocaleString());
      drawMetaRow('Messages Exchanged', `${messages.length}`);
      const userMsgCount = messages.filter((m) => m.role === 'user').length;
      drawMetaRow('Questions Asked', `${userMsgCount}`);

      // Footer note anchored near the bottom of the cover page
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        'Generated from your DamChat conversation history.',
        centerX,
        pageHeight - 25,
        { align: 'center' }
      );

      pdf.addPage();

      let y = margin;

      const ensureSpace = (needed) => {
        if (y + needed > bottomLimit) {
          pdf.addPage();
          y = margin;
        }
      };

      // Splits "some **bold** text" into [{text, bold}] segments
      const parseInline = (text) =>
        text
          .split(/(\*\*[^*]+\*\*)/g)
          .filter(Boolean)
          .map((part) =>
            part.startsWith('**') && part.endsWith('**')
              ? { text: part.slice(2, -2), bold: true }
              : { text: part, bold: false }
          );

      // Word-wraps + draws bold-aware text starting at x, advances the shared `y`
      const drawRichLine = (segments, x, maxWidth, fontSize, lineHeight) => {
        pdf.setFontSize(fontSize);
        let cursorX = x;
        segments.forEach((seg) => {
          pdf.setFont('helvetica', seg.bold ? 'bold' : 'normal');
          const words = seg.text.split(/(\s+)/);
          words.forEach((word) => {
            if (word === '') return;
            const w = pdf.getTextWidth(word);
            if (word.trim() !== '' && cursorX + w > x + maxWidth) {
              y += lineHeight;
              cursorX = x;
              ensureSpace(lineHeight);
            }
            if (word.trim() !== '') pdf.text(word, cursorX, y);
            cursorX += w;
          });
        });
        y += lineHeight;
      };

      const renderContent = (content, x, maxWidth) => {
        content.split('\n').forEach((rawLine) => {
          const line = rawLine.trim();
          if (line === '') {
            y += 2;
            return;
          }
          ensureSpace(8);

          const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
          if (headingMatch) {
            const level = headingMatch[1].length; // 1 = #, up to 6 = ######
            const headingText = headingMatch[2];
            pdf.setTextColor(15, 42, 74);
            // Level 1 gets the biggest font; anything level 4+ (e.g. "#### 1. Embankment Dams")
            // shares the smallest heading size rather than shrinking indefinitely
            const sizeByLevel = { 1: 15, 2: 13.5, 3: 12 };
            const lineHeightByLevel = { 1: 8, 2: 7, 3: 6 };
            const fontSize = sizeByLevel[level] || 11;
            const lineHeight = lineHeightByLevel[level] || 5.5;
            drawRichLine(parseInline(headingText), x, maxWidth, fontSize, lineHeight);
          } else if (/^[-*]\s+/.test(line)) {
            pdf.setTextColor(30, 30, 30);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10.5);
            pdf.text('\u2022', x, y);
            drawRichLine(parseInline(line.replace(/^[-*]\s+/, '')), x + 5, maxWidth - 5, 10.5, 5.5);
          } else if (/^\d+\.\s+/.test(line)) {
            const match = line.match(/^(\d+)\.\s+(.*)/);
            pdf.setTextColor(30, 30, 30);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10.5);
            pdf.text(`${match[1]}.`, x, y);
            drawRichLine(parseInline(match[2]), x + 7, maxWidth - 7, 10.5, 5.5);
          } else {
            pdf.setTextColor(30, 30, 30);
            drawRichLine(parseInline(line), x, maxWidth, 10.5, 5.5);
          }
        });
      };

      messages.forEach((message) => {
        ensureSpace(14);
        const isUser = message.role === 'user';

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        if (isUser) pdf.setTextColor(26, 111, 209);
        else pdf.setTextColor(15, 42, 74);
        pdf.text(isUser ? 'You' : 'DamChat', margin, y);
        y += 6;

        renderContent(message.content, margin, contentWidth);
        y += 6;

        ensureSpace(4);
        pdf.setDrawColor(230, 230, 230);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 6;
      });

      pdf.save(`DamChat_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export chat. Please try again.');
    } finally {
      setExportingFlag(false);
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

  // console.log(voiceInputFlag);
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
  // console.log(session);

  useEffect(() => {
    if (!session) return;
    const { organisation, designation } = session.user.user_metadata || {};
    if (!designation || !organisation) {
      setIsVerified(false);
    } else {
      setIsVerified(true);
    }
  }, [session]);

  // useEffect(() => {
  //   // console.log('******************************');
  //   // console.log('audioHasEnded: ', audioHasEnded);
  //   // console.log('isRecording: ', isRecording);
  //   // console.log('voiceInputFlag: ', voiceInputFlag);
  //   // console.log('isProcessing: ', isProcessing);
  //   // console.log('******************************');
  //   // if (audioHasEnded && !isRecording && voiceInputFlag && !isProcessing) {
  //   if (!isRecording && voiceInputFlag && !isProcessing) {
  //     // console.log('execute');
  //     playSound();
  //     handleVoiceInput();
  //   }
  // }, [isRecording, voiceInputFlag, isProcessing]);
  // // }, [audioHasEnded, isRecording, voiceInputFlag, isProcessing]);
  // Uncomment above if you want continuous voice input

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
    const handleBeforeUnload = () => {
      sessionStorage.clear();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
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
    sessionStorage.clear();
    if (error) {
      console.error('Sign-out error:', error.message);
    } else {
      setSession(null);
      router.push('/CWC');
    }
  };

  function handleSubmit(e) {
    e.preventDefault();
    if (!isVerified) return;
    setQuery(e.target.query.value);
    setValue('');
  }

  function handlePageListClick(data) {
    setShowPages(true);
    setPageData(data);
    setContext(contextList[data.index]);
  }

  async function incrementCategoryCount(category) {
    try {
      const res = await fetch('/api/incrementCategoryCount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: category, origin: 'CWC' }),
      });
      const data = await res.json();
      // console.log(data);
    } catch (error) {
      console.log('Failed to increment categorty', error.message);
    }
  }

  async function getConversationById(conversationId) {
    try {
      const res = await fetch('/api/getConversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, origin: 'CWC' }),
      });

      if (!res.ok) throw new Error('Failed to fetch conversation');

      const data = await res.json();
      if (data.success) {
        // console.log(data.conversation.pdfList);
        setMessages(data.conversation.messages || []);
        setSessionQuery(data.conversation.messages[0]?.content || '');
        setPagesList(data.conversation.pdfList || []);
        setContextList(data.conversation.contextList || []);
        sessionStorage.setItem(
          'messages',
          JSON.stringify(data.conversation.messages) || [],
        );
        sessionStorage.setItem(
          'pagesList',
          JSON.stringify(data.conversation.pdfList) || [],
        );
        sessionStorage.setItem(
          'contextList',
          JSON.stringify(data.conversation.contextList) || [],
        );
        sessionStorage.setItem(
          'query',
          data.conversation.messages[0]?.content || '',
        );
        sessionStorage.setItem(
          'lastMessagesLength',
          data.conversation.messages.length || 0,
        );
        sessionStorage.setItem('conversationId', conversationId);
        setConversationId(conversationId);
        setShowChats(false);
      }
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  useEffect(() => {
    if (messages.length !== 0) {
      sessionStorage.setItem('messages', JSON.stringify(messages) || []);
      sessionStorage.setItem('pagesList', JSON.stringify(pagesList) || []);
      sessionStorage.setItem('contextList', JSON.stringify(contextList) || []);
    }
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
    setPagesList(JSON.parse(sessionStorage.getItem('pagesList')) || []);
    setContextList(JSON.parse(sessionStorage.getItem('contextList')) || []);
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
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content: query,
          createdAt: new Date().toISOString(),
        },
      ]);
      const chatRes = await fetch('/api/ask', {
        method: 'POST',
        body: JSON.stringify({
          question: query,
          conversation: convo,
          origin: 'CWC',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const { answer, pages, category, context } = await chatRes.json();
      // console.log(pages);
      setContext(context);
      if (contextList.length == 0) {
        setContextList([context]);
      } else {
        setContextList((prev) => [...prev, context]);
      }
      if (pagesList.length == 0) {
        setPagesList([pages]);
      } else {
        setPagesList((prev) => [...prev, pages]);
      }
      // console.log(pages);
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: answer,
          createdAt: new Date().toISOString(),
        },
      ]);
      setReply(answer);
      // playElevenLabsAudio(answer);
      setIsProcessing(false);
      setVoiceInputFlag(false); // remove this too if you want continuous voice input
      incrementCategoryCount(category);
    };
    processQuery();
  }, [query, session]);
  // console.log(pagesList);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('code')) {
      router.replace('/CWC/home');
    }
  }, []);

  useEffect(() => {
    // console.log(
    //   messages.length,
    //   parseInt(sessionStorage.getItem('lastMessagesLength')),
    // );
    if (
      messages.length -
      (parseInt(sessionStorage.getItem('lastMessagesLength')) || 0) >=
      2
    ) {
      const newMessages = messages.slice(-2); // user + bot
      fetch('/api/saveConversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          newMessages,
          newPdfList: pagesList,
          newContextList: contextList,
          origin: 'CWC',
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          // console.log(data);
          if (data?.id && !conversationId) {
            setConversationId(data.id); // capture the new conversation ID
            sessionStorage.setItem('conversationId', data.id);
          }
        })
        .catch((err) => {
          console.error('Failed to save messages:', err);
        });
      sessionStorage.setItem('lastMessagesLength', messages.length);
    }
  }, [messages, pagesList]);

  useEffect(() => {
    const storedConversationId = sessionStorage.getItem('conversationId');
    if (storedConversationId) {
      setConversationId(storedConversationId);
    }
    const fetchChats = async () => {
      try {
        const res = await fetch('/api/getChats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ origin: 'CWC' }),
        });
        if (!res.ok) throw new Error('Failed to fetch chats');
        const data = await res.json();
        // console.log(data);
        setChats(data.chats);
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };
    session && fetchChats();
  }, [session, messages, reply, showChats]);

  useEffect(() => {
    const incrementVisits = async () => {
      try {
        const res = await fetch('/api/incrementVisits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ origin: 'CWC' }),
        });
        const data = await res.json();
        // console.log(data);
      } catch (error) {
        console.error('Error incrementing visits:', error);
      }
    };
    session && incrementVisits();
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const sendHeartbeat = async () => {
      // console.log(session?.user.id);
      await fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session?.user.id, origin: 'CWC' }),
      });
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 10000);
    return () => clearInterval(interval);
  }, [session]);

  // if (true) {
  //   return <MaintenancePage />;
  // }

  if (!loading && !session)
    return (
      <div className="wrapper">
        <h1>Unauthenticated</h1>
      </div>
    );

  return (
    <div className={`${'wrapper'} ${'container'}`}>
      <OnboardingModal session={session} func={setIsVerified} origin={'CWC'} />
      {showPages && (
        <PagesComponent
          pages={pagesList}
          func={setShowPages}
          pageData={pageData}
          context={context}
        />
      )}
      {showChats && (
        <ChatListModal
          chats={chats}
          onClose={() => setShowChats(false)}
          onNewChat={() => {
            setMessages([]);
            setSessionQuery('');
            sessionStorage.removeItem('messages', []);
            sessionStorage.removeItem('query', '');
            sessionStorage.removeItem('lastMessagesLength', 0);
            sessionStorage.removeItem('conversationId', null);
            setConversationId(null);
            setShowChats(false);
            setQuery('');
            setReply('');
            setPagesList([]);
            setContextList([]);
          }}
          onSelectChat={async (id) => {
            await getConversationById(id);
          }}
          setPagesList={setPagesList}
          setContextList={setContextList}
          origin={'CWC'}
        />
      )}
      <div className={styles.logoSection}>
        <img
          src="/images/curvedText.png"
          alt="ICED"
          className={styles.curved}
        />
        <img src="/images/logo.gif" alt="IITR logo" className={styles.logo} />
      </div>
      <ul
        className={styles.header}
        style={
          isVerified ? null : { pointerEvents: 'none', userSelect: 'none' }
        }
      >
        <li className={styles.headerElement}>
          <img src="/images/icedLogo.png" alt="" />
          <h3>DamChat</h3>
          {/* <h1>DamChat</h1> */}
        </li>
        <li
          className={styles.headerElement}
          ref={menuRef}
          tabIndex={0}
          role="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="1.8rem"
            height="1.8rem"
            onClick={() => {
              if (!isVerified) return;
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
              <li>
                <button
                  onClick={() => {
                    setShowChats(true), setSettingsFlag(false);
                  }}
                >
                  Chats
                </button>
              </li>
              <li>
                <Link href={'/CWC/about'}>About</Link>
              </li>
              <li>
                <button
                  onClick={handleExportChat}
                  disabled={messages.length === 0 || exportingFlag}
                  style={
                    messages.length === 0 || exportingFlag
                      ? { pointerEvents: 'none', opacity: 0.5, cursor: 'not-allowed' }
                      : undefined
                  }
                >
                  {exportingFlag ? 'Exporting...' : 'Export Chat'}
                </button>
              </li>
              <li>
                <button onClick={() => signOut()} className={styles.lastChild}>
                  {signOutFlag ? 'Signing out...' : 'Sign out'}
                </button>
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
              pages={pagesList}
              func={handlePageListClick}
              // pagesData={pageData}
              isProcessing={isProcessing}
            />
          )}
        </section>
        <section
          style={
            isVerified
              ? null
              : {
                pointerEvents: 'none',
                userSelect: 'none',
              }
          }
        >
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
                      if (!isVerified) return;
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
