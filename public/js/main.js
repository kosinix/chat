const urlParams = new URLSearchParams(window.location.search);
const room = urlParams.get('room');
const uid = urlParams.get('uid');
var socket = io('/chat', {
    query: {
        room: room,
        uid: uid
    }
});
var app = new Vue({
    el: '#app',
    delimiters: ["${", "}"],
    data: {
        messages: [
            // {
            //     author: '',
            //     content: 'Chat started',
            //     className: 'item notif'
            // },
        ],
        message: ''
    },
    created: function () {
        // var urlParams = new URLSearchParams(window.location.search);
        // var room = urlParams.get('room');
        // socket.emit('join room', room);
    },
    methods: {
        send: function () {
            var me = this;
            socket.emit('chat send', me.message);
            me.message = '';
        }
    }
})
// socket.on('reconnect_attempt', () => {
//     socket.io.opts.query = {
//       token: 'fgh'
//     }
//   });
socket.on('someone joined', function (msg) {
    app.messages.push({
        author: '',
        content: msg,
        className: 'item notif'
    })
});
socket.on('sender message', function (msg, author) {
    app.messages.push({
        author: author,
        content: msg,
        className: 'item sender'
    })
    window.scrollTo(0,document.body.scrollHeight);
});
socket.on('chat received', function (msg, author) {
    app.messages.push({
        author: author,
        content: msg,
        className: 'item'
    })
    // window.scrollTo(0,document.querySelector(".thread").scrollHeight+100);

});