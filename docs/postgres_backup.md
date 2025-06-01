# PostgreSQL Backups

To **automate PostgreSQL backups of the `pgdata` volume using cron**, you have a couple of options:

---

## ✅ Option 1: Backup with `pg_dump` Inside the Container

This is the cleanest and most reliable approach.

---

### 🧱 Step 1: Create a Backup Script

Create a file called `pg_backup.sh`:

```bash
#!/bin/bash

# Config
CONTAINER_NAME=postgres-container
BACKUP_DIR=/srv/pg_backups
DATE=$(date +\%F-\%H-%M-%S)
FILENAME=$BACKUP_DIR/pg_backup_$DATE.sql

# Ensure the backup directory exists
mkdir -p $BACKUP_DIR

# Run backup using pg_dumpall from inside the container
docker exec -t $CONTAINER_NAME pg_dumpall -U myuser > $FILENAME

# Optional: keep only the last 7 backups
find $BACKUP_DIR -type f -name "*.sql" -mtime +7 -exec rm {} \;
```

Make it executable:

```bash
chmod +x pg_backup.sh
```

---

### 🧱 Step 2: Test the Script

Run:

```bash
./pg_backup.sh
```

Check that it creates a file like:

```
/srv/pg_backups/pg_backup_2025-05-31-14-33-02.sql
```

---

### 🧱 Step 3: Set Up Cron Job

Edit crontab for root or a dedicated backup user:

```bash
crontab -e
```

Add a line to run the backup daily at 2AM:

```bash
0 2 * * * /path/to/pg_backup.sh >> /var/log/pg_backup.log 2>&1
```

> Replace `/path/to/pg_backup.sh` with the actual path.

---

### ✅ Option 2: Backup the Entire Volume as a Tarball (Raw Volume)

You can also tar the Docker volume directly. This is useful if you don't need to inspect SQL files and want exact data folder backups.

#### Backup:

```bash
docker run --rm \
  -v pgdata:/volume \
  -v /srv/pg_backups:/backup \
  alpine \
  tar czf /backup/pgdata_$(date +%F).tar.gz -C /volume .
```

Add this to your cron script if you'd rather snapshot raw data.

---

### 🔐 Security Tips

* Store backups outside the container (e.g. `/srv/pg_backups`).
* Consider encrypting or syncing backups to cloud storage.
* Use `pg_dump` for easier restoration and migration.

---