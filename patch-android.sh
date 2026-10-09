#!/usr/bin/env bash
# Menyesuaikan proyek Android hasil "npx cap add android": izin, nomor versi, ikon, splash.
# Pemakaian: bash scripts/patch-android.sh <nomor-build>
set -euo pipefail
RUN="${1:-1}"
RES=android/app/src/main/res
MANIFEST=android/app/src/main/AndroidManifest.xml

# 1) Izin lokasi (GPS) dan kamera
python3 - "$MANIFEST" <<'PY'
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
add = '''    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
'''
if 'ACCESS_FINE_LOCATION' not in s:
    s = s.replace('<application', add + '    <application', 1)
open(p, 'w', encoding='utf-8').write(s)
print('Izin lokasi & kamera ditambahkan')
PY

# 2) Nomor versi (harus naik setiap build agar bisa menimpa versi lama)
sed -i "s/versionCode [0-9]*/versionCode ${RUN}/; s/versionName \"[^\"]*\"/versionName \"1.${RUN}\"/" android/app/build.gradle
echo "versionCode=${RUN}"

# 3) Ikon & splash (tidak fatal bila gagal)
set +e
if command -v magick >/dev/null 2>&1; then M=magick; else M=convert; fi
SRC=""
for f in icon-512.png icon-192.png; do [ -f "$f" ] && SRC="$f" && break; done
if [ -n "$SRC" ] && command -v "$M" >/dev/null 2>&1; then
  echo "Membuat ikon dari $SRC"
  for d in "mdpi 48 108" "hdpi 72 162" "xhdpi 96 216" "xxhdpi 144 324" "xxxhdpi 192 432"; do
    set -- $d; dir="$RES/mipmap-$1"; [ -d "$dir" ] || continue
    $M "$SRC" -resize "$2x$2" "$dir/ic_launcher.png"
    $M "$SRC" -resize "$2x$2" "$dir/ic_launcher_round.png"
    fg=$(( $3 * 66 / 100 ))
    $M "$SRC" -resize "${fg}x${fg}" -background none -gravity center -extent "$3x$3" "$dir/ic_launcher_foreground.png"
  done
  [ -f "$RES/values/ic_launcher_background.xml" ] && sed -i 's/#FFFFFF/#166534/I' "$RES/values/ic_launcher_background.xml"
  # splash: latar hijau + ikon di tengah (menimpa logo Capacitor)
  find "$RES" -name 'splash.png' | while read -r sp; do
    dim=$($M identify -format '%wx%h' "$sp" 2>/dev/null || identify -format '%wx%h' "$sp")
    w=${dim%x*}; h=${dim#*x}; min=$(( w < h ? w : h )); ic=$(( min * 28 / 100 ))
    $M -size "${w}x${h}" xc:'#166534' \( "$SRC" -resize "${ic}x${ic}" \) -gravity center -composite "$sp"
  done
else
  echo "Ikon sumber tidak ditemukan / ImageMagick tidak ada: memakai ikon bawaan"
fi
exit 0
