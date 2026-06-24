import { useEffect, useRef, useCallback } from "react";
import useSocket from "../../../hooks/useSocket";
import useAuthUser from "../../../hooks/useAuthUser";
import useCallStore from "../store/callSlice";
import { getCallToken } from "../services/callApi";
import toast from "react-hot-toast";

let ringtoneAudio = null;

function playRingtone() {
  try {
    if (!ringtoneAudio) {
      ringtoneAudio = new Audio("/ringtone.wav");
      ringtoneAudio.loop = true;
    }
    ringtoneAudio.currentTime = 0;
    ringtoneAudio.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

function stopRingtone() {
  if (ringtoneAudio) {
    ringtoneAudio.pause();
    ringtoneAudio.currentTime = 0;
  }
}

export function useCallSignaling() {
  const { on, emit, isConnected } = useSocket();
  const { authUser } = useAuthUser();
  const {
    callState,
    incomingCall,
    setIncomingCall,
    setOutgoingCall,
    resetCall,
    setConnected,
  } = useCallStore();

  const callStateRef = useRef(callState);
  const incomingRef = useRef(incomingCall);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    incomingRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    if (callState === "incoming") playRingtone();
    else stopRingtone();
    return () => stopRingtone();
  }, [callState]);

  useEffect(() => {
    if (!isConnected) return;

    const unsubIncoming = on("call:incoming", (data) => {
      if (callStateRef.current !== "idle" && callStateRef.current !== "incoming") return;
      if (incomingRef.current?.callId === data.callId) return;
      setIncomingCall(data);
      useCallStore.setState({ callState: "incoming" });
    });

    const unsubAccept = on("call:accept", async (data) => {
      stopRingtone();
      const state = useCallStore.getState();
      if (state.callState === "outgoing" && data?.callId && data?.roomName) {
        try {
          const tokenRes = await getCallToken({
            callId: data.callId,
            roomName: data.roomName,
          });
          setConnected({
            callId: data.callId,
            roomName: data.roomName,
            serverUrl: tokenRes.serverUrl,
            token: tokenRes.token,
            callType: data.callType || state.callType,
            callMode: data.callMode || state.callMode,
            isHost: true,
            remoteUser: state.outgoingCall?.remoteUser,
          });
        } catch {
          toast.error("Failed to join call");
          resetCall();
        }
      }
    });

    const unsubReject = on("call:reject", (data) => {
      stopRingtone();
      toast.error("Call declined");
      if (incomingRef.current?.callId === data.callId || callStateRef.current === "outgoing") {
        resetCall();
      }
    });

    const unsubEnd = on("call:end", () => {
      stopRingtone();
      resetCall();
    });

    const unsubMissed = on("call:missed", () => {
      stopRingtone();
      toast("Missed call", { icon: "📞" });
      resetCall();
    });

    const unsubRinging = on("call:ringing", (data) => {
      if (callStateRef.current === "outgoing" && data?.callId) {
        const current = useCallStore.getState().outgoingCall;
        useCallStore.setState({
          outgoingCall: { ...current, ...data },
          callId: data.callId,
          roomName: data.roomName,
        });
      }
    });

    return () => {
      unsubIncoming();
      unsubAccept();
      unsubReject();
      unsubEnd();
      unsubMissed();
      unsubRinging();
    };
  }, [isConnected, on, setIncomingCall, setOutgoingCall, resetCall, setConnected]);

  const ensureMediaPermissions = async (callType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      console.error("Media permissions error:", err);
      toast.error("Camera/Microphone permissions are required for calls");
      return false;
    }
  };

  const initiateCall = useCallback(
    async (payload, ack) => {
      const hasPerms = await ensureMediaPermissions(payload.callType);
      if (!hasPerms) {
        if (ack) ack({ success: false, error: "Permissions denied" });
        return;
      }
      return emit("call:initiate", { ...payload, callerId: authUser?._id }, ack);
    },
    [emit, authUser?._id]
  );

  const acceptCall = useCallback(
    async (callId) => {
      const state = useCallStore.getState();
      const type = state.incomingCall?.callType || "voice";
      const hasPerms = await ensureMediaPermissions(type);
      if (!hasPerms) return;
      
      emit("call:accept", { callId, userId: authUser?._id });
    },
    [emit, authUser?._id]
  );

  const rejectCall = useCallback(
    (callId) => {
      stopRingtone();
      emit("call:reject", { callId, userId: authUser?._id });
      resetCall();
    },
    [emit, authUser?._id, resetCall]
  );

  const endCallSignal = useCallback(
    (callId) => emit("call:end", { callId, userId: authUser?._id }),
    [emit, authUser?._id]
  );

  return {
    initiateCall,
    acceptCall,
    rejectCall,
    endCallSignal,
    setConnected,
  };
}

export default useCallSignaling;
