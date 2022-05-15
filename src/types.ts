export type JSEP = {
  sdp?: string;
  type?: RTCSdpType;
};

export type CALL_DESCRIPTION = {
  answerDescription?: RTCSessionDescriptionInit;
  offerDescription?: RTCSessionDescriptionInit;
};
