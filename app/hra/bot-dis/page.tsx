import { redirect } from 'next/navigation';

// /hra/bot-dis was renamed to /hra/bot-test. Redirect preserves any query params.
export default async function HraBotDisPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      v === undefined ? [] : Array.isArray(v) ? v.map((s) => [k, s]) : [[k, v]]
    )
  ).toString();
  redirect(`/hra/bot-test${qs ? `?${qs}` : ''}`);
}
