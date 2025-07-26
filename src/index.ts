
import httpService from './HttpService';
import webSocketService from './Websocke/ws';

const express = new httpService()
const wsService = new webSocketService(express.app)



// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id);

//   // User joins a room
//   socket.on('join-room', (data) => {
//     const { roomId, username } = data;
//     const userId = socket.id;
    
//     // Create room if doesn't exist
//     if (!rooms.has(roomId)) {
//       rooms.set(roomId, new Map());
//     }
    
//     // Add user to room
//     const user = {
//       id: userId,
//       username,
//       x: Math.random() * 800, // Random starting position
//       y: Math.random() * 600,
//       socketId: socket.id
//     };
    
//     rooms.get(roomId).set(userId, user);
//     users.set(userId, { ...user, roomId });
    
//     // Join socket room
//     socket.join(roomId);
    
//     // Send current users to new user
//     const roomUsers = Array.from(rooms.get(roomId).values());
//     socket.emit('room-users', roomUsers);
    
//     // Notify others about new user
//     socket.to(roomId).emit('user-joined', user);
    
//     console.log(`${username} joined room ${roomId}`);
// });

// // Handle user movement
// socket.on('user-move', (data) => {
//     const { x, y } = data;
//     const userId = socket.id;
//     console.log(`${userId},${x + y}`)
    
//     if (users.has(userId)) {
//       const user = users.get(userId);
//       const roomId = user.roomId;
      
//       // Update user position
//       user.x = x;
//       user.y = y;
//       users.set(userId, user);
//       rooms.get(roomId).set(userId, user);
      
//       // Broadcast movement to others in room
//       socket.to(roomId).emit('user-moved', {
//         userId,
//         x,
//         y
//       });
//     }
//   });

//   // Handle disconnect
//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
    
//     if (users.has(socket.id)) {
//       const user = users.get(socket.id);
//       const roomId = user.roomId;
      
//       // Remove user from room
//       rooms.get(roomId)?.delete(socket.id);
//       users.delete(socket.id);
      
//       // Notify others
//       socket.to(roomId).emit('user-left', socket.id);
//     }
//   });
// });

const PORT =  3000;
wsService.listen(PORT);