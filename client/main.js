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
    let space = html`<span style="font-size: 0.5em">&nbsp;</span>`
    min = min == Infinity ? "" : min;
    max = max == Infinity ? "" : max;
    return html`${min}${space}..${space}${max}`;
  }

  if ((typeof value) == "string") return html`<img alt="${value}" title="${value}" src="img/${value}.png">`;

  return value;
}

function check_requirement(partner, requirement) {
  if (requirement == undefined) return undefined;
  if (typeof requirement == "number" && partner >= requirement) return true;
  if (Array.isArray(requirement) && partner >= requirement[0] && partner < requirement[1]) return true;
  if (typeof requirement == "string" && partner == requirement) return true;
  return false;
}

function requirements_met(f) {
  const stats = (f.hp ?? true) && (f.mp ?? true) && (f.off ?? true) && (f.def ?? true) && (f.speed ?? true) && (f.brains ?? true);
  const mistakes = f.mistakes ?? false;
  const weight = f.weight ?? false;
  const bonus = (f.happiness ?? false) || (f.discipline ?? false) || (f.battles ?? false) || (f.techs ?? false) || (f.partner ?? false);

  return [stats, mistakes, weight, bonus].filter(met => met).length;
}

const digimon_template = (name, values, stats, compute_classes) => {
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
      ${() => stats.map(group => stat_group_template(group, values, compute_classes))}
    </table>
  </div>`
}

const stat_group_template = (group, values, compute_classes) => {
  const keys = Object.keys(group);
  const classes = objectMap(group, key => compute_classes(key));
  const requirement_classes = keys.flatMap(key => classes[key].filter(klass => {
    if (klass.startsWith("stat-")) return false;
    if (klass == "not-requirement") return false;

    return true;
  }));
  const fulfilled = requirement_classes.filter(klass => klass == "fulfilled")

  let is_fulfilled = (keys.length == 6) ? requirement_classes.length == fulfilled.length : fulfilled.length > 0;
  let klass = is_fulfilled ? "fulfilled" : "";

  return html`
  <tbody class="${klass}">
    ${() => keys.map(key => stat_row_template(group[key], values[key], classes[key]))}
  </tbody>
  `
}

const stat_row_template = (label, value, classes) => {
  return html`
  <tr class="${() => classes.join(" ")}">
    <th>${label}</th>
    <td>${format_value(value)}</td>
  </tr>`
}

html`
  ${() => {
    const compute_classes = (k) => [`stat-${k}`, "flash-once"];
    return digimon_template(state.partner.name, state.partner, stats, compute_classes);
  }}
`(document.querySelector("#partner"))

html`
  ${() => state.evoPaths.map((path) => {
    const compute_classes = (k) => {
      const fulfilled = path.fulfillments[k];
      const klass = fulfilled == undefined ? "not-requirement" : fulfilled ? "fulfilled" : "unfulfilled";
      return [`stat-${k}`, klass];
    };
    const met = requirements_met(path.fulfillments)
    const ready = met >= 3 ? "ready" : "";
    const name = html`<div class="${ready}">${path.name}</div>`;
    return digimon_template(name, path.requirements, stats, compute_classes);
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
      ice_techs: 0x155802,
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
  state.partner.partner = state.partner.name;
  // state.partner.partner = "Biyomon";
  state.partner.techs = countTechs(state.partner);

  state.evoPaths = evolutionPaths[state.partner.name]
  // state.evoPaths = evolutionPaths["Biyomon"]
    .map((digimon) => {
      const requirements = evolutionRequirements[digimon];
      const fulfillments = objectMap(requirements, (key, value) => check_requirement(state.partner[key], value))

      return {name: digimon, requirements, fulfillments}
    })
    .filter((path) => path.requirements.special == undefined);
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
