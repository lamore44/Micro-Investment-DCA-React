/**
 * GBM (Geometric Brownian Motion) Monte Carlo Simulator
 * Dipakai buat proyeksi harga aset kripto ke depan
 *
 * Rumus utama:
 *   S_t = S_{t-1} * exp( (μ - σ²/2) + σ * Z_t )
 * di mana Z_t ~ N(0,1) dibangkitkan dengan transformasi Box-Muller
 */

// ---------------------------------------------------------------------------
// TIPE DATA
// ---------------------------------------------------------------------------

/** Satu titik persentil di bulan tertentu */
export interface PercentilePoint {
  month: number;  // 1-based (bulan ke-1, ke-2, ...)
  worst: number;  // persentil 5%
  low: number;    // persentil 25%
  median: number; // persentil 50%
  high: number;   // persentil 75%
  best: number;   // persentil 95%
}

/** Output lengkap dari runGBMSimulation */
export interface GBMSimulationResult {
  /** Array koordinat persentil tiap bulan — untuk grafik cone */
  percentileSeries: PercentilePoint[];
  /** Persentase skenario di mana nilai akhir > startValue (0–100) */
  probabilityOfProfit: number;
  /** Nilai median akhir di bulan terakhir */
  medianFinalValue: number;
  /** Nilai best-case (persentil 95%) di bulan terakhir */
  bestFinalValue: number;
  /** Nilai worst-case (persentil 5%) di bulan terakhir */
  worstFinalValue: number;
}

// ---------------------------------------------------------------------------
// HELPER: BOX-MULLER TRANSFORM
// ---------------------------------------------------------------------------

/**
 * Menghasilkan dua angka acak independen berdistribusi N(0,1)
 * menggunakan transformasi Box-Muller.
 *
 * Kenapa Box-Muller? Math.random() cuma kasih distribusi uniform [0,1).
 * GBM butuh distribusi normal. Box-Muller ngubah 2 angka uniform
 * jadi 2 angka normal — cepat & cukup akurat buat simulasi ini.
 *
 * Rumus:
 *   Z1 = sqrt(-2 * ln(U1)) * cos(2π * U2)
 *   Z2 = sqrt(-2 * ln(U1)) * sin(2π * U2)
 */
function boxMuller(): [number, number] {
  // Loop buat hindari kasus U1 = 0 (ln(0) = -Infinity)
  let u1: number, u2: number;
  do {
    u1 = Math.random();
    u2 = Math.random();
  } while (u1 === 0);

  const mag = Math.sqrt(-2.0 * Math.log(u1));
  const z1 = mag * Math.cos(2.0 * Math.PI * u2);
  const z2 = mag * Math.sin(2.0 * Math.PI * u2);
  return [z1, z2];
}

/**
 * Menghasilkan satu angka acak N(0,1).
 * Ambil salah satu dari pasangan Box-Muller.
 */
function randomNormal(): number {
  return boxMuller()[0];
}

// ---------------------------------------------------------------------------
// HELPER: HITUNG PERSENTIL
// ---------------------------------------------------------------------------

/**
 * Menghitung nilai persentil dari array angka.
 * Array HARUS sudah diurutkan (ascending) sebelum dipanggil.
 *
 * @param sortedArr - Array yang sudah diurutkan dari kecil ke besar
 * @param p         - Persentil yang diinginkan (0–100)
 */
function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0;
  if (p <= 0) return sortedArr[0];
  if (p >= 100) return sortedArr[sortedArr.length - 1];

  // Posisi "float" di dalam array
  const index = (p / 100) * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sortedArr[lower];

  // Interpolasi linear antara dua nilai terdekat
  const frac = index - lower;
  return sortedArr[lower] * (1 - frac) + sortedArr[upper] * frac;
}

// ---------------------------------------------------------------------------
// FUNGSI UTAMA: RUN GBM SIMULATION
// ---------------------------------------------------------------------------

const NUM_SCENARIOS = 500;  // jumlah path simulasi
const TRADING_DAYS_PER_MONTH = 30; // asumsi 30 hari/bulan (crypto 24/7)

/**
 * Menjalankan simulasi Monte Carlo berbasis GBM.
 *
 * @param startValue       - Nilai portofolio awal (modal awal + semua kontribusi DCA)
 * @param dailyDrift       - μ harian (rata-rata return harian, desimal, misal 0.001)
 * @param dailyVolatility  - σ harian (standar deviasi return harian, desimal, misal 0.03)
 * @param mcMonths         - Jumlah bulan proyeksi ke depan (misal 6, 12, 24)
 *
 * @returns GBMSimulationResult — persentil per bulan + metrik ringkasan
 *
 * Contoh pemakaian:
 *   const result = runGBMSimulation(10_000_000, 0.001, 0.035, 12);
 *   console.log(result.probabilityOfProfit); // misal 68.2
 */
export function runGBMSimulation(
  startValue: number,
  dailyDrift: number,
  dailyVolatility: number,
  mcMonths: number,
): GBMSimulationResult {
  const totalDays = mcMonths * TRADING_DAYS_PER_MONTH;

  // ── 1. JALANKAN 500 SKENARIO ──────────────────────────────────────────────
  //
  // scenarios[i] = array nilai portofolio di setiap hari untuk skenario ke-i
  // Ukurannya: 500 x (totalDays + 1) — index 0 adalah startValue
  //
  // Rumus GBM per langkah:
  //   S_t = S_{t-1} * exp( (μ - σ²/2)*Δt + σ*√Δt * Z_t )
  // Δt = 1 hari, jadi Δt = 1 dan √Δt = 1 → menyederhanakan:
  //   S_t = S_{t-1} * exp( (μ - σ²/2) + σ * Z_t )

  const drift = dailyDrift - (dailyVolatility * dailyVolatility) / 2;

  // Simpan hanya nilai di checkpoint bulanan, bukan semua hari
  // monthlySnapshots[i][m] = nilai skenario ke-i di akhir bulan ke-m (1-indexed)
  const monthlySnapshots: number[][] = Array.from(
    { length: NUM_SCENARIOS },
    () => [],
  );

  for (let i = 0; i < NUM_SCENARIOS; i++) {
    let currentValue = startValue;

    for (let day = 1; day <= totalDays; day++) {
      const Z = randomNormal();
      currentValue = currentValue * Math.exp(drift + dailyVolatility * Z);

      // Simpan snapshot di akhir setiap bulan
      if (day % TRADING_DAYS_PER_MONTH === 0) {
        monthlySnapshots[i].push(currentValue);
      }
    }
  }

  // ── 2. HITUNG PERSENTIL TIAP BULAN ───────────────────────────────────────

  const percentileSeries: PercentilePoint[] = [];

  for (let m = 0; m < mcMonths; m++) {
    // Kumpulkan nilai semua skenario di bulan ke-(m+1)
    const valuesAtMonth = monthlySnapshots.map(s => s[m]);

    // Urutkan ascending supaya fungsi percentile() bisa dipake
    valuesAtMonth.sort((a, b) => a - b);

    percentileSeries.push({
      month: m + 1,
      worst: percentile(valuesAtMonth, 5),
      low: percentile(valuesAtMonth, 25),
      median: percentile(valuesAtMonth, 50),
      high: percentile(valuesAtMonth, 75),
      best: percentile(valuesAtMonth, 95),
    });
  }

  // ── 3. HITUNG PROBABILITY OF PROFIT ──────────────────────────────────────
  //
  // Berapa skenario yang berakhir di atas startValue?

  const finalValues = monthlySnapshots.map(s => s[mcMonths - 1]);
  const profitableCount = finalValues.filter(v => v > startValue).length;
  const probabilityOfProfit = (profitableCount / NUM_SCENARIOS) * 100;

  // ── 4. HITUNG RINGKASAN NILAI AKHIR ──────────────────────────────────────

  const lastMonthPoint = percentileSeries[percentileSeries.length - 1];

  return {
    percentileSeries,
    probabilityOfProfit: parseFloat(probabilityOfProfit.toFixed(1)),
    medianFinalValue: lastMonthPoint.median,
    bestFinalValue: lastMonthPoint.best,
    worstFinalValue: lastMonthPoint.worst,
  };
}

// ---------------------------------------------------------------------------
// HELPER EXPORT: FORMAT PERSENTASE RETURN
// ---------------------------------------------------------------------------

/**
 * Menghitung persentase return dari nilai awal ke nilai akhir.
 * Dipakai buat nampilin "+72.4%" di UI.
 *
 * @param startValue - Nilai awal
 * @param endValue   - Nilai akhir dari simulasi
 * @returns string seperti "+72.40%" atau "-12.30%"
 */
export function formatReturn(startValue: number, endValue: number): string {
  if (startValue === 0) return '0.00%';
  const pct = ((endValue - startValue) / startValue) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}