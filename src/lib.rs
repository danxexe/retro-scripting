use std::collections::HashMap;
use std::sync::{LazyLock, RwLock};
use std::thread;
use std::ffi::{CString, CStr};
use libloading::{Library, Symbol};
use libretro_rs::sys::{
    retro_environment_t,
    retro_system_info,
    retro_game_info,
};

mod rpc_server;

const LIBRARY_NAME: &core::ffi::CStr = c"RetroScripting";
const LIBRARY_VERSION: &core::ffi::CStr = c"0.1";

static PROXY_STATE: RwLock<ProxyState> = RwLock::new(ProxyState::default());

struct Core {
    pub lib: Library,
}

impl Core {
    fn new(lib: Library) -> Core {
        Core { lib }
    }

    // Libretro functions

    fn retro_set_environment(&self, cb: retro_environment_t) {
        let func: Symbol<unsafe extern "C" fn(retro_environment_t)> =
        unsafe { self.lib.get(b"retro_set_environment\0").unwrap() };
        unsafe { func(cb) }
    }

    fn retro_init(&self) {
        let func: Symbol<unsafe extern "C" fn()> =
        unsafe { self.lib.get(b"retro_init\0").unwrap() };
        unsafe { func() }
    }

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
    environment_callback: Option<retro_environment_t>,
}

impl ProxyState {
    pub fn core(&self) -> &Core {
        self.core.as_ref().unwrap()
    }
    pub const fn default() -> Self {
        ProxyState {
            core: None,
            environment_callback: None,
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
pub extern "C" fn retro_api_version() -> ::std::os::raw::c_uint {
    1
}

#[no_mangle]
pub extern "C" fn retro_set_environment(cb: retro_environment_t) {
    let mut state = PROXY_STATE.write().unwrap();

    if let Some(core) = &state.core {
        let cb = state.environment_callback.unwrap();
        core.retro_set_environment(cb);
    } else {
        state.environment_callback = Some(cb);
        println!("[RetroScripting] Proxy core retro_set_environment called, environment_callback stored");
    }
}

#[no_mangle]
pub extern "C" fn retro_init() {
    println!("[RetroScripting] Proxy core retro_init called");
}

#[no_mangle]
pub extern "C" fn retro_get_system_info(info: *mut retro_system_info) {
    let state = PROXY_STATE.read().unwrap();

    if let Some(real_core) = &state.core {
        let func: Symbol<unsafe extern "C" fn(*mut retro_system_info)> =
            unsafe { real_core.lib.get(b"retro_get_system_info\0").unwrap() };
        unsafe { func(info) };
    } else {
        let dummy_info = retro_system_info {
            library_name: LIBRARY_NAME.as_ptr(),
            library_version: LIBRARY_VERSION.as_ptr(),
            valid_extensions: std::ptr::null(),
            need_fullpath: true,
            block_extract: true,
        };
        unsafe { *info = dummy_info };
    }
}

#[no_mangle]
pub extern "C" fn retro_load_game(game_info: *const retro_game_info) -> bool {
    println!("[RetroScripting] Proxy core retro_load_game called. Parsing core path...");

    let info = unsafe { &*game_info };
    let rom_path = unsafe { CStr::from_ptr(info.path).to_str().unwrap() };

    let (core_path, file_path) = parse_rom_path(rom_path);

    if let Some(file_path) = file_path {
        let mut state = PROXY_STATE.write().unwrap();

        let lib = unsafe {
            Library::new(&core_path).expect("[RetroScripting] Failed to load real core")
        };
        let core = Core::new(lib);
        state.core = Some(core);

        println!("[RetroScripting] Loaded real core: {}", &core_path);

        let clean_path = CString::new(file_path).unwrap();
        let mut real_info = *info;
        real_info.path = clean_path.as_ptr();

        let core = state.core.as_ref().unwrap();
        let environment_callback = state.environment_callback.unwrap();

        core.retro_set_environment(environment_callback);
        core.retro_init();
        let loaded = core.retro_load_game(&real_info);

        if loaded {
            let _ = &*SERVER;
        }

        loaded
    } else {
        eprintln!("[RetroScripting] No content specified in argument");
        return false;
    }
}

fn parse_rom_path(rom_path: &str) -> (String, Option<String>) {
    let mut parts = rom_path.splitn(2, '?');
    let core_path = parts.next().unwrap_or_default().to_string();
    let query = parts.next().unwrap_or("");

    let mut args = HashMap::new();
    for pair in query.split('&') {
        if let Some((key, value)) = pair.split_once('=') {
            args.insert(key.to_string(), value.to_string());
        }
    }

    (core_path, args.get("content").map(|s| s.to_string()))
}

fn core_get_memory_data(address: usize) -> u8 {
    let state = PROXY_STATE.read().unwrap();
    state.core().memory()[address]
}

macro_rules! forward_fn {
    ($name:ident, $ret:ty, $($arg:ident: $type:ty),*) => {
        #[no_mangle]
        pub extern "C" fn $name($($arg: $type),*) -> $ret {
            unsafe {
                let state = PROXY_STATE.read().unwrap();
                let core = &state.core.as_ref().unwrap();
                let lib = &core.lib;
                let func: Symbol<unsafe extern "C" fn($($type),*) -> $ret> = lib
                    .get(concat!(stringify!($name), "\0").as_bytes())
                    .expect("Failed to find function in wrapped core");
                func($($arg),*)
            }
        }
    };
}

// #[no_mangle]
// pub extern "C" fn retro_serialize_size() -> usize {
//     unsafe {
//         let core = &WRAPPED_CORE;
//         let func: Symbol<unsafe extern "C" fn() -> usize> = core
//             .get(b"retro_serialize_size\0")
//             .expect("Failed to find retro_init in wrapped core");
//         let result = func();

//         println!("retro_serialize_size called: {}", result);

//         result
//     }
// }

// forward_fn!(retro_api_version, (), );
// forward_fn!(retro_init, (), );
forward_fn!(retro_deinit, (), );
// forward_fn!(retro_get_system_info, (), info: *mut std::ffi::c_void);
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
// forward_fn!(retro_set_environment, (), cb: extern "C" fn(*const std::ffi::c_void));
forward_fn!(retro_set_controller_info, (), info: *mut std::ffi::c_void);
forward_fn!(retro_get_input_device_capabilities, u32, port: u32);
forward_fn!(retro_get_input_devices, u32, );
forward_fn!(retro_get_controls, u32, );
forward_fn!(retro_get_name, *const std::ffi::c_char, );
forward_fn!(retro_get_format, u32, );
forward_fn!(retro_get_core_version, *const std::ffi::c_char, );
