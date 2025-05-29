'use client';
import styles from './MailsViewer.module.css';

export default function MailViewer({ emails = [], queryParams = {} }) {
  //   console.log(emails);
  const decodeBase64 = (data) => {
    if (!data) return '';
    const decoded = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    return decoded;
  };

  const getHeader = (headers, name) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ||
    '';

  function cleanSnippet(rawSnippet) {
    // Decode HTML entities
    const decoded = rawSnippet
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    // Strip reply chains (like "On Mon, ... wrote:")
    const cleaned = decoded.split(/On\s.+wrote:/gi)[0];
    // Optionally trim the trailing "From: XYZ" or other headers if they remain
    return cleaned.trim();
  }

  function decodeHTMLEntities(text) {
    const txt = document.createElement('textarea');
    txt.innerHTML = text;
    return txt.value;
  }

  return (
    <div className={styles.wrapper}>
      <section className={styles.queryBox}>
        <h2>Search Filters</h2>
        <ul>
          {Object.entries(queryParams).map(
            ([key, val]) =>
              val && (
                <li key={key}>
                  <strong>{key}:</strong> {val}
                </li>
              ),
          )}
        </ul>
      </section>

      <section className={styles.emailList}>
        {emails.length === 0 ? (
          <p className={styles.noEmail}>No emails found.</p>
        ) : (
          emails.map((email) => {
            const { id, snippet, payload } = email;
            const headers = payload?.headers || [];

            const subject = getHeader(headers, 'Subject');
            const from = getHeader(headers, 'From');
            const to = getHeader(headers, 'To');
            const date = getHeader(headers, 'Date');
            const newDate = new Date(date);
            const body = decodeBase64(payload?.body?.data);

            return (
              <div className={styles.emailCard} key={id}>
                <h3>{subject}</h3>
                <p className={styles.meta}>
                  <span>
                    <strong>From:</strong> {from}
                  </span>
                  <span>
                    {newDate.toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                  <span>
                    <strong>To:</strong> {to}
                  </span>

                  {/* <span>
                    <strong>Time:</strong> {newDate.toLocaleTimeString()}
                  </span> */}
                </p>
                {/* <p className={styles.body}>{body}</p> */}
                <p className={styles.body}>
                  {body !== snippet
                    ? cleanSnippet(decodeHTMLEntities(snippet))
                    : decodeHTMLEntities(snippet)}
                </p>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
