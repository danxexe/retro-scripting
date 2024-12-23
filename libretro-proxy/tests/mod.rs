#[cfg(test)]
mod tests {
    use libretro_proxy::{Core, Proxy, retro_system_info};
    use cargo_metadata::MetadataCommand;
    use glob::glob;

    struct TestProxy {
        core: Core,
    }

    const PROXY_LIBRARY_NAME: &core::ffi::CStr = c"Example Core (Proxied)";

    impl Proxy for TestProxy {
        fn core(&self) -> &Core {
            &self.core
        }

        fn retro_get_system_info(&self, info: *mut retro_system_info) {
            self.core().retro_get_system_info(info);
            unsafe {
                assert_eq!("Example Core", std::ffi::CStr::from_ptr((*info).library_name).to_str().unwrap());
                (*info).library_name = PROXY_LIBRARY_NAME.as_ptr();
            }
        }
    }

    #[test]
    fn it_works() {
        let metadata = MetadataCommand::new().exec().expect("Failed to fetch cargo metadata");
        let target_dir = metadata.target_directory
            .join("debug").join("deps")
            .join("rust_libretro_example_core-*")
            .with_extension(std::env::consts::DLL_SUFFIX.replace(".", ""));

        let core_path = glob(target_dir.as_str())
            .expect("rust_libretro_example_core dynamic library not found")
            .last()
            .unwrap()
            .unwrap();

        let core = Core::load(core_path.to_str().unwrap())
            .expect("could not load rust_libretro_example_core dynamic library");

        let proxy = TestProxy {core};

        let mut info: std::mem::MaybeUninit<retro_system_info> = std::mem::MaybeUninit::uninit();

        let core_name = unsafe {
            proxy.core.retro_get_system_info(info.as_mut_ptr());
            let info = info.assume_init();
            std::ffi::CStr::from_ptr(info.library_name).to_str().unwrap()
        };
        let proxy_name = unsafe {
            proxy.retro_get_system_info(info.as_mut_ptr());
            let info = info.assume_init();
            std::ffi::CStr::from_ptr(info.library_name).to_str().unwrap()
        };

        assert_eq!(1, proxy.retro_api_version());
        assert_eq!("Example Core", core_name);
        assert_eq!("Example Core (Proxied)", proxy_name);
    }
}
