import type { ReactNode } from 'react';
import { SiteFooter } from '../components';
import styles from './Layout.module.css';

// Page frame: skip link, landmarks, and the centered content column capped at `--content-max-width`.
export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className={styles.skipLink} href="#main">
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.inner}>
          <h1 className={styles.title}>Shaded</h1>
          <p className={styles.intro}>
            Open data bearing witness to the human toll in Gaza and the West Bank.
          </p>
        </div>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        <div className={styles.inner}>{children}</div>
      </main>
      <footer className={styles.footer}>
        <div className={styles.inner}>
          <SiteFooter />
        </div>
      </footer>
    </>
  );
}
