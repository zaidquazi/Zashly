import { useEffect, useRef } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import useCallStore from "../store/callSlice";
import useAuthUser from "../../../hooks/useAuthUser";

function RoomEventBridge({ onLeave }) {
  const room = useRoomContext();
  const { setParticipants, setActiveSpeaker, setNetworkQuality } = useCallStore();
  const { authUser } = useAuthUser();

  useEffect(() => {
    if (!room) return;

    const onDisconnected = () => onLeave?.();
    const onActiveSpeakers = (speakers) => {
      const top = speakers?.[0];
      if (top) setActiveSpeaker(top.identity);
    };
    const onParticipantConnected = () => {
      const list = Array.from(room.remoteParticipants.values()).map((p) => ({
        identity: p.identity,
        name: p.name || p.identity,
        isLocal: false,
      }));
      list.unshift({
        identity: authUser?._id,
        name: authUser?.fullName || "You",
        isLocal: true,
      });
      setParticipants(list);
    };

    room.on("disconnected", onDisconnected);
    room.on("activeSpeakersChanged", onActiveSpeakers);
    room.on("participantConnected", onParticipantConnected);
    room.on("participantDisconnected", onParticipantConnected);

    onParticipantConnected();

    return () => {
      room.off("disconnected", onDisconnected);
      room.off("activeSpeakersChanged", onActiveSpeakers);
      room.off("participantConnected", onParticipantConnected);
      room.off("participantDisconnected", onParticipantConnected);
    };
  }, [room, onLeave, setParticipants, setActiveSpeaker, authUser, setNetworkQuality]);

  const tracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: true }],
    { onlySubscribed: false }
  );

  const lastQualityRef = useRef(null);

  useEffect(() => {
    const local = tracks.find((t) => t.participant?.isLocal);
    if (local?.participant) {
      const q = local.participant.connectionQuality;
      const map = { excellent: "excellent", good: "good", poor: "poor", lost: "poor" };
      const resolved = map[q] || "moderate";
      if (resolved !== lastQualityRef.current) {
        lastQualityRef.current = resolved;
        setNetworkQuality(resolved);
      }
    }
  }, [tracks, setNetworkQuality]);

  return <RoomAudioRenderer />;
}

export function LiveKitRoomProvider({ children, onLeave }) {
  const { token, serverUrl, callState, micEnabled, cameraEnabled } = useCallStore();
  const connectOptions = useRef({ autoSubscribe: true });

  if (callState !== "connected" || !token || !serverUrl) return null;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={micEnabled}
      video={cameraEnabled}
      options={connectOptions.current}
      onDisconnected={onLeave}
      className="lk-room-root h-full w-full"
    >
      <RoomEventBridge onLeave={onLeave} />
      {children}
    </LiveKitRoom>
  );
}

export default LiveKitRoomProvider;
