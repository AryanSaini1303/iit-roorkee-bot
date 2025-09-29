"use client";

import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function TenantSelect() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Choose Your Portal</h1>
        <div className={styles.buttons}>
          <button
            className={styles.cwcButton}
            onClick={() => router.push("/CWC")}
          >
            CWC
          </button>
          <button
            className={styles.dsaButton}
            onClick={() => router.push("/DSA")}
          >
            DSA
          </button>
        </div>
      </div>
    </div>
  );
}
