use std::env;
use std::sync::LazyLock;
use std::thread;
use libloading::{Library, Symbol};
use libretro_rs::sys::retro_game_info;

mod rpc_server;

static STATE: LazyLock<ProxyState> = LazyLock::new(|| {
    let core_path = env::var("RETRO_SCRIPTING_CORE_PATH")
        .expect("[RetroScripting] Core path not specified. Please set the RETRO_SCRIPTING_CORE_PATH env var before running.");

    let lib = unsafe {
        Library::new(&core_path).unwrap_or_else(|_| {panic!("[RetroScripting] Failed to load core from path: {}", core_path) })
    };

    ProxyState {core: Some(Core::new(lib))}
});

struct Core {
    pub lib: Library,
}

impl Core {
    fn new(lib: Library) -> Core {
        Core { lib }
    }

    // Libretro functions

    fn retro_load_game(&self, game_info: *const retro_game_info) -> bool {
        let func: Symbol<unsafe extern "C" fn(*const retro_game_info) -> bool> =
        unsafe { self.lib.get(b"retro_load_game\0").unwrap() };
        unsafe { func(game_info) }
    }

    fn retro_get_memory_size(&self, id: usize) -> usize {
        let func: Symbol<unsafe extern "C" fn(::std::os::raw::c_uint) -> usize> =
        unsafe { self.lib.get(b"retro_get_memory_size\0").unwrap() };
        unsafe { func(id.try_into().unwrap()) }
    }

    fn retro_get_memory_data(&self, id: usize) -> *mut std::ffi::c_void {
        let func: Symbol<unsafe extern "C" fn(::std::os::raw::c_uint) -> *mut ::std::os::raw::c_void> =
        unsafe { self.lib.get(b"retro_get_memory_data\0").unwrap() };
        unsafe { func(id.try_into().unwrap()) }
    }

    // Custom functions

    fn memory(&self) -> &[u8] {
        let memory_ptr = self.retro_get_memory_data(2);
        let memory_size = self.retro_get_memory_size(2);
        unsafe {
            std::slice::from_raw_parts(memory_ptr as *const u8, memory_size)
        }
    }
}

struct ProxyState {
    core: Option<Core>,
}

impl ProxyState {
    pub fn core(&self) -> &Core {
        self.core.as_ref().unwrap()
    }
    pub const fn default() -> Self {
        ProxyState {
            core: None,
        }
    }
}

impl Default for ProxyState {
    fn default() -> Self {
        ProxyState::default()
    }
}

static SERVER: LazyLock<()> = LazyLock::new(|| {
    println!("spawning!");

    thread::spawn(|| {
        rpc_server::handler(core_get_memory_data);
    });
});

#[no_mangle]
pub extern "C" fn retro_load_game(game_info: *const retro_game_info) -> bool {
    let state = &*STATE;
    let loaded = state.core().retro_load_game(game_info);

    if loaded {
        let _ = &*SERVER;
    }

    loaded
}

fn core_get_memory_data(address: usize) -> u8 {
    let state = &*STATE;
    state.core().memory()[address]
}

macro_rules! forward_fn {
    ($name:ident, $ret:ty, $($arg:ident: $type:ty),*) => {
        #[no_mangle]
        pub extern "C" fn $name($($arg: $type),*) -> $ret {
            let state = &*STATE;
            unsafe {
                let lib = &state.core().lib;
                let func: Symbol<unsafe extern "C" fn($($type),*) -> $ret> = lib
                    .get(concat!(stringify!($name), "\0").as_bytes())
                    .expect("Failed to find function in wrapped core");
                func($($arg),*)
            }
        }
    };
}

forward_fn!(retro_api_version, (), );
forward_fn!(retro_set_environment, (), cb: extern "C" fn(*const std::ffi::c_void));
forward_fn!(retro_init, (), );
forward_fn!(retro_deinit, (), );
forward_fn!(retro_get_system_info, (), info: *mut std::ffi::c_void);
forward_fn!(retro_get_system_av_info, (), info: *mut std::ffi::c_void);
forward_fn!(retro_set_video_refresh, (), cb: extern "C" fn(*const std::ffi::c_void, u32, u32, usize));
forward_fn!(retro_set_audio_sample, (), cb: extern "C" fn(i16, i16));
forward_fn!(retro_set_audio_sample_batch, (), cb: extern "C" fn(*const i16, usize) -> usize);
forward_fn!(retro_set_input_poll, (), cb: extern "C" fn());
forward_fn!(retro_set_input_state, (), cb: extern "C" fn(u32, u32, u32, u32) -> i16);
forward_fn!(retro_unload_game, (), );
forward_fn!(retro_get_memory_data, *mut std::ffi::c_void, id: u32);
forward_fn!(retro_get_memory_size, usize, id: u32);
// forward_fn!(retro_load_game, bool, game_info: *const std::ffi::c_void);
forward_fn!(retro_load_game_special, bool, game_type: u32, game_info: *const std::ffi::c_void);
forward_fn!(retro_cheat_reset, (), );
forward_fn!(retro_cheat_set, (), index: u32, enabled: bool, code: *const std::ffi::c_char);
forward_fn!(retro_get_region, u32, );
forward_fn!(retro_get_system_type, u32, );
forward_fn!(retro_get_system_id, *const std::ffi::c_char, );
forward_fn!(retro_get_system_name, *const std::ffi::c_char, );
forward_fn!(retro_get_libretro_version, *const std::ffi::c_char, );
forward_fn!(retro_set_controller_port_device, (), port: u32, device: u32);
forward_fn!(retro_reset, (), );
forward_fn!(retro_serialize_size, usize, );
forward_fn!(retro_serialize, bool, data: *mut std::ffi::c_void, size: usize);
forward_fn!(retro_unserialize, bool, data: *const std::ffi::c_void, size: usize);
forward_fn!(retro_run, (), );
forward_fn!(retro_set_controller_info, (), info: *mut std::ffi::c_void);
forward_fn!(retro_get_input_device_capabilities, u32, port: u32);
forward_fn!(retro_get_input_devices, u32, );
forward_fn!(retro_get_controls, u32, );
forward_fn!(retro_get_name, *const std::ffi::c_char, );
forward_fn!(retro_get_format, u32, );
forward_fn!(retro_get_core_version, *const std::ffi::c_char, );
