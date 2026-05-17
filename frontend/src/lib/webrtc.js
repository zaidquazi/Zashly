const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];

export async function getUserMedia(callType = "video") {
  const constraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: callType === "video"
      ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: "user",
        }
      : false,
  };

  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    console.error("Failed to get user media:", err);

    if (callType === "video") {
      console.warn("Falling back to audio-only...");
      try {
        return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (audioErr) {
        console.error("Audio-only fallback also failed:", audioErr);
        throw audioErr;
      }
    }
    throw err;
  }
}

export function createPeerConnection({
  onIceCandidate,
  onTrack,
  onConnectionStateChange,
  onIceConnectionStateChange,
}) {
  const pc = new RTCPeerConnection({
    iceServers: ICE_SERVERS,
    iceCandidatePoolSize: 10,
  });

  if (onIceCandidate) {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };
  }

  if (onTrack) {
    let _remoteStream = null;
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        _remoteStream = event.streams[0];
      } else {
        if (!_remoteStream) _remoteStream = new MediaStream();
        _remoteStream.addTrack(event.track);
      }
      onTrack(_remoteStream);
    };
  }

  if (onConnectionStateChange) {
    pc.onconnectionstatechange = () => {
      onConnectionStateChange(pc.connectionState);
    };
  }

  if (onIceConnectionStateChange) {
    pc.oniceconnectionstatechange = () => {
      onIceConnectionStateChange(pc.iceConnectionState);
    };
  }

  return pc;
}

export async function createOffer(pc) {
  const offer = await pc.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
  });
  await pc.setLocalDescription(offer);
  return offer;
}

export async function createAnswer(pc) {
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

export async function setRemoteDescription(pc, description) {
  await pc.setRemoteDescription(new RTCSessionDescription(description));
}

export async function addIceCandidate(pc, candidate) {
  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (err) {
    console.error("Error adding ICE candidate:", err);
  }
}

export function addLocalTracks(pc, localStream) {
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });
}

export async function switchCamera(localStream) {
  const videoTrack = localStream.getVideoTracks()[0];
  if (!videoTrack) return localStream;

  const currentFacing = videoTrack.getSettings().facingMode;
  const newFacing = currentFacing === "user" ? "environment" : "user";

  videoTrack.stop();

  try {
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: newFacing },
      audio: false,
    });
    const newTrack = newStream.getVideoTracks()[0];
    localStream.removeTrack(videoTrack);
    localStream.addTrack(newTrack);
    return newTrack;
  } catch (err) {
    console.error("Failed to switch camera:", err);
    return null;
  }
}

export function formatCallDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
