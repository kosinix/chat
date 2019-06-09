//// Core modules
const http = require('http');
const path = require('path');

//// External modules
const express = require('express');
const lodash = require('lodash');
const nunjucks = require('nunjucks')
const socketIO = require('socket.io')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

//// First things first
//// Save full path of our root app directory and load config and credentials
global.APP_DIR = path.resolve(__dirname).replace(/\\/g, '/'); // Turn back slash to slash for cross-platform compat
global.PORT = 3000
global.BASE_URL = `http://localhost:${PORT}`

//// Create app
const app = express();
// Parse http body
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

// Cookies
app.use(cookieParser());

const server = http.Server(app);
var io = socketIO(server);

server.listen(PORT, function () {
    console.log(`Chat listening on: ${BASE_URL}`);
});

app.use(express.static(`${APP_DIR}/public`))

//// Setup view
// Setup nunjucks loader. See https://mozilla.github.io/nunjucks/api.html#loader
let loaderFsNunjucks = new nunjucks.FileSystemLoader(APP_DIR, {
    "watch": false,
    "noCache": true
})

// Setup nunjucks environment. See https://mozilla.github.io/nunjucks/api.html#environment
let nunjucksEnv = new nunjucks.Environment(loaderFsNunjucks)
nunjucksEnv.express(app)

app.get('/', function (req, res) {
    res.render(`index.html`);
});
app.post('/join', function (req, res) {
    let randomString = (length, chars) => {
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
    }
    let uid = lodash.get(req, 'body.uid')
    var roomId = randomString(8, '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    res.redirect(`/r/?room=${roomId}&uid=${uid}`);
});
app.get('/r/', function (req, res) {
    let roomId = lodash.get(req, 'query.room');
    let uid = lodash.get(req, 'query.uid');
    let inviteUrl = `${BASE_URL}/r/?room=${roomId}`;
    res.render(`room.html`, {
        inviteUrl: inviteUrl,
        uid: uid
    });
});

// Chat namespace
const chat = io.of('/chat');

// middleware
// chat.use((socket, next) => {
//     console.log(socket)
//     let room = socket.handshake.query.room;
//     if ('abc' === room) {
//         return next();
//     }
//     console.log('authentication error', room)
//     return next(new Error('authentication error'));
// });
chat.on('connect', function (socket) {
    let room = socket.handshake.query.room;
    let uid = socket.handshake.query.uid;
    socket.join(room);
    console.log(`User "${uid}" connected.`)

    // to all clients in room except sender
    socket.to(room).emit('someone joined', `User "${uid}" has joined the room.`, uid);
    // to sender only
    socket.emit('someone joined', 'You joined this room.', uid);

    io.of('/chat').clients((error, clients) => {
        if (error) throw error;
        // console.log(clients.length + ' user(s) connected to /chat'); // => [PZDoMHjiu8PYfRiKAAAF, Anw2LatarvGVVXEIAAAD]
    });

    io.of('/chat').in(room).clients((error, clients) => {
        if (error) throw error;
        
        console.log(`${clients.length} user(s) connected to room "${room}"`); // => [PZDoMHjiu8PYfRiKAAAF, Anw2LatarvGVVXEIAAAD]
    });

    socket.on('chat send', function (msg) {
        // to all clients in room except sender
        socket.to(room).emit('chat received', msg, uid);
        // to sender only
        socket.emit('sender message', msg, uid);
    });
    socket.on('error', (error) => {
        console.log(error);
    });
    socket.on('disconnect', function () {
        console.log(`User "${uid}" disconnected.`)
    });
});
