/**
 * openFDA food enforcement (recall) reports for a brand.
 * https://open.fda.gov/apis/food/enforcement/
 */
export interface Recall {
  date: string;
  reason: string;
  classification: string;
  product: string;
  status: string;
}

export async function fetchRecalls(brand: string, signal?: AbortSignal): Promise<Recall[]> {
  const firm = brand.split(',')[0].trim().replace(/"/g, '');
  if (!firm) return [];
  const url = `https://api.fda.gov/food/enforcement.json?search=recalling_firm:"${encodeURIComponent(firm)}"&sort=report_date:desc&limit=5`;
  const res = await fetch(url, { signal });
  if (res.status === 404) return []; // openFDA answers 404 when there are no matches
  if (!res.ok) throw new Error(`openFDA returned ${res.status}`);
  const data = await res.json();
  return (data.results ?? []).map((r: any) => ({
    date: formatDate(r.report_date ?? r.recall_initiation_date ?? ''),
    reason: r.reason_for_recall ?? '',
    classification: r.classification ?? '',
    product: r.product_description ?? '',
    status: r.status ?? '',
  }));
}

function formatDate(yyyymmdd: string): string {
  return /^\d{8}$/.test(yyyymmdd) ? `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6)}` : yyyymmdd;
}
