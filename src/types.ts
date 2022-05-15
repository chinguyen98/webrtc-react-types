export type CALL_DESCRIPTION = {
  answerDescription?: RTCSessionDescriptionInit;
  offerDescription?: RTCSessionDescriptionInit;
};

export type CALL_STATUS =
  | 'idle'
  | 'calling'
  | 'connecting'
  | 'connected'
  | 'hangup';
