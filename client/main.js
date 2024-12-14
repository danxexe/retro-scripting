import { JSONRPCClient } from './json-rpc-2.0.js'
import { stats, digimonNames, evolutionPaths, evolutionRequirements } from './digimon-world.js'
import { reactive, html } from './arrow.js'

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

let state = reactive({
  partner: {},
  evoPaths: [],
});

window.state = state;

function format_value(value) {
  if (Array.isArray(value)) {
    let [min, max] = value;
    min = min == Infinity ? "∞" : min;
    max = max == Infinity ? "∞" : max;
    return html`${min} <span style="font-size: 0.8em">≷</span> ${max}`;
  }

  return value;
}

const digimon_template = (name, stats, props) => {
  return html`
  <table>
    <thead>
      <tr>
        <th colspan="2">${() => name}</th>
      </tr>
    </thead>
    <tbody>
      ${() => Object.entries(props).map(([key, display]) => html`
        <tr class="flash-once">
          <th>${display}</th>
          <td>${format_value(stats[key])}</td>
        </tr>
      `)}
    </tbody>
  </table>`
}

html`
  ${() => digimon_template(state.partner.name, state.partner, stats)}
`(document.querySelector("#partner"))

html`
  ${() => state.evoPaths.map(([name, requirements]) => digimon_template(name, requirements, stats))}
`(document.querySelector("#evolution-paths"))

async function update() {
  const response = await client.request("read_memory", {
    u8: {
      happiness: 0x13848A,
      discipline: 0x138488,
      mistakes: 0x13847e,
      weight: 0x1384a2,
      battles: 0x1384b4
    },
    u16le: {
      digimon_id: 0x1557b0,
      off: 0x1557e0,
      def: 0x1557e2,
      speed: 0x1557e4,
      brains: 0x1557e6,
      hp: 0x1557f0,
      mp: 0x1557f2,
    }
  });
  
  state.partner = reactive({ ...response["u8"], ...response["u16le"] });
  state.partner.name = digimonNames.get(state.partner.digimon_id);

  state.evoPaths = evolutionPaths[state.partner.name]
    .map((digimon) => [digimon, evolutionRequirements[digimon]])
    .filter(([_, req]) => req.special == undefined);

  old_data = state.partner;
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
