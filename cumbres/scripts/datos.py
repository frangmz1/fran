# Genera src/data/mapa.json con los datos reales de Cumbres del Lago:
# huella de cada casa, calles, plumas y portones de las privadas, lago,
# parques, tipo de suelo y relieve.
#
# Fuentes abiertas (no hace falta cuenta ni llave):
#   - Overture Maps (casas detectadas en imágenes satelitales por Microsoft y
#     Google, calles de OpenStreetMap): https://overturemaps.org
#   - Relieve: Terrain Tiles de AWS (SRTM): https://registry.opendata.aws/terrain-tiles/
#
# Uso:
#   pip install pyarrow shapely numpy pillow requests
#   python3 scripts/datos.py
#
# Lo que se descarga se guarda en scripts/.cache para no bajarlo otra vez.

import base64
import hashlib
import io
import json
import math
import re
import sys
from pathlib import Path

import numpy as np
import pyarrow as pa
import pyarrow.compute as pc
import pyarrow.parquet as pq
import requests
import shapely
from PIL import Image
from shapely import affinity
from shapely.geometry import LineString, Point, Polygon, box, mapping
from shapely.ops import unary_union

AQUI = Path(__file__).resolve().parent
CACHE = AQUI / ".cache"
SALIDA = AQUI.parent / "src" / "data" / "mapa.json"

OVERTURE = "https://overturemaps-us-west-2.s3.amazonaws.com"
RELEASE = "release/2026-09-23.1"
RELIEVE = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium"

# Cumbres del Lago (calles "Lago ...", circuito Lago de Pátzcuaro y Pista Cumbres).
CUMBRES = (-100.4790, 20.6945, -100.4580, 20.7110)  # lon0, lat0, lon1, lat1
MARGEN_JUEGO = 250    # m alrededor de Cumbres que también se pueden recorrer
MARGEN_TERRENO = 700  # m de terreno extra para el horizonte
PASO = 8              # m entre muestras del relieve

LON0 = (CUMBRES[0] + CUMBRES[2]) / 2
LAT0 = (CUMBRES[1] + CUMBRES[3]) / 2
MX = 111320 * math.cos(math.radians(LAT0))  # metros por grado de longitud
MZ = 110574                                 # metros por grado de latitud

S = requests.Session()


def log(*a):
    print(*a, file=sys.stderr, flush=True)


# ---------------------------------------------------------------------------
# Coordenadas: x = este, z = sur, en metros desde el centro de Cumbres.

def a_metros(lon, lat):
    return (lon - LON0) * MX, -(lat - LAT0) * MZ


def a_grados(x, z):
    return LON0 + x / MX, LAT0 - z / MZ


def proyectar(g):
    return shapely.transform(g, lambda c: np.column_stack([(c[:, 0] - LON0) * MX, -(c[:, 1] - LAT0) * MZ]))


def caja_grados(margen):
    x0, z1 = a_metros(CUMBRES[0], CUMBRES[1])
    x1, z0 = a_metros(CUMBRES[2], CUMBRES[3])
    lon0, lat1 = a_grados(x0 - margen, z0 - margen)
    lon1, lat0 = a_grados(x1 + margen, z1 + margen)
    return (lon0, lat0, lon1, lat1)


def caja_metros(margen):
    x0, z1 = a_metros(CUMBRES[0], CUMBRES[1])
    x1, z0 = a_metros(CUMBRES[2], CUMBRES[3])
    return (x0 - margen, z0 - margen, x1 + margen, z1 + margen)


# ---------------------------------------------------------------------------
# Lectura de Overture por HTTP con rangos: solo se bajan los pedazos de los
# archivos Parquet que caen dentro de la zona.

class ArchivoHttp(io.RawIOBase):
    def __init__(self, key):
        self.url = f"{OVERTURE}/{key}"
        self.size = int(S.head(self.url, timeout=60).headers["Content-Length"])
        self.pos = 0

    def seekable(self):
        return True

    def readable(self):
        return True

    def tell(self):
        return self.pos

    def seek(self, off, whence=0):
        self.pos = off if whence == 0 else self.pos + off if whence == 1 else self.size + off
        return self.pos

    def read(self, n=-1):
        if n < 0:
            n = self.size - self.pos
        if n == 0 or self.pos >= self.size:
            return b""
        fin = min(self.size, self.pos + n) - 1
        for intento in range(5):
            try:
                datos = S.get(self.url, headers={"Range": f"bytes={self.pos}-{fin}"}, timeout=120).content
                break
            except requests.RequestException:
                if intento == 4:
                    raise
        self.pos += len(datos)
        return datos

    def readinto(self, b):
        d = self.read(len(b))
        b[: len(d)] = d
        return len(d)


def listar(prefijo):
    claves, token = [], None
    while True:
        url = f"{OVERTURE}/?list-type=2&prefix={prefijo}"
        if token:
            url += "&continuation-token=" + requests.utils.quote(token)
        t = S.get(url, timeout=60).text
        claves += re.findall(r"<Key>([^<]*)</Key>", t)
        m = re.search(r"<NextContinuationToken>([^<]*)</NextContinuationToken>", t)
        if not m:
            return [k for k in claves if k.endswith(".parquet")]
        token = m.group(1)


def overture(tema, tipo, caja):
    archivo = CACHE / f"{tipo}.parquet"
    if archivo.exists():
        return pq.read_table(archivo)
    log(f"Bajando {tema}/{tipo} de Overture…")
    x0, y0, x1, y1 = caja
    tablas = []
    for clave in listar(f"{RELEASE}/theme={tema}/type={tipo}/"):
        pf = pq.ParquetFile(ArchivoHttp(clave))
        md = pf.metadata
        grupos = []
        for i in range(md.num_row_groups):
            rg = md.row_group(i)
            est = {}
            for c in range(rg.num_columns):
                col = rg.column(c)
                if col.path_in_schema.startswith("bbox.") and col.statistics is not None and col.statistics.has_min_max:
                    est[col.path_in_schema] = (col.statistics.min, col.statistics.max)
            if len(est) < 4:
                continue
            if est["bbox.xmin"][0] > x1 or est["bbox.xmax"][1] < x0 or est["bbox.ymin"][0] > y1 or est["bbox.ymax"][1] < y0:
                continue
            grupos.append(i)
        if not grupos:
            continue
        t = pf.read_row_groups(grupos)
        b = t.column("bbox").combine_chunks()
        dentro = pc.and_(
            pc.and_(pc.less_equal(b.field("xmin"), x1), pc.greater_equal(b.field("xmax"), x0)),
            pc.and_(pc.less_equal(b.field("ymin"), y1), pc.greater_equal(b.field("ymax"), y0)),
        )
        t = t.filter(dentro)
        if t.num_rows:
            tablas.append(t)
    t = pa.concat_tables(tablas, promote_options="default")
    CACHE.mkdir(exist_ok=True)
    pq.write_table(t, archivo)
    log(f"  {t.num_rows} elementos")
    return t


def nombre(r):
    n = r.get("names")
    return n["primary"] if n and n.get("primary") else ""


# ---------------------------------------------------------------------------
# Relieve (mosaico de mosaicos Terrarium, zoom 15 ≈ 4.5 m por pixel).

def relieve(caja):
    z = 15
    n = 2 ** z

    def tile_xy(lon, lat):
        return (lon + 180) / 360 * n, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n

    tx0, ty0 = tile_xy(caja[0], caja[3])
    tx1, ty1 = tile_xy(caja[2], caja[1])
    ix0, iy0, ix1, iy1 = int(tx0), int(ty0), int(tx1), int(ty1)
    mosaico = np.zeros(((iy1 - iy0 + 1) * 256, (ix1 - ix0 + 1) * 256))
    for ty in range(iy0, iy1 + 1):
        for tx in range(ix0, ix1 + 1):
            archivo = CACHE / f"relieve-{z}-{tx}-{ty}.png"
            if not archivo.exists():
                log(f"Bajando relieve {tx},{ty}…")
                CACHE.mkdir(exist_ok=True)
                archivo.write_bytes(S.get(f"{RELIEVE}/{z}/{tx}/{ty}.png", timeout=60).content)
            im = np.asarray(Image.open(archivo).convert("RGB")).astype(float)
            h = im[:, :, 0] * 256 + im[:, :, 1] + im[:, :, 2] / 256 - 32768
            mosaico[(ty - iy0) * 256:(ty - iy0 + 1) * 256, (tx - ix0) * 256:(tx - ix0 + 1) * 256] = h

    # Quita picos sin dato (el mosaico trae algunos pixeles de cientos de metros).
    med = np.median(mosaico)
    malo = np.abs(mosaico - med) > 250
    mosaico[malo] = med

    def muestra(lon, lat):
        px, py = tile_xy(lon, lat)
        px, py = (px - ix0) * 256 - 0.5, (py - iy0) * 256 - 0.5
        i, j = int(math.floor(px)), int(math.floor(py))
        fx, fy = px - i, py - j
        a = mosaico[j, i] * (1 - fx) + mosaico[j, i + 1] * fx
        b = mosaico[j + 1, i] * (1 - fx) + mosaico[j + 1, i + 1] * fx
        return a * (1 - fy) + b * fy

    return muestra


def suavizar(h, sigma):
    r = int(sigma * 3)
    k = np.exp(-np.arange(-r, r + 1) ** 2 / (2 * sigma * sigma))
    k /= k.sum()
    p = np.pad(h, r, mode="edge")
    p = np.apply_along_axis(lambda f: np.convolve(f, k, mode="valid"), 0, p)
    p = np.apply_along_axis(lambda f: np.convolve(f, k, mode="valid"), 1, p)
    return p


# ---------------------------------------------------------------------------
# Casas.

def hash01(texto):
    return int(hashlib.md5(texto.encode()).hexdigest()[:8], 16) / 0xFFFFFFFF


def limpiar_poligono(g):
    if not g.is_valid:
        g = g.buffer(0)
    if g.geom_type == "MultiPolygon":
        g = max(g.geoms, key=lambda p: p.area)
    if g.geom_type != "Polygon" or g.is_empty:
        return None
    g = Polygon(g.exterior).simplify(0.25, preserve_topology=True)
    if g.is_empty or g.geom_type != "Polygon":
        return None
    return shapely.geometry.polygon.orient(g, 1.0)


def eje_largo(g):
    r = g.minimum_rotated_rectangle
    c = list(r.exterior.coords)
    a = (c[1][0] - c[0][0], c[1][1] - c[0][1])
    b = (c[2][0] - c[1][0], c[2][1] - c[1][1])
    la, lb = math.hypot(*a), math.hypot(*b)
    if la >= lb:
        return math.atan2(a[1], a[0]), la, lb, r
    return math.atan2(b[1], b[0]), lb, la, r


def dividir_hilera(g, calles_arbol, calles):
    """Las detecciones del satélite a veces juntan varias casas pegadas en un
    solo bloque. Si el bloque es largo, angosto y corre paralelo a la calle,
    se parte en casas de ~8.5 m de frente."""
    ang, largo, ancho, rect = eje_largo(g)
    if largo < 24 or ancho > 17 or ancho < 5 or g.area / rect.area < 0.72:
        return [g]
    c = g.centroid
    calle = calles[calles_arbol.nearest(c)]
    p = calle.interpolate(calle.project(c))
    q = calle.interpolate(min(calle.length, calle.project(c) + 2))
    if p.distance(q) < 0.5:
        q = calle.interpolate(max(0, calle.project(c) - 2))
    ang_calle = math.atan2(q.y - p.y, q.x - p.x)
    diff = abs(math.remainder(ang - ang_calle, math.pi))
    if diff > math.radians(35):
        return [g]
    n = max(2, round(largo / 8.5))
    g_rot = affinity.rotate(g, -ang, origin=c, use_radians=True)
    x0, y0, x1, y1 = g_rot.bounds
    partes = []
    for k in range(n):
        tira = box(x0 + (x1 - x0) * k / n, y0 - 1, x0 + (x1 - x0) * (k + 1) / n, y1 + 1)
        parte = g_rot.intersection(tira)
        parte = limpiar_poligono(affinity.rotate(parte, ang, origin=c, use_radians=True)) if not parte.is_empty else None
        if parte is not None and parte.area > 12:
            partes.append(parte)
    return partes or [g]


def frente(g, calles_arbol, calles):
    """Índice de la pared que da a la calle y distancia de esa pared a la calle."""
    c = g.centroid
    calle = calles[calles_arbol.nearest(c)]
    p = calle.interpolate(calle.project(c))
    vx, vz = p.x - c.x, p.y - c.y
    vl = math.hypot(vx, vz) or 1
    vx, vz = vx / vl, vz / vl
    coords = list(g.exterior.coords)[:-1]
    # orient(1.0) en (x, z) deja los vértices en sentido antihorario visto con z
    # hacia abajo: la normal exterior de la arista (a→b) es (dz, -dx).
    mejor, idx = -9, 0
    for i in range(len(coords)):
        a, b = coords[i], coords[(i + 1) % len(coords)]
        dx, dz = b[0] - a[0], b[1] - a[1]
        l = math.hypot(dx, dz)
        if l < 2.5:
            continue
        nx, nz = dz / l, -dx / l
        punt = (nx * vx + nz * vz) * min(1, l / 6)
        if punt > mejor:
            mejor, idx = punt, i
    a, b = coords[idx], coords[(idx + 1) % len(coords)]
    medio = Point((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    return idx, medio.distance(calle)


def pisos_de(area, clave):
    r = hash01(clave + "p")
    if area < 30:
        return 1
    if area < 60:
        return 1 if r < 0.5 else 2
    if area > 450:
        return 2 if r < 0.7 else 3
    if r < 0.06:
        return 1
    if r < 0.88:
        return 2
    return 3


def plano(g, dec=1):
    return [round(v, dec) for xy in list(g.exterior.coords)[:-1] for v in xy]


def linea(g, dec=1):
    return [round(v, dec) for xy in g.coords for v in xy]


# ---------------------------------------------------------------------------

ANCHO_CALLE = {
    "motorway": 11, "trunk": 10, "primary": 9, "secondary": 8, "tertiary": 7.5,
    "residential": 6.5, "unclassified": 6, "living_street": 5, "service": 4.5, "unknown": 5,
    "track": 3.5, "footway": 2.2, "path": 1.8, "pedestrian": 4, "cycleway": 2, "steps": 2,
}
CODIGO_CALLE = {
    "motorway": "v", "trunk": "v", "primary": "p", "secondary": "s", "tertiary": "t",
    "residential": "r", "unclassified": "r", "living_street": "r", "unknown": "r",
    "service": "e", "track": "c", "footway": "a", "path": "a", "pedestrian": "a", "cycleway": "a", "steps": "a",
}
PARA_AUTOS = set("vpstre")


def main():
    caja_terreno = caja_grados(MARGEN_TERRENO)
    x0, z0, x1, z1 = caja_metros(MARGEN_TERRENO)
    zona_terreno = box(x0, z0, x1, z1)
    zona_casas = box(*caja_metros(MARGEN_JUEGO))

    # --- Calles -----------------------------------------------------------
    calles_json, calles_autos, anchos_autos = [], [], []
    for r in overture("transportation", "segment", caja_terreno).to_pylist():
        if r["subtype"] != "road":
            continue
        g = proyectar(shapely.from_wkb(r["geometry"])).intersection(zona_terreno)
        if g.is_empty:
            continue
        clase = r["class"] or "unknown"
        cod = CODIGO_CALLE.get(clase, "r")
        un_sentido = any(
            a.get("access_type") == "denied" and (a.get("when") or {}).get("heading") == "backward" and not (a.get("when") or {}).get("mode")
            for a in (r["access_restrictions"] or [])
        )
        ancho = ANCHO_CALLE.get(clase, 6)
        if un_sentido and cod in "ps":
            ancho = 7
        for parte in getattr(g, "geoms", [g]):
            if parte.geom_type != "LineString" or parte.length < 1:
                continue
            parte = parte.simplify(0.3)
            d = {"c": cod, "w": ancho, "p": linea(parte)}
            if nombre(r):
                d["n"] = nombre(r)
            if un_sentido:
                d["u"] = 1
            if r.get("road_flags"):
                banderas = {f for rf in r["road_flags"] for f in (rf.get("values") or [])}
                if "is_bridge" in banderas:
                    d["b"] = 1
                if "is_tunnel" in banderas:
                    continue
            calles_json.append(d)
            if cod in PARA_AUTOS:
                calles_autos.append(parte)
                anchos_autos.append(ancho)
    arbol = shapely.STRtree(calles_autos)
    log(f"Calles: {len(calles_json)}")

    # --- Casas ------------------------------------------------------------
    # Superficie de las calles: las detecciones del satélite y los anchos de
    # calle no siempre cuadran, así que ninguna casa se deja encima del asfalto.
    asfalto = shapely.union_all([
        LineString(list(zip(c["p"][::2], c["p"][1::2]))).buffer(c["w"] / 2, cap_style="flat")
        for c in calles_json if c["c"] in PARA_AUTOS and len(c["p"]) >= 4
    ])
    shapely.prepare(asfalto)
    quitadas = recortadas = 0

    casas = []
    for r in overture("buildings", "building", caja_grados(MARGEN_JUEGO)).to_pylist():
        g = proyectar(shapely.from_wkb(r["geometry"]))
        if not zona_casas.contains(g.centroid):
            continue
        g = limpiar_poligono(g)
        if g is None or g.area < 12:
            continue
        clave_base = r["id"].replace("-", "")[:10]
        partes = dividir_hilera(g, arbol, calles_autos)
        for k, parte in enumerate(partes):
            clave = clave_base + (str(k) if len(partes) > 1 else "")
            if asfalto.intersects(parte):
                encima = parte.intersection(asfalto).area
                if encima > 0.3 * parte.area:
                    quitadas += 1
                    continue
                if encima > 0.2:
                    parte = limpiar_poligono(parte.difference(asfalto))
                    recortadas += 1
                    if parte is None or parte.area < 12:
                        continue
            idx, dist = frente(parte, arbol, calles_autos)
            casa = {
                "id": clave,
                "p": plano(parte),
                "f": idx,
                "d": round(dist, 1),
                "n": pisos_de(parte.area, clave),
            }
            if len(partes) > 1:
                casa["h"] = 1  # casa de hilera (pegada a sus vecinas)
            casas.append(casa)
    log(f"Casas: {len(casas)} ({quitadas} quitadas y {recortadas} recortadas por estar sobre la calle)")

    # --- Agua ---------------------------------------------------------------
    muestra = relieve(caja_terreno)
    nx = int(math.ceil((x1 - x0) / PASO)) + 1
    nz = int(math.ceil((z1 - z0) / PASO)) + 1
    alt = np.zeros((nz, nx))
    for j in range(nz):
        for i in range(nx):
            alt[j, i] = muestra(*a_grados(x0 + i * PASO, z0 + j * PASO))
    alt = suavizar(alt, 1.1)

    def alt_en(x, z):
        fi, fj = (x - x0) / PASO, (z - z0) / PASO
        i, j = min(nx - 2, max(0, int(fi))), min(nz - 2, max(0, int(fj)))
        tx, tz = fi - i, fj - j
        return (alt[j, i] * (1 - tx) + alt[j, i + 1] * tx) * (1 - tz) + (alt[j + 1, i] * (1 - tx) + alt[j + 1, i + 1] * tx) * tz

    agua_json = []
    for r in overture("base", "water", caja_terreno).to_pylist():
        g = proyectar(shapely.from_wkb(r["geometry"]))
        if g.geom_type not in ("Polygon", "MultiPolygon") or r["class"] == "swimming_pool":
            continue
        g = g.intersection(zona_terreno)
        for p in getattr(g, "geoms", [g]):
            if p.geom_type != "Polygon" or p.area < 300:
                continue
            p = shapely.geometry.polygon.orient(Polygon(p.exterior).simplify(1.0), 1.0)
            orilla = [alt_en(*p.exterior.interpolate(t, normalized=True).coords[0]) for t in np.linspace(0, 1, 60)]
            nivel = float(np.percentile(orilla, 15)) - 0.6
            # Hunde el terreno dentro del agua para que se vea la orilla.
            bx0, bz0, bx1, bz1 = p.bounds
            for j in range(max(0, int((bz0 - z0) / PASO) - 1), min(nz, int((bz1 - z0) / PASO) + 2)):
                for i in range(max(0, int((bx0 - x0) / PASO) - 1), min(nx, int((bx1 - x0) / PASO) + 2)):
                    q = Point(x0 + i * PASO, z0 + j * PASO)
                    if p.contains(q):
                        prof = 0.8 + min(3.5, p.exterior.distance(q) / 8)
                        alt[j, i] = min(alt[j, i], nivel - prof)
            d = {"p": plano(p), "y": round(nivel, 2)}
            if nombre(r):
                d["n"] = nombre(r)
            agua_json.append(d)
    log(f"Cuerpos de agua: {len(agua_json)}")

    # --- Parques y suelos -----------------------------------------------------
    parques = []
    TIPOS_PARQUE = {"park": "parque", "golf": "golf", "recreation": "deporte", "managed": "pasto", "horticulture": "jardin"}
    for r in overture("base", "land_use", caja_terreno).to_pylist():
        t = TIPOS_PARQUE.get(r["subtype"])
        if not t:
            continue
        g = proyectar(shapely.from_wkb(r["geometry"])).intersection(zona_terreno)
        for p in getattr(g, "geoms", [g]):
            if p.geom_type != "Polygon" or p.area < 150:
                continue
            p = shapely.geometry.polygon.orient(Polygon(p.exterior).simplify(0.8), 1.0)
            d = {"t": t, "p": plano(p)}
            if nombre(r):
                d["n"] = nombre(r)
            parques.append(d)
    log(f"Parques y jardines: {len(parques)}")

    suelos = []
    TIPOS_SUELO = {"barren": "tierra", "shrub": "monte", "grass": "zacate", "crop": "cultivo", "forest": "arboles"}
    for r in overture("base", "land_cover", caja_terreno).to_pylist():
        t = TIPOS_SUELO.get(r["subtype"])
        if not t:
            continue
        g = proyectar(shapely.from_wkb(r["geometry"])).intersection(zona_terreno)
        for p in getattr(g, "geoms", [g]):
            if p.geom_type != "Polygon" or p.area < 2000:
                continue
            p = Polygon(p.exterior).simplify(6)
            if p.is_valid and not p.is_empty and p.geom_type == "Polygon":
                suelos.append({"t": t, "p": plano(shapely.geometry.polygon.orient(p, 1.0), 0)})
    log(f"Manchas de suelo: {len(suelos)}")

    # --- Plumas y portones de las privadas --------------------------------------
    accesos = []
    for r in overture("base", "infrastructure", caja_terreno).to_pylist():
        if r["subtype"] != "barrier" or r["class"] not in ("gate", "lift_gate", "swing_gate"):
            continue
        g = proyectar(shapely.from_wkb(r["geometry"]))
        if g.geom_type != "Point" or not zona_casas.contains(g):
            continue
        k = arbol.nearest(g)
        calle = calles_autos[k]
        if calle.distance(g) > 4:
            continue
        s = calle.project(g)
        a = calle.interpolate(max(0, s - 1.5))
        b = calle.interpolate(min(calle.length, s + 1.5))
        ang = math.atan2(b.y - a.y, b.x - a.x)
        p = calle.interpolate(s)
        accesos.append({
            "t": "pluma" if r["class"] == "lift_gate" else "porton",
            "x": round(p.x, 1), "z": round(p.y, 1), "a": round(ang, 3), "w": anchos_autos[k],
        })
    # Entrada y salida de la misma privada vienen como dos accesos pegados: se deja uno.
    unicos = []
    for a in accesos:
        if all(math.hypot(a["x"] - u["x"], a["z"] - u["z"]) > 14 for u in unicos):
            unicos.append(a)
    accesos = unicos
    log(f"Plumas y portones: {len(accesos)}")

    # --- Relieve codificado ---------------------------------------------------------
    minimo = float(np.floor(alt.min()))
    q = np.clip(np.round((alt - minimo) * 10), 0, 65535).astype("<u2")
    lim = caja_metros(MARGEN_JUEGO)
    mapa = {
        "fuente": "Overture Maps " + RELEASE.split("/")[1] + " (Microsoft ML Buildings, Google Open Buildings, OpenStreetMap) y AWS Terrain Tiles",
        "origen": {"lon": round(LON0, 6), "lat": round(LAT0, 6)},
        "juego": [round(v) for v in lim],
        "relieve": {
            "x0": x0, "z0": z0, "paso": PASO, "nx": nx, "nz": nz, "min": minimo,
            "datos": base64.b64encode(q.tobytes()).decode(),
        },
        "calles": calles_json,
        "casas": casas,
        "agua": agua_json,
        "parques": parques,
        "suelos": suelos,
        "accesos": accesos,
    }
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(json.dumps(mapa, ensure_ascii=False, separators=(",", ":")))
    log(f"Listo: {SALIDA} ({SALIDA.stat().st_size / 1e6:.2f} MB)")


if __name__ == "__main__":
    main()
