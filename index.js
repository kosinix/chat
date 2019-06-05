//// Core modules
const http = require('http');
const path = require('path');

//// External modules
const express = require('express');
const lodash = require('lodash');
const nunjucks = require('nunjucks')
const socketIO = require('socket.io')

//// First things first
//// Save full path of our root app directory and load config and credentials
global.APP_DIR = path.resolve(__dirname).replace(/\\/g, '/'); // Turn back slash to slash for cross-platform compat
global.PORT = 3000

//// Create app
const app = express();
const server = http.Server(app);
var io = socketIO(server);

server.listen(PORT, function () {
    console.log(`Chat listening on port: ${PORT}`);
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
    res.render(`room.html`);
});
app.get('/r/:roomId', function (req, res) {
    let roomId = lodash.get(req, 'params.roomId')
    res.render(`room.html`);
});

// Chat namespace
const chat = io.of('/chat');

// middleware
// chat.use((socket, next) => {
//     console.log(socket)
//     let token = socket.handshake.query.token;
//     if ('abc' === token) {
//         return next();
//     }
//     console.log('authentication error', token)
//     return next(new Error('authentication error'));
// });

chat.on('connect', function (socket) {
    let room = socket.handshake.query.token;
    socket.join(room);
    
    io.of('/chat').clients((error, clients) => {
        if (error) throw error;
        console.log(clients.length + ' user(s) connected to /chat'); // => [PZDoMHjiu8PYfRiKAAAF, Anw2LatarvGVVXEIAAAD]
    });

    io.of('/chat').in(room).clients((error, clients) => {
        if (error) throw error;
        console.log(clients.length + ' user(s) connected to '+room); // => [PZDoMHjiu8PYfRiKAAAF, Anw2LatarvGVVXEIAAAD]
    });

    socket.on('chat send', function (msg) {
        chat.to(room).emit('chat received', msg + ' room - '+room);
    });
    socket.on('error', (error) => {
        console.log(error);
    });
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});
