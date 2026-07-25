# 🛡️ PostgreSQL Backup & Restoration Runbook

This runbook documents the backup schedule and restoration verification procedure for the HospitalQueue PostgreSQL database.

---

## ⏰ 1. Managed Backup Schedule
* **Provider:** Render Managed PostgreSQL
* **Schedule:** Automated Daily Snapshots at 00:00 UTC
* **Retention Policy:** 7 Days Point-In-Time-Recovery (PITR)

---

## 🔄 2. Restoration Test Procedure
To verify that database backups can be successfully restored:

1. Navigate to Render Dashboard → PostgreSQL Database → **Backups**.
2. Select the latest daily automated snapshot.
3. Click **Restore to New Database**.
4. Run verification query against the restored instance:
   ```sql
   SELECT count(*) FROM users;
   SELECT count(*) FROM appointments;