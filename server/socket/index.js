import Room from '../models/Room.js';

// In-memory room occupancy tracking: roomId -> Map<socketId, { socketId, username, joinedAt }>
const roomUsers = new Map();

export const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Welcome ping
    socket.emit('devsync:connected', {
      message: 'Welcome to DevSync real-time server',
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });

    // Diagnostic ping/pong
    socket.on('devsync:ping', (data) => {
      socket.emit('devsync:pong', {
        clientData: data,
        serverTime: Date.now(),
      });
    });

    // Event: join-room ({ roomId, username, isHost })
    socket.on('join-room', async ({ roomId, username, isHost }) => {
      if (!roomId) return;

      const normalizedRoomId = roomId.trim().toUpperCase();
      const cleanUsername = username?.trim() || 'Anonymous Developer';

      // Save room info on socket instance
      socket.data.roomId = normalizedRoomId;
      socket.data.username = cleanUsername;
      socket.data.isHost = Boolean(isHost);

      socket.join(normalizedRoomId);
      if (isHost) {
        socket.join(`${normalizedRoomId}:host`);
      }

      if (!roomUsers.has(normalizedRoomId)) {
        roomUsers.set(normalizedRoomId, new Map());
      }

      roomUsers.get(normalizedRoomId).set(socket.id, {
        socketId: socket.id,
        username: cleanUsername,
        joinedAt: new Date().toISOString(),
      });

      const usersInRoom = Array.from(roomUsers.get(normalizedRoomId).values());

      console.log(
        `[Socket.io] User "${cleanUsername}" (${socket.id}) joined room "${normalizedRoomId}". Active users: ${usersInRoom.length}`
      );

      // Broadcast updated user list to everyone in the room (including joiner)
      io.to(normalizedRoomId).emit('room-users', {
        roomId: normalizedRoomId,
        users: usersInRoom,
        count: usersInRoom.length,
        actionUser: cleanUsername,
        action: 'joined',
      });
    });

    // Event: code-change ({ roomId, code })
    socket.on('code-change', async ({ roomId, code }) => {
      if (!roomId || code === undefined) return;

      const normalizedRoomId = roomId.trim().toUpperCase();

      // Broadcast code exclusively to all other clients in the room
      socket.to(normalizedRoomId).emit('code-update', code);

      // Asynchronously update MongoDB document
      try {
        await Room.updateOne({ roomId: normalizedRoomId }, { code });
      } catch (err) {
        console.error(`[Socket.io] Error updating room code in DB: ${err.message}`);
      }
    });

    // Event: language-change ({ roomId, language })
    socket.on('language-change', async ({ roomId, language }) => {
      if (!roomId || !language) return;

      const normalizedRoomId = roomId.trim().toUpperCase();

      // Broadcast new language to all other clients in the room
      socket.to(normalizedRoomId).emit('language-update', language);

      // Asynchronously update MongoDB document
      try {
        await Room.updateOne({ roomId: normalizedRoomId }, { language });
      } catch (err) {
        console.error(`[Socket.io] Error updating room language in DB: ${err.message}`);
      }
    });

    // Event: problem-change ({ roomId, problemDescription, title, testCases })
    socket.on('problem-change', async ({ roomId, problemDescription, title, testCases }) => {
      if (!roomId) return;

      const normalizedRoomId = roomId.trim().toUpperCase();

      // Broadcast updated problem statement & test cases to all peers in room
      socket.to(normalizedRoomId).emit('problem-update', {
        problemDescription,
        title,
        testCases,
      });

      try {
        const updateFields = {};
        if (problemDescription !== undefined) updateFields.problemDescription = problemDescription;
        if (title !== undefined) updateFields.title = title;
        if (Array.isArray(testCases)) updateFields.testCases = testCases;
        await Room.updateOne({ roomId: normalizedRoomId }, updateFields);
      } catch (err) {
        console.error(`[Socket.io] Error updating room problem in DB: ${err.message}`);
      }
    });

    // Event: send-message ({ roomId, message, sender })
    socket.on('send-message', ({ roomId, message, sender }) => {
      if (!roomId || !message?.trim()) return;

      const normalizedRoomId = roomId.trim().toUpperCase();
      const cleanSender = sender?.trim() || socket.data.username || 'Anonymous Developer';

      const chatPayload = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        roomId: normalizedRoomId,
        sender: cleanSender,
        message: message.trim(),
        timestamp: new Date().toISOString(),
        socketId: socket.id,
      };

      console.log(
        `[Socket.io Chat] [${normalizedRoomId}] ${cleanSender}: ${message.trim().substring(0, 30)}...`
      );

      // Broadcast to all clients in the room (including sender for acknowledgment)
      io.to(normalizedRoomId).emit('receive-message', chatPayload);
    });

    // Event: register-host ({ roomId })
    socket.on('register-host', ({ roomId }) => {
      if (!roomId) return;
      const normalizedRoomId = roomId.trim().toUpperCase();
      socket.data.isHost = true;
      socket.join(`${normalizedRoomId}:host`);
      console.log(`[Socket.io] Socket ${socket.id} registered as Host for room ${normalizedRoomId}`);
    });

    // Event: flag-integrity-event ({ roomId, type, charCount, timestamp, snippet, user })
    socket.on('flag-integrity-event', ({ roomId, type, charCount, timestamp, snippet, user }) => {
      if (!roomId) return;
      const normalizedRoomId = roomId.trim().toUpperCase();
      const cleanUser = user || socket.data.username || 'Candidate';
      const eventTime = timestamp || new Date().toISOString();

      const alertPayload = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        roomId: normalizedRoomId,
        type: type || 'BULK_PASTE',
        charCount: Number(charCount) || 0,
        timestamp: eventTime,
        user: cleanUser,
        snippet: snippet ? String(snippet).slice(0, 100) : '',
        message: `⚠️ Alert: ${charCount} characters pasted in a single keystroke.`,
      };

      console.warn(
        `[Socket.io Anti-Cheat Alert] [${normalizedRoomId}] ${cleanUser}: ${alertPayload.message}`
      );

      // Broadcast exclusively to the host's socket connection (and fallback to other room peers if no dedicated host joined yet)
      const hostRoom = io.sockets.adapter.rooms.get(`${normalizedRoomId}:host`);
      if (hostRoom && hostRoom.size > 0) {
        io.to(`${normalizedRoomId}:host`).emit('integrity-alert', alertPayload);
      } else {
        // Broadcast to peers so host on same room channel receives it
        socket.to(normalizedRoomId).emit('integrity-alert', alertPayload);
      }
    });

    // Event: timeline-event ({ roomId, text, type, timestamp })
    socket.on('timeline-event', ({ roomId, text, type, timestamp }) => {
      if (!roomId || !text) return;
      const normalizedRoomId = roomId.trim().toUpperCase();

      const timelinePayload = {
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        roomId: normalizedRoomId,
        text,
        type: type || 'GENERAL',
        timestamp: timestamp || new Date().toISOString(),
        user: socket.data.username || 'Candidate',
      };

      io.to(normalizedRoomId).emit('timeline-event', timelinePayload);
    });

    // === WebRTC 1-on-1 Audio & Video Call Signaling ===
    // Event: webrtc-join-call ({ roomId })
    socket.on('webrtc-join-call', ({ roomId }) => {
      if (!roomId) return;
      const normalizedRoomId = roomId.trim().toUpperCase();
      console.log(`[WebRTC] User ${socket.data.username || socket.id} ready for call in ${normalizedRoomId}`);
      socket.to(normalizedRoomId).emit('webrtc-peer-joined', {
        callerId: socket.id,
        callerName: socket.data.username || 'Peer Developer',
      });
    });

    // Event: webrtc-offer ({ roomId, offer })
    socket.on('webrtc-offer', ({ roomId, offer }) => {
      if (!roomId || !offer) return;
      const normalizedRoomId = roomId.trim().toUpperCase();
      socket.to(normalizedRoomId).emit('webrtc-offer', {
        offer,
        from: socket.id,
        callerName: socket.data.username || 'Peer Developer',
      });
    });

    // Event: webrtc-answer ({ roomId, answer })
    socket.on('webrtc-answer', ({ roomId, answer }) => {
      if (!roomId || !answer) return;
      const normalizedRoomId = roomId.trim().toUpperCase();
      socket.to(normalizedRoomId).emit('webrtc-answer', {
        answer,
        from: socket.id,
      });
    });

    // Event: webrtc-ice-candidate ({ roomId, candidate })
    socket.on('webrtc-ice-candidate', ({ roomId, candidate }) => {
      if (!roomId || !candidate) return;
      const normalizedRoomId = roomId.trim().toUpperCase();
      socket.to(normalizedRoomId).emit('webrtc-ice-candidate', {
        candidate,
        from: socket.id,
      });
    });

    // Event: webrtc-end-call ({ roomId })
    socket.on('webrtc-end-call', ({ roomId }) => {
      if (!roomId) return;
      const normalizedRoomId = roomId.trim().toUpperCase();
      socket.to(normalizedRoomId).emit('webrtc-call-ended', {
        from: socket.id,
      });
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      const { roomId, username } = socket.data || {};

      if (roomId && roomUsers.has(roomId)) {
        const roomMap = roomUsers.get(roomId);
        roomMap.delete(socket.id);

        const remainingUsers = Array.from(roomMap.values());

        console.log(
          `[Socket.io] User "${username || socket.id}" disconnected from room "${roomId}". Remaining users: ${remainingUsers.length}`
        );

        if (remainingUsers.length === 0) {
          roomUsers.delete(roomId);
        } else {
          io.to(roomId).emit('room-users', {
            roomId,
            users: remainingUsers,
            count: remainingUsers.length,
            actionUser: username || 'A developer',
            action: 'left',
          });
        }
      }

      console.log(`[Socket.io] Client disconnected: ${socket.id} (${reason})`);
    });
  });
};

export default initSocket;
