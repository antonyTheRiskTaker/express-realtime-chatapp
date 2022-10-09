const path = require('path');
const http = require('http'); // This package is needed to use socket.io
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { 
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatCord Bot';

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // (Line below) once connected, this line sends out an event (in this case, the event name is 'message' but you can choose any name you want) and message which will be received from the client JS
    // (Line below) only the user sees this message
    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));

    // Broadcast when a user connects
    // (Line below) anyone but the user sees the message
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );
  });

  // Listen for chatMessage (see client JS)
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    // (Line below) all users can see the message
    io.emit('message', formatMessage(botName, 'A user has left the chat'));
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));