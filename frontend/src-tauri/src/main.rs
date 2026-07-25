#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::{Command, Child};
use std::sync::{Arc, Mutex};
use std::env;
use tauri::{RunEvent, WindowEvent, Manager};

struct BackendProcess {
    child: Arc<Mutex<Option<Child>>>,
}

fn spawn_backend() -> Option<Child> {
    // Look for the sidecar executable next to the app binary
    let current_dir = env::current_dir().unwrap_or_default();
    
    // In dev mode, we assume the backend is run separately or we could use python
    #[cfg(debug_assertions)]
    let cmd = Command::new("python")
        .arg("../../backend/main.py")
        .spawn();

    #[cfg(not(debug_assertions))]
    let cmd = {
        // Resolve path to bundled sidecar (studymate-backend)
        let exe_name = if cfg!(target_os = "windows") { "studymate-backend.exe" } else { "studymate-backend" };
        Command::new(current_dir.join(exe_name))
            .spawn()
    };

    match cmd {
        Ok(child) => {
            println!("Backend started successfully.");
            Some(child)
        },
        Err(e) => {
            eprintln!("Failed to start backend sidecar: {}", e);
            None
        }
    }
}

fn main() {
    let child_process = spawn_backend();
    let process_state = BackendProcess {
        child: Arc::new(Mutex::new(child_process)),
    };

    let child_arc = process_state.child.clone();

    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            
            #[cfg(debug_assertions)]
            window.open_devtools();

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(move |_app_handle, event| {
            match event {
                RunEvent::ExitRequested { .. } | RunEvent::Exit => {
                    // Kill the child process cleanly when app closes
                    if let Ok(mut lock) = child_arc.lock() {
                        if let Some(mut child) = lock.take() {
                            println!("Terminating backend...");
                            let _ = child.kill();
                        }
                    }
                },
                _ => {}
            }
        });
}
