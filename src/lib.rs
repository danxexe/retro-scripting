use libloading::{Library, Symbol};
use core::panic;
use std::{collections::HashMap, sync::LazyLock};
use std::thread;
use jsonrpc_http_server::jsonrpc_core::{IoHandler, Params};
use serde_json;

type Request = HashMap<String, HashMap<String, usize>>;

static WRAPPED_CORE: LazyLock<Library> = LazyLock::new(|| {
    unsafe {
        Library::new("C:\\Emulation\\emulators\\RetroArch\\cores\\mednafen_psx_hw_libretro.dll").expect("Failed to load wrapped core library")
    }
});

static SERVER: LazyLock<()> = LazyLock::new(|| {
    println!("spawning!");

    thread::spawn(|| {
        let mut io = IoHandler::default();
        io.add_sync_method("read_memory", |params: Params| {
            // println!("read_memory: {:?}", params);

            params.parse::<Request>()
            .map(|request| {
                request.into_iter()
                .map(|(k, addresses)| {
                    match k.as_str() {
                        "u8" => {
                            let addresses = addresses.into_iter()
                            .map(|(name, address)| {
                                let value = core_get_memory_data(address);
                                (name, value as u64)
                            })
                            .collect::<HashMap<String, u64>>();

                            (k, addresses)
                        },
                        "u16le" => {
                            let addresses = addresses.into_iter()
                            .map(|(name, address)| {
                                let l = core_get_memory_data(address) as u16;
                                let r = (core_get_memory_data(address + 1) as u16) << 8;
                                let value = l + r;
                                (name, value as u64)
                            })
                            .collect::<HashMap<String, u64>>();

                            (k, addresses)
                        },
                        _ => panic!()
                    }
                })
                .collect::<HashMap<String, HashMap<String, u64>>>()
            })
            .map(|response| { serde_json::to_value(response).unwrap() })
        });

        let server = jsonrpc_http_server::ServerBuilder::new(io)
            .start_http(&"127.0.0.1:3030".parse().unwrap())
            .expect("Unable to start RPC server");

        server.wait();
    });
});

fn core_get_memory_data(address: usize) -> u8 {
    let memory_ptr = retro_get_memory_data(2);
    let memory_size = retro_get_memory_size(2);
    unsafe {
        let memory = std::slice::from_raw_parts(memory_ptr as *const u8, memory_size);
        memory[address]
    }    
}

macro_rules! forward_fn {
    ($name:ident, $ret:ty, $($arg:ident: $type:ty),*) => {
        #[no_mangle]
        pub extern "C" fn $name($($arg: $type),*) -> $ret {        
            unsafe {
                let _ = &*SERVER;
                let core = &WRAPPED_CORE;
                let func: Symbol<unsafe extern "C" fn($($type),*) -> $ret> = core
                    .get(concat!(stringify!($name), "\0").as_bytes())
                    .expect("Failed to find function in wrapped core");
                func($($arg),*)
            }
        }
    };
}

#[no_mangle]
pub extern "C" fn retro_init(game: *const std::ffi::c_void) {

    // Forward to the real core
    unsafe {
        let core = &WRAPPED_CORE;
        let func: Symbol<unsafe extern "C" fn(*const std::ffi::c_void) -> std::ffi::c_void> = core
            .get(b"retro_init\0")
            .expect("Failed to find retro_init in wrapped core");
        func(game);
    }
}

#[no_mangle]
pub extern "C" fn retro_serialize_size() -> bool {
    unsafe {
        let core = &WRAPPED_CORE;
        let func: Symbol<unsafe extern "C" fn() -> bool> = core
            .get(b"retro_serialize_size\0")
            .expect("Failed to find retro_init in wrapped core");
        let result = func();

        println!("retro_serialize_size called: {}", result);

        result
    }
}

forward_fn!(retro_api_version, (), );
// forward_fn!(retro_init, (), );
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
forward_fn!(retro_load_game, bool, game_info: *const std::ffi::c_void);
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
// forward_fn!(retro_serialize_size, usize, );
forward_fn!(retro_serialize, bool, data: *mut std::ffi::c_void, size: usize);
forward_fn!(retro_unserialize, bool, data: *const std::ffi::c_void, size: usize);
forward_fn!(retro_run, (), );
forward_fn!(retro_set_environment, (), cb: extern "C" fn(*const std::ffi::c_void));
forward_fn!(retro_set_controller_info, (), info: *mut std::ffi::c_void);
forward_fn!(retro_get_input_device_capabilities, u32, port: u32);
forward_fn!(retro_get_input_devices, u32, );
forward_fn!(retro_get_controls, u32, );
forward_fn!(retro_get_name, *const std::ffi::c_char, );
forward_fn!(retro_get_format, u32, );
forward_fn!(retro_get_core_version, *const std::ffi::c_char, );
