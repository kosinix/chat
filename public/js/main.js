const urlParams = new URLSearchParams(window.location.search);
const room = urlParams.get('room');
var socket = io('/chat', { query: "token="+room });
var app = new Vue({
    el: '#app',
    delimiters: ["${", "}"],
    data: {
        messages: [
            {
                content: ''
            }
        ],
        message: ''
    },
    created: function(){
        // var urlParams = new URLSearchParams(window.location.search);
        // var room = urlParams.get('room');
        // socket.emit('join room', room);
    },
    methods: {
        send: function(){
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
socket.on('chat received', function (msg) {
    app.messages.push({
        content: msg
    })
});