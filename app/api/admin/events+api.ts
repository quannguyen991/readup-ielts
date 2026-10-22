import { errorText } from '@/lib/server-locale';
import { countEvents, toCsv, type EventRow } from '@/services/admin/event-csv';
import { fetchAllPages } from '@/services/admin/fetch-all';
import { requireAdmin } from '@/services/admin/guard';

/**
 * GET /api/admin/events?days=7            → JSON: số lượt theo ngày, sự kiện, nguồn, chiến dịch
 * GET /api/admin/events?days=7&format=csv → file CSV để tải về
 * Chỉ admin. Mặc định 7 ngày, tối đa 90 ngày.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) return guard.response;
    const { admin } = guard;

    const url = new URL(request.url);
    const days = Math.min(Math.max(Number(url.searchParams.get('days') ?? 7) || 7, 1), 90);
    const since = new Date(Date.now() - days * 86_400_000).toISOString();

    const { rows, error, truncated } = await fetchAllPages<EventRow>((from, to) =>
      admin.from('app_events').select('at, name, utm_source, utm_campaign, signed_in').gte('at', since).order('id').range(from, to),
    );
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const counts = countEvents(rows);
    if (url.searchParams.get('format') === 'csv') {
      return new Response(toCsv(counts), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="readup-events-${days}d.csv"`,
        },
      });
    }
    return Response.json({ days, counts, truncated });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không đọc được sự kiện.', 'Could not load events.') }, { status: 500 });
  }
}
