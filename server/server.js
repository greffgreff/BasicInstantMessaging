"use strict";
process.title = "node-chat";

var port = 1337;

var webSocketServer = require("websocket").server;
var http = require("http");

var history = [];
var clients = [];

function htmlEntities(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

var colors = ["red", "green", "blue", "magenta", "purple", "plum", "orange"];
colors.sort(function (a, b) {
  return Math.random() > 0.5;
});

var server = http.createServer((req, rep) => {});

server.listen(port, () => console.log(`Server is listening on port ${port}`));

var wsServer = new webSocketServer({ httpServer: server });

wsServer.on("request", req => {
  console.log(`Connection from origin ${req.origin}...`);
  // NOTE optional, check origin

  var connection = req.accept(null, req.origin);

  var index = clients.push(connection) - 1;
  var userName = false;
  var userColor = false;

  console.log("Connection accepted.");

  if (history.length > 0) {
    connection.sendUTF(JSON.stringify({ type: "history", data: history }));
  }

  connection.on("message", msg => {
    if (msg.type === "utf8") {
      if (userName === false) {
        userName = htmlEntities(msg.utf8Data);
        userColor = colors.shift();

        connection.sendUTF(JSON.stringify({ type: "color", data: userColor }));

        console.log(`User is known as: ${userName} with ${userColor} color.`);
      } else {
        console.log(`Received Message from ${userName}: ${msg.utf8Data}`);

        var obj = {
          time: new Date().getTime(),
          text: htmlEntities(msg.utf8Data),
          author: userName,
          color: userColor,
        };
        history.push(obj);
        history = history.slice(-100);

        var json = JSON.stringify({ type: "message", data: obj });

        for (var i = 0; i < clients.length; i++) {
          clients[i].sendUTF(json);
        }
      }
    }
  });

  connection.on("close", cnn => {
    if (userName !== false && userColor !== false) {
      console.log(`Peer ${cnn.remoteAddress} disconnected.`);
      clients.splice(index, 1);
      colors.push(userColor);
    }
  });
});
