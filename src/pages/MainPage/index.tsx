import { useEffect, useState, VFC } from 'react';
import styles from './mainapge.module.css';

const MainPage: VFC = () => {
  const [isMediaReady, setIsMediaReady] = useState<boolean | null>(null);

  /* Check user media permission! */
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        console.log('Got media stream!', stream);
        setIsMediaReady(true);
      } catch (err) {
        console.error('Error accessing media devices', err);
        setIsMediaReady(false);
      }
    })();
  }, []);

  if (isMediaReady === null) {
    return <>Loading....</>;
  }

  if (isMediaReady === false) {
    return <>Permission denied!</>;
  }

  return <div>Main Page</div>;
};

export default MainPage;
