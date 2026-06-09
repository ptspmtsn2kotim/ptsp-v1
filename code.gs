/**
 * Google Apps Script (code.gs) - Simple & Reliable Version
 * Untuk mencatat semua layanan PTSP MTsN 2 Kotawaringin Timur ke masing-masing Sheet/Tab.
 * 
 * PETUNJUK INSTALASI:
 * 1. Buka Google Spreadsheet Anda.
 * 2. Klik menu "Ekstensi" -> "Apps Script".
 * 3. Hapus semua kode lama dan ganti dengan seluruh kode di bawah ini.
 * 4. Simpan dengan menekan tombol disket/Simpan.
 * 5. Klik "Terapkan" (Deploy) -> "Terapkan baru" (New deployment).
 * 6. Pilih jenis penerapan "Aplikasi web" (Web app).
 * 7. Pada bagian "Yang memiliki akses" (Who has access), ubah menjadi "Siapa saja" (Anyone) -> INI SANGAT PENTING!
 * 8. Klik "Terapkan" (Deploy) dan setujui izin akses akun Google Anda jika diminta.
 * 9. Salin URL Web App yang dihasilkan.
 */

function doPost(e) {
  try {
    // 1. Pastikan ada data yang dikirim dan valid
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: 'error', message: 'Tidak ada data payload' });
    }

    // 2. Parse data JSON dari request
    var data = JSON.parse(e.postData.contents);

    // 3. Ambil nama sheet dari parameter 'sheetName'
    var sheetName = data.sheetName;
    if (!sheetName) {
      return createJsonResponse({ status: 'error', message: 'Parameter sheetName wajib diisi' });
    }

    // Hapus sheetName dari data agar tidak ikut masuk sebagai kolom data
    delete data.sheetName;

    // 4. Buka Spreadsheet aktif
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Bersihkan nama sheet dari karakter terlarang agar tidak error
    sheetName = sheetName.replace(/[:\/\\\?\*\[\]]/g, '').substring(0, 100);
    var sheet = ss.getSheetByName(sheetName);

    // 5. Jika sheet belum ada, buat sheet baru secara otomatis
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // 6. Ambil header (kolom) yang sudah ada di baris pertama
    var headers = [];
    var lastColumn = sheet.getLastColumn();
    if (lastColumn > 0) {
      // Ambil nilai baris pertama (header)
      headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    }

    // Fungsi pembantu untuk menerjemahkan kunci teknis ke nama kolom bahasa Indonesia yang cantik
    function getFriendlyHeaderName(key) {
      var translations = {
        'id': 'ID Pengajuan',
        'status': 'Status',
        'keterangan': 'Keterangan/Alasan/Catatan',
        'admin': 'Admin Verifikasi',
        'tanggalVerifikasi': 'Tanggal Verifikasi',
        'tanggalPengajuan': 'Tanggal Pengajuan',
        'namaSiswa': 'Nama Pengaju/Siswa',
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
      
      if (translations[key]) {
        return translations[key];
      }
      
      // Jika key tidak ada di kamus, ubah huruf pertama jadi besar (Capitalize)
      return key.charAt(0).toUpperCase() + key.slice(1);
    }

    var rowData = [];

    // 7. Looping data yang masuk dan cocokkan dengan header yang rapi
    for (var key in data) {
      var headerName = getFriendlyHeaderName(key);
      var headerIndex = headers.indexOf(headerName);
      
      // Jika key (kolom) belum ada di header, tambahkan kolom baru
      if (headerIndex === -1) {
        headers.push(headerName);
        headerIndex = headers.length - 1;
        
        var cell = sheet.getRange(1, headerIndex + 1);
        
        // Tulis header baru ke baris pertama
        cell.setValue(headerName);
        
        // Atur agar header baris pertama tebal (bold), rata tengah (center), dan berwarna hijau pastel cantik
        cell.setFontWeight("bold")
            .setBackground("#D1FAE5")
            .setHorizontalAlignment("center")
            .setVerticalAlignment("middle");
      }
      
      // Masukkan nilai ke array rowData sesuai urutan index header
      var cellVal = data[key];
      if (typeof cellVal === 'object' && cellVal !== null) {
        cellVal = JSON.stringify(cellVal);
      }
      rowData[headerIndex] = cellVal !== undefined && cellVal !== null ? String(cellVal) : '';
    }

    // 8. Pastikan panjang rowData sama dengan headers (isi string kosong jika ada yang terlewat)
    for (var i = 0; i < headers.length; i++) {
      if (rowData[i] === undefined) {
        rowData[i] = "";
      }
    }

    // 9. Tambahkan data sebagai baris baru di bagian paling bawah
    sheet.appendRow(rowData);

    // Otomatis sesuaikan lebar kolom (Auto-fit) agar rapi
    for (var col = 1; col <= sheet.getLastColumn(); col++) {
      sheet.autoResizeColumn(col);
    }

    // 10. Kembalikan respon sukses ke server Node.js
    return createJsonResponse({ 
      status: 'success', 
      message: 'Data berhasil disimpan ke sheet: ' + sheetName 
    });

  } catch (error) {
    // Tangkap error jika terjadi kegagalan
    return createJsonResponse({ 
      status: 'error', 
      message: error.toString() 
    });
  }
}

// Untuk mengecek koneksi Web App aktif dan mengambil data melalui GET
function doGet(e) {
  try {
    if (e.parameter && e.parameter.action === 'get_all') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheets = ss.getSheets();
      var allRequests = [];
      
      for (var i = 0; i < sheets.length; i++) {
        var sheet = sheets[i];
        var sheetName = sheet.getName();
        var lastRow = sheet.getLastRow();
        var lastCol = sheet.getLastColumn();
        
        if (lastRow > 0 && lastCol > 0) {
          var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
          var headers = data[0];
          
          for (var j = 1; j < data.length; j++) {
            var row = data[j];
            var obj = { serviceName: sheetName };
            
            for (var k = 0; k < headers.length; k++) {
              var header = headers[k];
              // Reverse translation of headers if needed, but we can just pass the raw object
              obj[header] = row[k];
            }
            allRequests.push(obj);
          }
        }
      }
      
      return createJsonResponse({
        status: 'success',
        data: allRequests
      });
    }
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }

  return createJsonResponse({ 
    status: 'online', 
    message: 'Koneksi Apps Script Aktif. Gunakan POST untuk mengirim data atau GET ?action=get_all untuk mengambil.' 
  });
}

// Fungsi bantuan untuk membuat output JSON yang aman (bebas CORS)
function createJsonResponse(responseObject) {
  return ContentService
    .createTextOutput(JSON.stringify(responseObject))
    .setMimeType(ContentService.MimeType.JSON);
}
