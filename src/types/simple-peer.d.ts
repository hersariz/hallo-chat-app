declare module 'simple-peer' {
  namespace SimplePeer {
    interface Options {
      initiator?: boolean;
      channelConfig?: object;
      channelName?: string;
      config?: object;
      wrtc?: object;
      stream?: MediaStream;
      streams?: MediaStream[];
      trickle?: boolean;
      allowHalfTrickle?: boolean;
      sdpTransform?: Function;
      objectMode?: boolean;
      answerConstraints?: {
        offerToReceiveAudio?: boolean;
        offerToReceiveVideo?: boolean;
      };
      offerConstraints?: {
        offerToReceiveAudio?: boolean;
        offerToReceiveVideo?: boolean;
      };
      reconnectTimer?: number;
      iceCompleteTimeout?: number;
      iceServers?: any[];
      sdpSemantics?: string;
      channelConfig?: object;
      bundlePolicy?: string;
      rtcpMuxPolicy?: string;
    }

    interface Instance extends NodeJS.EventEmitter {
      signal(data: any): void;
      send(data: any): void;
      destroy(): void;
      _pc: any; // RTCPeerConnection
      connected: boolean;
      destroyed: boolean;
      stream?: MediaStream;
      streams: MediaStream[];
    }
  }

  const SimplePeer: {
    new(opts?: SimplePeer.Options): SimplePeer.Instance;
    (opts?: SimplePeer.Options): SimplePeer.Instance;
  };

  export = SimplePeer;
}