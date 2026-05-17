import { useEffect, useRef, useCallback } from "react";
import useCallStore from "../store/useCallStore";
import useSocket from "../hooks/useSocket";
import useAuthUser from "../hooks/useAuthUser";
import { answerCallLog, endCallLog } from "../lib/callApi";
import {
  getUserMedia,
  createPeerConnection,
  createOffer,
  createAnswer,
  setRemoteDescription,
  addIceCandidate,
  addLocalTracks,
} from "../lib/webrtc";
import { createRingtone, createOutgoingTone, playCallEndTone } from "../lib/callTones";
import IncomingCallModal from "./IncomingCallModal";
import ActiveCallScreen from "./ActiveCallScreen";
import toast from "react-hot-toast";

/**
 * Retry wrapper for answerCallLog — retries on transient network errors.
 */
async function answerCallLogWithRetry(data, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await answerCallLog(data);
    } catch (err) {
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      // Final attempt failed — log but don't disrupt the call
      console.warn("answerCallLog failed after retries:", err?.message);
    }
  }
}

const RING_TIMEOUT = 45000; // 45 seconds before auto-ending unanswered call

/**
 * CallProvider — Global component that manages WebRTC calls.
 * Mount once in App.jsx. It listens for socket events and manages
 * the entire call lifecycle including peer connections.
 */
const CallProvider = () => {
  const { socket, emit } = useSocket();
  const { authUser } = useAuthUser();
  const store = useCallStore();
  const ringtoneRef = useRef(null);
  const outgoingToneRef = useRef(null);
  const ringTimeoutRef = useRef(null);
  const iceCandidateQueue = useRef({});
  const remoteAudioRefs = useRef({}); // hidden <audio> elements keyed by peerId

  // ── Centralized tone management ──────────────────────────
  // Create tone instances once
  useEffect(() => {
    ringtoneRef.current = createRingtone();
    outgoingToneRef.current = createOutgoingTone();
    return () => {
      try { ringtoneRef.current?.stop(); } catch {}
      try { outgoingToneRef.current?.stop(); } catch {}
    };
  }, []);

  const stopAllSounds = useCallback(() => {
    try { ringtoneRef.current?.stop(); } catch {}
    try { outgoingToneRef.current?.stop(); } catch {}
  }, []);

  // ── Auto play/stop tones based on call state ─────────────
  const { callState } = store;
  useEffect(() => {
    if (callState === "outgoing") {
      try { outgoingToneRef.current?.play(); } catch {}
    } else if (callState === "incoming") {
      try { ringtoneRef.current?.play(); } catch {}
    } else {
      // Stop all sounds whenever we leave outgoing/incoming
      stopAllSounds();
      if (callState === "idle") {
        // Play call-end beep if we just came from a call
        // (handled by endCallCleanup transitions)
      }
    }
    // Cleanup: stop sounds if this effect re-runs or unmounts
    return () => {
      stopAllSounds();
    };
  }, [callState, stopAllSounds]);

  const clearRingTimeout = useCallback(() => {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
  }, []);

  // ── Setup WebRTC for a 1-on-1 call (caller side) ─────────
  const setupCallerPeerConnection = useCallback(
    async (callId, targetUserId, callType) => {
      try {
        const localStream = await getUserMedia(callType);
        store.setLocalStream(localStream);

        const pc = createPeerConnection({
          onIceCandidate: (candidate) => {
            emit("webrtc:ice-candidate", {
              callId,
              targetUserId,
              candidate,
              fromUserId: authUser._id,
            });
          },
          onTrack: (stream) => {
            store.addRemoteStream(targetUserId, stream);
            // Ensure remote audio plays via a hidden <audio> element
            ensureRemoteAudioPlays(targetUserId, stream);
          },
          onConnectionStateChange: (state) => {
            console.log("Connection state:", state);
            if (state === "disconnected" || state === "failed") {
              store.setReconnecting();
              // Attempt reconnection after a brief delay
              setTimeout(() => {
                const currentState = useCallStore.getState();
                if (currentState.callState === "reconnecting") {
                  handleEndCall(callId);
                }
              }, 10000);
            }
            if (state === "connected") {
              store.setCallConnected();
            }
          },
        });

        addLocalTracks(pc, localStream);
        store.setPeerConnection(targetUserId, pc);

        const offer = await createOffer(pc);
        emit("webrtc:offer", {
          callId,
          targetUserId,
          offer,
          fromUserId: authUser._id,
        });
      } catch (err) {
        console.error("Failed to setup caller peer connection:", err);
        toast.error("Could not access camera/microphone");
        store.endCallCleanup();
      }
    },
    [emit, authUser, store]
  );

  // ── Handle ending a call ───────────────────────────────────
  const handleEndCall = useCallback(
    (callId) => {
      const currentState = useCallStore.getState();
      stopAllSounds();
      clearRingTimeout();

      emit("call:end", {
        callId: callId || currentState.callId,
        userId: authUser?._id,
      });

      endCallLog({
        callId: callId || currentState.callId,
        duration: currentState.callDuration,
        status: currentState.callDuration > 0 ? "ended" : "missed",
      }).catch(() => {});

      store.endCallCleanup();
    },
    [emit, authUser, store, stopAllSounds, clearRingTimeout]
  );

  // ── Initiate a call (delegated to useStartCall hook) ──────
  // NOTE: Pages (ChatPage, GroupChatPage, CallsPage) call useStartCall directly.
  // CallProvider.startCall is only used by ActiveCallScreen for invite features.
  // We do NOT call initiateCallLog here to avoid duplicate DB inserts.
  const startCall = useCallback(
    ({ callType, type, targetId, targetName, targetPic, groupName, groupId }) => {
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

      // Call log is created server-side in the socket call:initiate handler.
      // No frontend HTTP call needed.

      // Auto-end if unanswered
      ringTimeoutRef.current = setTimeout(() => {
        const currentState = useCallStore.getState();
        if (currentState.callState === "outgoing") {
          toast("No answer", { icon: "📞" });
          handleEndCall(callId);
        }
      }, RING_TIMEOUT);
    },
    [authUser, emit, store, handleEndCall]
  );

  // ── Socket event listeners ─────────────────────────────────
  useEffect(() => {
    if (!socket || !authUser) return;

    // Incoming call
    const handleIncomingCall = (data) => {
      const currentState = useCallStore.getState();
      // If already in a call, decline automatically
      if (currentState.callState !== "idle") {
        emit("call:decline", {
          callId: data.callId,
          userId: authUser._id,
          userName: authUser.fullName,
        });
        return;
      }

      store.receiveIncomingCall(data);

      // Ringtone is managed centrally by the callState useEffect

      // Show browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification(
          data.type === "group"
            ? `${data.callerName} • ${data.groupName}`
            : data.callerName,
          {
            body: `Incoming ${data.callType} call...`,
            icon: data.callerPic || "/icon.png",
            tag: `call-${data.callId}`,
            requireInteraction: true,
          }
        );
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        // Auto-close when call ends
        setTimeout(() => notification.close(), RING_TIMEOUT);
      }

      // Vibrate on mobile
      if ("vibrate" in navigator) {
        navigator.vibrate([300, 100, 300, 100, 300]);
      }
    };

    // Call accepted by other user
    const handleCallAccepted = async (data) => {
      const currentState = useCallStore.getState();
      if (currentState.callId !== data.callId) return;

      // Tones auto-stop via callState effect
      clearRingTimeout();

      // Setup WebRTC peer connection (caller side)
      await setupCallerPeerConnection(
        data.callId,
        data.userId,
        currentState.callType
      );
    };

    // Call declined
    const handleCallDeclined = (data) => {
      const currentState = useCallStore.getState();
      if (currentState.callId !== data.callId) return;

      // Tones auto-stop via callState effect
      clearRingTimeout();
      toast(`${data.userName || "User"} declined the call`, { icon: "❌" });
      store.endCallCleanup();
    };

    // Call ended by other party
    const handleCallEnded = (data) => {
      const currentState = useCallStore.getState();
      if (currentState.callId !== data.callId) return;

      // Tones auto-stop via callState effect
      clearRingTimeout();

      if (currentState.callState === "incoming") {
        // Missed call
        toast("Missed call", { icon: "📞" });
      } else if (data.reason === "disconnected") {
        toast("Call disconnected", { icon: "⚠️" });
      } else {
        toast("Call ended", { icon: "📞" });
      }

      store.endCallCleanup();
    };

    // User unavailable (offline)
    const handleUserUnavailable = (data) => {
      const currentState = useCallStore.getState();
      if (currentState.callId !== data.callId) return;

      // Tones auto-stop via callState effect
      clearRingTimeout();
      toast("User is unavailable", { icon: "📵" });
      store.endCallCleanup();
    };

    // Participant joined group call
    const handleParticipantJoined = (data) => {
      const currentState = useCallStore.getState();
      if (currentState.callId !== data.callId) return;

      store.addParticipant({
        userId: data.userId,
        userName: data.userName,
        userPic: data.userPic,
      });
      toast(`${data.userName} joined the call`, { icon: "➕" });
    };

    // Participant left
    const handleParticipantLeft = (data) => {
      const currentState = useCallStore.getState();
      if (currentState.callId !== data.callId) return;

      store.removeParticipant(data.userId);
      store.removePeerConnection(data.userId);
      store.removeRemoteStream(data.userId);

      if (data.reason === "disconnected") {
        toast(`${data.userName || "User"} disconnected`, { icon: "⚠️" });
      } else {
        toast(`${data.userName || "User"} left the call`, { icon: "➖" });
      }

      // If 1-on-1, end the call
      const updatedState = useCallStore.getState();
      if (updatedState.type === "one-on-one") {
        handleEndCall();
      }
    };

    // ── WebRTC signaling events ─────────────────────────────

    const handleWebRTCOffer = async (data) => {
      const currentState = useCallStore.getState();
      if (currentState.callId !== data.callId) return;

      try {
        const localStream =
          currentState.localStream || (await getUserMedia(currentState.callType));
        if (!currentState.localStream) {
          store.setLocalStream(localStream);
        }

        const pc = createPeerConnection({
          onIceCandidate: (candidate) => {
            emit("webrtc:ice-candidate", {
              callId: data.callId,
              targetUserId: data.fromUserId,
              candidate,
              fromUserId: authUser._id,
            });
          },
          onTrack: (stream) => {
            store.addRemoteStream(data.fromUserId, stream);
            // Ensure remote audio plays via a hidden <audio> element
            ensureRemoteAudioPlays(data.fromUserId, stream);
          },
          onConnectionStateChange: (connState) => {
            console.log("Callee connection state:", connState);
            if (connState === "connected") {
              if (useCallStore.getState().callState !== "connected") {
                store.setCallConnected();
              }
            }
            if (connState === "disconnected" || connState === "failed") {
              store.setReconnecting();
              setTimeout(() => {
                if (useCallStore.getState().callState === "reconnecting") {
                  handleEndCall();
                }
              }, 10000);
            }
          },
        });

        addLocalTracks(pc, localStream);
        store.setPeerConnection(data.fromUserId, pc);

        await setRemoteDescription(pc, data.offer);

        // Process queued ICE candidates
        const queued = iceCandidateQueue.current[data.fromUserId] || [];
        for (const candidate of queued) {
          await addIceCandidate(pc, candidate);
        }
        delete iceCandidateQueue.current[data.fromUserId];

        const answer = await createAnswer(pc);
        emit("webrtc:answer", {
          callId: data.callId,
          targetUserId: data.fromUserId,
          answer,
          fromUserId: authUser._id,
        });
      } catch (err) {
        console.error("Error handling WebRTC offer:", err);
        toast.error("Failed to connect call");
      }
    };

    const handleWebRTCAnswer = async (data) => {
      const currentState = useCallStore.getState();
      if (currentState.callId !== data.callId) return;

      const pc = currentState.peerConnections[data.fromUserId];
      if (pc) {
        try {
          await setRemoteDescription(pc, data.answer);

          // Process queued ICE candidates
          const queued = iceCandidateQueue.current[data.fromUserId] || [];
          for (const candidate of queued) {
            await addIceCandidate(pc, candidate);
          }
          delete iceCandidateQueue.current[data.fromUserId];
        } catch (err) {
          console.error("Error setting remote description:", err);
        }
      }
    };

    const handleICECandidate = async (data) => {
      const currentState = useCallStore.getState();
      if (currentState.callId !== data.callId) return;

      const pc = currentState.peerConnections[data.fromUserId];
      if (pc && pc.remoteDescription) {
        await addIceCandidate(pc, data.candidate);
      } else {
        // Queue the candidate
        if (!iceCandidateQueue.current[data.fromUserId]) {
          iceCandidateQueue.current[data.fromUserId] = [];
        }
        iceCandidateQueue.current[data.fromUserId].push(data.candidate);
      }
    };

    // ── Register all listeners ──────────────────────────────
    socket.on("call:incoming", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("call:declined", handleCallDeclined);
    socket.on("call:ended", handleCallEnded);
    socket.on("call:user-unavailable", handleUserUnavailable);
    socket.on("call:participant-joined", handleParticipantJoined);
    socket.on("call:participant-left", handleParticipantLeft);
    socket.on("call:participant-declined", (data) => {
      toast(`${data.userName || "User"} declined`, { icon: "❌" });
    });
    socket.on("webrtc:offer", handleWebRTCOffer);
    socket.on("webrtc:answer", handleWebRTCAnswer);
    socket.on("webrtc:ice-candidate", handleICECandidate);
    socket.on("call:message", ({ callId, message }) => {
      const currentState = useCallStore.getState();
      if (currentState.callId === callId) {
        store.addCallMessage(message);
      }
    });
    socket.on("call:status-update", ({ callId, userId, isMuted, isCameraOff }) => {
      const currentState = useCallStore.getState();
      if (currentState.callId === callId) {
        store.updateParticipantStatus(userId, { isMuted, isCameraOff });
      }
    });

    return () => {
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("call:declined", handleCallDeclined);
      socket.off("call:ended", handleCallEnded);
      socket.off("call:user-unavailable", handleUserUnavailable);
      socket.off("call:participant-joined", handleParticipantJoined);
      socket.off("call:participant-left", handleParticipantLeft);
      socket.off("call:participant-declined");
      socket.off("webrtc:offer", handleWebRTCOffer);
      socket.off("webrtc:answer", handleWebRTCAnswer);
      socket.off("webrtc:ice-candidate", handleICECandidate);
      socket.off("call:message");
      socket.off("call:status-update");
    };
  }, [
    socket,
    authUser,
    emit,
    store,
    stopAllSounds,
    clearRingTimeout,
    setupCallerPeerConnection,
    handleEndCall,
  ]);

  // ── Accept call handler ────────────────────────────────────
  const handleAcceptCall = useCallback(async () => {
    const currentState = useCallStore.getState();
    if (!currentState.callId || !authUser) return;

    // Tones auto-stop via callState effect

    try {
      // Get local media
      const localStream = await getUserMedia(currentState.callType);
      store.setLocalStream(localStream);

      // Notify via socket
      emit("call:accept", {
        callId: currentState.callId,
        userId: authUser._id,
        userName: authUser.fullName,
        userPic: authUser.profilePic || "",
      });

      // Log answer to database (with retry for rare timing edge cases)
      answerCallLogWithRetry({
        callId: currentState.callId,
        userId: authUser._id,
      }).catch(console.error);

      // The actual WebRTC connection will be established when we receive
      // the offer from the caller (handled in handleWebRTCOffer)
    } catch (err) {
      console.error("Failed to accept call:", err);
      toast.error("Could not access camera/microphone");
      store.endCallCleanup();
    }
  }, [authUser, emit, store]);

  // ── Decline call handler ───────────────────────────────────
  const handleDeclineCall = useCallback(() => {
    const currentState = useCallStore.getState();
    if (!currentState.callId || !authUser) return;

    // Tones auto-stop via callState effect

    emit("call:decline", {
      callId: currentState.callId,
      userId: authUser._id,
      userName: authUser.fullName,
    });

    endCallLog({
      callId: currentState.callId,
      duration: 0,
      status: "declined",
    }).catch(() => {});

    store.endCallCleanup();
  }, [authUser, emit, store]);

  // ── Ensure remote audio plays (hidden <audio> element) ─────
  const ensureRemoteAudioPlays = useCallback((peerId, stream) => {
    if (!stream) return;
    // Reuse or create a hidden audio element for this peer
    let audioEl = remoteAudioRefs.current[peerId];
    if (!audioEl) {
      audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.playsInline = true;
      audioEl.style.display = "none";
      document.body.appendChild(audioEl);
      remoteAudioRefs.current[peerId] = audioEl;
    }
    audioEl.srcObject = stream;
    // Ensure playback starts (browsers may block without user gesture)
    audioEl.play().catch(() => {});
  }, []);

  // Cleanup hidden audio elements when call ends
  useEffect(() => {
    if (callState === "idle") {
      Object.values(remoteAudioRefs.current).forEach((el) => {
        try {
          el.srcObject = null;
          el.remove();
        } catch {}
      });
      remoteAudioRefs.current = {};
    }
  }, [callState]);

  // ── Render call UI based on state ──────────────────────────

  return (
    <>
      {callState === "incoming" && (
        <IncomingCallModal
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}

      {(callState === "outgoing" ||
        callState === "connected" ||
        callState === "reconnecting") && (
        <ActiveCallScreen
          onEndCall={() => handleEndCall()}
          startCall={startCall}
        />
      )}
    </>
  );
};

// Export startCall for use by ChatPage/GroupChatPage
export { CallProvider };
export default CallProvider;
