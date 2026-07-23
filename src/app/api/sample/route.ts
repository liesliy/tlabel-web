import { generateSampleCSV } from '@/lib/tlabel/csv-parser';

export async function GET() {
  const rows = 4;
  const cols = 4;
  const samples = 200;
  const csv = generateSampleCSV(rows, cols, samples);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="sample_tactile_${rows}x${cols}.csv"`,
    },
  });
}
