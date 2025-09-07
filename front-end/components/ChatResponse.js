'use client';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // Or any preferred theme
import styles from './ChatResponse.module.css';
import { useEffect, useRef, useState } from 'react';
import ZenaLoading from './ZenaLoading';
import PagesList from './PagesList';

export default function ChatResponse({
  conversation,
  pages,
  func,
  isProcessing,
}) {
  const bottomRef = useRef(null);
  const width = (() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
  })();
  const [showlist, setShowlist] = useState(false);
  const [clickIndex, setClickIndex] = useState(-1);
  const [pagesData, setPagesData] = useState([]);

  function handleClick(clickIndex) {
    setShowlist(true);
    setClickIndex(clickIndex);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  let botIndex = -1;

  useEffect(() => {
    if (!pages || pages.length === 0) return;
    const structuredData = pages.map((item) => {
      const obj = {};
      item.forEach((page) => {
        const [pdf, pageNum] = page.split('|').map((s) => s.trim());
        if (obj[pdf]) {
          obj[pdf].push(pageNum);
        } else {
          obj[pdf] = [pageNum];
        }
      });
      return obj;
    });
    setPagesData(structuredData);
  }, [pages]);

  // console.log(pagesData);

  return (
    <div className={styles.container}>
      {conversation.map((message, index) => {
        let pageInfo = null;
        if (message.role !== 'user') {
          botIndex++;
          if (pages[botIndex] && pages[botIndex].length > 0) {
            pageInfo = (
              <section className={styles.pagesInfo}>
                {!isProcessing && (
                  <div>
                    {botIndex < pages.length - 1 && pages.length > 0 ? (
                      !showlist || index !== clickIndex ? (
                        <em
                          onClick={() => handleClick(index)}
                          className={styles.pagesList}
                        >
                          Click here for referenced pages!
                        </em>
                      ) : (
                        <>
                          <em>
                            {pagesData[botIndex] && (
                              <PagesList
                                idx={botIndex}
                                pagesData={pagesData}
                                func={func}
                                setClickIndex={setClickIndex}
                              />
                            )}
                          </em>
                        </>
                      )
                    ) : (
                      <em>
                        {pagesData[botIndex] && (
                          <PagesList
                            idx={botIndex}
                            pagesData={pagesData}
                            func={func}
                            setClickIndex={setClickIndex}
                          />
                        )}
                      </em>
                    )}
                  </div>
                )}
                <div ref={bottomRef}></div>
              </section>
            );
          }
        }

        return (
          <section key={index}>
            <div
              className={
                message.role === 'user' ? styles.userMessage : styles.botMessage
              }
            >
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {message.content}
              </ReactMarkdown>
            </div>
            {pageInfo}
          </section>
        );
      })}
      {isProcessing && <ZenaLoading />}
    </div>
  );
}
