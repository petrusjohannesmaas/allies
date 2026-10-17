// Prevents an extra console window on Windows in a release build.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    allies_lib::run();
}