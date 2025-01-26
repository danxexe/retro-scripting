use std::{env, path::PathBuf};

fn main() {
    cc::Build::new()
        .include("vendor/rcheevos/include")
        .file("vendor/rcheevos/src/rhash/aes.c")
        .file("vendor/rcheevos/src/rhash/cdreader.c")
        .file("vendor/rcheevos/src/rhash/hash.c")
        .file("vendor/rcheevos/src/rhash/md5.c")
        .file("vendor/rcheevos/src/rc_compat.c")
        .compile("rcheevos_hash");

    println!("cargo::rustc-link-lib=static=rcheevos_hash");

    let bindings = bindgen::Builder::default()
        .header("vendor/rcheevos/include/rc_hash.h")
        .use_core()
        .layout_tests(true)
        .impl_debug(true)
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        .generate()
        .expect("Unable to generate bindings");

    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());

    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");
}
