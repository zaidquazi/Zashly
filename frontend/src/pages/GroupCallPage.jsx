import { Navigate, useParams, useSearchParams } from "react-router";
import { useEffect } from "react";
import useCallStore from "../features/calls/store/callSlice";
import { GroupCallScreen } from "../features/calls/components/GroupCallScreen";
import { useCallSession } from "../features/calls/hooks/useCallSession";
import "../features/calls/call-ui.css";

const GroupCallPage = () => {
  const { groupId } = useParams();
  const [search] = useSearchParams();
  const type = search.get("type") === "video" ? "video" : "voice";
  const { callState } = useCallStore();
  const { startGroupCall } = useCallSession();

  useEffect(() => {
    if (callState === "idle" && groupId) {
      startGroupCall({ groupId, groupName: "Group", type });
    }
  }, [groupId, type, callState, startGroupCall]);

  if (callState === "idle") return <Navigate to={`/group/${groupId}`} replace />;
  if (callState === "connected") return <GroupCallScreen />;
  return null;
};

export default GroupCallPage;
