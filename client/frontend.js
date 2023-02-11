console.log("Loading...");

var content = document.getElementById("content");
var input = document.getElementById("input");
var state = document.getElementById("state");

var myColor = false;
var myName = "";

window.WebSocket = window.WebSocket;

if (!window.WebSocket) {
  alert("Sorry, but your browser doesn't support WebSocket.");
  input.hide();
  state.hide();
}

var connection = new WebSocket("ws://localhost:1337");

connection.onopen = () => {
  input.disabled = false;
  state.textContent = "Choose name:";
};

connection.onerror = error => {
  content.html($("<p>", { text: "Sorry, but there's some problem with your " + "connection or the server is down." }));
};

connection.onmessage = msg => {
  try {
    var json = JSON.parse(msg.data);
  } catch (e) {
    console.log("Invalid JSON: ", msg.data);
    return;
  }

  if (json.type === "color") {
    myColor = json.data;
    state.textContent = myName;
    state.style.color = myColor;
    input.disabled = false;
  } else if (json.type === "history") {
    for (var i = 0; i < json.data.length; i++) {
      addMessage(json.data[i].author, json.data[i].text, json.data[i].color, new Date(json.data[i].time));
    }
  } else if (json.type === "message") {
    input.disabled = false;
    addMessage(json.data.author, json.data.text, json.data.color, new Date(json.data.time));
  }

  content.scrollTop = content.scrollHeight;
};

input.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    if (!input.value) {
      return;
    }

    connection.send(input.value);

    // First msg sent corresponds to name input
    if (myName == "") {
      console.log(myName);
      myName = input.value;
      console.log(myName);
    }

    // NOTE Make sure user cannot send anything until server sends response
    input.value = "";
    input.disabled = true;
  }
});

// Optional method to wait for 3 secs for server response
setInterval(() => {
  if (connection.readyState !== 1) {
    state.textContent = "Unable to communicate with the WebSocket server";
    input.disabled = true;
  }
}, 3000);

function addMessage(author, msg, color, dt) {
  const newDiv = document.createElement("p");
  newDiv.style.color = color;
  const newContent = document.createTextNode(`${("0" + dt.getHours()).slice(-2)}:${("0" + dt.getMinutes()).slice(-2)}:${("0" + dt.getSeconds()).slice(-2)} ${author}: ${msg}}`);
  newDiv.appendChild(newContent);
  content.appendChild(newDiv);
}
