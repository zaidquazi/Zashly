import { useCallback, useRef } from "react";
import useCallStore from "../store/useCallStore";
import useSocket from "./useSocket";
import useAuthUser from "./useAuthUser";
import toast from "react-hot-toast";

const RING_TIMEOUT = 45000;

const useStartCall = () => {
  const { emit } = useSocket();
  const { authUser } = useAuthUser();
  const store = useCallStore();
  const ringTimeoutRef = useRef(null);

  const startCall = useCallback(
    async ({ callType, type, targetId, targetName, targetPic, groupName, groupId }) => {
      if (!authUser) return;

      const currentState = useCallStore.getState();
      if (currentState.callState !== "idle") {
        toast.error("Already in a call");
        return;
      }

      if (!targetId) {
        toast.error("Invalid call target");
        return;
      }

      const callId = `call_${authUser._id}_${targetId}_${Date.now()}`;

      store.initiateCall({
        callId,
        callType,
        type,
        targetId,
        targetName,
        targetPic,
        groupName,
        groupId,
      });

      emit("call:initiate", {
        callId,
        callerId: authUser._id,
        callerName: authUser.fullName,
        callerPic: authUser.profilePic || "",
        targetId,
        type,
        callType,
        groupName,
      });


      ringTimeoutRef.current = setTimeout(() => {
        const cs = useCallStore.getState();
        if (cs.callState === "outgoing") {
          toast("No answer", { icon: "ðŸ“ž" });
          emit("call:end", { callId, userId: authUser._id });
          store.endCallCleanup();
        }
      }, RING_TIMEOUT);
    },
    [authUser, emit, store]
  );

  return { startCall };
};

export default useStartCall;
