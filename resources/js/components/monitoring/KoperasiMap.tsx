import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    AlertTriangle,
    Camera,
    Check,
    ChevronDown,
    Loader2,
    Maximize2,
    Minimize2,
    Search,
} from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { mapPoints as mapPointsRoute } from '@/routes/monitoring';
import type {
    MapPointsResponse,
    MapPointTuple,
    MarkerColor,
    MarkerTier,
} from '@/types/monitoring';

const COLOR_HEX: Record<MarkerColor, string> = {
    red: '#dc2626',
    orange: '#f97316',
    yellow: '#eab308',
    green: '#16a34a',
    blue: '#2563eb',
    gray: '#9ca3af',
};

const SPRITE_SIZE = 22;
const SPRITE_RADIUS = SPRITE_SIZE / 2;

function drawShape(
    ctx: CanvasRenderingContext2D,
    tier: MarkerTier,
    color: string,
    offsetX = 0,
    offsetY = 0,
) {
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    switch (tier) {
        case 'sarpras': {
            ctx.beginPath();
            ctx.moveTo(11, 2);
            ctx.lineTo(20, 19);
            ctx.lineTo(2, 19);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
        }
        case 'sdm': {
            ctx.beginPath();
            ctx.arc(11, 7, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(3, 20);
            ctx.bezierCurveTo(3, 15.6, 6.6, 13, 11, 13);
            ctx.bezierCurveTo(15.4, 13, 19, 15.6, 19, 20);
            ctx.fill();
            ctx.stroke();
            break;
        }
        case 'odoo': {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(2, 3);
            ctx.lineTo(4, 3);
            ctx.lineTo(6, 15);
            ctx.lineTo(17, 15);
            ctx.lineTo(19, 7);
            ctx.lineTo(6, 7);
            ctx.stroke();

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(8, 19, 1.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(16, 19, 1.6, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        default: {
            ctx.beginPath();
            ctx.arc(SPRITE_RADIUS, SPRITE_RADIUS, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
        }
    }

    ctx.restore();
}

function shapeSvg(tier: MarkerTier, color: string): string {
    switch (tier) {
        case 'sarpras':
            return `<svg width="22" height="22" viewBox="0 0 22 22"><polygon points="11,2 20,19 2,19" fill="${color}" stroke="white" stroke-width="1.5"/></svg>`;
        case 'sdm':
            return `<svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="7" r="4" fill="${color}" stroke="white" stroke-width="1.5"/><path d="M3 20c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="${color}" stroke="white" stroke-width="1.5"/></svg>`;
        case 'odoo':
            return `<svg width="22" height="22" viewBox="0 0 22 22"><path d="M2 3h2l2 12h11l2-8H6" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/><circle cx="8" cy="19" r="1.6" fill="${color}"/><circle cx="16" cy="19" r="1.6" fill="${color}"/></svg>`;
        default:
            return `<svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7" fill="${color}" stroke="white" stroke-width="1.5"/></svg>`;
    }
}

const FIELD = {
    nik: 0,
    nama: 1,
    provinsi: 2,
    kotaKabupaten: 3,
    kecamatan: 4,
    kodim: 5,
    lat: 6,
    lng: 7,
    validationStatus: 8,
    progress: 9,
    completedSarprasCount: 10,
    sarprasPrimary: 11,
    sarprasSecondary: 12,
    sarprasLengkap: 13,
    jumlahKaryawan: 14,
    hasPo: 15,
    hasReceipt: 16,
    hasSales: 17,
    tier: 18,
    color: 19,
} as const;

function popupHtml(point: MapPointTuple): string {
    const yesNo = (value: boolean) => (value ? 'Ya' : 'Belum');

    return `
        <div style="font-size:13px;line-height:1.5;min-width:220px">
            <p style="font-weight:600;margin-bottom:2px">${point[FIELD.nama] ?? '-'}</p>
            <p style="color:#6b7280;margin-bottom:6px">${[point[FIELD.kecamatan], point[FIELD.kotaKabupaten], point[FIELD.provinsi]].filter(Boolean).join(', ')}</p>
            <table style="width:100%;border-collapse:collapse">
                <tr><td style="color:#6b7280;padding:1px 0">Status verifikasi</td><td style="text-align:right;font-weight:500">${point[FIELD.validationStatus] ?? '-'}</td></tr>
                <tr><td style="color:#6b7280;padding:1px 0">Progres pembangunan</td><td style="text-align:right;font-weight:500">${point[FIELD.progress]}%</td></tr>
                <tr><td style="color:#6b7280;padding:1px 0">Sarpras lengkap</td><td style="text-align:right;font-weight:500">${point[FIELD.completedSarprasCount]} jenis</td></tr>
                <tr><td style="color:#6b7280;padding:1px 0">Sarpras esensial 1</td><td style="text-align:right;font-weight:500">${yesNo(point[FIELD.sarprasPrimary])}</td></tr>
                <tr><td style="color:#6b7280;padding:1px 0">Sarpras esensial 2</td><td style="text-align:right;font-weight:500">${yesNo(point[FIELD.sarprasSecondary])}</td></tr>
                <tr><td style="color:#6b7280;padding:1px 0">Sarpras lengkap semua</td><td style="text-align:right;font-weight:500">${yesNo(point[FIELD.sarprasLengkap])}</td></tr>
                <tr><td style="color:#6b7280;padding:1px 0">Jumlah karyawan</td><td style="text-align:right;font-weight:500">${point[FIELD.jumlahKaryawan]}</td></tr>
                <tr><td style="color:#6b7280;padding:1px 0">Sudah PO</td><td style="text-align:right;font-weight:500">${yesNo(point[FIELD.hasPo])}</td></tr>
                <tr><td style="color:#6b7280;padding:1px 0">Sudah penerimaan barang</td><td style="text-align:right;font-weight:500">${yesNo(point[FIELD.hasReceipt])}</td></tr>
                <tr><td style="color:#6b7280;padding:1px 0">Sudah penjualan</td><td style="text-align:right;font-weight:500">${yesNo(point[FIELD.hasSales])}</td></tr>
            </table>
        </div>
    `;
}

function LegendGroup({
    tier,
    title,
    items,
}: {
    tier: MarkerTier;
    title: string;
    items: Array<{ color: MarkerColor; label: string }>;
}) {
    return (
        <div>
            <p className="mb-1.5 text-xs font-semibold text-foreground">
                {title}
            </p>
            <div className="space-y-1">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                        <span
                            className="inline-block h-[18px] w-[18px] shrink-0"
                            dangerouslySetInnerHTML={{
                                __html: shapeSvg(tier, COLOR_HEX[item.color]),
                            }}
                        />
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    );
}

const HIT_TEST_RADIUS_PX = 9;
const ALL = 'all';

// Batas jumlah opsi yang dirender di dalam dropdown. Daftar kecamatan bisa
// mencapai ribuan entri; merender semuanya sekaligus membebani React setiap
// kali komponen dirender ulang. Sisanya dapat dicari lewat kotak pencarian.
const DROPDOWN_RENDER_LIMIT = 200;

const SearchableFilterSelect = memo(function SearchableFilterSelect({
    value,
    options,
    allLabel,
    widthClass,
    onChange,
}: {
    value: string;
    options: string[];
    allLabel: string;
    widthClass: string;
    onChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onPointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
        ? options.filter((option) =>
              option.toLowerCase().includes(normalizedQuery),
          )
        : options;
    const shown = filtered.slice(0, DROPDOWN_RENDER_LIMIT);
    const hiddenCount = filtered.length - shown.length;

    const select = (next: string) => {
        onChange(next);
        setOpen(false);
        setQuery('');
    };

    return (
        <div ref={rootRef} className={`relative ${widthClass}`}>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex h-8 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm whitespace-nowrap shadow-xs transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
                <span
                    className={
                        value === ALL
                            ? 'truncate text-muted-foreground'
                            : 'truncate'
                    }
                >
                    {value === ALL ? allLabel : value}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </button>

            {open && (
                <div className="absolute top-full left-0 z-[1200] mt-1 w-64 rounded-md border bg-popover text-popover-foreground shadow-md">
                    <div className="flex items-center gap-2 border-b px-2">
                        <Search className="h-3.5 w-3.5 shrink-0 opacity-50" />
                        <input
                            autoFocus
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Cari..."
                            className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                        <button
                            type="button"
                            onClick={() => select(ALL)}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                            <span className="w-3.5 shrink-0">
                                {value === ALL && (
                                    <Check className="h-3.5 w-3.5" />
                                )}
                            </span>
                            {allLabel}
                        </button>
                        {shown.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => select(option)}
                                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                            >
                                <span className="w-3.5 shrink-0">
                                    {value === option && (
                                        <Check className="h-3.5 w-3.5" />
                                    )}
                                </span>
                                <span className="truncate">{option}</span>
                            </button>
                        ))}
                        {hiddenCount > 0 && (
                            <p className="px-2 py-1.5 text-xs text-muted-foreground">
                                +{hiddenCount.toLocaleString('id-ID')} opsi
                                lainnya, persempit lewat pencarian
                            </p>
                        )}
                        {filtered.length === 0 && (
                            <p className="px-2 py-1.5 text-xs text-muted-foreground">
                                Tidak ada hasil
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

type DrawnPoint = { x: number; y: number; index: number };

type Filters = {
    provinsi: string;
    kotaKabupaten: string;
    kecamatan: string;
    tier: string;
};

const DEFAULT_FILTERS: Filters = {
    provinsi: ALL,
    kotaKabupaten: ALL,
    kecamatan: ALL,
    tier: ALL,
};

function matchesFilters(point: MapPointTuple, filters: Filters): boolean {
    if (
        filters.provinsi !== ALL &&
        point[FIELD.provinsi] !== filters.provinsi
    ) {
        return false;
    }

    if (
        filters.kotaKabupaten !== ALL &&
        point[FIELD.kotaKabupaten] !== filters.kotaKabupaten
    ) {
        return false;
    }

    if (
        filters.kecamatan !== ALL &&
        point[FIELD.kecamatan] !== filters.kecamatan
    ) {
        return false;
    }

    if (filters.tier !== ALL && point[FIELD.tier] !== filters.tier) {
        return false;
    }

    return true;
}

function uniqueSorted(values: Array<string | null>): string[] {
    return Array.from(
        new Set(values.filter((v): v is string => Boolean(v))),
    ).sort((a, b) => a.localeCompare(b));
}

// --- Sprite atlas: 24 kombinasi tier x warna digambar sekali ke satu bitmap
// grid, lalu di-upload sebagai satu texture WebGL. Setiap titik hanya perlu
// menyimpan index sel di atlas (bukan bitmap terpisah).
const ATLAS_TIERS: MarkerTier[] = ['status', 'sarpras', 'sdm', 'odoo'];
const ATLAS_COLORS = Object.keys(COLOR_HEX) as MarkerColor[];
const ATLAS_COLS = ATLAS_COLORS.length;
const ATLAS_ROWS = ATLAS_TIERS.length;
const ATLAS_CELL = 32;

const SPRITE_INDEX = new Map<string, number>();
ATLAS_TIERS.forEach((tier, row) => {
    ATLAS_COLORS.forEach((color, col) => {
        SPRITE_INDEX.set(`${tier}_${color}`, row * ATLAS_COLS + col);
    });
});

function buildSpriteAtlasCanvas(): HTMLCanvasElement {
    const atlas = document.createElement('canvas');
    atlas.width = ATLAS_COLS * ATLAS_CELL;
    atlas.height = ATLAS_ROWS * ATLAS_CELL;
    const ctx = atlas.getContext('2d');

    if (!ctx) {
        return atlas;
    }

    const margin = (ATLAS_CELL - SPRITE_SIZE) / 2;

    ATLAS_TIERS.forEach((tier, row) => {
        ATLAS_COLORS.forEach((color, col) => {
            drawShape(
                ctx,
                tier,
                COLOR_HEX[color],
                col * ATLAS_CELL + margin,
                row * ATLAS_CELL + margin,
            );
        });
    });

    return atlas;
}

// a_worldPos disimpan dalam koordinat dunia pada zoom referensi 0 (hasil
// map.project(latlng, 0)), diupload ke GPU sekali saat data/filter berubah.
// Transformasi pan/zoom dilakukan di GPU lewat u_scale (2^zoom saat ini) dan
// u_origin, yang di-update tiap moveend/zoomend tanpa perlu menghitung ulang
// atau mengunggah ulang posisi 36 ribu titik di CPU.
const VERTEX_SHADER_SRC = `
    attribute vec2 a_worldPos;
    attribute float a_texIndex;
    uniform vec2 u_resolution;
    uniform float u_pointSize;
    uniform float u_scale;
    uniform vec2 u_origin;
    varying float v_texIndex;

    void main() {
        vec2 screenPixel = a_worldPos * u_scale - u_origin;
        vec2 zeroToOne = screenPixel / u_resolution;
        vec2 clipSpace = zeroToOne * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
        gl_PointSize = u_pointSize;
        v_texIndex = a_texIndex;
    }
`;

const FRAGMENT_SHADER_SRC = `
    precision mediump float;
    varying float v_texIndex;
    uniform sampler2D u_atlas;
    uniform float u_cols;
    uniform float u_rows;

    void main() {
        float col = mod(v_texIndex, u_cols);
        float row = floor(v_texIndex / u_cols);
        vec2 cellSize = vec2(1.0 / u_cols, 1.0 / u_rows);
        vec2 uv = (gl_PointCoord + vec2(col, row)) * cellSize;
        vec4 texColor = texture2D(u_atlas, uv);
        if (texColor.a < 0.05) {
            discard;
        }
        gl_FragColor = texColor;
    }
`;

function compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string,
): WebGLShader | null {
    const shader = gl.createShader(type);

    if (!shader) {
        return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);

        return null;
    }

    return shader;
}

type GLState = {
    gl: WebGLRenderingContext;
    program: WebGLProgram;
    worldPosBuffer: WebGLBuffer;
    texIndexBuffer: WebGLBuffer;
    worldPosLoc: number;
    texIndexLoc: number;
    resolutionLoc: WebGLUniformLocation;
    pointSizeLoc: WebGLUniformLocation;
    scaleLoc: WebGLUniformLocation;
    originLoc: WebGLUniformLocation;
    maxPointSize: number;
    /** Jumlah titik yang saat ini ada di worldPosBuffer/texIndexBuffer. */
    renderCount: number;
};

function initWebGL(
    canvas: HTMLCanvasElement,
    atlasCanvas: HTMLCanvasElement,
): GLState | null {
    const gl = (canvas.getContext('webgl', {
        premultipliedAlpha: true,
        preserveDrawingBuffer: true,
    }) ??
        canvas.getContext('experimental-webgl', {
            premultipliedAlpha: true,
            preserveDrawingBuffer: true,
        })) as WebGLRenderingContext | null;

    if (!gl) {
        return null;
    }

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fragmentShader = compileShader(
        gl,
        gl.FRAGMENT_SHADER,
        FRAGMENT_SHADER_SRC,
    );

    if (!vertexShader || !fragmentShader) {
        return null;
    }

    const program = gl.createProgram();

    if (!program) {
        return null;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return null;
    }

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Tidak di-flip: baris atlas (canvas, atas ke bawah) diupload apa adanya
    // sehingga tier index 0..3 pada shader selaras langsung dengan koordinat
    // V=0..1 tanpa perlu pembalikan tambahan.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        atlasCanvas,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const worldPosBuffer = gl.createBuffer();
    const texIndexBuffer = gl.createBuffer();

    if (!worldPosBuffer || !texIndexBuffer) {
        return null;
    }

    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const pointSizeLoc = gl.getUniformLocation(program, 'u_pointSize');
    const scaleLoc = gl.getUniformLocation(program, 'u_scale');
    const originLoc = gl.getUniformLocation(program, 'u_origin');
    const atlasLoc = gl.getUniformLocation(program, 'u_atlas');
    const colsLoc = gl.getUniformLocation(program, 'u_cols');
    const rowsLoc = gl.getUniformLocation(program, 'u_rows');

    if (!resolutionLoc || !pointSizeLoc || !scaleLoc || !originLoc) {
        return null;
    }

    gl.useProgram(program);
    gl.uniform1i(atlasLoc, 0);
    gl.uniform1f(colsLoc, ATLAS_COLS);
    gl.uniform1f(rowsLoc, ATLAS_ROWS);

    const pointSizeRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as
        Float32Array | number[];
    const maxPointSize = pointSizeRange ? pointSizeRange[1] : 64;

    return {
        gl,
        program,
        worldPosBuffer,
        texIndexBuffer,
        worldPosLoc: gl.getAttribLocation(program, 'a_worldPos'),
        texIndexLoc: gl.getAttribLocation(program, 'a_texIndex'),
        resolutionLoc,
        pointSizeLoc,
        scaleLoc,
        originLoc,
        maxPointSize,
        renderCount: 0,
    };
}

export default function KoperasiMap() {
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const allPointsRef = useRef<MapPointTuple[]>([]);
    const filtersRef = useRef<Filters>(DEFAULT_FILTERS);
    const drawRef = useRef<() => void>(() => {});
    const rebuildBufferRef = useRef<() => void>(() => {});
    const fitToFilterRef = useRef<() => void>(() => {});

    const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
    const [pointCount, setPointCount] = useState(0);
    const [visibleCount, setVisibleCount] = useState(0);
    const [fetchedAt, setFetchedAt] = useState<string | null>(null);
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [captureError, setCaptureError] = useState(false);
    const [allPoints, setAllPoints] = useState<MapPointTuple[]>([]);
    const [glUnsupported, setGlUnsupported] = useState(false);

    const provinsiOptions = useMemo(
        () => uniqueSorted(allPoints.map((p) => p[FIELD.provinsi])),
        [allPoints],
    );

    const kotaKabupatenOptions = useMemo(
        () =>
            uniqueSorted(
                allPoints
                    .filter(
                        (p) =>
                            filters.provinsi === ALL ||
                            p[FIELD.provinsi] === filters.provinsi,
                    )
                    .map((p) => p[FIELD.kotaKabupaten]),
            ),
        [allPoints, filters.provinsi],
    );

    const kecamatanOptions = useMemo(
        () =>
            uniqueSorted(
                allPoints
                    .filter(
                        (p) =>
                            (filters.provinsi === ALL ||
                                p[FIELD.provinsi] === filters.provinsi) &&
                            (filters.kotaKabupaten === ALL ||
                                p[FIELD.kotaKabupaten] ===
                                    filters.kotaKabupaten),
                    )
                    .map((p) => p[FIELD.kecamatan]),
            ),
        [allPoints, filters.provinsi, filters.kotaKabupaten],
    );

    useEffect(() => {
        const container = containerRef.current;

        if (!container || mapRef.current) {
            return;
        }

        const map = L.map(container, {
            center: [-2.5, 118],
            zoom: 5,
            scrollWheelZoom: true,
            preferCanvas: true,
        });
        mapRef.current = map;

        L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                attribution: 'Tiles &copy; Esri',
                maxZoom: 19,
                // ArcGIS mengizinkan CORS (Access-Control-Allow-Origin: *),
                // ini diperlukan supaya tile bisa di-composite ke canvas
                // export saat screenshot tanpa canvas jadi "tainted".
                crossOrigin: true,
            },
        ).addTo(map);

        // Pane khusus agar canvas titik berada di atas tile namun tetap di
        // bawah popup (markerPane=600, tooltipPane=650, popupPane=700).
        const pane = map.createPane('koperasiPointsPane');
        pane.style.zIndex = '610';
        pane.style.pointerEvents = 'none';
        // Transisi CSS transform selama animasi zoom; transform-nya
        // sendiri didorong manual lewat listener zoomanim di bawah.
        L.DomUtil.addClass(pane, 'leaflet-zoom-animated');

        const canvas = L.DomUtil.create(
            'canvas',
            'koperasi-map-canvas',
            pane,
        ) as HTMLCanvasElement;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';

        const atlasCanvas = buildSpriteAtlasCanvas();
        const glState = initWebGL(canvas, atlasCanvas);

        if (!glState) {
            setGlUnsupported(true);

            return;
        }

        let drawnPoints: DrawnPoint[] = [];
        let lastTopLeft = L.point(0, 0);
        let popup: L.Popup | null = null;

        // Posisi dunia (world position, zoom referensi 0) diupload ke GPU
        // sekali setiap kali data atau filter provinsi/kab-kota/kecamatan/
        // status berubah - BUKAN setiap pan/zoom. Index array ini dipetakan
        // ke allPointsRef supaya bisa ditelusuri balik saat hit-test klik.
        let bufferedIndices: number[] = [];

        const rebuildBuffer = () => {
            const points = allPointsRef.current;
            const activeFilters = filtersRef.current;
            const n = points.length;
            // Array biasa (bukan map.project() 36 ribu kali) - proyeksi
            // dihitung manual (rumus Spherical Mercator EPSG:3857 di zoom
            // 0) langsung ke typed array, jauh lebih cepat karena tanpa
            // overhead pemanggilan fungsi/alokasi objek Leaflet per titik.
            const worldPositions = new Float32Array(n * 2);
            const texIndices = new Float32Array(n);
            const indices: number[] = [];
            let count = 0;
            const DEG2RAD = Math.PI / 180;
            const MAX_LAT = 85.0511287798;

            for (let i = 0; i < n; i++) {
                const point = points[i];

                if (!matchesFilters(point, activeFilters)) {
                    continue;
                }

                const lat = Math.max(
                    Math.min(point[FIELD.lat], MAX_LAT),
                    -MAX_LAT,
                );
                const lng = point[FIELD.lng];
                const sinLat = Math.sin(lat * DEG2RAD);
                const worldX = 128 * (1 + lng / 180);
                const worldY =
                    128 -
                    (64 * Math.log((1 + sinLat) / (1 - sinLat))) / Math.PI;
                const spriteIndex = SPRITE_INDEX.get(
                    `${point[FIELD.tier]}_${point[FIELD.color]}`,
                );

                worldPositions[count * 2] = worldX;
                worldPositions[count * 2 + 1] = worldY;
                texIndices[count] = spriteIndex ?? 0;
                indices.push(i);
                count++;
            }

            const { gl } = glState;
            gl.bindBuffer(gl.ARRAY_BUFFER, glState.worldPosBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                worldPositions.subarray(0, count * 2),
                gl.STATIC_DRAW,
            );
            gl.bindBuffer(gl.ARRAY_BUFFER, glState.texIndexBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                texIndices.subarray(0, count),
                gl.STATIC_DRAW,
            );

            glState.renderCount = count;
            bufferedIndices = indices;
        };

        // Canvas berada di dalam pane khusus yang otomatis ikut ditransformasi
        // oleh Leaflet saat drag, sama seperti tilePane dan markerPane.
        // Ukuran dan posisi canvas direset tiap kali dipanggil, mengikuti
        // origin viewport saat itu. Transformasi pan/zoom titik sepenuhnya
        // dilakukan GPU lewat uniform u_scale/u_origin (lihat vertex
        // shader) - fungsi ini tidak lagi melakukan loop atas seluruh titik.
        const render = () => {
            if (glState.renderCount === 0) {
                return;
            }

            const size = map.getSize();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(size.x * dpr);
            canvas.height = Math.round(size.y * dpr);
            canvas.style.width = `${size.x}px`;
            canvas.style.height = `${size.y}px`;

            const topLeft = map.containerPointToLayerPoint([0, 0]);
            lastTopLeft = topLeft;
            L.DomUtil.setPosition(canvas, topLeft);

            // Selesaikan transformasi affine (world -> canvas-local pixel)
            // pakai satu titik referensi (pusat viewport saat ini), lalu
            // biarkan GPU menerapkannya ke seluruh titik lain via u_scale
            // dan u_origin.
            const zoomScale = Math.pow(2, map.getZoom());
            const refLatLng = map.getCenter();
            const refWorld = map.project(refLatLng, 0);
            const refCanvasLocal = map
                .latLngToLayerPoint(refLatLng)
                .subtract(topLeft);

            const scale = zoomScale * dpr;
            const originX = (refWorld.x * zoomScale - refCanvasLocal.x) * dpr;
            const originY = (refWorld.y * zoomScale - refCanvasLocal.y) * dpr;

            const { gl } = glState;
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.useProgram(glState.program);

            gl.uniform2f(glState.resolutionLoc, canvas.width, canvas.height);
            gl.uniform1f(
                glState.pointSizeLoc,
                Math.min(SPRITE_SIZE * dpr, glState.maxPointSize),
            );
            gl.uniform1f(glState.scaleLoc, scale);
            gl.uniform2f(glState.originLoc, originX, originY);

            gl.bindBuffer(gl.ARRAY_BUFFER, glState.worldPosBuffer);
            gl.enableVertexAttribArray(glState.worldPosLoc);
            gl.vertexAttribPointer(
                glState.worldPosLoc,
                2,
                gl.FLOAT,
                false,
                0,
                0,
            );

            gl.bindBuffer(gl.ARRAY_BUFFER, glState.texIndexBuffer);
            gl.enableVertexAttribArray(glState.texIndexLoc);
            gl.vertexAttribPointer(
                glState.texIndexLoc,
                1,
                gl.FLOAT,
                false,
                0,
                0,
            );

            gl.drawArrays(gl.POINTS, 0, glState.renderCount);
        };

        // Dipakai buat hit-test klik dan angka "menampilkan X dari Y titik"
        // di UI - scan O(n) ini terpisah dari render() (yang sekarang O(1)
        // per pan/zoom), jadi tetap dijalankan tiap moveend tapi tidak lagi
        // memblokir/menunda gambar ulang titik di GPU.
        const refreshVisibleForUI = () => {
            const bounds = map.getBounds().pad(0.15);
            const nextDrawn: DrawnPoint[] = [];
            const topLeft = lastTopLeft;

            for (const i of bufferedIndices) {
                const point = allPointsRef.current[i];
                const lat = point[FIELD.lat];
                const lng = point[FIELD.lng];

                if (!bounds.contains([lat, lng])) {
                    continue;
                }

                const layerPoint = map.latLngToLayerPoint([lat, lng]);
                nextDrawn.push({
                    x: layerPoint.x - topLeft.x,
                    y: layerPoint.y - topLeft.y,
                    index: i,
                });
            }

            drawnPoints = nextDrawn;
            setVisibleCount(nextDrawn.length);
        };

        const draw = () => {
            render();
            refreshVisibleForUI();
        };
        drawRef.current = draw;
        rebuildBufferRef.current = rebuildBuffer;

        const rebuildBufferAndDraw = () => {
            rebuildBuffer();
            draw();
        };

        const fitToFilter = () => {
            const points = allPointsRef.current;
            const activeFilters = filtersRef.current;
            const matched = points.filter((p) =>
                matchesFilters(p, activeFilters),
            );

            if (matched.length === 0) {
                map.setView([-2.5, 118], 5);
                draw();

                return;
            }

            const bounds = L.latLngBounds(
                matched.map(
                    (p) => [p[FIELD.lat], p[FIELD.lng]] as [number, number],
                ),
            );
            map.fitBounds(bounds, { padding: [24, 24], maxZoom: 12 });
            draw();
        };
        fitToFilterRef.current = fitToFilter;

        const onClick = (event: L.LeafletMouseEvent) => {
            const clickLayerPoint = map.latLngToLayerPoint(event.latlng);
            const clickPoint = clickLayerPoint.subtract(lastTopLeft);

            let closest: DrawnPoint | null = null;
            let closestDistSq = HIT_TEST_RADIUS_PX * HIT_TEST_RADIUS_PX;

            for (const drawn of drawnPoints) {
                const dx = drawn.x - clickPoint.x;
                const dy = drawn.y - clickPoint.y;
                const distSq = dx * dx + dy * dy;

                if (distSq <= closestDistSq) {
                    closest = drawn;
                    closestDistSq = distSq;
                }
            }

            if (!closest) {
                return;
            }

            const point = allPointsRef.current[closest.index];

            if (popup) {
                map.closePopup(popup);
            }

            popup = L.popup()
                .setLatLng([point[FIELD.lat], point[FIELD.lng]])
                .setContent(popupHtml(point))
                .openOn(map);
        };

        map.on('moveend zoomend resize', draw);
        map.on('click', onClick);

        // Setara Map._latLngToNewLayerPoint internal Leaflet, disusun ulang
        // dari method publik (project, getSize) agar tidak bergantung API
        // privat.
        const latLngToNewLayerPointPublic = (
            latlng: L.LatLng,
            zoom: number,
            center: L.LatLng,
        ): L.Point => {
            const viewHalf = map.getSize().divideBy(2);
            const topLeft = map.project(center, zoom).subtract(viewHalf);

            return map.project(latlng, zoom).subtract(topLeft);
        };

        const onZoomAnim = (e: L.ZoomAnimEvent) => {
            const topLeftLatLng = map.layerPointToLatLng(lastTopLeft);
            const scale = map.getZoomScale(e.zoom);
            const newTopLeft = latLngToNewLayerPointPublic(
                topLeftLatLng,
                e.zoom,
                e.center,
            );

            L.DomUtil.setTransform(canvas, newTopLeft, scale);
        };
        map.on('zoomanim', onZoomAnim);

        // ResizeObserver mendeteksi perubahan ukuran container secara akurat
        // (misal saat masuk/keluar mode fullscreen), lalu memanggil
        // invalidateSize() supaya Leaflet memuat ulang tile untuk area yang
        // baru terlihat. Pendekatan ini lebih andal dibandingkan menebak
        // durasi transisi CSS dengan setTimeout.
        let resizeFrame: number | null = null;
        const resizeObserver = new ResizeObserver(() => {
            if (resizeFrame !== null) {
                cancelAnimationFrame(resizeFrame);
            }

            resizeFrame = requestAnimationFrame(() => {
                map.invalidateSize();
            });
        });
        resizeObserver.observe(container);

        fetch(mapPointsRoute.url())
            .then((response) => response.json() as Promise<MapPointsResponse>)
            .then((body) => {
                if (body.status !== 'ok') {
                    setStatus('error');

                    return;
                }

                allPointsRef.current = body.points;
                setAllPoints(body.points);
                setPointCount(body.points.length);
                setFetchedAt(body.fetched_at);
                setStatus('ok');
                rebuildBufferAndDraw();
            })
            .catch(() => setStatus('error'));

        return () => {
            map.off('moveend zoomend resize', draw);
            map.off('click', onClick);
            map.off('zoomanim', onZoomAnim);
            resizeObserver.disconnect();

            if (resizeFrame !== null) {
                cancelAnimationFrame(resizeFrame);
            }

            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Canvas digambar ulang setiap filter berubah. Peta otomatis pan/zoom ke
    // bounding box titik yang cocok apabila filter wilayah yang berubah,
    // bukan filter status saja.
    const updateFilter = (patch: Partial<Filters>) => {
        setFilters((prev) => {
            const next = { ...prev, ...patch };
            filtersRef.current = next;

            requestAnimationFrame(() => {
                rebuildBufferRef.current();

                if ('tier' in patch && Object.keys(patch).length === 1) {
                    drawRef.current();
                } else {
                    fitToFilterRef.current();
                }
            });

            return next;
        });
    };

    const resetFilters = () => {
        setFilters(DEFAULT_FILTERS);
        filtersRef.current = DEFAULT_FILTERS;
        requestAnimationFrame(() => {
            rebuildBufferRef.current();
            mapRef.current?.setView([-2.5, 118], 5);
            drawRef.current();
        });
    };

    const handleCapture = () => {
        const map = mapRef.current;
        const container = containerRef.current;

        if (!map || !container || isCapturing) {
            return;
        }

        setIsCapturing(true);
        setCaptureError(false);

        try {
            const rect = container.getBoundingClientRect();
            const scale = Math.min(window.devicePixelRatio || 1, 2);

            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = Math.round(rect.width * scale);
            exportCanvas.height = Math.round(rect.height * scale);
            const ctx = exportCanvas.getContext('2d');

            if (!ctx) {
                return;
            }

            ctx.scale(scale, scale);

            const tiles =
                container.querySelectorAll<HTMLImageElement>(
                    'img.leaflet-tile',
                );
            tiles.forEach((tile) => {
                if (!tile.complete || tile.naturalWidth === 0) {
                    return;
                }

                const b = tile.getBoundingClientRect();
                ctx.drawImage(
                    tile,
                    b.left - rect.left,
                    b.top - rect.top,
                    b.width,
                    b.height,
                );
            });

            const pointsCanvas = container.querySelector<HTMLCanvasElement>(
                '.koperasi-map-canvas',
            );

            if (pointsCanvas) {
                const b = pointsCanvas.getBoundingClientRect();
                ctx.drawImage(
                    pointsCanvas,
                    b.left - rect.left,
                    b.top - rect.top,
                    b.width,
                    b.height,
                );
            }

            let dataUrl: string;

            try {
                dataUrl = exportCanvas.toDataURL('image/png');
            } catch {
                // Tile citra satelit dimuat tanpa header CORS permisif,
                // sehingga canvas hasil composite dianggap "tainted" oleh
                // browser dan tidak bisa diekspor. Kegagalan ditangani di
                // sini agar tidak muncul sebagai uncaught error.
                setCaptureError(true);

                return;
            }

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `peta-sebaran-kdkmp-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
            link.click();
        } finally {
            setIsCapturing(false);
        }
    };

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;

        if (isFullscreen) {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isFullscreen]);

    return (
        <Card
            ref={cardRef}
            className={
                isFullscreen
                    ? 'fixed inset-0 z-[1000] overflow-y-auto rounded-none border-0'
                    : 'shadow-sm'
            }
        >
            <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">
                        {status === 'ok' && (
                            <>
                                Menampilkan{' '}
                                {visibleCount.toLocaleString('id-ID')} dari{' '}
                                {pointCount.toLocaleString('id-ID')} titik
                                {fetchedAt &&
                                    `, update ${new Date(fetchedAt).toLocaleString('id-ID')}`}
                            </>
                        )}
                    </p>
                    <div className="flex items-center gap-2">
                        {status === 'loading' && (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Memuat titik peta...
                            </span>
                        )}
                        {status === 'error' && (
                            <span className="flex items-center gap-1.5 text-xs text-destructive">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Gagal memuat data peta
                            </span>
                        )}
                        {glUnsupported && (
                            <span className="flex items-center gap-1.5 text-xs text-destructive">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                WebGL tidak didukung browser ini
                            </span>
                        )}
                        {captureError && (
                            <span className="flex items-center gap-1.5 text-xs text-destructive">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Screenshot gagal, coba screenshot manual
                            </span>
                        )}
                        {status === 'ok' && (
                            <>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    disabled={isCapturing}
                                    onClick={handleCapture}
                                    title="Screenshot peta"
                                >
                                    <Camera className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    onClick={() =>
                                        setIsFullscreen((prev) => !prev)
                                    }
                                    title={
                                        isFullscreen
                                            ? 'Keluar fullscreen'
                                            : 'Fullscreen'
                                    }
                                >
                                    {isFullscreen ? (
                                        <Minimize2 className="h-4 w-4" />
                                    ) : (
                                        <Maximize2 className="h-4 w-4" />
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {status === 'ok' && (
                    <div className="flex flex-wrap items-center gap-2">
                        <SearchableFilterSelect
                            value={filters.provinsi}
                            options={provinsiOptions}
                            allLabel="Semua Provinsi"
                            widthClass="w-[160px]"
                            onChange={(value) =>
                                updateFilter({
                                    provinsi: value,
                                    kotaKabupaten: ALL,
                                    kecamatan: ALL,
                                })
                            }
                        />

                        <SearchableFilterSelect
                            value={filters.kotaKabupaten}
                            options={kotaKabupatenOptions}
                            allLabel="Semua Kab/Kota"
                            widthClass="w-[170px]"
                            onChange={(value) =>
                                updateFilter({
                                    kotaKabupaten: value,
                                    kecamatan: ALL,
                                })
                            }
                        />

                        <SearchableFilterSelect
                            value={filters.kecamatan}
                            options={kecamatanOptions}
                            allLabel="Semua Kecamatan"
                            widthClass="w-[160px]"
                            onChange={(value) =>
                                updateFilter({ kecamatan: value })
                            }
                        />

                        <Select
                            value={filters.tier}
                            onValueChange={(value) =>
                                updateFilter({ tier: value })
                            }
                        >
                            <SelectTrigger size="sm" className="w-[160px]">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent className="z-[1200]">
                                <SelectItem value={ALL}>
                                    Semua Status
                                </SelectItem>
                                <SelectItem value="status">
                                    Verifikasi & Pembangunan
                                </SelectItem>
                                <SelectItem value="sarpras">
                                    Fokus Sarpras
                                </SelectItem>
                                <SelectItem value="sdm">Fokus SDM</SelectItem>
                                <SelectItem value="odoo">
                                    Operasional (Odoo)
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={resetFilters}
                        >
                            Reset
                        </Button>
                    </div>
                )}

                <div
                    ref={containerRef}
                    className={
                        isFullscreen
                            ? 'relative h-[calc(100vh-220px)] w-full overflow-hidden rounded-lg border'
                            : 'relative h-[480px] w-full overflow-hidden rounded-lg border'
                    }
                />

                <div className="grid gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
                    <LegendGroup
                        tier="status"
                        title="Status verifikasi & pembangunan"
                        items={[
                            {
                                color: 'yellow',
                                label: 'Sedang diverifikasi',
                            },
                            { color: 'orange', label: 'Dipertimbangkan' },
                            {
                                color: 'red',
                                label: 'Terverifikasi, belum bangun',
                            },
                            { color: 'green', label: 'Mulai pembangunan' },
                        ]}
                    />
                    <LegendGroup
                        tier="sarpras"
                        title="Pembangunan 100%, fokus sarpras"
                        items={[
                            { color: 'red', label: 'Sarpras < 6 jenis' },
                            {
                                color: 'yellow',
                                label: 'Sarpras esensial 1',
                            },
                            { color: 'green', label: 'Sarpras esensial 2' },
                        ]}
                    />
                    <LegendGroup
                        tier="sdm"
                        title="Sarpras lengkap, fokus SDM"
                        items={[
                            { color: 'red', label: 'SDM belum ada' },
                            { color: 'yellow', label: 'SDM sebagian' },
                            {
                                color: 'green',
                                label: 'SDM 6 orang (lengkap)',
                            },
                        ]}
                    />
                    <LegendGroup
                        tier="odoo"
                        title="Operasional (Odoo)"
                        items={[
                            { color: 'yellow', label: 'Sudah PO' },
                            {
                                color: 'green',
                                label: 'Sudah penerimaan barang',
                            },
                            { color: 'blue', label: 'Sudah penjualan' },
                        ]}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    Tiap titik menampilkan tahap paling lanjut yang sudah
                    dicapai: operasional (Odoo) lebih prioritas dari SDM, SDM
                    lebih prioritas dari sarpras, sarpras lebih prioritas dari
                    status verifikasi. Klik titik untuk lihat detail lengkap.
                </p>
            </CardContent>
        </Card>
    );
}
