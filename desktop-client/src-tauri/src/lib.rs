/// Masaustu kabugu.
///
/// Uygulama mantiginin TAMAMI web tarafinda; burasi yalnizca pencereyi
/// aciyor ve yerel depolamayi sagliyor. Boylece ayni kod hem tarayicida
/// hem masaustunde calisiyor ve Rust tarafi bakim yuku olmuyor.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .run(tauri::generate_context!())
        .expect("Uygulama baslatilamadi");
}
