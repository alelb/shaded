import styles from './SiteFooter.module.css';

export const DATA_PORTAL_URL = 'https://data.techforpalestine.org/';
export const SOURCE_REPO_URL = 'https://github.com/alelb/shaded';

// Site-wide attribution and limitations note. Always rendered, so the caveat stays visible near every view.
export function SiteFooter() {
  return (
    <div className={styles.footer}>
      <p>
        Data:{' '}
        <a className={styles.link} href={DATA_PORTAL_URL}>
          Tech for Palestine
        </a>
      </p>
      <p className={styles.note}>
        Reported figures may undercount the real toll because of information disruption and bodies
        not yet recovered.
      </p>
      <p>
        <a className={styles.link} href={SOURCE_REPO_URL}>
          Source code
        </a>
      </p>
    </div>
  );
}
