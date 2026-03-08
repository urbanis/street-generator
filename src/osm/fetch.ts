export interface OsmStreetTags {
  [key: string]: string | undefined;
}

export async function fetchOsmStreetAt(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<OsmStreetTags | null> {
  const delta = 0.0002;
  const bbox = `${lat - delta},${lng - delta},${lat + delta},${lng + delta}`;
  const query = `
    [out:json][timeout:10];
    way["highway"](${bbox});
    out tags 1;
  `;
  const url =
    "https://overpass-api.de/api/interpreter?data=" +
    encodeURIComponent(query);

  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const data = await res.json();
  const way = data?.elements?.[0];
  return way?.tags ?? null;
}
