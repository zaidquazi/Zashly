import { create } from "zustand";

const useCallStore = create((set, get) => ({
  // â”€â”€ Call metadata â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  callState: "idle",
  callId: null,
  callType: null,
  type: null,

  // â”€â”€ Caller info (for incoming calls) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  callerId: null,
  callerName: "",
  callerPic: "",

  // â”€â”€ Target info (for outgoing calls) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  targetId: null,
  targetName: "",
  targetPic: "",

  // â”€â”€ Group info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  groupName: "",
  groupId: null,

  // â”€â”€ Call controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  isMuted: false,
  isCameraOff: false,
  callDuration: 0,
  timerInterval: null,

  participants: [],

  localStream: null,
  remoteStreams: {},
  peerConnections: {},
  callMessages: [],

  // â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  
  addCallMessage: (message) =>
    set((state) => ({
      callMessages: [...state.callMessages, message],
    })),

  initiateCall: ({ callId, callType, type, targetId, targetName, targetPic, groupName, groupId }) =>
    set({
      callState: "outgoing",
      callId,
      callType,
      type,
      targetId,
      targetName,
      targetPic,
      groupName: groupName || "",
      groupId: groupId || null,
      callerId: null,
      callerName: "",
      callerPic: "",
      isMuted: false,
      isCameraOff: callType === "voice",
      callDuration: 0,
      participants: [],
    }),

  receiveIncomingCall: ({ callId, callerId, callerName, callerPic, type, callType, groupName, groupId }) =>
    set({
      callState: "incoming",
      callId,
      callerId,
      callerName,
      callerPic,
      type,
      callType,
      groupName: groupName || "",
      groupId: groupId || null,
      isMuted: false,
      isCameraOff: callType === "voice",
      callDuration: 0,
      participants: [],
    }),

  setCallConnected: () => {
    const interval = setInterval(() => {
      set((state) => ({ callDuration: state.callDuration + 1 }));
    }, 1000);

    set({
      callState: "connected",
      timerInterval: interval,
    });
  },

  setReconnecting: () =>
    set({ callState: "reconnecting" }),

  toggleMute: () =>
    set((state) => {
      const newMuted = !state.isMuted;
        if (state.localStream) {
        state.localStream.getAudioTracks().forEach((track) => {
          track.enabled = !newMuted;
        });
      }
      return { isMuted: newMuted };
    }),

  toggleCamera: () =>
    set((state) => {
      const newCameraOff = !state.isCameraOff;
      if (state.localStream) {
        state.localStream.getVideoTracks().forEach((track) => {
          track.enabled = !newCameraOff;
        });
      }
      return { isCameraOff: newCameraOff };
    }),

  setLocalStream: (stream) =>
    set({ localStream: stream }),

  addRemoteStream: (userId, stream) =>
    set((state) => ({
      remoteStreams: { ...state.remoteStreams, [userId]: stream },
    })),

  removeRemoteStream: (userId) =>
    set((state) => {
      const newStreams = { ...state.remoteStreams };
      delete newStreams[userId];
      return { remoteStreams: newStreams };
    }),

  setPeerConnection: (userId, pc) =>
    set((state) => ({
      peerConnections: { ...state.peerConnections, [userId]: pc },
    })),

  removePeerConnection: (userId) =>
    set((state) => {
      const newPCs = { ...state.peerConnections };
      if (newPCs[userId]) {
        newPCs[userId].close();
        delete newPCs[userId];
      }
      return { peerConnections: newPCs };
    }),

  setParticipants: (participants) =>
    set({ participants }),

  addParticipant: (participant) =>
    set((state) => {
      if (state.participants.find((p) => p.userId === participant.userId)) return state;
      return { 
        participants: [
          ...state.participants, 
          { ...participant, isMuted: !!participant.isMuted, isCameraOff: !!participant.isCameraOff }
        ] 
      };
    }),

  updateParticipantStatus: (userId, updates) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.userId === userId ? { ...p, ...updates } : p
      ),
    })),

  removeParticipant: (userId) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.userId !== userId),
    })),

  // â”€â”€ Full cleanup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  endCallCleanup: () => {
    const state = get();

    if (state.timerInterval) {
      clearInterval(state.timerInterval);
    }

    if (state.localStream) {
      state.localStream.getTracks().forEach((track) => track.stop());
    }

    Object.values(state.peerConnections).forEach((pc) => {
      try { pc.close(); } catch {""}
    });

    set({
      callState: "idle",
      callId: null,
      callType: null,
      type: null,
      callerId: null,
      callerName: "",
      callerPic: "",
      targetId: null,
      targetName: "",
      targetPic: "",
      groupName: "",
      groupId: null,
      isMuted: false,
      isCameraOff: false,
      callDuration: 0,
      timerInterval: null,
      participants: [],
      localStream: null,
      remoteStreams: {},
      peerConnections: {},
      callMessages: [],
    });
  },
}));

export default useCallStore;
