use core::ffi::{c_char, c_int, c_uint, c_uchar};

unsafe extern "C" {
    pub unsafe fn rc_hash_generate_from_buffer(
        hash: *mut c_char,
        console_id: c_uint,
        buffer: *const c_uchar,
        buffer_size: usize,
    ) -> c_int;

    pub unsafe fn rc_hash_generate_from_file(
        hash: *mut c_char,
        console_id: c_uint,
        path: *const c_char,
    ) -> c_int;
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::ffi::CStr;

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
}
