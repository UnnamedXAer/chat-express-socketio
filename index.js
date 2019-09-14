require('dotenv').config();
const express = require('express');
const path = require('path');
const cons = require('consolidate');
const uuid = require('uuid');
const fs = require('fs');

const key = fs.readFileSync(__dirname + '/certs/selfsigned.key');
const cert = fs.readFileSync(__dirname + '/certs/selfsigned.crt');
const options = {
    key: key,
    cert: cert
};

const app = express();

// https for local and http for hosting eg. Heroku
// https is required by browser to push notifications
const http = ((process.env.HOSTING == "LOCAL") ? require('https').createServer(options, app) : require('http').createServer(app));

const io = require('socket.io')(http);

const routes = require('./routes/routes');

app.use(express.static(path.join(__dirname, 'public')));

app.engine('html', cons.swig)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use('/', routes);

app.get("/", (req, res) => {
    res.render('index');
});

let usersNum = 0;
io.on('connection', socket => {
    let userAdded = false;
    socket.user = {
        id: uuid()
    };

    // send generated user id to connected user
    socket.emit('my-id', socket.user.id);

    socket.emit('environment', process.env.ENVIRONMENT);

    // new user is connected
    socket.on('user-connected', user => {

        if (userAdded) 
            return;

        const myId = socket.user.id;
        socket.user = user; // publicKey probably is not needed here
        socket.user.id = myId;
        userAdded = true;
        ++usersNum;

        // emit newly connected user to other users already connected.
        socket.broadcast.emit('user-connected', user);

        // get list of all users connected to sockets
        const connected = Object.values(io.sockets.connected);
        const users = connected.map(x => x.user);
        // emit all connected users to newly connected user.
        socket.emit('users-already-connected', users);
    });

    socket.on('user-data-change', (key, value) => {
        socket.user[key] = value;
        socket.broadcast.emit('user-data-change', socket.user);
    });

    socket.on('disconnect', () => {
        if (userAdded) {
            --usersNum;
            socket.broadcast.emit('user-disconnected', socket.user.id);
        }
    });

    socket.on('chat message', msg => {
        const connected = Object.values(io.sockets.connected);
        const destinationSocket = connected.find(x => x.user.id == msg.destinationUserId);
        if (destinationSocket) // todo - sometimes users are undefined when restarted server
            destinationSocket.emit('chat message', msg);
    });

    socket.on('user-is-typing', user => {
        socket.broadcast.emit('user-is-typing', user);
    });

    socket.on('user-not-typing', userId => {
        socket.broadcast.emit('user-not-typing', userId);
    });

    socket.on('force-refresh', () => {
        if (process.env.ENVIRONMENT == 'development') {
            io.emit('force-refresh');
        }
    });
});

http.listen((process.env.PORT || 3001), () => {
    console.log('listening on', (process.env.PORT || 3001));
});