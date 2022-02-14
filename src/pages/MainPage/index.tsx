import { addDoc, collection, Firestore, getDocs } from 'firebase/firestore';
import { useEffect, useRef, useState, VFC } from 'react';
import { Calls } from '../../collections/Calls';
import Button from '../../components/Button';
import StreamVideo from '../../components/StreamVideo';
import { __iceCandidatePoolSize__, __iceServers__ } from '../../config';
import { LOCAL_STREAM_ID, REMOTE_STREAM_ID } from '../../constants';
import { initFirebase } from '../../firebaseApp';
import useAppContext from '../../hooks/useAppContext';
import styles from './mainpage.module.css';

const MainPage: VFC = () => {
  const [isMediaReady, setIsMediaReady] = useState<boolean | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);

  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);

  const { setPc, pc, ownUsername } = useAppContext();

  /* Check user media permission and init two stream refs! */
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        console.info('Got local media stream!', stream);
        setIsMediaReady(true);
        localStream.current = stream;
        remoteStream.current = new MediaStream();
      } catch (err) {
        console.error('Error accessing media devices', err);
        setIsMediaReady(false);
      }
    })();
  }, []);

  /* Init connect to firestore */
  useEffect(() => {
    const fireStoreDb = initFirebase() as Firestore;
    setDb(fireStoreDb);
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

  /* Get tracks from remote stream! */
  useEffect(() => {
    if (pc) {
      pc.ontrack = (e) => {
        e.streams[0].getTracks().forEach((track) => {
          remoteStream.current?.addTrack(track);
        });
      };
    }
  }, [pc]);

  /* Apply remote tracks to remote video! */
  useEffect(() => {
    const remoteVideo = document.querySelector<HTMLVideoElement>(
      `#${REMOTE_STREAM_ID}`
    );
    if (remoteVideo) {
      remoteVideo.srcObject = remoteStream.current;
    }
  }, []);

  const startCall = async () => {
    const callRef = await addDoc(
      collection(db as Firestore, 'calls'),
      {
        
      } as Calls
    );
  };

  if (isMediaReady === null) {
    return <>Loading....</>;
  }

  if (isMediaReady === false) {
    return <>Permission denied!</>;
  }

  return (
    <div className={styles['mainpage']}>
      <div className={styles['video-container']}>
        <StreamVideo id={LOCAL_STREAM_ID} displayName={ownUsername} />
        <StreamVideo id={REMOTE_STREAM_ID} displayName="&nbsp;" />
      </div>
      <div style={{ width: '100px', marginTop: '5px' }}>
        <Button onClick={startCall} value="Start call!" />
      </div>
    </div>
  );
};

export default MainPage;
