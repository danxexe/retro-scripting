#![allow(non_camel_case_types)]

use libloading::Symbol;
use core::ffi::{c_uint, c_void, c_char};

pub type retro_environment_t = rust_libretro_sys::retro_environment_t;
pub type retro_video_refresh_t = rust_libretro_sys::retro_video_refresh_t;
pub type retro_audio_sample_t = rust_libretro_sys::retro_audio_sample_t;
pub type retro_audio_sample_batch_t = rust_libretro_sys::retro_audio_sample_batch_t;
pub type retro_input_poll_t = rust_libretro_sys::retro_input_poll_t;
pub type retro_input_state_t = rust_libretro_sys::retro_input_state_t;
pub type retro_system_info = rust_libretro_sys::retro_system_info;
pub type retro_system_av_info = rust_libretro_sys::retro_system_av_info;
pub type retro_game_info = rust_libretro_sys::retro_game_info;

pub type Library = libloading::Library;

pub struct Core {
    pub lib: Library,
}

macro_rules! forward_to_lib {
    ($name:ident, fn($($arg:ident: $type:ty),*) $(-> $ret:ty)?) => {
        pub extern "C" fn $name(&self, $($arg: $type),*) $(-> $ret)? {
            unsafe {
                let lib = &self.lib;
                let func: Symbol<unsafe extern "C" fn($($type),*) $(-> $ret)?> = lib
                    .get(concat!(stringify!($name), "\0").as_bytes())
                    .expect(&format!("Failed to find function '{}' in proxied core", stringify!($name)));
                func($($arg),*)
            }
        }
    };
}

impl Core {
    pub fn load(path: &str) -> Option<Core> {
        unsafe {
            Library::new(&path).ok().map(|lib| Core {lib})
        }
    }

    forward_to_lib!(retro_set_environment, fn(cb: retro_environment_t));
    forward_to_lib!(retro_set_video_refresh, fn(cb: retro_video_refresh_t));
    forward_to_lib!(retro_set_audio_sample, fn(cb: retro_audio_sample_t));
    forward_to_lib!(retro_set_audio_sample_batch, fn(cb: retro_audio_sample_batch_t));
    forward_to_lib!(retro_set_input_poll, fn(cb: retro_input_poll_t));
    forward_to_lib!(retro_set_input_state, fn(cb: retro_input_state_t));
    forward_to_lib!(retro_init, fn());
    forward_to_lib!(retro_deinit, fn());
    forward_to_lib!(retro_api_version, fn() -> c_uint);
    forward_to_lib!(retro_get_system_info, fn(info: *mut retro_system_info));
    forward_to_lib!(retro_get_system_av_info, fn(info: *mut retro_system_av_info));
    forward_to_lib!(retro_set_controller_port_device, fn(port: c_uint, device: c_uint));
    forward_to_lib!(retro_reset, fn());
    forward_to_lib!(retro_run, fn());
    forward_to_lib!(retro_serialize_size, fn() -> usize);
    forward_to_lib!(retro_serialize, fn(data: *mut c_void, size: usize) -> bool);
    forward_to_lib!(retro_unserialize, fn(data: *const c_void, size: usize) -> bool);
    forward_to_lib!(retro_cheat_reset, fn());
    forward_to_lib!(retro_cheat_set, fn(index: c_uint, enabled: bool, code: *const c_char));
    forward_to_lib!(retro_load_game, fn(game: *const retro_game_info) -> bool);
    forward_to_lib!(retro_load_game_special, fn(game_type: c_uint, info: *const retro_game_info, num_info: usize) -> bool);
    forward_to_lib!(retro_unload_game, fn());
    forward_to_lib!(retro_get_region, fn() -> c_uint);
    forward_to_lib!(retro_get_memory_data, fn(id: c_uint) -> *mut c_void);
    forward_to_lib!(retro_get_memory_size, fn(id: c_uint) -> usize);
}

pub trait Proxy {
    fn core(&self) -> &Core;

    fn retro_set_environment(&self, cb: retro_environment_t) { self.core().retro_set_environment(cb) }
    fn retro_set_video_refresh(&self, cb: retro_video_refresh_t) { self.core().retro_set_video_refresh(cb) }
    fn retro_set_audio_sample(&self, cb: retro_audio_sample_t) { self.core().retro_set_audio_sample(cb) }
    fn retro_set_audio_sample_batch(&self, cb: retro_audio_sample_batch_t) { self.core().retro_set_audio_sample_batch(cb) }
    fn retro_set_input_poll(&self, cb: retro_input_poll_t) { self.core().retro_set_input_poll(cb) }
    fn retro_set_input_state(&self, cb: retro_input_state_t) { self.core().retro_set_input_state(cb) }
    fn retro_init(&self) { self.core().retro_init() }
    fn retro_deinit(&self) { self.core().retro_deinit() }
    fn retro_api_version(&self) -> c_uint { self.core().retro_api_version() }
    fn retro_get_system_info(&self, info: *mut retro_system_info) { self.core().retro_get_system_info(info) }
    fn retro_get_system_av_info(&self, info: *mut retro_system_av_info) { self.core().retro_get_system_av_info(info) }
    fn retro_set_controller_port_device(&self, port: c_uint, device: c_uint) { self.core().retro_set_controller_port_device(port, device) }
    fn retro_reset(&self) { self.core().retro_reset() }
    fn retro_run(&self) { self.core().retro_run() }
    fn retro_serialize_size(&self) -> usize { self.core().retro_serialize_size() }
    fn retro_serialize(&self, data: *mut c_void, size: usize) -> bool { self.core().retro_serialize(data, size) }
    fn retro_unserialize(&self, data: *const c_void, size: usize) -> bool { self.core().retro_unserialize(data, size) }
    fn retro_cheat_reset(&self) { self.core().retro_cheat_reset() }
    fn retro_cheat_set(&self, index: c_uint, enabled: bool, code: *const c_char) { self.core().retro_cheat_set(index, enabled, code) }
    fn retro_load_game(&self, game: *const retro_game_info) -> bool { self.core().retro_load_game(game) }
    fn retro_load_game_special(&self, game_type: c_uint, info: *const retro_game_info, num_info: usize) -> bool { self.core().retro_load_game_special(game_type, info, num_info) }
    fn retro_unload_game(&self) { self.core().retro_unload_game() }
    fn retro_get_region(&self) -> c_uint { self.core().retro_get_region() }
    fn retro_get_memory_data(&self, id: c_uint) -> *mut c_void { self.core().retro_get_memory_data(id) }
    fn retro_get_memory_size(&self, id: c_uint) -> usize { self.core().retro_get_memory_size(id) }
}

#[macro_export]
macro_rules! proxy_to {
    ($proxy:expr) => {
        #[no_mangle]
        pub extern "C" fn retro_set_environment(cb: libretro_proxy::retro_environment_t) { $proxy.retro_set_environment(cb) }

        #[no_mangle]
        pub extern "C" fn retro_set_video_refresh(cb: libretro_proxy::retro_video_refresh_t) { $proxy.retro_set_video_refresh(cb) }

        #[no_mangle]
        pub extern "C" fn retro_set_audio_sample(cb: libretro_proxy::retro_audio_sample_t) { $proxy.retro_set_audio_sample(cb) }

        #[no_mangle]
        pub extern "C" fn retro_set_audio_sample_batch(cb: libretro_proxy::retro_audio_sample_batch_t) { $proxy.retro_set_audio_sample_batch(cb) }

        #[no_mangle]
        pub extern "C" fn retro_set_input_poll(cb: libretro_proxy::retro_input_poll_t) { $proxy.retro_set_input_poll(cb) }

        #[no_mangle]
        pub extern "C" fn retro_set_input_state(cb: libretro_proxy::retro_input_state_t) { $proxy.retro_set_input_state(cb) }

        #[no_mangle]
        pub extern "C" fn retro_init() { $proxy.retro_init() }

        #[no_mangle]
        pub extern "C" fn retro_deinit() { $proxy.retro_deinit() }

        #[no_mangle]
        pub extern "C" fn retro_api_version() -> ::core::ffi::c_uint { $proxy.retro_api_version() }

        #[no_mangle]
        pub extern "C" fn retro_get_system_info(info: *mut libretro_proxy::retro_system_info) { $proxy.retro_get_system_info(info) }

        #[no_mangle]
        pub extern "C" fn retro_get_system_av_info(info: *mut libretro_proxy::retro_system_av_info) { $proxy.retro_get_system_av_info(info) }

        #[no_mangle]
        pub extern "C" fn retro_set_controller_port_device(port: ::core::ffi::c_uint, device: ::core::ffi::c_uint) { $proxy.retro_set_controller_port_device(port, device) }

        #[no_mangle]
        pub extern "C" fn retro_reset() { $proxy.retro_reset() }

        #[no_mangle]
        pub extern "C" fn retro_run() { $proxy.retro_run() }

        #[no_mangle]
        pub extern "C" fn retro_serialize_size() -> usize { $proxy.retro_serialize_size() }

        #[no_mangle]
        pub extern "C" fn retro_serialize(data: *mut ::core::ffi::c_void, size: usize) -> bool { $proxy.retro_serialize(data, size) }

        #[no_mangle]
        pub extern "C" fn retro_unserialize(data: *const ::core::ffi::c_void, size: usize) -> bool { $proxy.retro_unserialize(data, size) }

        #[no_mangle]
        pub extern "C" fn retro_cheat_reset() { $proxy.retro_cheat_reset() }

        #[no_mangle]
        pub extern "C" fn retro_cheat_set(index: ::core::ffi::c_uint, enabled: bool, code: *const ::core::ffi::c_char) { $proxy.retro_cheat_set(index, enabled, code) }

        #[no_mangle]
        pub extern "C" fn retro_load_game(game: *const libretro_proxy::retro_game_info) -> bool { $proxy.retro_load_game(game) }

        #[no_mangle]
        pub extern "C" fn retro_load_game_special(game_type: ::core::ffi::c_uint, info: *const libretro_proxy::retro_game_info, num_info: usize) -> bool { $proxy.retro_load_game_special(game_type, info, num_info) }

        #[no_mangle]
        pub extern "C" fn retro_unload_game() { $proxy.retro_unload_game() }

        #[no_mangle]
        pub extern "C" fn retro_get_region() -> ::core::ffi::c_uint { $proxy.retro_get_region() }

        #[no_mangle]
        pub extern "C" fn retro_get_memory_data(id: ::core::ffi::c_uint) -> *mut ::core::ffi::c_void { $proxy.retro_get_memory_data(id) }

        #[no_mangle]
        pub extern "C" fn retro_get_memory_size(id: ::core::ffi::c_uint) -> usize { $proxy.retro_get_memory_size(id) }
    };
}
