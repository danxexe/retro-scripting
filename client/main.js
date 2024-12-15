import { JSONRPCClient } from './json-rpc-2.0.js'
import { stats, digimonNames, evolutionPaths, evolutionRequirements, countTechs} from './digimon-world.js'
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

let state = reactive({
  partner: {},
  evoPaths: [],
});

window.state = state;

const objectMap = (obj, fn) =>
  Object.fromEntries(
    Object.entries(obj).map(
      ([k, v], i) => [k, fn(k, v, i)]
    )
  )

function format_value(value) {
  if (Array.isArray(value)) {
    let [min, max] = value;
    let space = html`<span style="font-size: 0.5em"> </span>`
    min = min == Infinity ? "" : min;
    max = max == Infinity ? "" : max;
    return html`${min}${space}..${space}${max}`;
  }

  return value;
}

function is_fulfilled(partner, requirement) {
  // console.log(partner, requirement)
  if (requirement == undefined) return "";
  if (typeof requirement == "number" && partner >= requirement) return "fulfilled";
  if (Array.isArray(requirement) && partner >= requirement[0] && partner < requirement[1]) return "fulfilled";
  return "unfulfilled";
}

const digimon_template = (name, stats, props, classes = []) => {
  return html`
  <div class="table-outer">
    <table>
      <thead>
        <tr>
          <th colspan="2">
            <div class="table-header">${() => name}</div>
          </th>
        </tr>
      </thead>
      <tbody>
        ${() => Object.entries(props).map(([key, display]) => html`
          <tr class="${() => classes[key]}">
            <th>${display}</th>
            <td>${format_value(stats[key])}</td>
          </tr>
        `)}
      </tbody>
    </table>
  </div>`
}

html`
  ${() => {
    const classes = objectMap(stats, (k, _) => "flash-once")
    return digimon_template(state.partner.name, state.partner, stats, classes);
  }}
`(document.querySelector("#partner"))

html`
  ${() => state.evoPaths.map(([name, requirements]) => {
    const classes = objectMap(stats, (k, v) => {
      const fulfilled = is_fulfilled(state.partner[k],  requirements[k]);
      return fulfilled;
    });
    return digimon_template(name, requirements, stats, classes);
  })}
`(document.querySelector("#evolution-paths"))

async function update() {
  const response = await client.request("read_memory", {
    u8: {
      happiness: 0x13848A,
      discipline: 0x138488,
      mistakes: 0x13847e,
      weight: 0x1384a2,
      battles: 0x1384b4,
      fire_techs: 0x155800,
      air_techs: 0x155801,
      aice_techs: 0x155802,
      mech_techs: 0x155803,
      earth_techs: 0x155804,
      battle_techs: 0x155805,
      filth_techs: 0x155806,
      filth_techs_ext: 0x155807,
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
  state.partner.techs = countTechs(state.partner);

  state.evoPaths = evolutionPaths[state.partner.name]
    .map((digimon) => [digimon, evolutionRequirements[digimon]])
    .filter(([_, req]) => req.special == undefined);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

window.run = true;

async function loop() {
  while (window.run) {
    try {
      await update();
    } catch (e) {
      window.run = false
      console.log(e)
    }

    await sleep(1000);
  }
}

loop()
