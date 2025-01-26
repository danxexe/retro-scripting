// #![no_std]
#![cfg_attr(not(test), no_std)]
#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(rustdoc::broken_intra_doc_links)]

include!(concat!(env!("OUT_DIR"), "/bindings.rs"));

#[cfg(test)]
mod tests {
    use super::*;
    use core::ffi::CStr;
    use core::ffi::{c_char, c_uint, c_uchar};

    #[test]
    fn test_rc_hash_generate_from_buffer() {
        const RC_CONSOLE_GAMEBOY: c_uint = 4; // Will hash the full file contents
        const BUFFER_SIZE: usize = 1024;
        let buffer = [0 as c_uchar; BUFFER_SIZE];
        const EXPECTED_HASH: &str = "0f343b0931126a20f133d67c2b018a3b"; // Hash for a 0 filled 1kB file

        let mut hash_buffer = [0 as c_char; 33];

        let result = unsafe {
            rc_hash_generate_from_buffer(
                hash_buffer.as_mut_ptr(),
                RC_CONSOLE_GAMEBOY,
                buffer.as_ptr(),
                BUFFER_SIZE
            )
        };

        let hash = unsafe { CStr::from_ptr(hash_buffer.as_ptr()) }.to_str().expect("Invalid UTF-8 in hash");

        assert_eq!(1, result);
        assert_eq!(EXPECTED_HASH, hash);
    }

    unsafe extern "C" fn error_callback(arg1: *const ::core::ffi::c_char) {
        let message = unsafe { CStr::from_ptr(arg1) }.to_str().expect("Invalid UTF-8 in message");
        println!("Error: {}", message);
    }

    #[test]
    fn bla() {
        use core::ffi::CStr;

        const _EXPECTED_HASH: &str = "0f343b0931126a20f133d67c2b018a3b"; // Hash for a 0 filled 1kB file

        let path = CStr::from_bytes_with_nul(b"path/to/Game Disk.chd\0").expect("CString::new failed");

        let mut iter: std::mem::MaybeUninit<rc_hash_iterator> = std::mem::MaybeUninit::uninit();

        let mut hash_buffer = [0 as c_char; 33];

        let (_result, _hash) = unsafe {
            rc_hash_init_default_cdreader();
            rc_hash_init_error_message_callback(Some(error_callback));
            rc_hash_initialize_iterator(
                iter.as_mut_ptr(),
                path.as_ptr(),
                core::ptr::null(),
                0,
            );

            let result = rc_hash_iterate(hash_buffer.as_mut_ptr(), iter.as_mut_ptr());
            let hash = CStr::from_ptr(hash_buffer.as_ptr()).to_str().expect("Invalid UTF-8 in hash");

            println!("{:?}", iter.assume_init().consoles);

            (result, hash)
        };

        // TODO: Implement chd format support

        // assert_eq!(1, result);
        // assert_eq!(EXPECTED_HASH, hash);
    }
}
