use std::env;
use std::sync::LazyLock;
use std::thread;
use libretro_proxy::Core as LibretroCore ;
use libretro_proxy::Proxy as LibretroProxy;

mod rpc_server;

static STATE: LazyLock<ProxyState> = LazyLock::new(|| {
    let core_path = env::var("RETRO_SCRIPTING_CORE_PATH")
        .expect("[RetroScripting] Core path not specified. Please set the RETRO_SCRIPTING_CORE_PATH env var before running.");

    let core = LibretroCore::load(&core_path).unwrap_or_else(|| {panic!("Failed to load core from path: {}", &core_path) });

    ProxyState {core}
});

struct ProxyState {
    core: LibretroCore,
}

impl ProxyState {
    pub fn core(&self) -> &LibretroCore {
        &self.core
    }

    fn memory(&self) -> &[u8] {
        let memory_ptr = self.core.retro_get_memory_data(2);
        let memory_size = self.core.retro_get_memory_size(2);
        unsafe {
            std::slice::from_raw_parts(memory_ptr as *const u8, memory_size)
        }
    }
}

impl LibretroProxy for ProxyState {
    fn core(&self) -> &LibretroCore {
        &self.core
    }

    fn retro_load_game(&self, game: *const libretro_proxy::retro_game_info) -> bool {
        let loaded = self.core().retro_load_game(game);

        if loaded {
            let _ = &*SERVER;
        }

        loaded
    }
}

static SERVER: LazyLock<()> = LazyLock::new(|| {
    println!("spawning!");

    thread::spawn(|| {
        rpc_server::handler(core_get_memory_data);
    });
});

fn core_get_memory_data(address: usize) -> u8 {
    let state = &*STATE;
    state.memory()[address]
}

libretro_proxy::proxy_to!(&*STATE);
