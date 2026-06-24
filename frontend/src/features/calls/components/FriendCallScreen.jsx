import { useEffect } from "react";
import { motion } from "framer-motion";
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

function FriendCallContent() {
  const { remoteUser, callType } = useCallStore();
  const room = useRoomContext();

  const videoTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }, { source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: true }
  );

  const remoteVideo = videoTracks.find((t) => !t.participant.isLocal && t.publication?.track);
  const localVideo = videoTracks.find((t) => t.participant.isLocal);

  useEffect(() => {
    if (callType === "voice") return;
    room?.localParticipant?.setCameraEnabled(true);
    useCallStore.getState().setCameraEnabled(true);
  }, [room, callType]);

  if (callType === "video") {
    return (
      <div className="call-screen video-layout">
        <div className="call-main-video">
          {remoteVideo ? (
            <VideoTrack trackRef={remoteVideo} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <ProfileAvatar
                src={remoteUser?.image}
                name={remoteUser?.name || "User"}
                size="w-32 h-32"
                textSize="text-4xl"
              />
              <p className="text-white text-lg">{remoteUser?.name}</p>
            </div>
          )}
        </div>

        {localVideo?.publication?.track && (
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            className="call-pip-video"
          >
            <VideoTrack trackRef={localVideo} className="w-full h-full object-cover rounded-xl" />
          </motion.div>
        )}

        <CallControls />
      </div>
    );
  }

  return (
    <div className="call-screen voice-layout">
      <motion.div
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="flex flex-col items-center gap-6"
      >
        <ProfileAvatar
          src={remoteUser?.image}
          name={remoteUser?.name || "User"}
          size="w-36 h-36"
          textSize="text-5xl"
        />
        <h2 className="text-2xl font-bold text-white">{remoteUser?.name}</h2>
        <p className="text-white/60">Voice call in progress</p>
      </motion.div>
      <CallControls />
    </div>
  );
}

import { KeepAwake } from '@capacitor-community/keep-awake';

export function FriendCallScreen() {
  const { hangUp } = useCallSession();
  const { isMinimized } = useCallStore();

  useEffect(() => {
    // Keep screen awake while in call
    KeepAwake.keepAwake().catch(() => {});
    return () => {
      KeepAwake.allowSleep().catch(() => {});
    };
  }, []);

  if (isMinimized) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <LiveKitRoomProvider onLeave={hangUp}>
        <FriendCallContent />
      </LiveKitRoomProvider>
    </div>
  );
}

export default FriendCallScreen;
