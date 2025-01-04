fn main() {
    cc::Build::new()
    .include("vendor/rcheevos/include")
    .file("vendor/rcheevos/src/rhash/aes.c")
    .file("vendor/rcheevos/src/rhash/cdreader.c")
    .file("vendor/rcheevos/src/rhash/hash.c")
    .file("vendor/rcheevos/src/rhash/md5.c")
    .compile("rcheevos");
}
