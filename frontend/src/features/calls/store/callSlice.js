import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

const initialState = {
  callState: "idle",
  callId: null,
  roomName: null,
  serverUrl: null,
  token: null,
  callType: "voice",
  callMode: "personal",
  isGroup: false,
  isHost: false,
  isMinimized: false,
  isFullscreen: false,
  showParticipants: false,
  micEnabled: true,
  cameraEnabled: false,
  screenShareEnabled: false,
  activeSpeakerId: null,
  networkQuality: "good",
  duration: 0,
  startedAt: null,
  incomingCall: null,
  outgoingCall: null,
  remoteUser: null,
  groupInfo: null,
  participants: [],
  localTracks: [],
  remoteTracks: [],
};

const useCallStore = create(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setIncomingCall: (call) => set({ incomingCall: call, callState: call ? "incoming" : get().callState }),

    setOutgoingCall: (call) =>
      set({
        outgoingCall: call,
        callState: call ? "outgoing" : get().callState,
        callType: call?.callType || get().callType,
        callMode: call?.callMode || get().callMode,
        isGroup: call?.callMode === "group",
        remoteUser: call?.remoteUser || null,
        groupInfo: call?.groupInfo || null,
      }),

    setConnected: (payload) =>
      set({
        callState: "connected",
        callId: payload.callId,
        roomName: payload.roomName,
        serverUrl: payload.serverUrl,
        token: payload.token,
        callType: payload.callType,
        callMode: payload.callMode,
        isGroup: payload.callMode === "group",
        isHost: payload.isHost ?? false,
        incomingCall: null,
        outgoingCall: null,
        startedAt: Date.now(),
        cameraEnabled: payload.callType === "video",
      }),

    setToken: (token, serverUrl) => set({ token, serverUrl }),

    setMicEnabled: (micEnabled) => set({ micEnabled }),
    setCameraEnabled: (cameraEnabled) => set({ cameraEnabled }),
    setScreenShareEnabled: (screenShareEnabled) => set({ screenShareEnabled }),
    setActiveSpeaker: (activeSpeakerId) => set({ activeSpeakerId }),
    setNetworkQuality: (networkQuality) => set({ networkQuality }),
    setParticipants: (participants) => set({ participants }),
    setShowParticipants: (showParticipants) => set({ showParticipants }),
    setMinimized: (isMinimized) => set({ isMinimized }),
    setFullscreen: (isFullscreen) => set({ isFullscreen }),
    setDuration: (duration) => set({ duration }),

    updateDuration: () => {
      const { startedAt } = get();
      if (!startedAt) return;
      set({ duration: Math.floor((Date.now() - startedAt) / 1000) });
    },

    resetCall: () => set({ ...initialState }),
  }))
);

export default useCallStore;
