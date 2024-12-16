# retro-scripting

Scripting for Libretro cores

## Why?

My initial use case was to be able to track evolution requirements for Digimon World (PS1).
Scripting support for emulators is very inconsistent.
RetroArch, one of the most convenient multi-platform emulators, has no scripting support at all as of 2024.
Allowing external code to access the memory of emulated games opens up many interesting tool possibilities.
Think [RetroAchievements](https://retroachievements.org/) or custom trackers used by retro game randomizers.

## How?

This project implements a `retro_scripting_libretro` core that acts as a proxy to another Libretro core.
All emulation functionality is handled by the proxied core.
The proxy core starts a [jsonrpc](https://en.wikipedia.org/wiki/JSON-RPC) server listening on http://localhost:3030.
Any app running on the same machine can then send requests to the jsonrpc server asking for the core to execute some method.

To load some content, you need to pass to retroarch

- the path to retro_scripting_libretro
- the path to the real core that will be proxied to
- the path to the game content file

like in the following example:

```
retroarch -L path/to/retro_scripting_libretro path/to/real_core_libretro?content=path/to/content_file'
```

## What?

Current features are very limited, but sufficient to implement a full game tracker. You can read either
[u8](## "unsigned 8-bit integer") or [u16](## "unsigned 16-bit integer, little endian") values from core memory:

```
curl -X POST -H "Content-type: application/json" -d '{
  "jsonrpc": "2.0",
  "method": "read_memory",
  "params": {
    "u8": {
      "some_u8": 1234,
      "another_u8": 1235
    },
    "u16le": {
      "some_u16": 1236,
      "another_u16": 1238
    }
  },
  "id": 1337
}' 127.0.0.1:3030
```
```
{"jsonrpc":"2.0","result":{"u16le":{"another_u16":4,"some_u16":3},"u8":{"another_u8":2,"some_u8":1}},"id":1337}
```

## TODO

- Add proper logging to the jsonrpc server.
- Implement memory reading for other data types. (C strings?, Entire structs?)
- Implement memory writing?
- Extract the Digimon World evolution tracker currently living in [/client](/client) to it's own repo.
