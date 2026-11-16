/** Curated Unsplash photography used across the prototype. */
export const PHOTOS = {
  // Egypt
  sphinxPyramid: 'photo-1568322445389-f64ac2515020',
  pyramidsSky: 'photo-1600520611035-84157ad4084d',
  sphinxWalk: 'photo-1553913861-c0fddf2619ee',
  sphinxKhafre: 'photo-1628503218283-6ddeac69dfea',
  lanterns: 'photo-1710211288908-85757461216e',
  felucca: 'photo-1684100096410-fd39cdff91a3',
  feluccaSunset: 'photo-1706821210522-a16bd0c5f7b2',
  luxorTemple: 'photo-1629468855534-450d7c4c5f72',
  karnak: 'photo-1584719763904-2799b453ba8d',
  pharaohStatue: 'photo-1568322445389-dc9223328f88',
  redSeaBeach: 'photo-1665643956022-ee053e925743',
  redSeaBay: 'photo-1738935457539-936fdb320c51',
  // Saudi Arabia
  kaaba: 'photo-1770786106021-52580470e31e',
  kaabaCourtyard: 'photo-1605553378313-22d0dc541393',
  clockTower: 'photo-1592326871020-04f58c1a52f3',
  haramArches: 'photo-1647177156544-0d51fb7c900c',
  nabawiDome: 'photo-1739029995207-c633ff65afcc',
  nabawiMinarets: 'photo-1692566123227-0f68f1b9dac6',
  nabawiSky: 'photo-1711261817080-8f064416206c',
  nabawiDomes: 'photo-1692977579997-948328cdb7d2',
  // Worldwide
  zanzibarDhow: 'photo-1620896712848-d05411ec91ec',
  zanzibarSunset: 'photo-1511684633137-6b5fc88b3dbc',
  zanzibarBoat: 'photo-1610208738451-46dcfde84295',
  istanbulSunset: 'photo-1763965367072-54870fc7f1b6',
  istanbulMosque: 'photo-1564407727371-3eece6c58961',
  istanbulAerial: 'photo-1763965368246-5e89755e4455',
  dubaiSunset: 'photo-1612873649383-edf91f1cf7fe',
  dubaiMarina: 'photo-1459787915554-b34915863013',
  dubaiSkyline: 'photo-1607414851776-f2fcc379fb48',
  dubaiStorm: 'photo-1651467606797-e1c660cf3fda',
  marrakechAtlas: 'photo-1597212618440-806262de4f6b',
  marrakechCarriage: 'photo-1653323792487-6ecc6217040b',
  marrakechSpices: 'photo-1580746738099-1cb74f972feb',
  capeTownSea: 'photo-1604763655221-b98ebdac6ddf',
  capeTownSunset: 'photo-1588455471455-4b28e9ab3cd5',
  capeTownCity: 'photo-1626894169601-482d26b23f35',
  capeTownRocks: 'photo-1606799955515-85468ee78c26',
  maldivesVilla: 'photo-1697898109604-e06e88b15271',
  maldivesDock: 'photo-1601999705946-fbf42c3c6c66',
  maldivesBungalows: 'photo-1758717152007-6a2eb7299409',
  // Travel & stays
  wingSunset: 'photo-1792553623324-923ef0877756',
  wingClouds: 'photo-1651924607898-1b0a7f53cc52',
  hotelMoody: 'photo-1629140727571-9b5c6f6267b4',
  hotelClassic: 'photo-1578898886225-c7c894047899',
  hotelWave: 'photo-1731336478850-6bce7235e320',
  hotelBright: 'photo-1605346434674-a440ca4dc4c0',
  resortPool: 'photo-1549294413-26f195200c16',
  infinityPool: 'photo-1735770517146-e95c872226fc',
  passportStamps: 'photo-1655722725332-9925c96dd627',
  // People
  ahmed: 'photo-1659422440915-d516c6dc932e',
  mariam: 'photo-1718048170732-0ef8a77fce9e',
} as const

export type PhotoId = (typeof PHOTOS)[keyof typeof PHOTOS]

type PhotoOptions = { crop?: 'faces' | 'entropy' | 'edges'; quality?: number }

/** Builds a sized, cropped Unsplash CDN URL. */
export function photoUrl(id: string, width: number, height?: number, options: PhotoOptions = {}): string {
  const params = new URLSearchParams({
    auto: 'format',
    fit: 'crop',
    w: String(Math.round(width)),
    q: String(options.quality ?? 72),
  })
  if (height) params.set('h', String(Math.round(height)))
  if (options.crop) params.set('crop', options.crop)
  return `https://images.unsplash.com/${id}?${params.toString()}`
}
