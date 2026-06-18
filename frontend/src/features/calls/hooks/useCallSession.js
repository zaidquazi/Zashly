import { useCallback } from "react";
import useAuthUser from "../../../hooks/useAuthUser";
import useCallStore from "../store/callSlice";
import { useCallSignaling } from "./useCallSignaling";
import { getCallToken, endCallApi } from "../services/callApi";
import toast from "react-hot-toast";

export function useCallSession() {
  const { authUser } = useAuthUser();
  const { initiateCall, acceptCall, rejectCall, endCallSignal, setConnected } = useCallSignaling();
  const {
    setOutgoingCall,
    resetCall,
    callId,
    roomName,
    callType,
    callMode,
  } = useCallStore();

  const startPersonalCall = useCallback(
    async ({ targetId, targetName, targetPic, type = "voice" }) => {
      if (!targetId) return;

      setOutgoingCall({
        targetId,
        remoteUser: { id: targetId, name: targetName, image: targetPic },
        callType: type,
        callMode: "personal",
      });
      useCallStore.setState({ callState: "outgoing", callType: type, callMode: "personal" });

      initiateCall(
        {
          targetId,
          callType: type,
          callMode: "personal",
          callerName: authUser?.fullName,
          callerPic: authUser?.profilePic,
        },
        async (ack) => {
          if (!ack?.success) {
            toast.error(ack?.error || "Could not start call");
            resetCall();
            return;
          }
          useCallStore.setState({
            callId: ack.callId,
            roomName: ack.roomName,
          });
        }
      );
    },
    [authUser, initiateCall, resetCall, setOutgoingCall]
  );

  const startGroupCall = useCallback(
    async ({ groupId, groupName, type = "voice", participantIds = [] }) => {
      setOutgoingCall({
        groupInfo: { id: groupId, name: groupName },
        callType: type,
        callMode: "group",
      });
      useCallStore.setState({
        callState: "outgoing",
        callType: type,
        callMode: "group",
        isGroup: true,
        isHost: true,
      });

      initiateCall(
        {
          groupId,
          callType: type,
          callMode: "group",
          participantIds,
          callerName: authUser?.fullName,
          callerPic: authUser?.profilePic,
        },
        async (ack) => {
          if (!ack?.success) {
            toast.error(ack?.error || "Could not start group call");
            resetCall();
            return;
          }
          const tokenRes = await getCallToken({ callId: ack.callId, roomName: ack.roomName });
          setConnected({
            callId: ack.callId,
            roomName: ack.roomName,
            serverUrl: tokenRes.serverUrl,
            token: tokenRes.token,
            callType: type,
            callMode: "group",
            isHost: true,
          });
        }
      );
    },
    [authUser, initiateCall, resetCall, setConnected, setOutgoingCall]
  );

  const answerIncomingCall = useCallback(async () => {
    const incoming = useCallStore.getState().incomingCall;
    if (!incoming?.callId) return;

    acceptCall(incoming.callId);

    try {
      const tokenRes = await getCallToken({
        callId: incoming.callId,
        roomName: incoming.roomName,
      });
      setConnected({
        callId: incoming.callId,
        roomName: incoming.roomName,
        serverUrl: tokenRes.serverUrl,
        token: tokenRes.token,
        callType: incoming.callType,
        callMode: incoming.callMode,
        isHost: false,
        remoteUser: {
          id: incoming.callerId,
          name: incoming.callerName,
          image: incoming.callerPic,
        },
      });
    } catch {
      toast.error("Failed to join call");
      resetCall();
    }
  }, [acceptCall, setConnected, resetCall]);

  const cancelOutgoingCall = useCallback(() => {
    const state = useCallStore.getState();
    if (state.callId) endCallSignal(state.callId);
    resetCall();
  }, [endCallSignal, resetCall]);

  const hangUp = useCallback(async () => {
    const state = useCallStore.getState();
    if (state.callId) {
      endCallSignal(state.callId);
      try {
        await endCallApi({ callId: state.callId, roomName: state.roomName });
      } catch {
        /* socket handles broadcast */
      }
    }
    resetCall();
  }, [endCallSignal, resetCall]);

  const declineIncoming = useCallback(() => {
    const incoming = useCallStore.getState().incomingCall;
    if (incoming?.callId) rejectCall(incoming.callId);
    else resetCall();
  }, [rejectCall, resetCall]);

  return {
    startPersonalCall,
    startGroupCall,
    answerIncomingCall,
    cancelOutgoingCall,
    hangUp,
    declineIncoming,
    callId,
    roomName,
    callType,
    callMode,
  };
}

export default useCallSession;
