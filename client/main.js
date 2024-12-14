const { JSONRPCClient } = require('json-rpc-2.0')


const client = new JSONRPCClient((jsonRPCRequest) =>
  fetch("http://localhost:3030", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(jsonRPCRequest),
  }).then((response) => {
    if (response.status === 200) {
      // Use client.receive when you received a JSON-RPC response.
      return response
        .json()
        .then((jsonRPCResponse) => client.receive(jsonRPCResponse));
    } else if (jsonRPCRequest.id !== undefined) {
      return Promise.reject(new Error(response.statusText));
    }
  })
);

async function update () {
  const response = await client.request("read_memory", {
    u8: {
      happiness: 0x13848A,
      discipline: 0x138488,
    },
    u16le: {
      digimon: 0x1557b0,
      off: 0x1557e0,
      def: 0x1557e2,
      speed: 0x1557e4,
      brains: 0x1557e6,
      hp: 0x1557f0,
      mp: 0x1557f2,
    }
  });

  console.log(response);

  const stats = {...response["u8"], ...response["u16le"]}

  for (const property in stats) {
    const element = document.getElementById(property)

    if (element) {
      const old = element.innerText
      element.innerText = stats[property];
  
      if (old != element.innerText) {
        element.classList.add("flash-once");
        element.addEventListener("animationend", function() {
          element.classList.remove("flash-once");
        }, { once: true });
      }  
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

let run = true;

async function loop() {
  while (run) {
    try {
      await update();
    } catch (e) {
      run = false
    }
    
    await sleep(1000);
  }
}

loop()
