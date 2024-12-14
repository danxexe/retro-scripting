import { JSONRPCClient } from './json-rpc-2.0.js'
import { digimon_hex_to_name, stats } from './digimon-world.js'

const client = new JSONRPCClient((jsonRPCRequest) =>
  fetch("http://localhost:3030", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(jsonRPCRequest),
  }).then((response) => {
    if (response.status === 200) {
      return response
        .json()
        .then((jsonRPCResponse) => client.receive(jsonRPCResponse));
    } else if (jsonRPCRequest.id !== undefined) {
      return Promise.reject(new Error(response.statusText));
    }
  })
);

const stats_table = document.querySelector("#stats-table");
const stats_row_template = document.querySelector("#stats-row-template");
let old_data = {}

async function update () {
  const response = await client.request("read_memory", {
    u8: {
      happiness: 0x13848A,
      discipline: 0x138488,
      mistakes: 0x13847e,
      weight: 0x1384a2,
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

  const data = {...response["u8"], ...response["u16le"]}
  const digimon_name = digimon_hex_to_name.get(data["digimon"]);

  document.querySelector("#digimon-name").innerText = digimon_name;

  for (const prop in stats) {
    const value = data[prop];
    const old_value = old_data[prop];

    if (value != old_value) {
      const clone = stats_row_template.content.cloneNode(true);

      clone.querySelector("tr").classList.add(prop, "flash-once");
      clone.querySelector("th").innerText = stats[prop];
      clone.querySelector("td").innerText = data[prop];
      
      const old_element = stats_table.querySelector("tr." + prop);
      if (old_element) {
        stats_table.replaceChild(clone, old_element);
      } else {
        stats_table.appendChild(clone);
      }
    }  
  }

  old_data = data;
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
      console.log(e)
    }
    
    await sleep(1000);
  }
}

loop()
