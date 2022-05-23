import { Form, Input, Modal } from 'antd';
import {
  collection,
  doc,
  Firestore,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useRef, useState, VFC } from 'react';
import Button from '../../components/Button';
import StreamVideo from '../../components/StreamVideo';
import { __iceCandidatePoolSize__, __iceServers__ } from '../../config';
import { LOCAL_STREAM_ID, REMOTE_STREAM_ID } from '../../constants';
import { FIREBASE_COLLECTIONS } from '../../constants/firebaseCollection';
import { initFirebase } from '../../firebaseApp';
import useAppContext from '../../hooks/useAppContext';
import { CALL_DESCRIPTION, CALL_STATUS } from '../../types';
import styles from './mainpage.module.css';

const MainPage: VFC = () => {
  const [isMediaReady, setIsMediaReady] = useState<boolean | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [isPrepareJoinCallModalOpen, setIsPreareJoinCallModalOpen] =
    useState<boolean>(false);
  const [isCheckingRoomId, setIsCheckingRoomId] = useState(false);
  const [callingStatus, setCallingStatus] = useState<CALL_STATUS>('idle');

  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);

  const { setPc, pc, ownUsername } = useAppContext();

  const [form] = Form.useForm();

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

  /* Set up remote stream! */
  useEffect(() => {
    if (pc && remoteStream.current) {
      const remoteVideo = document.querySelector<HTMLVideoElement>(
        `#${REMOTE_STREAM_ID}`
      );
      if (remoteVideo) {
        remoteVideo.srcObject = remoteStream.current;
        pc.ontrack = ({ streams, track }) => {
          streams[0].getTracks().forEach((track) => {
            remoteStream.current?.addTrack(track);
          });
        };
      }
    }
  }, [pc, remoteStream.current]);

  const startCall = async () => {
    const callCollection = collection(
      db as Firestore,
      FIREBASE_COLLECTIONS.CALLS
    );
    const callDocRef = doc(callCollection);

    const offerCandidateCollection = collection(
      db as Firestore,
      FIREBASE_COLLECTIONS.CALLS,
      callDocRef.id,
      FIREBASE_COLLECTIONS.OFFER_CANDIDATE
    );

    const answerCandidateCollection = collection(
      db as Firestore,
      FIREBASE_COLLECTIONS.CALLS,
      callDocRef.id,
      FIREBASE_COLLECTIONS.ANSWER_CANDIDATE
    );

    if (pc) {
      /* Listen offer candidates and save */
      pc.onicecandidate = async (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          const offerCandidateDocRef = doc(offerCandidateCollection);
          await setDoc(offerCandidateDocRef, event.candidate.toJSON());
        }
      };

      /* Create offer */
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);
      const jsep: RTCSessionDescriptionInit = {
        sdp: offerDescription?.sdp,
        type: offerDescription.type,
      };
      const callDescription: CALL_DESCRIPTION = {
        offerDescription: jsep,
      };
      await setDoc(callDocRef, callDescription);

      setCallingStatus('calling');

      /* Listen answer description and set to remote description */
      onSnapshot(callDocRef, (observe) => {
        const data: CALL_DESCRIPTION | undefined = observe.data();
        if (data?.answerDescription && !pc?.currentRemoteDescription) {
          const answerDescription = new RTCSessionDescription(
            data.answerDescription
          );
          pc.setRemoteDescription(answerDescription);
        }
      });

      /* Listen remote ice candidate */
      onSnapshot(answerCandidateCollection, (observe) => {
        observe.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.addIceCandidate(candidate);
          }
        });
      });

      setCallId(callDocRef.id);
    }
  };

  const prepareJoinCall = async () => {
    setIsPreareJoinCallModalOpen(true);
    form.resetFields();
  };

  const joinCall = async ({ roomIdToJoin }: { roomIdToJoin: string }) => {
    try {
      setIsCheckingRoomId(true);
      const roomRef = doc(
        db as Firestore,
        FIREBASE_COLLECTIONS.CALLS,
        roomIdToJoin
      );
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const callDescription: CALL_DESCRIPTION = roomSnap.data();
        const answerCandidateCollection = collection(
          db as Firestore,
          FIREBASE_COLLECTIONS.CALLS,
          roomIdToJoin,
          FIREBASE_COLLECTIONS.ANSWER_CANDIDATE
        );
        const offerCandidateCollection = collection(
          db as Firestore,
          FIREBASE_COLLECTIONS.CALLS,
          roomIdToJoin,
          FIREBASE_COLLECTIONS.OFFER_CANDIDATE
        );

        if (pc) {
          /* Add ice candidate */
          pc.onicecandidate = async (event) => {
            if (event?.candidate) {
              const answerCandidateDocRef = doc(answerCandidateCollection);
              await setDoc(answerCandidateDocRef, event.candidate.toJSON());
            }
          };

          await pc.setRemoteDescription(
            new RTCSessionDescription(
              callDescription.offerDescription as RTCSessionDescriptionInit
            )
          );

          const answerDescription = await pc.createAnswer();
          await pc.setLocalDescription(answerDescription);

          const jsep: RTCSessionDescriptionInit = {
            sdp: answerDescription?.sdp,
            type: answerDescription.type,
          };

          const updateData: CALL_DESCRIPTION = {
            answerDescription: jsep,
          };

          await updateDoc(roomRef, updateData);

          /* Listen remote ice candidate */
          onSnapshot(offerCandidateCollection, (observe) => {
            observe.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
              }
            });
          });
        }
      } else {
        setIsCheckingRoomId(false);
        console.log('Not found!');
      }
    } catch (err) {
      console.log({ err });
      setIsCheckingRoomId(false);
    }
  };

  const handleHangup = () => {};

  if (isMediaReady === null) {
    return <>Loading....</>;
  }

  if (isMediaReady === false) {
    return <>Permission denied!</>;
  }

  return (
    <>
      <div className={styles['mainpage']}>
        <div className={styles['video-container']}>
          <StreamVideo id={LOCAL_STREAM_ID} displayName={ownUsername} />
          <StreamVideo id={REMOTE_STREAM_ID} displayName="&nbsp;" />
        </div>
        <div className={styles['callId']}>{callId}</div>
        {callingStatus === 'idle' && (
          <>
            <div style={{ width: '100px', marginTop: '5px' }}>
              <Button onClick={startCall} value="Start call!" />
            </div>
            <div style={{ width: '100px', marginTop: '5px' }}>
              <Button onClick={prepareJoinCall} value="Join call" />
            </div>
          </>
        )}
        {callingStatus === 'calling' && (
          <div style={{ width: '100px', marginTop: '5px' }}>
            <Button onClick={handleHangup} value="Hangup!" />
          </div>
        )}
      </div>
      <Modal
        visible={isPrepareJoinCallModalOpen}
        onOk={form.submit}
        onCancel={() => {
          setIsPreareJoinCallModalOpen(false);
        }}
        confirmLoading={isCheckingRoomId}
      >
        <Form form={form} onFinish={joinCall}>
          <div>Enter room id: </div>
          <Form.Item name="roomIdToJoin">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default MainPage;
