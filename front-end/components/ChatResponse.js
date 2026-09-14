'use client';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import styles from './ChatResponse.module.css';
import { useEffect, useRef, useState } from 'react';
import ZenaLoading from './ZenaLoading';
import PagesList from './PagesList';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

function BotReferenceImage({ docName, pageNum }) {
  const [imgUrl, setImgUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const filename = `${docName} | ${pageNum}.png`;

    fetch(`${BACKEND_URL}/getImageViewUrl?filename=${encodeURIComponent(filename)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch image URL: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setImgUrl(data.viewUrl);
      })
      .catch((err) => {
        console.error('Error fetching presigned image URL:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [docName, pageNum]);

  if (!imgUrl) return null;

  return (
    <img
      src={imgUrl}
      alt={`${docName} page ${pageNum}`}
      onError={(e) => {
        e.target.style.display = 'none';
      }}
      className={styles.pageImage}
    />
  );
}

export default function ChatResponse({
  conversation,
  pages,
  func,
  isProcessing,
}) {
  const bottomRef = useRef(null);
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

  return (
    <div className={styles.container} id="chatExportArea">
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

              {message.role !== 'user' &&
                pagesData[botIndex] &&
                (() => {
                  if (!Object.keys(pagesData[botIndex])[0]) return;
                  if (Object.keys(pagesData[botIndex]).length > 2) return;
                  const docName = Object.keys(pagesData[botIndex])[0];
                  const pageName = pagesData[botIndex][docName][0];
                  const pageNum = pageName?.replace('Page ', '');
                  return <BotReferenceImage docName={docName} pageNum={pageNum} />;
                })()}
            </div>
            {pageInfo}
          </section>
        );
      })}
      {isProcessing && <ZenaLoading />}
    </div>
  );
}