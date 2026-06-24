import { useEffect } from "react";
import {
  VideoTrack,
  useTracks,
  useRoomContext,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import ProfileAvatar from "../../../components/ProfileAvatar";
import useCallStore from "../store/callSlice";
import { useCallSession } from "../hooks/useCallSession";
import LiveKitRoomProvider from "../providers/LiveKitRoomProvider";
import CallControls from "./CallControls";
import ParticipantsPanel from "./ParticipantsPanel";

function GroupCallContent() {
  const { callType, groupInfo, activeSpeakerId } = useCallStore();
  const room = useRoomContext();

  const videoTracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: true }
  );

  useEffect(() => {
    if (callType === "video") {
      room?.localParticipant?.setCameraEnabled(true);
      useCallStore.getState().setCameraEnabled(true);
    }
  }, [room, callType]);

  const gridClass =
    videoTracks.length <= 2
      ? "grid-cols-1"
      : videoTracks.length <= 4
        ? "grid-cols-2"
        : "grid-cols-3";

  return (
    <div className="call-screen group-layout flex">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 text-white">
          <h2 className="text-lg font-semibold">{groupInfo?.name || "Group Call"}</h2>
        </div>

        {callType === "video" ? (
          <div className={`call-video-grid ${gridClass} flex-1 p-4 gap-3 overflow-y-auto`}>
            {videoTracks.map((trackRef) => (
              <div
                key={trackRef.participant.identity + trackRef.source}
                className={`call-grid-tile ${
                  activeSpeakerId === trackRef.participant.identity ? "speaker-active" : ""
                }`}
              >
                {trackRef.publication?.track ? (
                  <VideoTrack trackRef={trackRef} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full bg-slate-800">
                    <ProfileAvatar
                      name={trackRef.participant.name || trackRef.participant.identity}
                      size="w-16 h-16"
                      textSize="text-xl"
                    />
                  </div>
                )}
                <span className="call-participant-label">
                  {trackRef.participant.isLocal
                    ? "You"
                    : trackRef.participant.name || trackRef.participant.identity}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/70 text-lg">Group voice call</p>
          </div>
        )}

        <CallControls showEndForHost />
      </div>
      <ParticipantsPanel />
    </div>
  );
}

import { KeepAwake } from '@capacitor-community/keep-awake';

export function GroupCallScreen() {
  const { hangUp: endSession } = useCallSession();
  const { isMinimized } = useCallStore();

  useEffect(() => {
    KeepAwake.keepAwake().catch(() => {});
    return () => {
      KeepAwake.allowSleep().catch(() => {});
    };
  }, []);

  if (isMinimized) return null;

  const onLeave = () => endSession();

  return (
    <div className="fixed inset-0 z-[150] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <LiveKitRoomProvider onLeave={onLeave}>
        <GroupCallContent />
      </LiveKitRoomProvider>
    </div>
  );
}

export default GroupCallScreen;
