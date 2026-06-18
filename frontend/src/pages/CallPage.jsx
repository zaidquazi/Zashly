import { Navigate, useParams } from "react-router";
import { useEffect } from "react";
import useCallStore from "../features/calls/store/callSlice";
import { FriendCallScreen } from "../features/calls/components/FriendCallScreen";
import { useCallSession } from "../features/calls/hooks/useCallSession";
import "../features/calls/call-ui.css";

const CallPage = () => {
  const { userId } = useParams();
  const { callState } = useCallStore();
  const { startPersonalCall } = useCallSession();

  useEffect(() => {
    if (callState === "idle" && userId) {
      startPersonalCall({ targetId: userId, type: "voice" });
    }
  }, [userId, callState, startPersonalCall]);

  if (callState === "idle") return <Navigate to="/app" replace />;
  if (callState === "connected") return <FriendCallScreen />;
  return null;
};

export default CallPage;
