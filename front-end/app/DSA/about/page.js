import Link from 'next/link';
import styles from './page.module.css';

export default function AboutPage() {
  return (
    <main className={`${styles.container} wrapper`}>
      <section className={styles.content}>
        <h1 className={styles.title}>
          About <span>DamChat</span>
        </h1>
        <p className={styles.subtitle}>
          Ensuring dam safety with clarity and compliance.
        </p>

        <div className={styles.block}>
          <h2 className={styles.heading}>Purpose</h2>
          <p className={styles.text}>
            DamChat is an AI-powered knowledge assistant designed to help you
            explore and understand the <strong>Dam Safety Act, 2021</strong> and
            its related regulations in India. Developed by the{' '}
            <strong>International Centre for Dams (ICED), IIT Roorkee</strong>,
            DamChat brings together cutting-edge artificial intelligence with
            expert knowledge of dam safety practices, policies, and governance.{' '}
            <br />
            Our aim is to make the complexities of the Dam Safety Act accessible
            to all—whether you are a policymaker, engineer, researcher, student,
            or an interested citizen. With DamChat, you can ask questions in
            natural language and receive intelligent, reliable, and
            easy-to-understand explanations backed by authoritative sources.{' '}
            <br />
            DamChat is <strong>free to use</strong> and built to encourage
            awareness, transparency, and informed decision-making about dam
            safety in India. By bridging the gap between technical regulations
            and public understanding, DamChat supports ICED’s mission to
            strengthen knowledge dissemination and build safer water
            infrastructure for the nation.
          </p>
        </div>

        <div className={styles.block}>
          <h2 className={styles.heading}>Research & Development</h2>
          <p className={styles.text}>
            DamChat has been conceptualized and developed under the vision and
            guidance of <strong>Professor B. Ravi Kumar Pillai </strong> and{' '}
            <strong>Professor M. L. Sharma.</strong> Their idea, mentorship, and
            unwavering support have been the driving force behind this
            initiative, making it possible to bring dam safety knowledge closer
            to everyone.
          </p>
        </div>

        <div className={styles.block1}>
          <p>
            Developed by{' '}
            <span>
              <Link href={'https://InventisLabs.com'} target="blank_">
                InventisLabs &#8599;
              </Link>
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
