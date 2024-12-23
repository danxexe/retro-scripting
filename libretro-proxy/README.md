# libretro-proxy

Write libretro cores that act as proxies to other cores.

This crate provides the following:

- A `Core` struct that enables dynamically loading an existing libretro core to proxy to.
- A `Proxy` trait that allows a "proxy" core to override specific libretro functions while delegating everything else to the proxied core.
- A `proxy_to!` declarative macro to export the expected libretro functions for the proxy core.


## Usage

See the [tests](tests/mod.rs) or the [parent project](https://github.com/danxexe/retro-scripting) for examples.
