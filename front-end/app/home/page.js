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
      setMessages((prev) => [...prev, { role: 'user', content: query }]);
      const chatRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ask`, {
        method: 'POST',
        body: JSON.stringify({
          question: query,
          // messages: [...convo, { role: 'user', content: query }],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const { answer, pages } = await chatRes.json();
      setPages(pages);
      console.log(pages);
      setMessages((prev) => [...prev, { role: 'system', content: answer }]);
      setReply(answer);
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
      <img src="/images/logo.gif" alt="IITR logo" className={styles.logo} />
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
          {reply.length !== 0 ? (
            <ChatResponse content={reply} pages={pages} func={setShowPages}/>
          ) : reply.length === 0 &&
            sessionQuery.length !== 0 &&
            !isProcessing ? (
            <ChatPlaceholder />
          ) : isProcessing || reply.length !== 0 ? (
            <ZenaLoading />
          ) : null}
        </section>
        <section>
          <section
            className={styles.textInput}
            style={!reply ? { position: 'absolute' } : null}
          >
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder={'Enter your query'}
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
              </div>
            </form>
          </section>
        </section>
      </div>
    </div>
  );
}
