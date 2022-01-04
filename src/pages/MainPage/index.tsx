import { useEffect, useRef, useState, VFC } from 'react';
import StreamVideo from '../../components/StreamVideo';
import { __iceCandidatePoolSize__, __iceServers__ } from '../../config';
import { LOCAL_STREAM_ID, REMOTE_STREAM_ID } from '../../constants';
import useAppContext from '../../hooks/useAppContext';
import styles from './mainpage.module.css';

const MainPage: VFC = () => {
  const [isMediaReady, setIsMediaReady] = useState<boolean | null>(null);

  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);

  const { setPc, pc, ownUsername } = useAppContext();

  /* Check user media permission! */
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        console.log('Got local media stream!', stream);
        setIsMediaReady(true);
        localStream.current = stream;
        remoteStream.current = new MediaStream();
      } catch (err) {
        console.error('Error accessing media devices', err);
        setIsMediaReady(false);
      }
    })();
  }, []);

  /* Init webrtc pc when media all ready! */
  useEffect(() => {
    if (isMediaReady) {
      const pc = new RTCPeerConnection({
        iceServers: __iceServers__,
        iceCandidatePoolSize: __iceCandidatePoolSize__,
      });
      setPc(pc);
    }
  }, [isMediaReady]);

  /* Set up local stream */
  useEffect(() => {
    if (pc && localStream.current) {
      const localVideo = document.querySelector<HTMLVideoElement>(
        `#${LOCAL_STREAM_ID}`
      );
      if (localVideo) {
        localVideo.srcObject = localStream.current;
      }
      localStream.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStream.current as MediaStream);
      });
    }
  }, [pc, localStream.current]);

  /* Set up pc callback */
  useEffect(() => {
    if (pc) {
      pc.ontrack = (e) => {
        e.streams[0].getTracks().forEach((track) => {
          remoteStream.current?.addTrack(track);
        });
      };
    }
  }, [pc]);

  if (isMediaReady === null) {
    return <>Loading....</>;
  }

  if (isMediaReady === false) {
    return <>Permission denied!</>;
  }

  return (
    <div className={styles['video-container']}>
      <StreamVideo id={LOCAL_STREAM_ID} displayName={ownUsername} />
      <StreamVideo id={REMOTE_STREAM_ID} displayName="&nspb;" />
    </div>
  );
};

export default MainPage;
