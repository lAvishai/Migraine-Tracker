import { MigraineLog } from "../types";

export interface DriveSyncStatus {
  lastSynced: string | null;
  fileUrl: string | null;
  fileId: string | null;
  isSyncing: boolean;
  error: string | null;
}

const BACKUP_FILE_NAME = "migraine_tracker_backup.json";

export interface DriveFileInfo {
  id: string;
  webViewLink?: string;
}

/**
 * Searches for an existing backup file in Google Drive or creates a new one.
 */
export async function findOrCreateDriveFile(accessToken: string): Promise<DriveFileInfo> {
  // 1. Search for existing file
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILE_NAME}' and trashed=false&fields=files(id,name,webViewLink)`;
  const searchRes = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    console.error("Error searching Google Drive:", errorText);
    throw new Error("נכשלה החיפוש בקובצי Google Drive");
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const existingFile = searchData.files[0];
    return {
      id: existingFile.id,
      webViewLink: existingFile.webViewLink,
    };
  }

  // 2. Create new file if not found
  const createUrl = `https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink`;
  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: BACKUP_FILE_NAME,
      mimeType: "application/json",
      description: "גיבוי אוטומטי של נתוני מעקב מיגרנות",
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    console.error("Error creating Google Drive backup file:", errorText);
    throw new Error("נכשלה יצירת קובץ הגיבוי ב-Google Drive");
  }

  const createdFile = await createRes.json();
  return {
    id: createdFile.id,
    webViewLink: createdFile.webViewLink,
  };
}

/**
 * Saves/overwrites current logs as JSON to the specified Google Drive file.
 */
export async function syncLogsToDrive(
  accessToken: string,
  fileId: string,
  logs: MigraineLog[]
): Promise<void> {
  const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
  const content = JSON.stringify(
    {
      appName: "MigraineTracker",
      lastUpdated: new Date().toISOString(),
      totalRecords: logs.length,
      logs: logs,
    },
    null,
    2
  );

  const res = await fetch(uploadUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: content,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Error updating Google Drive backup file:", errorText);
    throw new Error("שגיאה בעדכון קובץ הגיבוי ב-Google Drive");
  }
}

/**
 * Fetches the logs stored in the Google Drive backup file.
 */
export async function restoreLogsFromDrive(
  accessToken: string,
  fileId: string
): Promise<MigraineLog[]> {
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Error downloading Google Drive backup file:", errorText);
    throw new Error("נכשלה הורדת הגיבוי מ-Google Drive");
  }

  const data = await res.json();
  if (data && Array.isArray(data.logs)) {
    return data.logs;
  }
  return [];
}
