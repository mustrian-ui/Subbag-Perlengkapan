import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './firebase';

// Provider Setup
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-Memory Token Cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initialize Authentication status listener.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // Clear tokens if we don't have cached token and not actively signing in
        if (!isSigningIn) {
          cachedAccessToken = null;
          if (onAuthFailure) onAuthFailure();
        }
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google Popup and request Sheets scope.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google Sign-In.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve current cached access token.
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Log out and clear the cached access token in memory.
 */
export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Creates a brand new Google Spreadsheet with six tabs corresponding to all micro-apps:
 * 1. Peminjaman Ruang (SIPERUM)
 * 2. Peminjaman Kendaraan (SIPAKAR)
 * 3. Konsumsi Rapat (SajiRapat)
 * 4. Cinderamata Daerah (PetaCendera)
 * 5. Logistik & ATK (SILOGIS)
 * 6. Pengaduan Fasilitas (LAPOR-RT)
 * and populates their column headers automatically.
 */
export const createServiceSpreadsheet = async (accessToken: string): Promise<string> => {
  try {
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: 'Database Pelayanan Subbag RT & Perlengkapan (Setda Tarakan)',
        },
        sheets: [
          {
            properties: {
              title: 'Peminjaman Ruang',
              gridProperties: { rowCount: 1000, columnCount: 12 },
            }
          },
          {
            properties: {
              title: 'Peminjaman Kendaraan',
              gridProperties: { rowCount: 1000, columnCount: 10 },
            }
          },
          {
            properties: {
              title: 'Konsumsi Rapat',
              gridProperties: { rowCount: 1000, columnCount: 14 },
            }
          },
          {
            properties: {
              title: 'Cinderamata Daerah',
              gridProperties: { rowCount: 1000, columnCount: 13 },
            }
          },
          {
            properties: {
              title: 'Logistik & ATK',
              gridProperties: { rowCount: 1000, columnCount: 11 },
            }
          },
          {
            properties: {
              title: 'Pengaduan Sarpras',
              gridProperties: { rowCount: 1000, columnCount: 11 },
            }
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Sheets API Error creation: ${errText}`);
    }

    const data = await response.json();
    const spreadsheetId = data.spreadsheetId;

    if (!spreadsheetId) {
      throw new Error('Gagal mendapatkan ID Spreadsheet dari respons Google Sheets.');
    }

    // Initialize Column Headers for all 6 applications via Batch Update
    const initResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: "'Peminjaman Ruang'!A1:K1",
            values: [
              ['ID Peminjaman', 'Nama Ruang', 'Tanggal', 'Waktu', 'Agenda / Nama Kegiatan', 'Nama Pejabat / Staff Pemohon', 'Dinas / Instansi', 'Status', 'Waktu Dibuat', 'Tautan Dokumen', 'Nama Dokumen']
            ]
          },
          {
            range: "'Peminjaman Kendaraan'!A1:I1",
            values: [
              ['ID Permohonan', 'Nama Unit Kendaraan', 'Nama Pejabat / Staff Pemohon', 'Dinas / Instansi', 'Tujuan / Kegiatan', 'Status Persetujuan', 'Waktu Dibuat', 'Tautan Dokumen', 'Nama Dokumen']
            ]
          },
          {
            range: "'Konsumsi Rapat'!A1:M1",
            values: [
              ['ID Permohonan', 'Agenda / Nama Kegiatan', 'Pilih Konsumsi', 'Tanggal Kegiatan', 'Jam Kegiatan', 'Lokasi Kegiatan', 'Jumlah Permintaan', 'Nama Pejabat / Staff Pemohon', 'Dinas / Instansi', 'Status', 'Waktu Dibuat', 'Tautan Dokumen Srikandi', 'Nama Dokumen']
            ]
          },
          {
            range: "'Cinderamata Daerah'!A1:L1",
            values: [
              ['ID Permohonan', 'Jenis Cinderamata', 'Jumlah Permintaan', 'Keperluan / Acara', 'Tanggal Diperlukan', 'Nama Tamu / Penerima', 'Nama Pejabat / Pemohon', 'Dinas / Instansi', 'Status', 'Waktu Dibuat', 'Tautan Dokumen', 'Nama Dokumen']
            ]
          },
          {
            range: "'Logistik & ATK'!A1:J1",
            values: [
              ['ID Permintaan', 'Nama Barang / Logistik', 'Jumlah', 'Kegiatan', 'Nama Pejabat / Staff Pemohon', 'Dinas / Instansi', 'Status Permintaan', 'Waktu Dibuat', 'Tautan Dokumen', 'Nama Dokumen']
            ]
          },
          {
            range: "'Pengaduan Sarpras'!A1:J1",
            values: [
              ['ID Aduan', 'Waktu Masuk', 'Nama Pelapor', 'NIP Pelapor', 'Unit / Bagian OPD', 'Kategori Kerusakan', 'Lokasi / Ruang', 'Uraian Pengaduan', 'Status Penanganan', 'Waktu Pembaruan']
            ]
          }
        ]
      })
    });

    if (!initResponse.ok) {
      const initErr = await initResponse.text();
      console.warn('Failed to configure headers, spreadsheet was created but is currently empty:', initErr);
    }

    return spreadsheetId;
  } catch (error) {
    console.error('Error creating Google Spreadsheet:', error);
    throw error;
  }
};

/**
 * Appends a booking transaction (SIPERUM) to the specified Spreadsheet.
 */
export const appendBookingToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  booking: { id: string; ruang: string; tanggal: string; waktu: string; agenda: string; status: string; documentUrl?: string; documentName?: string; pemohon?: string; instansi?: string }
) => {
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' });
  const rowValues = [
    booking.id,
    booking.ruang,
    booking.tanggal,
    booking.waktu,
    booking.agenda,
    booking.pemohon || '',
    booking.instansi || '',
    booking.status,
    timestamp,
    booking.documentUrl || '',
    booking.documentName || ''
  ];

  return appendRowToSheet(accessToken, spreadsheetId, 'Peminjaman Ruang', rowValues);
};

/**
 * Appends a vehicle booking (SIPAKAR) to the specified Spreadsheet.
 */
export const appendVehicleToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  vehicle: { id: string; kendaraan: string; pemohon: string; tujuan: string; status: string; documentUrl?: string; documentName?: string; instansi?: string }
) => {
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' });
  const rowValues = [
    vehicle.id,
    vehicle.kendaraan,
    vehicle.pemohon,
    vehicle.instansi || '',
    vehicle.tujuan,
    vehicle.status,
    timestamp,
    vehicle.documentUrl || '',
    vehicle.documentName || ''
  ];

  return appendRowToSheet(accessToken, spreadsheetId, 'Peminjaman Kendaraan', rowValues);
};

/**
 * Appends a meeting catering request (SajiRapat) to the specified Spreadsheet.
 */
export const appendSajiRapatToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  request: { id: string; acara?: string; jenisKonsumsi?: string; tanggal?: string; waktu?: string; lokasi?: string; porsi?: string | number; pemohon?: string; instansi?: string; status: string; documentUrl?: string; documentName?: string }
) => {
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' });
  const rowValues = [
    request.id,
    request.acara || '',
    request.jenisKonsumsi || '',
    request.tanggal || '',
    request.waktu || '',
    request.lokasi || '',
    request.porsi || '',
    request.pemohon || '',
    request.instansi || '',
    request.status,
    timestamp,
    request.documentUrl || '',
    request.documentName || ''
  ];

  return appendRowToSheet(accessToken, spreadsheetId, 'Konsumsi Rapat', rowValues);
};

/**
 * Appends a souvenir / plaque request (PetaCendera) to the specified Spreadsheet.
 */
export const appendCinderamataToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  request: { id: string; jenisCinderamata: string; jumlah: string | number; keperluan: string; tanggalPerlu: string; penerima?: string; pemohon: string; instansi: string; status: string; documentUrl?: string; documentName?: string }
) => {
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' });
  const rowValues = [
    request.id,
    request.jenisCinderamata,
    request.jumlah,
    request.keperluan,
    request.tanggalPerlu,
    request.penerima || '-',
    request.pemohon,
    request.instansi,
    request.status,
    timestamp,
    request.documentUrl || '',
    request.documentName || ''
  ];

  return appendRowToSheet(accessToken, spreadsheetId, 'Cinderamata Daerah', rowValues);
};

/**
 * Appends a logistics & supplies order (SILOGIS) to the specified Spreadsheet.
 */
export const appendLogisticsToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  logistics: { id: string; barang: string; jumlah: string; status: string; documentUrl?: string; documentName?: string; kegiatan?: string; pemohon?: string; instansi?: string }
) => {
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' });
  const rowValues = [
    logistics.id,
    logistics.barang,
    logistics.jumlah,
    logistics.kegiatan || '',
    logistics.pemohon || '',
    logistics.instansi || '',
    logistics.status,
    timestamp,
    logistics.documentUrl || '',
    logistics.documentName || ''
  ];

  return appendRowToSheet(accessToken, spreadsheetId, 'Logistik & ATK', rowValues);
};

/**
 * Appends a maintenance complaint (LAPOR-RT) to the specified Spreadsheet.
 */
export const appendComplaintToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  complaint: { id: string; createdAt: string; name: string; nip?: string; bagian: string; type: string; location?: string; message: string; status: string }
) => {
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' });
  const rowValues = [
    complaint.id,
    complaint.createdAt || timestamp,
    complaint.name,
    complaint.nip || '-',
    complaint.bagian,
    complaint.type,
    complaint.location || '-',
    complaint.message,
    complaint.status,
    timestamp
  ];

  return appendRowToSheet(accessToken, spreadsheetId, 'Pengaduan Sarpras', rowValues);
};

/**
 * Bulk synchronizes all 6 services data to the Google Spreadsheet.
 */
export const syncAllServicesToSpreadsheet = async (
  accessToken: string,
  spreadsheetId: string,
  data: {
    bookings: any[];
    vehicles: any[];
    sajiRapat: any[];
    cinderamata: any[];
    logistics: any[];
    complaints: any[];
  }
): Promise<{ success: boolean; totalRowsSynced: number }> => {
  let totalRowsSynced = 0;

  // 1. Sync Bookings (SIPERUM)
  for (const b of data.bookings) {
    await appendBookingToSheet(accessToken, spreadsheetId, b);
    totalRowsSynced++;
  }

  // 2. Sync Vehicles (SIPAKAR)
  for (const v of data.vehicles) {
    await appendVehicleToSheet(accessToken, spreadsheetId, v);
    totalRowsSynced++;
  }

  // 3. Sync SajiRapat
  for (const s of data.sajiRapat) {
    await appendSajiRapatToSheet(accessToken, spreadsheetId, s);
    totalRowsSynced++;
  }

  // 4. Sync Cinderamata (PetaCendera)
  for (const c of data.cinderamata) {
    await appendCinderamataToSheet(accessToken, spreadsheetId, c);
    totalRowsSynced++;
  }

  // 5. Sync Logistics (SILOGIS)
  for (const l of data.logistics) {
    await appendLogisticsToSheet(accessToken, spreadsheetId, l);
    totalRowsSynced++;
  }

  // 6. Sync Complaints (LAPOR-RT)
  for (const comp of data.complaints) {
    await appendComplaintToSheet(accessToken, spreadsheetId, comp);
    totalRowsSynced++;
  }

  return { success: true, totalRowsSynced };
};

/**
 * Private helper to append array values to a Google Sheet Tab.
 */
const appendRowToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  values: any[]
) => {
  try {
    const range = `'${sheetName}'!A:Z`;
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          majorDimension: 'ROWS',
          values: [values]
        })
      }
    );

    if (!response.ok) {
      const errResponse = await response.text();
      throw new Error(`Google Sheets API append row error: ${errResponse}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error appending row to sheet "${sheetName}":`, error);
    throw error;
  }
};

/**
 * Helper to check if a spreadsheet actually exists and we have permissions.
 */
export const verifySpreadsheetPermissions = async (
  accessToken: string,
  spreadsheetId: string
): Promise<boolean> => {
  try {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Creates or gets a Google Drive folder named "Surat Pelayanan Setda Tarakan" inside the user's Google Drive.
 */
export const getOrCreateDriveFolder = async (accessToken: string): Promise<string> => {
  // First, check if there's an existing folder ID in localStorage
  const savedFolderId = localStorage.getItem('pemkot_gdrive_folder_id');
  if (savedFolderId) {
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${savedFolderId}?fields=id`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        return savedFolderId;
      }
    } catch (e) {
      console.warn('Saved folder not accessible or deleted', e);
    }
  }

  // Find if a folder with this name already exists
  try {
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='Surat Pelayanan Setda Tarakan' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.files && searchData.files.length > 0) {
        const existingId = searchData.files[0].id;
        localStorage.setItem('pemkot_gdrive_folder_id', existingId);
        return existingId;
      }
    }
  } catch (searchErr) {
    console.warn('Failed to search for folder:', searchErr);
  }

  // Create new folder
  try {
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Surat Pelayanan Setda Tarakan',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Drive API Folder creation failed: ${errText}`);
    }

    const data = await response.json();
    const folderId = data.id;
    if (folderId) {
      localStorage.setItem('pemkot_gdrive_folder_id', folderId);
      return folderId;
    }
    throw new Error('No folder ID returned from Google Drive API');
  } catch (error) {
    console.error('Error creating Google Drive Folder:', error);
    throw error;
  }
};

/**
 * Uploads a physical file directly to the specified Google Drive folder.
 */
export const uploadFileToDrive = async (
  accessToken: string,
  folderId: string,
  file: File
): Promise<{ id: string; webViewLink: string; name: string }> => {
  try {
    const metadata = {
      name: file.name,
      parents: [folderId],
    };

    const formData = new FormData();
    formData.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    formData.append('file', file);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Drive upload error: ${errText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      webViewLink: data.webViewLink || `https://drive.google.com/open?id=${data.id}`,
      name: data.name || file.name,
    };
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error);
    throw error;
  }
};
