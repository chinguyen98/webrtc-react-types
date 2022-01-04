import { VFC } from 'react';
import styles from './stream-video.module.css';

interface StreamVideoProps {
  displayName: string | null;
  id: string;
}

const StreamVideo: VFC<StreamVideoProps> = ({ id, displayName }) => {
  return (
    <div className={styles['stream-video']}>
      <h1>{displayName}</h1>
      <video width="640" height="360" id={id} playsInline autoPlay muted />
    </div>
  );
};

export default StreamVideo;
