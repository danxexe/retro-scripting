#![allow(non_camel_case_types)]

use libloading::Symbol;
pub type Library = libloading::Library;
pub mod sys;

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

    forward_to_lib!(retro_set_environment, fn(cb: sys::retro_environment_t));
    forward_to_lib!(retro_set_video_refresh, fn(cb: sys::retro_video_refresh_t));
    forward_to_lib!(retro_set_audio_sample, fn(cb: sys::retro_audio_sample_t));
    forward_to_lib!(retro_set_audio_sample_batch, fn(cb: sys::retro_audio_sample_batch_t));
    forward_to_lib!(retro_set_input_poll, fn(cb: sys::retro_input_poll_t));
    forward_to_lib!(retro_set_input_state, fn(cb: sys::retro_input_state_t));
    forward_to_lib!(retro_init, fn());
    forward_to_lib!(retro_deinit, fn());
    forward_to_lib!(retro_api_version, fn() -> sys::c_uint);
    forward_to_lib!(retro_get_system_info, fn(info: *mut sys::retro_system_info));
    forward_to_lib!(retro_get_system_av_info, fn(info: *mut sys::retro_system_av_info));
    forward_to_lib!(retro_set_controller_port_device, fn(port: sys::c_uint, device: sys::c_uint));
    forward_to_lib!(retro_reset, fn());
    forward_to_lib!(retro_run, fn());
    forward_to_lib!(retro_serialize_size, fn() -> usize);
    forward_to_lib!(retro_serialize, fn(data: *mut sys::c_void, size: usize) -> bool);
    forward_to_lib!(retro_unserialize, fn(data: *const sys::c_void, size: usize) -> bool);
    forward_to_lib!(retro_cheat_reset, fn());
    forward_to_lib!(retro_cheat_set, fn(index: sys::c_uint, enabled: bool, code: *const sys::c_char));
    forward_to_lib!(retro_load_game, fn(game: *const sys::retro_game_info) -> bool);
    forward_to_lib!(retro_load_game_special, fn(game_type: sys::c_uint, info: *const sys::retro_game_info, num_info: usize) -> bool);
    forward_to_lib!(retro_unload_game, fn());
    forward_to_lib!(retro_get_region, fn() -> sys::c_uint);
    forward_to_lib!(retro_get_memory_data, fn(id: sys::c_uint) -> *mut sys::c_void);
    forward_to_lib!(retro_get_memory_size, fn(id: sys::c_uint) -> usize);
}

pub trait Proxy {
    fn core(&self) -> &Core;

    fn retro_set_environment(&self, cb: sys::retro_environment_t) { self.core().retro_set_environment(cb) }
    fn retro_set_video_refresh(&self, cb: sys::retro_video_refresh_t) { self.core().retro_set_video_refresh(cb) }
    fn retro_set_audio_sample(&self, cb: sys::retro_audio_sample_t) { self.core().retro_set_audio_sample(cb) }
    fn retro_set_audio_sample_batch(&self, cb: sys::retro_audio_sample_batch_t) { self.core().retro_set_audio_sample_batch(cb) }
    fn retro_set_input_poll(&self, cb: sys::retro_input_poll_t) { self.core().retro_set_input_poll(cb) }
    fn retro_set_input_state(&self, cb: sys::retro_input_state_t) { self.core().retro_set_input_state(cb) }
    fn retro_init(&self) { self.core().retro_init() }
    fn retro_deinit(&self) { self.core().retro_deinit() }
    fn retro_api_version(&self) -> sys::c_uint { self.core().retro_api_version() }
    fn retro_get_system_info(&self, info: *mut sys::retro_system_info) { self.core().retro_get_system_info(info) }
    fn retro_get_system_av_info(&self, info: *mut sys::retro_system_av_info) { self.core().retro_get_system_av_info(info) }
    fn retro_set_controller_port_device(&self, port: sys::c_uint, device: sys::c_uint) { self.core().retro_set_controller_port_device(port, device) }
    fn retro_reset(&self) { self.core().retro_reset() }
    fn retro_run(&self) { self.core().retro_run() }
    fn retro_serialize_size(&self) -> usize { self.core().retro_serialize_size() }
    fn retro_serialize(&self, data: *mut sys::c_void, size: usize) -> bool { self.core().retro_serialize(data, size) }
    fn retro_unserialize(&self, data: *const sys::c_void, size: usize) -> bool { self.core().retro_unserialize(data, size) }
    fn retro_cheat_reset(&self) { self.core().retro_cheat_reset() }
    fn retro_cheat_set(&self, index: sys::c_uint, enabled: bool, code: *const sys::c_char) { self.core().retro_cheat_set(index, enabled, code) }
    fn retro_load_game(&self, game: *const sys::retro_game_info) -> bool { self.core().retro_load_game(game) }
    fn retro_load_game_special(&self, game_type: sys::c_uint, info: *const sys::retro_game_info, num_info: usize) -> bool { self.core().retro_load_game_special(game_type, info, num_info) }
    fn retro_unload_game(&self) { self.core().retro_unload_game() }
    fn retro_get_region(&self) -> sys::c_uint { self.core().retro_get_region() }
    fn retro_get_memory_data(&self, id: sys::c_uint) -> *mut sys::c_void { self.core().retro_get_memory_data(id) }
    fn retro_get_memory_size(&self, id: sys::c_uint) -> usize { self.core().retro_get_memory_size(id) }
}

#[macro_export]
macro_rules! proxy_to {
    ($proxy:expr) => {
        #[no_mangle] pub extern "C" fn retro_set_environment(cb: libretro_proxy::sys::retro_environment_t) { $proxy.retro_set_environment(cb) }
        #[no_mangle] pub extern "C" fn retro_set_video_refresh(cb: libretro_proxy::sys::retro_video_refresh_t) { $proxy.retro_set_video_refresh(cb) }
        #[no_mangle] pub extern "C" fn retro_set_audio_sample(cb: libretro_proxy::sys::retro_audio_sample_t) { $proxy.retro_set_audio_sample(cb) }
        #[no_mangle] pub extern "C" fn retro_set_audio_sample_batch(cb: libretro_proxy::sys::retro_audio_sample_batch_t) { $proxy.retro_set_audio_sample_batch(cb) }
        #[no_mangle] pub extern "C" fn retro_set_input_poll(cb: libretro_proxy::sys::retro_input_poll_t) { $proxy.retro_set_input_poll(cb) }
        #[no_mangle] pub extern "C" fn retro_set_input_state(cb: libretro_proxy::sys::retro_input_state_t) { $proxy.retro_set_input_state(cb) }
        #[no_mangle] pub extern "C" fn retro_init() { $proxy.retro_init() }
        #[no_mangle] pub extern "C" fn retro_deinit() { $proxy.retro_deinit() }
        #[no_mangle] pub extern "C" fn retro_api_version() -> libretro_proxy::sys::c_uint { $proxy.retro_api_version() }
        #[no_mangle] pub extern "C" fn retro_get_system_info(info: *mut libretro_proxy::sys::retro_system_info) { $proxy.retro_get_system_info(info) }
        #[no_mangle] pub extern "C" fn retro_get_system_av_info(info: *mut libretro_proxy::sys::retro_system_av_info) { $proxy.retro_get_system_av_info(info) }
        #[no_mangle] pub extern "C" fn retro_set_controller_port_device(port: libretro_proxy::sys::c_uint, device: libretro_proxy::sys::c_uint) { $proxy.retro_set_controller_port_device(port, device) }
        #[no_mangle] pub extern "C" fn retro_reset() { $proxy.retro_reset() }
        #[no_mangle] pub extern "C" fn retro_run() { $proxy.retro_run() }
        #[no_mangle] pub extern "C" fn retro_serialize_size() -> usize { $proxy.retro_serialize_size() }
        #[no_mangle] pub extern "C" fn retro_serialize(data: *mut libretro_proxy::sys::c_void, size: usize) -> bool { $proxy.retro_serialize(data, size) }
        #[no_mangle] pub extern "C" fn retro_unserialize(data: *const libretro_proxy::sys::c_void, size: usize) -> bool { $proxy.retro_unserialize(data, size) }
        #[no_mangle] pub extern "C" fn retro_cheat_reset() { $proxy.retro_cheat_reset() }
        #[no_mangle] pub extern "C" fn retro_cheat_set(index: libretro_proxy::sys::c_uint, enabled: bool, code: *const libretro_proxy::sys::c_char) { $proxy.retro_cheat_set(index, enabled, code) }
        #[no_mangle] pub extern "C" fn retro_load_game(game: *const libretro_proxy::sys::retro_game_info) -> bool { $proxy.retro_load_game(game) }
        #[no_mangle] pub extern "C" fn retro_load_game_special(game_type: libretro_proxy::sys::c_uint, info: *const libretro_proxy::sys::retro_game_info, num_info: usize) -> bool { $proxy.retro_load_game_special(game_type, info, num_info) }
        #[no_mangle] pub extern "C" fn retro_unload_game() { $proxy.retro_unload_game() }
        #[no_mangle] pub extern "C" fn retro_get_region() -> libretro_proxy::sys::c_uint { $proxy.retro_get_region() }
        #[no_mangle] pub extern "C" fn retro_get_memory_data(id: libretro_proxy::sys::c_uint) -> *mut libretro_proxy::sys::c_void { $proxy.retro_get_memory_data(id) }
        #[no_mangle] pub extern "C" fn retro_get_memory_size(id: libretro_proxy::sys::c_uint) -> usize { $proxy.retro_get_memory_size(id) }
    };
}
