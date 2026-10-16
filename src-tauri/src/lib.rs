#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    // Only the end-to-end builds enable the `wdio` feature, so a normal build
    // has no WebDriver server to reach.
    #[cfg(feature = "wdio")]
    let builder = builder
        .plugin(tauri_plugin_wdio::init())
        .plugin(tauri_plugin_wdio_webdriver::init());

    builder
        .run(tauri::generate_context!())
        .expect("error while running the Allies app");
}