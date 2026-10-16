use tauri_plugin_sql::{Builder, Migration, MigrationKind};

/// Every migration the app runs on `sqlite:allies.db`, oldest first. sqlx
/// refuses a database whose applied migration has changed, so a change to one
/// of these files is a new, higher-numbered file rather than an edit.
fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "init",
        sql: include_str!("../migrations/0001_init.sql"),
        kind: MigrationKind::Up,
    }]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default().plugin(
        Builder::default()
            .add_migrations("sqlite:allies.db", migrations())
            .build(),
    );

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

#[cfg(test)]
mod tests {
    use super::migrations;

    #[test]
    fn versions_are_unique() {
        let versions: Vec<i64> = migrations().iter().map(|m| m.version).collect();
        let mut sorted = versions.clone();
        sorted.sort_unstable();
        sorted.dedup();
        assert_eq!(versions, sorted, "migration versions repeat: {versions:?}");
    }

    #[test]
    fn versions_are_ascending() {
        let versions: Vec<i64> = migrations().iter().map(|m| m.version).collect();
        let mut sorted = versions.clone();
        sorted.sort_unstable();
        assert_eq!(versions, sorted, "migration versions are out of order: {versions:?}");
    }

    #[test]
    fn every_migration_has_sql() {
        for migration in migrations() {
            assert!(!migration.sql.trim().is_empty(), "migration {} has no SQL", migration.version);
        }
    }
}