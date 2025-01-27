import { JSONRPCClient } from './json-rpc-2.0.js'
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
  map: Array(32).fill(Array(32).fill(255)),
  position: {y: 0, x: 0},
  visited: new Set([]),
});

window.state = state;

function buildTr(y) {
  return html`
  <tr id="${() => `row-${y}`}">
    ${() => state.map.map(
      (_, x) => buildTd(y, x)
    )}
  </tr>
  `.key(`row-${y}`)
}

function buildTd(y, x) {
  const value = state.map[y][x].toString(16).padStart(2, '0');
  const display = value;
  const key = `cell-${y}-${x}`;
  const isCurrent = state.position.x == x && state.position.y == y;
  const isVisited = Reflect.getPrototypeOf(state.visited).has(y * 32 + x)

  return html`
  <td
    data-key="${() => key}"
    data-value="${() => value}"
    data-current="${() => isCurrent}"
    data-visited="${() => isVisited}"
  >${() => display}</td>
  `.key(key)
}

function toggleVisited() {
  document.querySelector('table').classList.toggle("hide-unvisited");
}

html`
  <button @click="${toggleVisited}">Show / hide unexplored</button>
  <table class="hide-unvisited">
    ${() => state.map.map(
      (_, y) => buildTr(y)
    )}
  </table>
`(document.querySelector(".container"))

async function setup() {
  const adresses = Object.fromEntries(Array(1024).keys().map(i => [i, 0x0254E + i]));

  let {
    u8: map,
  } = await client.request("read_rom", {
    u8: adresses
  });

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const cell = map[y * 32 + x];
      state.map[y][x] = cell;
    }
  }
}

async function update() {
  let {
    u8: position,
  } = await client.request("read_memory", {
    u8: {
      y: 0x4F,
      x: 0x50,
    }
  });

  if (state.position != position) {
    state.position = position;
    const visited = Reflect.getPrototypeOf(state.visited)
    visited.add(position.y * 32 + position.x);
    state.visited = visited;
  }
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

    await sleep(250);
  }
}

await setup()
loop()
