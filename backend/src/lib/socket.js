import { Server } from "socket.io";
import Group from "../models/Group.js";
import User from "../models/User.js";
import Blacklist from "../models/Blacklist.js";
import CallLog from "../models/CallLog.js";

let io = null;
const onlineUsers = new Map();
const activeCalls = new Map();

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const ip = socket.handshake.address;
    try {
      const isBanned = await Blacklist.findOne({ type: "ip", value: ip });
      if (isBanned) {
        return next(new Error("Your IP is banned from this server."));
      }
      next();
    } catch (err) {
      next();
    }
  });

  io.on("connection", (socket) => {
    socket.on("user-online", async (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.broadcast.emit("friendStatusChange", { userId, isOnline: true });
      socket.emit("online-users-list", Array.from(onlineUsers.keys()));

      try {
        const groups = await Group.find({ members: userId }).select("_id");
        groups.forEach((g) => {
          socket.join(`group:${g._id}`);
        });
      } catch (err) {
        console.error("Error joining group rooms:", err.message);
      }
    });

    socket.on("call:initiate", async (data) => {
      const {
        callId,
        callerId,
        callerName,
        callerPic,
        targetId,
        type,
        callType,
        groupName,
      } = data;

      console.log(`📞 Call initiated: ${callId} by ${callerName} (${type} ${callType})`);

      // Store active call in memory
      activeCalls.set(callId, {
        callerId,
        callerName,
        callerPic,
        type,
        callType,
        targetId,
        groupName,
        participants: new Set([callerId]),
        startTime: null,
      });

      let targetName = "";
      try {
        if (type === "one-on-one") {
          const target = await User.findById(targetId).select("fullName");
          targetName = target?.fullName || "";
        } else {
          const group = await Group.findById(targetId).select("name");
          targetName = group?.name || "";
        }

        await CallLog.findOneAndUpdate(
          { callId },
          {
            $setOnInsert: {
              callerId,
              callerName: callerName || "",
              callerPic: callerPic || "",
              callType: callType || "video",
              type,
              targetId,
              targetName,
              callId,
              status: "ringing",
              participants: [callerId],
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (dbErr) {
        console.error("Error creating call log from socket:", dbErr.message);
      }

      if (type === "one-on-one") {
        const targetSocketId = onlineUsers.get(targetId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("call:incoming", {
            callId,
            callerId,
            callerName,
            callerPic,
            type,
            callType,
          });
        } else {
          socket.emit("call:user-unavailable", { callId, targetId });
          await CallLog.findOneAndUpdate(
            { callId },
            { status: "missed" }
          ).catch(() => {});
          activeCalls.delete(callId);
        }
      } else if (type === "group") {
        try {
          const group = await Group.findById(targetId)
            .select("members name")
            .lean();
          if (group) {
            const memberIds = group.members.map((m) => m.toString());
            memberIds.forEach((memberId) => {
              if (memberId !== callerId) {
                const memberSocketId = onlineUsers.get(memberId);
                if (memberSocketId) {
                  io.to(memberSocketId).emit("call:incoming", {
                    callId,
                    callerId,
                    callerName,
                    callerPic,
                    type,
                    callType,
                    groupName: groupName || group.name,
                    groupId: targetId,
                  });
                }
              }
            });
          }
        } catch (err) {
          console.error("Error sending group call:", err.message);
        }
      }
    });

    socket.on("call:accept", (data) => {
      const { callId, userId, userName, userPic } = data;

      const call = activeCalls.get(callId);
      if (call) {
        call.participants.add(userId);
        if (!call.startTime) call.startTime = Date.now();

        const callerSocketId = onlineUsers.get(call.callerId);
        if (callerSocketId) {
          io.to(callerSocketId).emit("call:accepted", {
            callId,
            userId,
            userName,
            userPic,
          });
        }

        if (call.type === "group") {
          call.participants.forEach((pid) => {
            if (pid !== userId) {
              const pSocketId = onlineUsers.get(pid);
              if (pSocketId) {
                io.to(pSocketId).emit("call:participant-joined", {
                  callId,
                  userId,
                  userName,
                  userPic,
                  participants: Array.from(call.participants),
                });
              }
            }
          });
        }
      }
    });

    socket.on("call:decline", async (data) => {
      const { callId, userId, userName } = data;

      const call = activeCalls.get(callId);
      if (call) {
        if (call.type === "one-on-one") {
          const callerSocketId = onlineUsers.get(call.callerId);
          if (callerSocketId) {
            io.to(callerSocketId).emit("call:declined", {
              callId,
              userId,
              userName,
            });
          }
          await CallLog.findOneAndUpdate(
            { callId },
            { status: "declined", endedAt: new Date() }
          ).catch(() => {});
          activeCalls.delete(callId);
        } else {
          const callerSocketId = onlineUsers.get(call.callerId);
          if (callerSocketId) {
            io.to(callerSocketId).emit("call:participant-declined", {
              callId,
              userId,
              userName,
            });
          }
        }
      }
    });

    socket.on("call:end", async (data) => {
      const { callId, userId } = data;

      const call = activeCalls.get(callId);
      if (call) {
        const duration = call.startTime
          ? Math.floor((Date.now() - call.startTime) / 1000)
          : 0;

        call.participants.forEach((pid) => {
          if (pid !== userId) {
            const pSocketId = onlineUsers.get(pid);
            if (pSocketId) {
              io.to(pSocketId).emit("call:ended", {
                callId,
                endedBy: userId,
                duration,
              });
            }
          }
        });

        if (call.type === "one-on-one") {
          const targetSocketId = onlineUsers.get(call.targetId);
          if (targetSocketId && !call.participants.has(call.targetId)) {
            io.to(targetSocketId).emit("call:ended", {
              callId,
              endedBy: userId,
              duration: 0,
            });
          }
        }

        if (call.type === "group") {
          try {
            const group = await Group.findById(call.targetId)
              .select("members")
              .lean();
            if (group) {
              group.members.forEach((m) => {
                const mid = m.toString();
                if (mid !== userId && !call.participants.has(mid)) {
                  const mSocketId = onlineUsers.get(mid);
                  if (mSocketId) {
                    io.to(mSocketId).emit("call:ended", {
                      callId,
                      endedBy: userId,
                      duration: 0,
                    });
                  }
                }
              });
            }
          } catch (err) {
            console.error("Error notifying group call end:", err.message);
          }
        }

        const finalStatus = call.startTime ? "ended" : "missed";
        await CallLog.findOneAndUpdate(
          { callId },
          {
            status: finalStatus,
            duration,
            endedAt: new Date(),
            participants: Array.from(call.participants),
          }
        ).catch(() => {});

        activeCalls.delete(callId);
      }
    });

    socket.on("call:join", (data) => {
      const { callId, userId, userName, userPic } = data;

      const call = activeCalls.get(callId);
      if (call) {
        call.participants.add(userId);

        call.participants.forEach((pid) => {
          if (pid !== userId) {
            const pSocketId = onlineUsers.get(pid);
            if (pSocketId) {
              io.to(pSocketId).emit("call:participant-joined", {
                callId,
                userId,
                userName,
                userPic,
                participants: Array.from(call.participants),
              });
            }
          }
        });
      }
    });

    socket.on("call:leave", async (data) => {
      const { callId, userId, userName } = data;

      const call = activeCalls.get(callId);
      if (call) {
        call.participants.delete(userId);

        call.participants.forEach((pid) => {
          const pSocketId = onlineUsers.get(pid);
          if (pSocketId) {
            io.to(pSocketId).emit("call:participant-left", {
              callId,
              userId,
              userName,
              participants: Array.from(call.participants),
            });
          }
        });

        if (call.participants.size === 0) {
          const duration = call.startTime
            ? Math.floor((Date.now() - call.startTime) / 1000)
            : 0;
          await CallLog.findOneAndUpdate(
            { callId },
            {
              status: "ended",
              duration,
              endedAt: new Date(),
            }
          ).catch(() => {});
          activeCalls.delete(callId);
        }
      }
    });

    socket.on("webrtc:offer", (data) => {
      const { targetUserId, offer, callId, fromUserId } = data;
      const targetSocketId = onlineUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc:offer", {
          callId,
          offer,
          fromUserId,
        });
      }
    });

    socket.on("webrtc:answer", (data) => {
      const { targetUserId, answer, callId, fromUserId } = data;
      const targetSocketId = onlineUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc:answer", {
          callId,
          answer,
          fromUserId,
        });
      }
    });

    socket.on("webrtc:ice-candidate", (data) => {
      const { targetUserId, candidate, callId, fromUserId } = data;
      const targetSocketId = onlineUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc:ice-candidate", {
          callId,
          candidate,
          fromUserId,
        });
      }
    });

    socket.on("call:message", (data) => {
      const { callId, message } = data;
      const call = activeCalls.get(callId);
      if (call) {
        // Broadcast message to all other participants in the call
        call.participants.forEach((pid) => {
          if (pid !== message.senderId) {
            const pSocketId = onlineUsers.get(pid);
            if (pSocketId) {
              io.to(pSocketId).emit("call:message", { callId, message });
            }
          }
        });
      }
    });

    socket.on("call:status-update", (data) => {
      const { callId, userId, isMuted, isCameraOff } = data;
      const call = activeCalls.get(callId);
      if (call) {
        call.participants.forEach((pid) => {
          if (pid !== userId) {
            const pSocketId = onlineUsers.get(pid);
            if (pSocketId) {
              io.to(pSocketId).emit("call:status-update", {
                callId,
                userId,
                isMuted,
                isCameraOff,
              });
            }
          }
        });
      }
    });

    socket.on("group-message", async (data) => {
      try {
        const sender = await User.findById(data.message.sender._id || data.message.sender).select("isShadowBanned strikes isBanned fullName");
        
        if (sender?.isShadowBanned) {
          return;
        }

        // ── Auto-Moderation ──────────────────────────────────
        const messageText = data.message.content || data.message.text || "";
        if (messageText) {
          const { checkMessage } = await import("../lib/autoModeration.js");
          const result = await checkMessage(messageText);

          if (result.flagged) {
            if (result.action === "block") {
              // Drop the message entirely — notify only the sender
              socket.emit("message-blocked", {
                reason: "Your message was blocked by auto-moderation.",
                matches: result.matches.map((m) => m.word),
              });
              return;
            }

            if (result.action === "strike") {
              // Apply a strike to the sender
              sender.strikes = (sender.strikes || 0) + 1;
              if (sender.strikes >= 3) sender.isBanned = true;
              await sender.save();

              socket.emit("message-blocked", {
                reason: `Your message violated community guidelines. Strike ${sender.strikes}/3.`,
                matches: result.matches.map((m) => m.word),
              });
              return;
            }

            // Default: "censor" — replace bad words with ***
            if (data.message.content) data.message.content = result.censored;
            if (data.message.text) data.message.text = result.censored;
          }
        }

        socket.to(`group:${data.groupId}`).emit("new-group-message", data.message);
      } catch (err) {
        console.error("Error in group-message socket handler:", err.message);
      }
    });

    socket.on("typing-start", ({ groupId, userId, userName }) => {
      socket.to(`group:${groupId}`).emit("user-typing", {
        groupId,
        userId,
        userName,
        isTyping: true,
      });
    });

    socket.on("typing-stop", ({ groupId, userId }) => {
      socket.to(`group:${groupId}`).emit("user-typing", {
        groupId,
        userId,
        isTyping: false,
      });
    });

    socket.on("join-group", (groupId) => {
      socket.join(`group:${groupId}`);
    });

    socket.on("leave-group", (groupId) => {
      socket.leave(`group:${groupId}`);
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          socket.broadcast.emit("friendStatusChange", { userId, isOnline: false });

          // Update lastSeen in DB
          User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch((err) =>
            console.error("Error updating lastSeen on disconnect:", err.message)
          );

          for (const [callId, call] of activeCalls.entries()) {
            if (call.participants.has(userId)) {
              call.participants.delete(userId);

              call.participants.forEach((pid) => {
                const pSocketId = onlineUsers.get(pid);
                if (pSocketId) {
                  io.to(pSocketId).emit("call:participant-left", {
                    callId,
                    userId,
                    userName: "User",
                    reason: "disconnected",
                    participants: Array.from(call.participants),
                  });
                }
              });

              if (call.type === "one-on-one" && call.participants.size === 0) {
                const targetSocketId = onlineUsers.get(call.targetId);
                if (targetSocketId) {
                  io.to(targetSocketId).emit("call:ended", {
                    callId,
                    endedBy: userId,
                    reason: "disconnected",
                    duration: 0,
                  });
                }
                activeCalls.delete(callId);
              }

              if (call.type === "group" && call.participants.size === 0) {
                activeCalls.delete(callId);
              }
            }
          }

          break;
        }
      }
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized. Call initSocket() first.");
  }
  return io;
}

export function getOnlineUsers() {
  return onlineUsers;
}

export function getActiveCalls() {
  return activeCalls;
}
