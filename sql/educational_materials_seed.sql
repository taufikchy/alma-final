-- SQL untuk seed materi edukasi ALMA
-- Jalankan di Supabase SQL Editor

-- Hapus data lama (opsional)
-- DELETE FROM "EducationalMaterial";

-- Insert materi edukasi
INSERT INTO "EducationalMaterial" (id, title, content, "videoUrl1", "videoUrl2", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Anemia pada Ibu Hamil',
  '<p>Anemia pada ibu hamil adalah kondisi ketika kadar hemoglobin (Hb) dalam darah lebih rendah dari normal, sehingga tubuh tidak mampu membawa oksigen secara optimal ke jaringan ibu dan janin. Pada kehamilan, anemia umumnya ditetapkan bila kadar <strong>Hb < 11 g/dL</strong>.</p>',
  'HuWVk6BdSp4',
  'eLct8XXuTrg',
  NOW(),
  NOW()
);

INSERT INTO "EducationalMaterial" (id, title, content, "videoUrl1", "videoUrl2", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Penyebab Anemia pada Ibu Hamil',
  '<p>Beberapa penyebab utama anemia pada ibu hamil antara lain:</p>
  <ol>
    <li><strong>Pola makan tidak bergizi seimbang</strong> - Kurang consumption of iron-rich foods, folic acid, and vitamin B12</li>
    <li><strong>Ibu hamil kekurangan energi kronis (KEK)</strong> - Kondisi di mana asupan energi lebih rendah dari kebutuhan</li>
    <li><strong>Jarak kehamilan terlalu dekat</strong> - Tubuh belum sempat memulihkan cadangan zat besi</li>
    <li><strong>Infeksi kronis atau penyakit tertentu</strong> - Seperti cacingan, malaria, dan penyakit kronis lainnya</li>
  </ol>',
  NULL,
  NULL,
  NOW(),
  NOW()
);

INSERT INTO "EducationalMaterial" (id, title, content, "videoUrl1", "videoUrl2", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Tanda dan Gejala Anemia',
  '<p>Anemia sering tidak disadari, namun gejala yang dapat muncul meliputi:</p>
  <ul>
    <li><strong>5L:</strong> Lemah, Lelah, Letih, Lesu, dan Lunglai</li>
    <li>Pusing atau sakit kepala</li>
    <li>Wajah pucat</li>
    <li>Sesak napas</li>
    <li>Jantung berdebar</li>
  </ul>',
  NULL,
  NULL,
  NOW(),
  NOW()
);

INSERT INTO "EducationalMaterial" (id, title, content, "videoUrl1", "videoUrl2", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Dampak Anemia pada Ibu dan Janin',
  '<p><strong>A. Pada Ibu:</strong></p>
  <ul>
    <li>Risiko perdarahan saat persalinan</li>
    <li>Infeksi lebih mudah terjadi</li>
    <li>Kelelahan berat</li>
  </ul>
  <p><strong>B. Pada Janin:</strong></p>
  <ul>
    <li>Berat badan lahir rendah (BBLR)</li>
    <li>Kelahiran prematur</li>
    <li>Gangguan pertumbuhan janin</li>
    <li>Risiko kematian bayi</li>
  </ul>',
  NULL,
  NULL,
  NOW(),
  NOW()
);

INSERT INTO "EducationalMaterial" (id, title, content, "videoUrl1", "videoUrl2", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Cara Mencegah Anemia pada Ibu Hamil',
  '<ol>
    <li><strong>Konsumsi Tablet Tambah Darah (TTD) atau MMS</strong><br>Minum TTD atau Multiple Micronutrient Supplement (MMS) setiap hari selama kehamilan.</li>
    <li><strong>Pola Makan Bergizi Seimbang</strong><br>Perbanyak makanan tinggi zat besi seperti: daging merah, hati ayam/sapi, ikan, sayuran hijau (bayam, kangkung), dan kacang-kacangan.</li>
    <li><strong>Konsumsi Vitamin C</strong><br>Vitamin C membantu penyerapan zat besi. Sumber: jeruk, jambu, tomat.</li>
    <li><strong>Hindari Penghambat Penyerapan Zat Besi</strong><br>Kurangi konsumsi teh dan kopi saat makan karena dapat menghambat penyerapan zat besi.</li>
    <li><strong>Pemeriksaan Kehamilan Rutin</strong><br>Periksa Hb secara berkala di fasilitas kesehatan.</li>
  </ol>',
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- Verifikasi
SELECT id, title, "createdAt" FROM "EducationalMaterial" ORDER BY "createdAt";
