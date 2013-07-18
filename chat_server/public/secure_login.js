window.onload = function() {
    var messages = [];
    var socket = io.connect('http://192.168.0.105:443',  {secure: true, port: 443});
    //var socket = io.connect('http://192.168.0.105:17231');
    var username = document.getElementById("user");
    var password = document.getElementById("password");
    var login = document.getElementById("login");

    socket.on('redirect', function (data) {
        console.log("redirect to: ", data.toUrl);
        window.location.href = data.toUrl;
    });

    login.onclick = function() {
        var _username = username.value;
        var _password = password.value;
        console.log(_username + ", " + _password);
        socket.emit('login', {username: _username, password: _password });
     };
}
