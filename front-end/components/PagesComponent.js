'use client';
import styles from './PagesComponent.module.css';
import { useState } from 'react';
import dynamic from 'next/dynamic';
const SinglePagePdfRenderer = dynamic(
  () => import('@/components/SinglePagePdfRenderer'),
  {
    ssr: false,
  },
);

export default function PagesComponent({ pages, func }) {
  const [pageNum, setPageNum] = useState(0);
  const parsedPages = pages.map((entry) => {
    const [name, pageStr] = entry.split('|').map((str) => str.trim());
    const pageNumber = parseInt(pageStr.replace('Page', '').trim(), 10);
    return { name, page: pageNumber };
  });
  return (
    <section className={styles.pagesSection}>
      <section className={styles.buttonContainer}>
        <button className={styles.crossBtn} onClick={() => func(false)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="0.8em"
            height="0.8em"
          >
            <g fill="none">
              <g filter="url(#f342id4)">
                <path
                  fill="url(#f342id0)"
                  d="M4.435 2.809A1.55 1.55 0 0 0 2.243 5L13.41 16.169a.25.25 0 0 1 0 .354L2.243 27.692a1.55 1.55 0 1 0 2.192 2.192l11.168-11.169a.25.25 0 0 1 .354 0l11.168 11.169a1.55 1.55 0 0 0 2.193-2.192l-11.17-11.17a.25.25 0 0 1 0-.353l11.17-11.168a1.55 1.55 0 0 0-2.192-2.192l-11.17 11.168a.25.25 0 0 1-.353 0z"
                ></path>
                <path
                  fill="url(#f342id1)"
                  d="M4.435 2.809A1.55 1.55 0 0 0 2.243 5L13.41 16.169a.25.25 0 0 1 0 .354L2.243 27.692a1.55 1.55 0 1 0 2.192 2.192l11.168-11.169a.25.25 0 0 1 .354 0l11.168 11.169a1.55 1.55 0 0 0 2.193-2.192l-11.17-11.17a.25.25 0 0 1 0-.353l11.17-11.168a1.55 1.55 0 0 0-2.192-2.192l-11.17 11.168a.25.25 0 0 1-.353 0z"
                ></path>
              </g>
              <path
                fill="url(#f342id7)"
                d="M4.435 2.809A1.55 1.55 0 0 0 2.243 5L13.41 16.169a.25.25 0 0 1 0 .354L2.243 27.692a1.55 1.55 0 1 0 2.192 2.192l11.168-11.169a.25.25 0 0 1 .354 0l11.168 11.169a1.55 1.55 0 0 0 2.193-2.192l-11.17-11.17a.25.25 0 0 1 0-.353l11.17-11.168a1.55 1.55 0 0 0-2.192-2.192l-11.17 11.168a.25.25 0 0 1-.353 0z"
              ></path>
              <g filter="url(#f342id5)">
                <path
                  stroke="url(#f342id2)"
                  strokeLinecap="round"
                  d="M3.685 3.558L15.2 15.074m13.367 13.368L17.68 17.555"
                ></path>
              </g>
              <g filter="url(#f342id6)">
                <path
                  stroke="url(#f342id3)"
                  strokeLinecap="round"
                  d="m27.832 4.289l-10.78 10.785M3.685 28.442L14.57 17.555"
                ></path>
              </g>
              <defs>
                <linearGradient
                  id="f342id0"
                  x1="15.78"
                  x2="15.78"
                  y1="2.355"
                  y2="30.338"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#E02C6B"></stop>
                  <stop offset="1" stopColor="#FF354E"></stop>
                </linearGradient>
                <linearGradient
                  id="f342id1"
                  x1="6.29"
                  x2="14.721"
                  y1="6.699"
                  y2="15.172"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#EE3D81"></stop>
                  <stop offset="1" stopColor="#EE3D81" stopOpacity="0"></stop>
                </linearGradient>
                <linearGradient
                  id="f342id2"
                  x1="3.314"
                  x2="28.986"
                  y1="3.885"
                  y2="29.499"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#FF679B"></stop>
                  <stop offset="1" stopColor="#FF7171"></stop>
                </linearGradient>
                <linearGradient
                  id="f342id3"
                  x1="28.939"
                  x2="6.319"
                  y1="3.885"
                  y2="26.505"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#EF4B8B"></stop>
                  <stop offset="1" stopColor="#FE4753"></stop>
                </linearGradient>
                <filter
                  id="f342id4"
                  width="28.483"
                  height="27.983"
                  x="1.789"
                  y="2.355"
                  colorInterpolationFilters="sRGB"
                  filterUnits="userSpaceOnUse"
                >
                  <feFlood
                    floodOpacity="0"
                    result="BackgroundImageFix"
                  ></feFlood>
                  <feBlend
                    in="SourceGraphic"
                    in2="BackgroundImageFix"
                    result="shape"
                  ></feBlend>
                  <feColorMatrix
                    in="SourceAlpha"
                    result="hardAlpha"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  ></feColorMatrix>
                  <feOffset dx=".5"></feOffset>
                  <feGaussianBlur stdDeviation=".5"></feGaussianBlur>
                  <feComposite
                    in2="hardAlpha"
                    k2="-1"
                    k3="1"
                    operator="arithmetic"
                  ></feComposite>
                  <feColorMatrix values="0 0 0 0 0.776471 0 0 0 0 0.219608 0 0 0 0 0.411765 0 0 0 1 0"></feColorMatrix>
                  <feBlend
                    in2="shape"
                    result="effect1_innerShadow_18590_2030"
                  ></feBlend>
                </filter>
                <filter
                  id="f342id5"
                  width="27.383"
                  height="27.383"
                  x="2.435"
                  y="2.308"
                  colorInterpolationFilters="sRGB"
                  filterUnits="userSpaceOnUse"
                >
                  <feFlood
                    floodOpacity="0"
                    result="BackgroundImageFix"
                  ></feFlood>
                  <feBlend
                    in="SourceGraphic"
                    in2="BackgroundImageFix"
                    result="shape"
                  ></feBlend>
                  <feGaussianBlur
                    result="effect1_foregroundBlur_18590_2030"
                    stdDeviation=".375"
                  ></feGaussianBlur>
                </filter>
                <filter
                  id="f342id6"
                  width="26.647"
                  height="26.652"
                  x="2.435"
                  y="3.039"
                  colorInterpolationFilters="sRGB"
                  filterUnits="userSpaceOnUse"
                >
                  <feFlood
                    floodOpacity="0"
                    result="BackgroundImageFix"
                  ></feFlood>
                  <feBlend
                    in="SourceGraphic"
                    in2="BackgroundImageFix"
                    result="shape"
                  ></feBlend>
                  <feGaussianBlur
                    result="effect1_foregroundBlur_18590_2030"
                    stdDeviation=".375"
                  ></feGaussianBlur>
                </filter>
                <radialGradient
                  id="f342id7"
                  cx="0"
                  cy="0"
                  r="1"
                  gradientTransform="rotate(134.145 13.617 7.88)scale(1.36671)"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#FF75A7"></stop>
                  <stop offset="1" stopColor="#FF75A7" stopOpacity="0"></stop>
                </radialGradient>
              </defs>
            </g>
          </svg>
        </button>
        <section className={styles.pageControlContainer}>
          <section className={styles.pageControl}>
            <button
              onClick={() =>
                setPageNum(() => (pageNum === 0 ? 0 : pageNum - 1))
              }
              disabled={pageNum === 0}
              style={{ transform: 'rotate(180deg)' }}
              className={styles.button}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="1em"
                height="1em"
                className={styles.icon}
              >
                <path
                  fill="currentColor"
                  d="M9.31 6.71a.996.996 0 0 0 0 1.41L13.19 12l-3.88 3.88a.996.996 0 1 0 1.41 1.41l4.59-4.59a.996.996 0 0 0 0-1.41L10.72 6.7c-.38-.38-1.02-.38-1.41.01"
                ></path>
              </svg>
            </button>
            <strong>{parsedPages[pageNum].page}</strong>
            <button
              onClick={() =>
                setPageNum(() =>
                  pages.length - 1 === pageNum ? pages.length - 1 : pageNum + 1,
                )
              }
              disabled={pages.length - 1 === pageNum}
              className={styles.button}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="1em"
                height="1em"
                className={styles.icon}
              >
                <path
                  fill="currentColor"
                  d="M9.31 6.71a.996.996 0 0 0 0 1.41L13.19 12l-3.88 3.88a.996.996 0 1 0 1.41 1.41l4.59-4.59a.996.996 0 0 0 0-1.41L10.72 6.7c-.38-.38-1.02-.38-1.41.01"
                ></path>
              </svg>
            </button>
          </section>
          <p>{parsedPages[pageNum].name}</p>
        </section>
      </section>
      <section className={styles.pagesContainer}>
        <SinglePagePdfRenderer
          key={`${parsedPages[pageNum].name}-${parsedPages[pageNum].page}`}
          pdfUrl={`/pdfs/${parsedPages[pageNum].name}.pdf`}
          pageNumber={parsedPages[pageNum].page}
        />
      </section>
    </section>
  );
}
