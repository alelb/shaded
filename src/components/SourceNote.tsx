import styles from './SourceNote.module.css';

export interface SourceNoteProps {
  /** The dataset names, e.g. "Gaza daily reports and Killed in Gaza". */
  datasetName: string;
  href: string;
}

// Source attribution, kept next to the figures it describes. Dates sit with each figure; the caveat is in the footer.
export function SourceNote({ datasetName, href }: SourceNoteProps) {
  return (
    <div className={styles.note}>
      <p>
        Source: {datasetName},{' '}
        <a className={styles.link} href={href}>
          Tech for Palestine
        </a>
      </p>
    </div>
  );
}
