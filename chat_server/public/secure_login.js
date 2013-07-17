window.onload = function() {
    var messages = [];
    var socket = io.connect('http://192.168.0.105:443',  {secure: true, port: 443});
    //var socket = io.connect('http://192.168.0.105:17231');
    var username = document.getElementById("user");
    var password = document.getElementById("password");
    var login = document.getElementById("login");

    socket.on('message', function (data) {
        if(data.message) {
            console.log(data.message);
        } else {
            console.log("There is a problem:", data);
        }
    });

    login.onclick = function() {
        var _username = username.value;
        var _password = password.value;
        console.log(_username + ", " + _password);
        socket.emit('data', {username: _username, password: _password });
     };
}
