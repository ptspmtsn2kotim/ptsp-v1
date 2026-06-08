/**
 * Google Apps Script (code.gs)
 * Untuk sinkronisasi real-time semua layanan PTSP MTsN 2 Kotawaringin Timur ke masing-masing Sheet.
 * 
 * PETUNJUK PENGGUNAAN:
 * 1. Buka Google Spreadsheet tempat Anda ingin menyimpan data.
 * 2. Klik menu "Ekstensi" -> "Apps Script".
 * 3. Hapus semua kode default dan ganti dengan kode di bawah ini.
 * 4. Klik ikon Simpan (Disk) di bagian atas.
 * 5. Klik tombol "Terapkan" (Deploy) -> "Terapkan baru" (New deployment).
 * 6. Pilih jenis penerapan "Aplikasi web" (Web app).
 * 7. Isi Deskripsi (misal: "PTSP Real-time v2").
 * 8. Pada bagian "Yang memiliki akses" (Who has access), pilih "Siapa saja" (Anyone) -> Ini SANGAT PENTING agar sistem website bisa mengirim data.
 * 9. Klik "Terapkan" (Deploy) dan pilih akun Google Anda jika diminta otorisasi.
 * 10. Salin URL Aplikasi Web yang diberikan dan pastikan cocok dengan URL di server.ts.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Kunci proses selama maksimal 30 detik untuk menghindari tabrakan data (race condition)
    lock.waitLock(30000);
    
    // Parse data JSON yang dikirimkan oleh website
    var jsonString = e.postData.contents;
    var data = JSON.parse(jsonString);
    
    // Ambil spreadsheet aktif
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Nama sheet/tab berdasarkan nama layanan, batasi maksimal 100 karakter dan bersihkan karakter terlarang
    var sheetName = data.sheetName || 'Layanan Umum';
    sheetName = sheetName.replace(/[:\/\\\?\*\[\]]/g, '').substring(0, 100);
    
    var sheet = ss.getSheetByName(sheetName);
    
    // Jika sheet belum ada, buat sheet baru dan buat header kolom bawaan
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      
      // Header awal standar
      var initialHeaders = [
        'Tanggal Pengajuan', 
        'Nama Pengaju/Siswa', 
        'Status', 
        'Keterangan/Alasan', 
        'Admin Verifikasi', 
        'Tanggal Verifikasi'
      ];
      sheet.appendRow(initialHeaders);
      
      // Hias header baris pertama agar terlihat profesional (tebal & warna latar emerald pastel)
      var headerRange = sheet.getRange(1, 1, 1, initialHeaders.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#D1FAE5'); 
      headerRange.setHorizontalAlignment('center');
      headerRange.setVerticalAlignment('middle');
    }
    
    // Baca baris header yang ada saat ini
    var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
    
    // Pisahkan data bawaan (utama) dan data khusus formulir (data)
    var rowData = {};
    
    // Masukkan info utama ke peta data
    rowData['tanggalPengajuan'] = data.tanggalPengajuan || new Date().toISOString();
    rowData['namaSiswa'] = data.namaSiswa || 'Anonim';
    rowData['status'] = data.status || 'Menunggu Verifikasi';
    rowData['keterangan'] = data.keterangan || '';
    rowData['admin'] = data.admin || '';
    rowData['tanggalVerifikasi'] = data.tanggalVerifikasi || '';
    
    // Flat keys dari detail data tambahan (formulir isian dinamis)
    if (data.data && typeof data.data === 'object') {
      for (var key in data.data) {
        rowData[key] = data.data[key];
      }
    } else {
      // Jika dikirim secara flat dari root (fallback)
      for (var k in data) {
        if (['sheetName', 'tanggalPengajuan', 'namaSiswa', 'status', 'keterangan', 'admin', 'tanggalVerifikasi'].indexOf(k) === -1) {
          rowData[k] = data[k];
        }
      }
    }
    
    // Fungsi pembantu untuk menerjemahkan kunci teknis bahasa Inggris ke header bahasa Indonesia yang rapi
    function getFriendlyHeaderName(key) {
      var translations = {
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
      return translations[key] || (key.charAt(0).toUpperCase() + key.slice(1));
    }
    
    // Cek apakah ada kolom baru yang belum ada di header saat ini
    for (var key in rowData) {
      var headerName = getFriendlyHeaderName(key);
      if (headers.indexOf(headerName) === -1) {
        // Tambahkan kolom baru ke sheet di posisi kanan terakhir
        var lastCol = sheet.getLastColumn();
        sheet.insertColumnAfter(lastCol);
        var newColNum = lastCol + 1;
        
        // Atur nama header baru dan hias warnanya (light blue pastel)
        sheet.getRange(1, newColNum).setValue(headerName)
          .setFontWeight('bold')
          .setBackground('#E0F2FE')
          .setHorizontalAlignment('center')
          .setVerticalAlignment('middle');
          
        headers.push(headerName);
      }
    }
    
    // Susun baris nilai berdasarkan tata letak kolom header
    var rowValues = [];
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      var cellValue = '';
      
      for (var key in rowData) {
        if (getFriendlyHeaderName(key) === header) {
          var rawVal = rowData[key];
          if (typeof rawVal === 'object' && rawVal !== null) {
            cellValue = JSON.stringify(rawVal);
          } else {
            cellValue = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
          }
          break;
        }
      }
      rowValues.push(cellValue);
    }
    
    // Tambahkan data baris baru
    sheet.appendRow(rowValues);
    
    // Atur ukuran kolom otomatis agar pas dengan teks
    for (var col = 1; col <= sheet.getLastColumn(); col++) {
      sheet.autoResizeColumn(col);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      'status': 'success', 
      'message': 'Data dimasukkan dengan sukses ke sheet "' + sheetName + '"' 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      'status': 'error', 
      'message': error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    // Lepaskan kunci
    lock.releaseLock();
  }
}

// Untuk cek koneksi lewat browser biasa
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ 
    'status': 'online', 
    'message': 'Koneksi real-time Apps Script Aktif. Gunakan POST untuk mengirim data.' 
  })).setMimeType(ContentService.MimeType.JSON);
}
