/**
 * Google Apps Script v3 (code.gs)
 * SISTEM SINCRONISASI DATABASE REAL-TIME PTSP MTsN 2 KOTAWARINGIN TIMUR
 * 
 * Kode ini menyinkronkan seluruh akun admin, verifikator, siswa, dan semua pengajuan
 * secara real-time antar perangkat dan environment (Local, Dev, Vercel, dll).
 * 
 * PETUNJUK INSTALASI:
 * 1. Buka Google Spreadsheet Anda.
 * 2. Klik menu "Ekstensi" -> "Apps Script".
 * 3. Hapus semua kode lama dan ganti dengan seluruh kode di bawah ini.
 * 4. Simpan proyek dengan menekan tombol disket/Simpan.
 * 5. Klik "Terapkan" (Deploy) -> "Terapkan baru" (New deployment).
 * 6. Pilih jenis penerapan "Aplikasi web" (Web app).
 * 7. Pada bagian "Yang memiliki akses" (Who has access), ubah menjadi "Siapa saja" (Anyone). -> INI SANGAT PENTING!
 * 8. Klik "Terapkan" (Deploy) dan setujui izin akses Google Anda jika diminta.
 * 9. Salin URL Web App yang dihasilkan lalu gunakan untuk memperbarui sistem.
 */

// KUNCI PENGAMAN UNTUK MENGHINDARI TABRAKAN RECORD (RACE CONDITION)
var LOCK_TIMEOUT_MS = 30000;

/**
 * Handle GET requests dari server/client untuk memuat semua data
 */
function doGet(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
    
    var action = e.parameter.action;
    
    if (action === 'get_db') {
      var dbData = loadDatabaseFromSheets();
      return createJsonResponse({ status: 'success', data: dbData });
    }
    
    // Default ping response
    return createJsonResponse({ 
      status: 'online', 
      message: 'Koneksi database real-time aktif. Gunakan POST untuk memanipulasi data.' 
    });
    
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handle POST requests untuk menyimpan, mengupdate, atau menghapus data
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
    
    var jsonString = e.postData.contents;
    var payload = JSON.parse(jsonString);
    var action = payload.action;
    
    var result = { status: 'error', message: 'Aksi tidak dikenal' };
    
    if (action === 'save_request') {
      result = saveRequestToSheets(payload.request);
    } else if (action === 'delete_request') {
      result = deleteRequestFromSheets(payload.id);
    } else if (action === 'save_user') {
      result = saveUserToSheets(payload.user);
    } else if (action === 'delete_user') {
      result = deleteUserFromSheets(payload.id);
    } else if (action === 'test_connection') {
      result = { status: 'success', message: 'Koneksi spreadsheet berhasil!' };
    }
    
    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * HELPER: Membuat respon berformat JSON yang aman dari pemblokiran CORS
 */
function createJsonResponse(object) {
  return ContentService.createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * DATABASE WORKFLOWS: Ambil spreadsheet aktif dan buat sheet logis kunci jika belum ada
 */
function getOrCreateSheet(sheetName, headers, headerColor) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setFontWeight('bold');
    range.setBackground(headerColor || '#D1FAE5'); // Default pastel emerald
    range.setHorizontalAlignment('center');
    range.setVerticalAlignment('middle');
  }
  return sheet;
}

/**
 * MEMUAT DATABASE DARI SHEETS KUNCI (users & requests)
 */
function loadDatabaseFromSheets() {
  // Ambil atau buat sheet sistem penyimpanan internal
  var userSheet = getOrCreateSheet('_system_users_', 
    ['ID', 'Username', 'Password', 'Role', 'Name', 'Email', 'NIS', 'Kelas'], '#F3F4F6');
    
  var reqSheet = getOrCreateSheet('_system_requests_', 
    ['ID', 'StudentId', 'StudentName', 'ServiceId', 'ServiceName', 'Status', 'CurrentTier', 'CreatedAt', 'DataJSON', 'HistoryJSON'], '#F3F4F6');
  
  // Ambil semua baris user
  var usersList = [];
  var userRows = userSheet.getDataRange().getValues();
  if (userRows.length > 1) {
    for (var i = 1; i < userRows.length; i++) {
      var row = userRows[i];
      usersList.push({
        id: Number(row[0]),
        username: String(row[1]),
        password: String(row[2]),
        role: String(row[3]),
        name: String(row[4]),
        email: row[5] ? String(row[5]) : '',
        nis: row[6] ? String(row[6]) : '',
        kelas: row[7] ? String(row[7]) : ''
      });
    }
  }
  
  // Ambil semua baris requests
  var reqsList = [];
  var reqRows = reqSheet.getDataRange().getValues();
  if (reqRows.length > 1) {
    for (var j = 1; j < reqRows.length; j++) {
      var rRow = reqRows[j];
      try {
        reqsList.push({
          id: Number(rRow[0]),
          studentId: Number(rRow[1]),
          studentName: String(rRow[2]),
          serviceId: String(rRow[3]),
          serviceName: String(rRow[4]),
          status: String(rRow[5]),
          currentTier: String(rRow[6]),
          createdAt: String(rRow[7]),
          data: rRow[8] ? JSON.parse(rRow[8]) : {},
          history: rRow[9] ? JSON.parse(rRow[9]) : []
        });
      } catch (e) {
        Logger.log('Gagal parse JSON baris ' + j + ': ' + e.toString());
      }
    }
  }
  
  return {
    users: usersList,
    requests: reqsList
  };
}

/**
 * MENYIMPAN ATAU MERUBAH DATA USER DI _system_users_
 */
function saveUserToSheets(user) {
  var sheet = getOrCreateSheet('_system_users_', 
    ['ID', 'Username', 'Password', 'Role', 'Name', 'Email', 'NIS', 'Kelas'], '#F3F4F6');
  
  var rows = sheet.getDataRange().getValues();
  var foundRowIdx = -1;
  
  for (var i = 1; i < rows.length; i++) {
    if (Number(rows[i][0]) === Number(user.id)) {
      foundRowIdx = i + 1; // Baris di GS 1-indexed
      break;
    }
  }
  
  var rowValues = [
    user.id,
    user.username || '',
    user.password || '',
    user.role || '',
    user.name || '',
    user.email || '',
    user.nis || '',
    user.kelas || ''
  ];
  
  if (foundRowIdx !== -1) {
    // Update baris lama
    sheet.getRange(foundRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    // Append baris baru
    sheet.appendRow(rowValues);
  }
  
  // Sort by ID agar rapi
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).sort(1);
  }
  
  return { status: 'success', message: 'User berhasil disimpan!' };
}

/**
 * MENGHAPUS USER DARI SYSTEM
 */
function deleteUserFromSheets(id) {
  var sheet = getOrCreateSheet('_system_users_', 
    ['ID', 'Username', 'Password', 'Role', 'Name', 'Email', 'NIS', 'Kelas'], '#F3F4F6');
  
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (Number(rows[i][0]) === Number(id)) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'User dengan ID ' + id + ' berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'User tidak ditemukan' };
}

/**
 * MENYIMPAN ATAU MERUBAH PENGAJUAN (REQUEST)
 */
function saveRequestToSheets(request) {
  // 1. Simpan ke database terpusat '_system_requests_'
  var dbSheet = getOrCreateSheet('_system_requests_', 
    ['ID', 'StudentId', 'StudentName', 'ServiceId', 'ServiceName', 'Status', 'CurrentTier', 'CreatedAt', 'DataJSON', 'HistoryJSON'], '#F3F4F6');
  
  var rows = dbSheet.getDataRange().getValues();
  var foundRowIdx = -1;
  
  for (var i = 1; i < rows.length; i++) {
    if (Number(rows[i][0]) === Number(request.id)) {
      foundRowIdx = i + 1;
      break;
    }
  }
  
  var dataJsonStr = JSON.stringify(request.data || {});
  var historyJsonStr = JSON.stringify(request.history || []);
  
  var rowValues = [
    request.id,
    request.studentId || 0,
    request.studentName || 'Anonim',
    request.serviceId || 'layanan-umum',
    request.serviceName || 'Layanan Umum',
    request.status || 'Menunggu Verifikasi',
    request.currentTier || 'Admin',
    request.createdAt || new Date().toISOString(),
    dataJsonStr,
    historyJsonStr
  ];
  
  if (foundRowIdx !== -1) {
    dbSheet.getRange(foundRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    dbSheet.appendRow(rowValues);
  }
  
  // Urutkan pengajuan dari ID terkecil-terbesar
  if (dbSheet.getLastRow() > 1) {
    dbSheet.getRange(2, 1, dbSheet.getLastRow() - 1, dbSheet.getLastColumn()).sort(1);
  }
  
  // 2. Tulis juga baris cantiknya ke Tab khusus Layanan masing-masing (agar user melihat rekap per tab di spreadsheets)
  appendPrettyRowToServiceSheet(request);
  
  return { status: 'success', message: 'Pengajuan berhasil disinkronkan!' };
}

/**
 * MENGHAPUS PENGAJUAN DARI SYSTEM TERPUSAT
 */
function deleteRequestFromSheets(id) {
  var sheet = getOrCreateSheet('_system_requests_', 
    ['ID', 'StudentId', 'StudentName', 'ServiceId', 'ServiceName', 'Status', 'CurrentTier', 'CreatedAt', 'DataJSON', 'HistoryJSON'], '#F3F4F6');
  
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (Number(rows[i][0]) === Number(id)) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Pengajuan dengan ID ' + id + ' berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'Pengajuan tidak ditemukan' };
}

/**
 * HELPER PRETTY SHEET: Menyisipkan baris di Tab Layanan Spesifik demi visual representatif
 */
function appendPrettyRowToServiceSheet(request) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = request.serviceName || 'Layanan Umum';
  sheetName = sheetName.replace(/[:\/\\\?\*\[\]]/g, '').substring(0, 100);
  
  var sheet = ss.getSheetByName(sheetName);
  var defaultHeaders = [
    'ID Pengajuan',
    'Tanggal Pengajuan', 
    'Nama Pengaju/Siswa', 
    'Status', 
    'Keterangan/Alasan', 
    'Admin Verifikasi', 
    'Tanggal Verifikasi'
  ];
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(defaultHeaders);
    var headerRange = sheet.getRange(1, 1, 1, defaultHeaders.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#D1FAE5'); 
    headerRange.setHorizontalAlignment('center');
    headerRange.setVerticalAlignment('middle');
  }
  
  // Cari apakah data ID pengajuan ini sudah ada sebelumnya di tab ini untuk diupdate, atau ditambahkan baru
  var values = sheet.getDataRange().getValues();
  var targetRow = -1;
  for (var i = 1; i < values.length; i++) {
    if (Number(values[i][0]) === Number(request.id)) {
      targetRow = i + 1;
      break;
    }
  }
  
  // Dapatkan keterangan/alasan penolakan/persetujuan dari entri history terakhir
  var keterangan = '';
  var adminVerified = '';
  var tanggalVerified = '';
  
  if (request.history && request.history.length > 0) {
    for (var h = request.history.length - 1; h >= 0; h--) {
      var item = request.history[h];
      if (item.action === 'Ditolak' || item.action === 'Disetujui Final' || item.action === 'Disetujui') {
        keterangan = item.reason || item.action;
        adminVerified = item.by || '';
        tanggalVerified = item.date || '';
        break;
      }
    }
  }
  
  // Siapkan data dasar
  var flatRow = {};
  flatRow['idPengajuan'] = request.id;
  flatRow['tanggalPengajuan'] = request.createdAt || new Date().toISOString();
  flatRow['namaSiswa'] = request.studentName || 'Anonim';
  flatRow['status'] = request.status || 'Menunggu Verifikasi';
  flatRow['keterangan'] = keterangan;
  flatRow['admin'] = adminVerified;
  flatRow['tanggalVerifikasi'] = tanggalVerified;
  
  // Unpack data forms dinamis ke baris
  if (request.data && typeof request.data === 'object') {
    for (var dKey in request.data) {
      flatRow[dKey] = request.data[dKey];
    }
  }
  
  // Ambil struktur header terkini
  var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  
  // Kamus terjemahan field keys formulir ke teks manusiawi
  function translateKey(key) {
    var mapping = {
      'idPengajuan': 'ID Pengajuan',
      'tanggalPengajuan': 'Tanggal Pengajuan',
      'namaSiswa': 'Nama Pengaju/Siswa',
      'status': 'Status',
      'keterangan': 'Keterangan/Alasan',
      'admin': 'Admin Verifikasi',
      'tanggalVerifikasi': 'Tanggal Verifikasi',
      'namaPemohon': 'Nama Pemohon',
      'namaPelapor': 'Nama Pelapor',
      'namaSiswaDilapor': 'Nama Siswa yang Dilaporkan',
      'alasan': 'Alasan/Keterangan',
      'nis': 'NIS',
      'kelas': 'Kelas',
      'tanggalMulai': 'Tanggal Mulai',
      'tanggalSelesai': 'Tanggal Selesai',
      'kebutuhan': 'Kebutuhan',
      'kontak': 'Kontak/Keterangan',
      'noHp': 'Nomor HP/WA',
      'nomorHp': 'Nomor HP/WA',
      'jenisSurat': 'Jenis Surat Keterangan',
      'jumlah': 'Jumlah Peminjaman/Legalisir',
      'keperluan': 'Keperluan',
      'lokasi': 'Lokasi Kejadian',
      'deskripsi': 'Deskripsi Laporan',
      'barang': 'Barang yang Dipinjam'
    };
    return mapping[key] || (key.charAt(0).toUpperCase() + key.slice(1));
  }
  
  // Check jika ada field baru, jika ya tambahkan kolom di sheet
  for (var fKey in flatRow) {
    var colName = translateKey(fKey);
    if (headers.indexOf(colName) === -1) {
      var lastColNum = sheet.getLastColumn();
      sheet.insertColumnAfter(lastColNum);
      sheet.getRange(1, lastColNum + 1).setValue(colName)
        .setFontWeight('bold')
        .setBackground('#E0F2FE') // soft blue pastel untuk dinamik kolom
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle');
      headers.push(colName);
    }
  }
  
  // Petakan nilai sesuai urutan kolom header
  var appendValues = [];
  for (var hIdx = 0; hIdx < headers.length; hIdx++) {
    var colHeader = headers[hIdx];
    var val = '';
    for (var fKey in flatRow) {
      if (translateKey(fKey) === colHeader) {
        val = flatRow[fKey];
        if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val);
        }
        break;
      }
    }
    appendValues.push(val !== undefined && val !== null ? String(val) : '');
  }
  
  if (targetRow !== -1) {
    // Update baris yang sudah ada
    sheet.getRange(targetRow, 1, 1, appendValues.length).setValues([appendValues]);
  } else {
    // Append baris baru
    sheet.appendRow(appendValues);
  }
  
  // Format autofit lebar kolom
  for (var c = 1; c <= sheet.getLastColumn(); c++) {
    sheet.autoResizeColumn(c);
  }
}
