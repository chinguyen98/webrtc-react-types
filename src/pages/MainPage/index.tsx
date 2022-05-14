import {
  collection,
  doc,
  Firestore,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { useEffect, useRef, useState, VFC } from 'react';
import Button from '../../components/Button';
import StreamVideo from '../../components/StreamVideo';
import { __iceCandidatePoolSize__, __iceServers__ } from '../../config';
import { LOCAL_STREAM_ID, REMOTE_STREAM_ID } from '../../constants';
import { FIREBASE_COLLECTIONS } from '../../constants/firebaseCollection';
import { initFirebase } from '../../firebaseApp';
import useAppContext from '../../hooks/useAppContext';
import styles from './mainpage.module.css';

const MainPage: VFC = () => {
  const [isMediaReady, setIsMediaReady] = useState<boolean | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [callId, setCallId] = useState<string | null>(null);

  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);

  const { setPc, pc, ownUsername } = useAppContext();

  /* Check user media permission and init two stream refs! */
  useEffect(() => {
    (async () => {
      try {
        const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
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
    const fireStoreDb: Firestore = initFirebase() as Firestore;
    setDb(fireStoreDb);
  }, []);

  /* Apply remote tracks to remote video! */
  useEffect(() => {
    const remoteVideo = document.querySelector<HTMLVideoElement>(
      `#${REMOTE_STREAM_ID}`
    );
    if (remoteVideo) {
      remoteVideo.srcObject = remoteStream.current;
    }
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

  const startCall = async () => {
    const callDocRef = doc(
      collection(db as Firestore, FIREBASE_COLLECTIONS.CALLS)
    );
    const offerCandidateCollection = collection(
      db as Firestore,
      FIREBASE_COLLECTIONS.CALLS,
      callDocRef.id,
      FIREBASE_COLLECTIONS.OFFER_CANDIDATE
    );

    /* Get offer candidates and save */
    if (pc) {
      pc.onicecandidate = async (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          const offerCandidateDocRef = doc(offerCandidateCollection);
          await setDoc(offerCandidateDocRef, event.candidate.toJSON());
        }
      };
    }

    /* Create offer */
    const offerDescription = await pc?.createOffer();
    await pc?.setLocalDescription(offerDescription);

    const jsep = {
      sdp: offerDescription?.sdp,
      type: offerDescription?.type,
    };

    await setDoc(callDocRef, jsep);

    setCallId(callDocRef.id);

    /* Listen for remote answer */
    onSnapshot(callDocRef, (snapshot) => {
      const data = snapshot.data();
      if (!pc?.currentRemoteDescription && data?.answerCandidates) {
        const answerDescription = new RTCSessionDescription(data.answerCandidates);
        pc?.setRemoteDescription(answerDescription);
      }
    });

    alert('done');
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
      <div className={styles['callId']}>{callId}</div>
      <div style={{ width: '100px', marginTop: '5px' }}>
        <Button onClick={startCall} value="Start call!" />
      </div>
    </div>
  );
};

export default MainPage;
