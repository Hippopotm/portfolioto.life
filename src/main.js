import "./styles.css";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";

const canvas = document.querySelector("#world");
const interfaceLayer = document.querySelector("#interface");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.08));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.32;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdff6ff);
scene.fog = new THREE.FogExp2(0xd8f5ff, 0.006);

const camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.1, 420);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clock = new THREE.Clock();
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -32, 0) });
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;

const roomName = document.querySelector("#roomName");
const roomDescription = document.querySelector("#roomDescription");
const roomCopy = document.querySelector("#roomCopy");
const toolchain = document.querySelector("#toolchain");
const panel = document.querySelector(".panel");
const projectBadge = document.querySelector("#projectBadge");
const aboutProfile = document.querySelector("#aboutProfile");
const enterWorld = document.querySelector("#enterWorld");
const mapButtons = [...document.querySelectorAll(".map button")];
const planTray = document.querySelector("#planTray");
const pdfStage = document.querySelector("#pdfStage");
const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(assetUrl("/draco/"));
gltfLoader.setDRACOLoader(dracoLoader);
const stlLoader = new STLLoader();

const materials = {
  floor: new THREE.MeshStandardMaterial({ color: 0xd7d7c5, roughness: 0.72, metalness: 0.03 }),
  wall: new THREE.MeshStandardMaterial({ color: 0xf4f0df, roughness: 0.58, metalness: 0.04 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0x9be8ff,
    roughness: 0.06,
    metalness: 0,
    transmission: 0.35,
    thickness: 1.2,
    transparent: true,
    opacity: 0.44
  }),
  brass: new THREE.MeshStandardMaterial({ color: 0xd6aa55, roughness: 0.28, metalness: 0.78 }),
  graphite: new THREE.MeshStandardMaterial({ color: 0x4b5353, roughness: 0.32, metalness: 0.72 }),
  black: new THREE.MeshStandardMaterial({ color: 0x060707, roughness: 0.4, metalness: 0.35 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf2efe5, roughness: 0.42, metalness: 0.18 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x101214, roughness: 0.86, metalness: 0.04 }),
  coral: new THREE.MeshStandardMaterial({ color: 0xf36f52, roughness: 0.38, metalness: 0.28 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x3fb8d7, roughness: 0.35, metalness: 0.35 }),
  green: new THREE.MeshStandardMaterial({ color: 0x98db8f, roughness: 0.42, metalness: 0.1 })
};

const rooms = [
  {
    id: "home",
    name: "Home",
    position: [0, 0],
    color: 0x89e7ff,
    tools: "CAD / SolidWorks / Rhino / Blender",
    description:
      "A calm welcome room for Marie-Chantal's portfolio, with floating 3D lettering and direct access to each project room.",
    copy:
      "Welcome to my portfolio of projects. Feel free to navigate between them by clicking the tabs at the bottom of the screen."
  },
  {
    id: "omniwheel",
    name: "Omniwheel Vehicle",
    position: [22, 0],
    color: 0xf3c969,
    tools: "SolidWorks / Raspberry Pi / phone app control / CNC milling",
    description:
      "Project led from feasibility evaluation to component selection and resistance testing. Physically built with SolidWorks-modeled parts, Raspberry Pi control, manual programming, a self-programmed phone app, and metal parts cut with a milling machine.",
    copy:
      "Designed for highly flexible movement, this omniwheel vehicle can move forward, backward, sideways, diagonally, and rotate in place with precision. Its specialized wheels make it ideal for tight navigation, robotics testing, and environments that require quick, smooth maneuvering."
  },
  {
    id: "snowboard",
    name: "Mountainboard",
    position: [44, 0],
    color: 0x89e7ff,
    tools: "SolidWorks / Onshape / 3D prototype",
    description:
      "Made from an existing model as a modeling exercise, recreated and studied in SolidWorks and Onshape. It remained a 3D prototype rather than being physically rebuilt.",
    copy:
      "This mountainboard combines the feel of board sports with an all-terrain wheel system, allowing riders to glide over rougher surfaces beyond snow. Its flexible frame, large textured wheels, and suspension-style details make it designed for stability, smooth movement, and adventurous outdoor riding."
  },
  {
    id: "tripod",
    name: "Devialet Speaker Tripod",
    position: [66, 0],
    color: 0xe7d0a0,
    tools: "Onshape / Blender rendering",
    description:
      "Modeled in Onshape and rendered in Blender. The core geometry is being prepared for fabrication, with threaded rods planned as the next structural elements to be added.",
    copy:
      "A 3D Devialet tripod core element recreated from an existing 108 dB Devialet Phantom tripod, then adapted for the 98 dB Devialet Phantom that does not have this tripod."
  },
  {
    id: "chair",
    name: "Swing",
    position: [88, 0],
    color: 0xff8f6a,
    tools: "Paint 3D / architectural model / children's play scale",
    description:
      "Made in Paint 3D. A physical model was also created for this architectural project at the scale of a children's game.",
    copy:
      "A simplified swing designed as part of a childlike 3D world environment, using rounded and readable forms to support playful interaction at the scale of a children's game."
  },
  {
    id: "lamp",
    name: "Shelf",
    position: [0, -22],
    color: 0xa8efb3,
    tools: "SolidWorks / resistance testing / reused metal build",
    description:
      "Prototyped through SolidWorks with resistance tests also run in SolidWorks, then physically built from reused metal pieces.",
    copy:
      "Inspired by the High-Tech & Structural Expressionist style of the Beaubourg Museum, this cylindrical shelf turns storage into a visible design feature. Its exposed structure, curved form, and layered shelves give it a modern industrial look while keeping space functional."
  },
  {
    id: "shoe",
    name: "Heating Bowl SI¹⁴",
    position: [22, -22],
    color: 0x68d5ff,
    tools: "Solid Edge / beach-harvested clay / physical testing",
    description:
      "3D modeled with Solid Edge, physically handmade from beach-harvested clay, physically tested, and successfully efficient.",
    copy:
      "This portable heating bowl is a social design project made of multiple parts that fit together to form a heat-generating object. Warm fluid flows through the assembled piece, while its material helps retain heat without becoming too hot to safely hold."
  },
  {
    id: "hanger",
    name: "Heating Sphere SI¹⁴",
    position: [44, -22],
    color: 0xf3c969,
    tools: "Solid Edge / clay 3D-print prototype concept",
    description:
      "3D modeled with Solid Edge, kept as a prototype, with a project direction to 3D print it in clay.",
    copy:
      "The heating sphere continues the SI¹⁴ exploration of compact, purpose-driven heat objects for harsh climates. Designed to be hollow, it contains warm fluid inside, while its layered spherical shape creates a large heat-transfer surface to radiate portable warmth efficiently."
  },
  {
    id: "cow",
    name: "Cow Toy for Kids",
    position: [66, -22],
    color: 0xfff2b5,
    tools: "Paint 3D",
    description: "Made simply with Paint 3D.",
    copy:
      "A simplified cow with rounded surfaces that recall safety and gentleness, part of a 3D world environment for a kids interactive game to teach them farm animals."
  },
  {
    id: "credits",
    name: "About me",
    position: [88, -22],
    color: 0xffffff,
    tools: "",
    description: "",
    copy: "A little more about me"
  }
];

const projectPlans = {
  snowboard: [
    {
      title: "Mountainboard plan",
      url: assetUrl("/plans/snowboard.pdf"),
      image: assetUrl("/plan-previews/snowboard.png")
    }
  ],
  shoe: [
    { title: "Part 1 drawing", url: assetUrl("/plans/heating-bowl-part-1.pdf"), image: assetUrl("/plan-previews/heating-bowl-part-1.png") },
    { title: "Part 2 drawing", url: assetUrl("/plans/heating-bowl-part-2.pdf"), image: assetUrl("/plan-previews/heating-bowl-part-2.png") },
    { title: "Part 3 drawing", url: assetUrl("/plans/heating-bowl-part-3.pdf"), image: assetUrl("/plan-previews/heating-bowl-part-3.png") },
    { title: "Part 4 drawing", url: assetUrl("/plans/heating-bowl-part-4.pdf"), image: assetUrl("/plan-previews/heating-bowl-part-4.png") }
  ],
  chair: [
    { title: "Physical model render", url: assetUrl("/visuals/swing-render.png"), image: assetUrl("/visuals/swing-render.png") },
    { title: "3D model edges", url: assetUrl("/visuals/swing-edges.png"), image: assetUrl("/visuals/swing-edges.png") },
    { title: "Dimension view 1", url: assetUrl("/visuals/swing-dimensions-1.png"), image: assetUrl("/visuals/swing-dimensions-1.png") },
    { title: "Dimension view 2", url: assetUrl("/visuals/swing-dimensions-2.png"), image: assetUrl("/visuals/swing-dimensions-2.png") },
    { title: "Dimension view 3", url: assetUrl("/visuals/swing-dimensions-3.png"), image: assetUrl("/visuals/swing-dimensions-3.png") }
  ]
};

const roomStyles = {
  home: { wall: 0xf0eadc, floor: 0xdadfca, accent: 0x89e7ff, mood: "gallery" },
  omniwheel: { wall: 0xc8d0b8, floor: 0xe8e5d3, accent: 0xf3c969, mood: "nineties" },
  snowboard: { wall: 0xdceef5, floor: 0xf1f4ed, accent: 0x3fb8d7, mood: "alpine" },
  tripod: { wall: 0xeee4cf, floor: 0xded0b5, accent: 0xd6aa55, mood: "modern" },
  chair: { wall: 0xf7d8c8, floor: 0xe5c5b7, accent: 0xff8f6a, mood: "deco" },
  lamp: { wall: 0xd8f0d4, floor: 0xe7ead8, accent: 0x6dbd83, mood: "studio" },
  shoe: { wall: 0xd7edf7, floor: 0xf4efe6, accent: 0x68d5ff, mood: "kitchen" },
  hanger: { wall: 0xf1dfc1, floor: 0xead7b3, accent: 0xf3c969, mood: "warm" },
  cow: { wall: 0xfff0bf, floor: 0xf7dfad, accent: 0xff8f6a, mood: "play" },
  credits: { wall: 0xe9e9e5, floor: 0xd7ded8, accent: 0xffffff, mood: "archive" }
};

const pdfRooms = {
  lamp: {
    title: "Shelf plan",
    url: assetUrl("/plans/etagere.pdf"),
    image: assetUrl("/plan-previews/etagere.png")
  }
};

const modelTransforms = {
  home: {
    rotation: [Math.PI / 2, 0, 0],
    scale: 7.4,
    lift: 1.18
  },
  snowboard: {
    rotation: [-Math.PI / 2, 0, 0],
    scale: 5.55,
    lift: 1.18
  },
  tripod: {
    rotation: [0, 0, 0],
    scale: 4.8,
    lift: 0.58
  },
  chair: {
    rotation: [0, 0, 0],
    scale: 5.4,
    lift: 0.72
  },
  hanger: {
    rotation: [-Math.PI / 2, 0, 0],
    scale: 3.25
  },
  shoe: {
    rotation: [0, 0, 0],
    scale: 3.2,
    lift: 0.72
  }
};

const freeRotationRooms = new Set(["shoe", "hanger"]);
const centeredPivotRooms = new Set(["shoe", "hanger", "tripod"]);

const roomById = new Map(rooms.map((room) => [room.id, room]));
const exhibits = [];
const exhibitByRoomId = new Map();
const loadedModels = new Set();
const loadingModels = new Map();
const loadedPreviews = new Set();
const loadingPreviews = new Map();
const externalModelRooms = ["home", "omniwheel", "snowboard", "chair", "hanger"];
const deferredModelRooms = new Set(["shoe", "tripod"]);
const previewModelRooms = new Set(["shoe", "tripod"]);
const roomSize = 18;
let activeRoom = null;
let selectedExhibit = null;
let isDragging = false;
let yaw = 0;
let pitch = 0;
let transition = null;
let viewReset = null;
let activeAssetRoomId = null;
let pdfPaperZoom = 1;
let pdfPaperPan = new THREE.Vector2(0, 0);
let isPanningPdf = false;
let lastPdfPointer = new THREE.Vector2(0, 0);
let copyTypeTimer = null;
let panelTimer = null;
const planDeckOrder = new Map();
const keys = new Set();
const teleportTarget = new THREE.Vector3(0, 2.4, 6);

const hemi = new THREE.HemisphereLight(0xf4fbff, 0xc8b992, 1.45);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff5d5, 3.1);
sun.position.set(16, 32, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -95;
sun.shadow.camera.right = 115;
sun.shadow.camera.top = 40;
sun.shadow.camera.bottom = -55;
scene.add(sun);

const roomAccentLight = new THREE.PointLight(0xffffff, 1.7, 24, 1.35);
scene.add(roomAccentLight);
const welcomeFrontLight = new THREE.SpotLight(0xffe8f8, 0, 42, Math.PI / 4, 0.38, 1.15);
welcomeFrontLight.position.set(0, 4.2, 7.6);
welcomeFrontLight.target.position.set(0, 1.85, 0);
scene.add(welcomeFrontLight);
scene.add(welcomeFrontLight.target);
const clouds = [];

function addBoxCollider(position, size) {
  const body = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(size[0] / 2, size[1] / 2, size[2] / 2)) });
  body.position.set(position[0], position[1], position[2]);
  world.addBody(body);
}

function makeBox(size, material, position, cast = false) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addLocalBox(group, size, color, position, rotation = [0, 0, 0], opacity = 1) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.62,
    metalness: 0.04,
    transparent: opacity < 1,
    opacity
  });
  const box = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  box.position.set(...position);
  box.rotation.set(...rotation);
  box.receiveShadow = true;
  group.add(box);
  return box;
}

function addLocalSphere(group, radius, color, position, opacity = 1) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.5,
    metalness: 0.08,
    transparent: opacity < 1,
    opacity
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 8), material);
  sphere.position.set(...position);
  group.add(sphere);
  return sphere;
}

function addRealWindow(group, accent) {
  const glass = addLocalBox(group, [4.3, 2.05, 0.035], 0xbceeff, [-5.3, 3.15, -8.84], [0, 0, 0], 0.28);
  glass.material.roughness = 0.02;
  glass.material.metalness = 0;
  glass.material.depthWrite = false;
  addLocalBox(group, [4.75, 0.1, 0.1], accent, [-5.3, 4.25, -8.78], [0, 0, 0], 0.78);
  addLocalBox(group, [4.75, 0.1, 0.1], accent, [-5.3, 2.05, -8.78], [0, 0, 0], 0.78);
  addLocalBox(group, [0.1, 2.3, 0.1], accent, [-7.68, 3.15, -8.78], [0, 0, 0], 0.78);
  addLocalBox(group, [0.1, 2.3, 0.1], accent, [-2.92, 3.15, -8.78], [0, 0, 0], 0.78);
  addLocalBox(group, [0.08, 2.1, 0.09], 0xffffff, [-5.3, 3.15, -8.75], [0, 0, 0], 0.52);
}

function addWallShelves(group, accent, dark, pale) {
  [-3.7, 2.2].forEach((z, shelfIndex) => {
    addLocalBox(group, [0.12, 0.16, 4.2], dark, [8.72, 2.15 + shelfIndex * 1.0, z], [0, 0, 0], 0.82);
    [-1.4, 0.2, 1.45].forEach((offset, i) => {
      addLocalBox(group, [0.28, 0.52 + i * 0.08, 0.34], i % 2 ? accent : pale, [8.58, 2.49 + shelfIndex * 1.0, z + offset], [0, 0, 0], 0.92);
    });
    addLocalSphere(group, 0.18, accent, [8.55, 2.55 + shelfIndex * 1.0, z - 0.35], 0.9);
  });

  [-4.4, 1.1].forEach((z, shelfIndex) => {
    addLocalBox(group, [0.12, 0.15, 3.6], dark, [-8.72, 2.25 + shelfIndex * 0.9, z], [0, 0, 0], 0.75);
    [-1.1, 0.55, 1.3].forEach((offset, i) => {
      addLocalBox(group, [0.3, 0.32 + i * 0.12, 0.4], i % 2 ? pale : accent, [-8.55, 2.53 + shelfIndex * 0.9, z + offset], [0, 0, 0], 0.9);
    });
  });

  [-5.4, -2.7, 0, 2.7, 5.4].forEach((x, i) => {
    addLocalBox(group, [0.86, 0.72, 0.06], i % 2 ? pale : accent, [x, 3.65 + (i % 2) * 0.24, 8.76], [0, 0, (i - 2) * 0.04], 0.58);
  });
}

function addRoomDecor(group, room, style) {
  const accent = style.accent;
  const dark = new THREE.Color(accent).offsetHSL(0, -0.16, -0.22).getHex();
  const pale = new THREE.Color(style.wall).offsetHSL(0.03, 0.08, 0.12).getHex();

  addRealWindow(group, accent);
  addWallShelves(group, accent, dark, pale);

  const artCount = room.id === "home" ? 2 : 3;
  for (let i = 0; i < artCount; i++) {
    const x = -1.8 + i * 1.8;
    const y = 3.15 + Math.sin(i + room.position[0]) * 0.22;
    addLocalBox(group, [1.12, 1.35, 0.07], 0xfffcf2, [x, y, -8.74]);
    addLocalBox(group, [0.82, 0.95, 0.08], i % 2 ? accent : pale, [x, y, -8.68], [0, 0, (i - 1) * 0.08], 0.9);
  }

  if (style.mood === "nineties") {
    [0.9, 1.55, 2.2].forEach((y, i) => addLocalBox(group, [18, 0.08, 0.05], i % 2 ? 0xff8f6a : 0x68d5ff, [0, y, 8.78], [0, 0, 0], 0.52));
    addLocalBox(group, [2.6, 1.7, 0.08], 0x2d3340, [5.6, 3.2, -8.7], [0, 0, -0.08], 0.75);
  } else if (style.mood === "alpine") {
    addLocalBox(group, [5.2, 1.15, 0.08], 0xffffff, [4.9, 3.25, -8.7], [0, 0, -0.2], 0.82);
    addLocalBox(group, [4.3, 0.12, 0.08], accent, [4.9, 2.67, -8.65], [0, 0, -0.2], 0.75);
  } else if (style.mood === "modern") {
    addLocalBox(group, [3.4, 3.1, 0.1], 0x101214, [5.1, 3.05, -8.7], [0, 0, 0], 0.58);
    addLocalBox(group, [0.14, 2.8, 0.12], accent, [6.65, 3.05, -8.58]);
  } else if (style.mood === "deco") {
    [-3.2, 0, 3.2].forEach((x, i) => addLocalBox(group, [0.12, 2.7, 0.07], i === 1 ? dark : accent, [x, 3, 8.78], [0, 0, 0], 0.55));
    addLocalBox(group, [4.6, 0.14, 0.07], dark, [0, 4.25, 8.78], [0, 0, 0], 0.55);
  } else if (style.mood === "kitchen") {
    for (let i = 0; i < 8; i++) addLocalBox(group, [1.08, 1.08, 0.05], i % 2 ? 0xffffff : 0xbadbe8, [-4.4 + i * 1.08, 1.35, -8.72]);
    addLocalBox(group, [7.8, 0.7, 1.0], 0xf6f2e8, [0.4, 0.55, -7.4]);
    addLocalBox(group, [7.9, 0.12, 1.04], accent, [0.4, 0.94, -7.4], [0, 0, 0], 0.6);
  } else if (style.mood === "warm") {
    for (let i = 0; i < 5; i++) addLocalBox(group, [0.1, 2.8, 0.06], i % 2 ? 0xf8ead0 : accent, [-5 + i * 2.4, 2.8, 8.76], [0, 0, 0], 0.46);
  } else if (style.mood === "play") {
    [[-4, 3.8], [-2.4, 2.7], [2.8, 3.6], [4.5, 2.6]].forEach(([x, y], i) => {
      addLocalBox(group, [0.9, 0.9, 0.07], i % 2 ? accent : 0xffffff, [x, y, -8.7], [0, 0, 0.8], 0.78);
    });
  } else if (style.mood === "archive") {
    [-4.6, -2.6, -0.6, 1.4, 3.4, 5.4].forEach((x, i) => addLocalBox(group, [1.2, 1.7, 0.08], i % 2 ? 0xf4f0df : 0xd0d7d2, [x, 3.05, -8.7]));
  }
}

function createRoom(room) {
  const [x, z] = room.position;
  const style = roomStyles[room.id] || { wall: room.color, floor: 0xd7d7c5, accent: room.color, mood: "gallery" };
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);

  const floorMat = materials.floor.clone();
  floorMat.color.setHex(style.floor);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(roomSize, 0.35, roomSize), floorMat);
  floor.position.y = -0.18;
  floor.receiveShadow = true;
  group.add(floor);
  addBoxCollider([x, -0.18, z], [roomSize, 0.35, roomSize]);

  const wallMat = materials.wall.clone();
  wallMat.color.setHex(style.wall);
  const windowX = -5.3;
  const windowY = 3.15;
  const windowW = 4.8;
  const windowH = 2.4;
  const windowLeft = windowX - windowW / 2;
  const windowRight = windowX + windowW / 2;
  const backSegments = [
    [[roomSize, windowY - windowH / 2, 0.35], [0, (windowY - windowH / 2) / 2, -roomSize / 2]],
    [[roomSize, 6.2 - (windowY + windowH / 2), 0.35], [0, (windowY + windowH / 2) + (6.2 - (windowY + windowH / 2)) / 2, -roomSize / 2]],
    [[windowLeft - -roomSize / 2, windowH, 0.35], [(-roomSize / 2 + windowLeft) / 2, windowY, -roomSize / 2]],
    [[roomSize / 2 - windowRight, windowH, 0.35], [(windowRight + roomSize / 2) / 2, windowY, -roomSize / 2]]
  ];
  const walls = [
    ...backSegments,
    [[roomSize, 6.2, 0.35], [0, 3.05, roomSize / 2]],
    [[0.35, 6.2, roomSize], [-roomSize / 2, 3.05, 0]],
    [[0.35, 6.2, roomSize], [roomSize / 2, 3.05, 0]]
  ];
  walls.forEach(([size, pos]) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(...size), wallMat);
    wall.position.set(...pos);
    wall.receiveShadow = true;
    group.add(wall);
    if (Math.abs(pos[2]) === roomSize / 2) addBoxCollider([x + pos[0], pos[1], z + pos[2]], size);
  });

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(5.8, 0.055, 12, 160),
    new THREE.MeshBasicMaterial({ color: style.accent, transparent: true, opacity: 0.55 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);

  addRoomDecor(group, room, style);

  return group;
}

rooms.forEach(createRoom);

function createCloud(position, scale = 1, speed = 0.16) {
  const cloud = new THREE.Group();
  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0,
    transparent: true,
    opacity: 0.82
  });
  const puffs = [
    [-1.2, 0, 0, 1.15],
    [-0.35, 0.18, 0.06, 1.38],
    [0.72, 0.05, -0.04, 1.05],
    [1.48, -0.05, 0.03, 0.78],
    [0.05, -0.18, 0, 1.55]
  ];
  puffs.forEach(([x, y, z, s]) => {
    const puff = mesh(new THREE.SphereGeometry(1, 24, 12), cloudMaterial, [x, y, z], [0, 0, 0], [1.55 * s, 0.42 * s, 0.72 * s]);
    puff.castShadow = false;
    puff.receiveShadow = false;
    cloud.add(puff);
  });
  cloud.position.set(...position);
  cloud.scale.setScalar(scale);
  cloud.userData = {
    baseX: position[0],
    baseY: position[1],
    baseZ: position[2],
    speed,
    phase: Math.random() * Math.PI * 2
  };
  scene.add(cloud);
  clouds.push(cloud);
}

[
  [[-7, 14.2, -8], 1.25, 0.09],
  [[13, 16.4, 4], 1.7, 0.07],
  [[31, 15.5, -13], 1.4, 0.1],
  [[49, 17.5, 3], 1.95, 0.06],
  [[70, 14.6, -14], 1.35, 0.11],
  [[92, 16.8, 2], 1.65, 0.08],
  [[10, 18.2, -30], 1.75, 0.07],
  [[58, 16.1, -28], 1.42, 0.1],
  [[94, 18.6, -24], 2.05, 0.05]
].forEach(([position, scale, speed]) => createCloud(position, scale, speed));

const galleryRuns = [
  { position: [44, -0.22, 0], size: [108, 0.28, 6.2] },
  { position: [44, -0.22, -22], size: [108, 0.28, 6.2] },
  { position: [0, -0.21, -11], size: [6.2, 0.3, 26] },
  { position: [22, -0.21, -11], size: [6.2, 0.3, 26] },
  { position: [44, -0.21, -11], size: [6.2, 0.3, 26] },
  { position: [66, -0.21, -11], size: [6.2, 0.3, 26] },
  { position: [88, -0.21, -11], size: [6.2, 0.3, 26] }
];

galleryRuns.forEach(({ position, size }) => {
  makeBox(size, new THREE.MeshStandardMaterial({ color: 0xcdcfbd, roughness: 0.68, metalness: 0.05 }), position);
  addBoxCollider(position, size);
});

function makeTextSprite(text, color) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "rgba(255, 252, 236, 0.78)";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = `#${color.toString(16).padStart(6, "0")}`;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, c.width - 10, c.height - 10);
  ctx.fillStyle = "#26312c";
  ctx.font = "800 76px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, c.width / 2, c.height / 2);
  const texture = new THREE.CanvasTexture(c);
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
}

function add(...meshes) {
  const group = new THREE.Group();
  meshes.forEach((mesh) => group.add(mesh));
  return group;
}

function mesh(geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position);
  m.rotation.set(...rotation);
  m.scale.set(...scale);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function createSnowboard() {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-4, -0.56);
  shape.quadraticCurveTo(-5.2, 0, -4, 0.56);
  shape.lineTo(4, 0.56);
  shape.quadraticCurveTo(5.2, 0, 4, -0.56);
  shape.lineTo(-4, -0.56);
  const board = mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.08, bevelSegments: 8 }), materials.blue);
  board.rotation.x = Math.PI / 2;
  board.position.y = 1.25;
  group.add(board);
  [-1.55, 1.55].forEach((x) => {
    group.add(mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.08, 64), materials.black, [x, 1.52, 0], [Math.PI / 2, 0, 0]));
    group.add(mesh(new THREE.BoxGeometry(1.25, 0.12, 0.55), materials.white, [x, 1.66, 0.02], [0, 0.2 * x, 0]));
  });
  for (let i = -3; i <= 3; i++) group.add(mesh(new THREE.BoxGeometry(0.08, 0.05, 1.05), materials.brass, [i, 1.52, 0]));
  return group;
}

function createLamp() {
  const group = new THREE.Group();
  group.add(mesh(new THREE.CylinderGeometry(0.28, 0.46, 2.4, 44), materials.brass, [0, 1.35, 0]));
  group.add(mesh(new THREE.SphereGeometry(1.7, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), materials.glass, [0, 2.65, 0], [0, 0, 0], [1, 0.62, 1]));
  group.add(mesh(new THREE.CylinderGeometry(1.35, 0.95, 0.5, 64, 1, true), materials.glass, [0, 2.32, 0]));
  const glow = new THREE.PointLight(0xffd890, 3.6, 12, 1.6);
  glow.position.set(0, 2.35, 0);
  group.add(glow);
  group.add(mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.12, 64), materials.black, [0, 0.08, 0]));
  return group;
}

function createCowToy() {
  const group = new THREE.Group();
  const spot = new THREE.MeshStandardMaterial({ color: 0x2d2924, roughness: 0.7, metalness: 0.02 });
  const pink = new THREE.MeshStandardMaterial({ color: 0xf4a48d, roughness: 0.62, metalness: 0.03 });
  const mouth = new THREE.MeshStandardMaterial({ color: 0x8f3b36, roughness: 0.68, metalness: 0.02 });
  group.add(mesh(new THREE.SphereGeometry(1.25, 48, 24), materials.white, [0, 1.28, 0], [0, 0, 0], [1.55, 0.86, 0.78]));
  group.add(mesh(new THREE.SphereGeometry(0.72, 40, 18), materials.white, [1.58, 1.52, 0], [0, 0, 0], [1.08, 0.92, 0.88]));
  group.add(mesh(new THREE.SphereGeometry(0.34, 32, 16), pink, [2.17, 1.36, 0], [0, 0, 0], [0.9, 0.55, 0.7]));
  group.add(mesh(new THREE.SphereGeometry(0.08, 16, 8), materials.black, [2.42, 1.4, -0.12]));
  group.add(mesh(new THREE.SphereGeometry(0.08, 16, 8), materials.black, [2.42, 1.4, 0.12]));
  [-0.28, 0.28].forEach((z) => {
    group.add(mesh(new THREE.SphereGeometry(0.155, 24, 12), materials.black, [2.18, 1.7, z], [0, 0, 0], [1, 1.12, 0.52]));
    group.add(mesh(new THREE.SphereGeometry(0.035, 12, 8), materials.white, [2.27, 1.75, z - 0.04 * Math.sign(z)]));
  });
  group.add(mesh(new THREE.ConeGeometry(0.12, 0.42, 18), materials.brass, [1.58, 2.15, -0.34], [0.18, 0.15, -0.18]));
  group.add(mesh(new THREE.ConeGeometry(0.12, 0.42, 18), materials.brass, [1.58, 2.15, 0.34], [0.18, -0.15, 0.18]));
  group.add(mesh(new THREE.SphereGeometry(0.18, 20, 10), pink, [1.36, 1.82, -0.55], [0, 0.1, 0], [0.72, 0.28, 0.5]));
  group.add(mesh(new THREE.SphereGeometry(0.18, 20, 10), pink, [1.36, 1.82, 0.55], [0, -0.1, 0], [0.72, 0.28, 0.5]));
  [
    [-0.55, 1.55, 0.58, 0.34, 0.22],
    [-0.2, 1.05, -0.62, 0.28, 0.18],
    [0.62, 1.42, 0.55, 0.32, 0.2],
    [0.82, 0.95, -0.34, 0.24, 0.16],
    [-1.2, 1.22, -0.22, 0.3, 0.18],
    [-1.0, 1.72, 0.38, 0.22, 0.14],
    [0.16, 1.78, -0.48, 0.2, 0.13],
    [1.2, 1.48, 0.42, 0.21, 0.14],
    [0.38, 0.82, 0.64, 0.16, 0.1],
    [-1.42, 0.96, 0.46, 0.2, 0.12]
  ].forEach(([x, y, z, sx, sy], index) =>
    group.add(mesh(new THREE.SphereGeometry(1, 24, 12), spot, [x, y, z], [0, index * 0.23, index * 0.19], [sx, sy, 0.035]))
  );
  [-0.85, 0.85].forEach((x) => [-0.55, 0.55].forEach((z) => {
    group.add(mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.72, 24), materials.coral, [x, 0.55, z], [0.08 * x, 0, 0.04 * z]));
    group.add(mesh(new THREE.SphereGeometry(0.22, 20, 10), mouth, [x, 0.18, z], [0, 0, 0], [1.0, 0.36, 0.74]));
  }));
  const tail = mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.15, 12), materials.brass, [-1.66, 1.35, 0], [0, 0, -0.62]);
  group.add(tail);
  group.add(mesh(new THREE.SphereGeometry(0.13, 18, 10), spot, [-2.08, 0.93, 0]));
  return group;
}

function createCreditsSculpture() {
  return new THREE.Group();
}

function createPdfObject(label = "PDF Plan") {
  const group = new THREE.Group();
  group.add(mesh(new THREE.BoxGeometry(4.25, 5.45, 0.1), materials.brass, [0, 2.65, -0.08]));
  group.add(mesh(new THREE.BoxGeometry(4.0, 5.2, 0.08), materials.white, [0, 2.65, 0]));
  const sprite = makeTextSprite(label, 0xf3c969);
  sprite.position.set(0, 2.65, 0.08);
  sprite.scale.set(3.4, 0.8, 1);
  group.add(sprite);
  return group;
}

function createWelcomeWorld() {
  const group = new THREE.Group();
  group.userData.isWelcomeWorld = true;
  return group;
}

async function loadActualModel(roomId, targetGroup, { preview = false } = {}) {
  if (roomId === "lamp") return;

  if (roomId === "omniwheel") {
    try {
      const geometry = await stlLoader.loadAsync(assetUrl("/models/omniwheel-vehicle.stl"));
      geometry.computeVertexNormals();
      const imported = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: 0xd9d7cb, roughness: 0.48, metalness: 0.32 })
      );
      const box = new THREE.Box3().setFromObject(imported);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxAxis = Math.max(size.x, size.y, size.z) || 1;
      imported.position.sub(center);
      imported.scale.setScalar(4.35 / maxAxis);
      imported.rotation.y = Math.PI;
      imported.updateMatrixWorld(true);
      const fittedBox = new THREE.Box3().setFromObject(imported);
      const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
      imported.position.x -= fittedCenter.x;
      imported.position.z -= fittedCenter.z;
      imported.updateMatrixWorld(true);
      fittedBox.setFromObject(imported);
      imported.position.y += 1.05 - fittedBox.min.y;
      imported.castShadow = true;
      imported.receiveShadow = true;
      targetGroup.clear();
      targetGroup.add(imported);
      return;
    } catch (error) {
      console.info("No external STL loaded for omniwheel.");
    }
  }

  const modelUrls = {
    home: assetUrl("/models/welcome.glb"),
    snowboard: assetUrl("/models/snowboard.gltf"),
    tripod: assetUrl("/models/tripod.glb"),
    chair: assetUrl("/models/swing.glb"),
    shoe: assetUrl("/models/heating-bowl.glb"),
    hanger: assetUrl("/models/heating-sphere.gltf")
  };
  const previewModelUrls = {
    shoe: assetUrl("/models/heating-bowl-preview.glb"),
    tripod: assetUrl("/models/tripod-preview.glb")
  };
  const url = preview ? previewModelUrls[roomId] : modelUrls[roomId] || assetUrl(`/models/${roomId}.glb`);
  if (!url) return;
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) return;
    const gltf = await gltfLoader.loadAsync(url);
    const imported = gltf.scene;
    const box = new THREE.Box3().setFromObject(imported);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    const transform = modelTransforms[roomId] || {};
    imported.position.sub(center);
    imported.scale.setScalar((transform.scale || 4.2) / maxAxis);
    if (transform.rotation) imported.rotation.set(...transform.rotation);
    imported.updateMatrixWorld(true);
    const fittedBox = new THREE.Box3().setFromObject(imported);
    if (centeredPivotRooms.has(roomId)) {
      const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
      imported.position.sub(fittedCenter);
      imported.updateMatrixWorld(true);
      fittedBox.setFromObject(imported);
      targetGroup.position.y = (transform.lift || 0.45) - fittedBox.min.y;
      targetGroup.userData.baseY = targetGroup.position.y;
    } else {
      imported.position.y += (transform.lift || 0.45) - fittedBox.min.y;
    }
    imported.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    targetGroup.clear();
    targetGroup.add(imported);
  } catch (error) {
    console.info(`No external GLB loaded for ${roomId}.`);
  }
}

function ensureRoomPreviewLoaded(roomId) {
  if (!previewModelRooms.has(roomId) || loadedPreviews.has(roomId)) return Promise.resolve();
  if (loadingPreviews.has(roomId)) return loadingPreviews.get(roomId);
  const targetGroup = exhibitByRoomId.get(roomId);
  if (!targetGroup) return Promise.resolve();
  const loadPromise = loadActualModel(roomId, targetGroup, { preview: true }).finally(() => {
    loadingPreviews.delete(roomId);
    loadedPreviews.add(roomId);
  });
  loadingPreviews.set(roomId, loadPromise);
  return loadPromise;
}

function ensureRoomModelLoaded(roomId) {
  if (roomId === "lamp" || loadedModels.has(roomId)) return Promise.resolve();
  if (loadingModels.has(roomId)) return loadingModels.get(roomId);
  const targetGroup = exhibitByRoomId.get(roomId);
  if (!targetGroup) return Promise.resolve();
  const loadPromise = loadActualModel(roomId, targetGroup).finally(() => {
    loadingModels.delete(roomId);
    loadedModels.add(roomId);
  });
  loadingModels.set(roomId, loadPromise);
  return loadPromise;
}

async function preloadExternalModels() {
  for (const roomId of externalModelRooms) {
    await ensureRoomModelLoaded(roomId);
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  for (const roomId of previewModelRooms) {
    await ensureRoomPreviewLoaded(roomId);
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
}

const modelFactories = {
  omniwheel: () => new THREE.Group(),
  snowboard: () => new THREE.Group(),
  tripod: () => new THREE.Group(),
  chair: () => new THREE.Group(),
  lamp: () => createPdfObject("Shelf PDF Plan"),
  shoe: () => new THREE.Group(),
  hanger: () => new THREE.Group(),
  cow: createCowToy,
  credits: createCreditsSculpture
};

rooms.forEach((room) => {
  const group = new THREE.Group();
  const [x, z] = room.position;
  group.position.set(x, 0, z);
  scene.add(group);

  if (room.id === "home") {
    group.add(createWelcomeWorld());
    exhibits.push({ id: room.id, group, spin: 0 });
    exhibitByRoomId.set(room.id, group);
    return;
  }

  const exhibit = modelFactories[room.id]();
  exhibit.position.set(0, room.id === "credits" ? 0 : 0.1, 0);
  exhibit.userData.roomId = room.id;
  exhibit.userData.baseY = exhibit.position.y;
  group.add(exhibit);
  if (room.id !== "credits") {
    const pedestal = mesh(new THREE.CylinderGeometry(3.4, 3.7, 0.55, 80), new THREE.MeshStandardMaterial({ color: 0xf5efe0, roughness: 0.48, metalness: 0.08 }), [0, 0.1, 0]);
    group.add(pedestal);
  }
  group.userData.roomId = room.id;
  const spin = room.id === "lamp" || room.id === "credits" ? 0 : 0.08;
  exhibits.push({ id: room.id, group: exhibit, spin });
  exhibitByRoomId.set(room.id, exhibit);
});

const playerShape = new CANNON.Sphere(0.72);
const player = new CANNON.Body({ mass: 6, shape: playerShape, linearDamping: 0.72, angularDamping: 1 });
player.position.set(0, 2.1, 6);
world.addBody(player);

function teleportTo(id) {
  const room = roomById.get(id);
  if (!room) return;
  const [x, z] = room.position;
  teleportTarget.set(x, 2.2, z + 5.9);
  player.position.set(teleportTarget.x, teleportTarget.y, teleportTarget.z);
  player.velocity.set(0, 0, 0);
  yaw = 0;
  pitch = 0;
  setActiveRoom(room);
}

function showPdfPaper(plan) {
  const isRoomPdf = pdfRooms[activeRoom?.id] === plan;
  const isLargePaper = activeRoom?.id === "shoe";
  pdfPaperZoom = 1;
  pdfPaperPan.set(0, 0);
  pdfStage.classList.toggle("large-paper", isLargePaper);
  pdfStage.innerHTML = `
    <div class="pdf-stage-title">
      <span>${plan.title}</span>
      <button type="button" class="pdf-paper-close">${isRoomPdf ? "Reset view" : "Close"}</button>
    </div>
    <div class="pdf-paper-viewport">
      <img class="pdf-paper-image" src="${plan.image}" alt="${plan.title}" draggable="false" />
    </div>
  `;
  pdfStage.classList.add("visible");
  updatePdfPaperTransform();
  pdfStage.querySelector(".pdf-paper-close").addEventListener("click", () => {
    if (isRoomPdf) {
      pdfPaperZoom = 1;
      pdfPaperPan.set(0, 0);
      updatePdfPaperTransform();
      return;
    }
    pdfStage.classList.remove("visible");
    pdfStage.innerHTML = "";
    activeAssetRoomId = null;
    updateProjectAssets(activeRoom);
  });
}

function updateProjectAssets(room) {
  if (activeAssetRoomId === room.id) return;
  activeAssetRoomId = room.id;
  let plans = projectPlans[room.id] || [];
  if (room.id === "chair") {
    const order = planDeckOrder.get(room.id) || plans.map((_, index) => index);
    plans = order.map((index) => projectPlans[room.id][index]).filter(Boolean);
  }
  planTray.innerHTML = "";
  planTray.classList.remove("center-stage");
  planTray.classList.toggle("deck-gallery", room.id === "chair");
  planTray.classList.toggle("visible", plans.length > 0);
  plans.forEach((plan, index) => {
    const button = document.createElement("button");
    button.className = "plan-card";
    button.type = "button";
    button.style.setProperty("--stack-index", index);
    button.style.setProperty("--deck-total", plans.length);
    button.innerHTML = `
      <span>${plan.title}</span>
      <img src="${plan.image}" alt="${plan.title}" />
    `;
    let dragStart = null;
    let dragged = false;
    button.addEventListener("pointerdown", (event) => {
      if (room.id !== "chair") return;
      dragStart = { x: event.clientX, y: event.clientY };
      dragged = false;
      button.setPointerCapture?.(event.pointerId);
      button.classList.add("dragging");
    });
    button.addEventListener("pointermove", (event) => {
      if (!dragStart) return;
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      if (Math.hypot(dx, dy) < 8) return;
      dragged = true;
      button.style.setProperty("--drag-x", `${dx}px`);
      button.style.setProperty("--drag-y", `${dy}px`);
    });
    const finishDrag = (event) => {
      if (!dragStart) return;
      button.releasePointerCapture?.(event.pointerId);
      button.classList.remove("dragging");
      button.style.removeProperty("--drag-x");
      button.style.removeProperty("--drag-y");
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      dragStart = null;
      if (!dragged || Math.hypot(dx, dy) < 34) return;
      const currentOrder = planDeckOrder.get(room.id) || projectPlans[room.id].map((_, planIndex) => planIndex);
      if (dx < -28 || dy < -28) currentOrder.push(currentOrder.shift());
      if (dx > 28 || dy > 28) currentOrder.unshift(currentOrder.pop());
      planDeckOrder.set(room.id, currentOrder);
      activeAssetRoomId = null;
      updateProjectAssets(room);
    };
    button.addEventListener("pointerup", finishDrag);
    button.addEventListener("pointercancel", finishDrag);
    button.addEventListener("click", (event) => {
      if (dragged) {
        event.preventDefault();
        return;
      }
      showPdfPaper(plan);
    });
    planTray.appendChild(button);
  });

  const pdfRoom = pdfRooms[room.id];
  pdfStage.innerHTML = "";
  pdfStage.classList.remove("large-paper");
  pdfStage.classList.toggle("visible", Boolean(pdfRoom));
  if (pdfRoom) showPdfPaper(pdfRoom);
}

function updatePdfPaperTransform() {
  const image = pdfStage.querySelector(".pdf-paper-image");
  if (!image) return;
  image.style.transform = `translate(${pdfPaperPan.x}px, ${pdfPaperPan.y}px) scale(${pdfPaperZoom})`;
}

function typeRoomCopy(nextText) {
  clearInterval(copyTypeTimer);
  const previous = roomCopy.textContent.trim();
  let deleting = true;
  let index = previous.length;
  let typingIndex = 0;
  copyTypeTimer = setInterval(() => {
    if (deleting) {
      index = Math.max(0, index - 4);
      roomCopy.textContent = previous.slice(0, index);
      if (index === 0) deleting = false;
      return;
    }
    typingIndex = Math.min(nextText.length, typingIndex + 3);
    roomCopy.textContent = nextText.slice(0, typingIndex);
    if (typingIndex >= nextText.length) clearInterval(copyTypeTimer);
  }, 14);
}

function updateRoomPanel(room, animate = true) {
  clearTimeout(panelTimer);
  const applyContent = () => {
    roomName.textContent = room.name;
    roomDescription.textContent = room.description;
    toolchain.textContent = room.tools;
  };
  projectBadge.textContent = room.name;
  projectBadge.classList.remove("badge-swap");
  void projectBadge.offsetWidth;
  projectBadge.classList.add("badge-swap");
  if (!animate || room.id === "home") {
    panel.classList.remove("panel-exit", "panel-enter");
    applyContent();
    return;
  }
  panel.classList.add("panel-exit");
  panelTimer = setTimeout(() => {
    applyContent();
    panel.classList.remove("panel-exit");
    panel.classList.add("panel-enter");
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.remove("panel-enter")));
  }, 420);
}

async function startRoomTransition(id) {
  const room = roomById.get(id);
  if (!room || room.id === activeRoom.id || transition) return;
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  if (previewModelRooms.has(room.id) && !loadedPreviews.has(room.id)) {
    await ensureRoomPreviewLoaded(room.id);
  }
  if (!deferredModelRooms.has(room.id) && externalModelRooms.includes(room.id) && !loadedModels.has(room.id)) {
    await ensureRoomModelLoaded(room.id);
  }

  const [x, z] = room.position;
  const [activeX, activeZ] = activeRoom.position;
  const start = new THREE.Vector3(player.position.x, Math.max(player.position.y, 2.2), player.position.z);
  const mapCenter = new THREE.Vector3(44, 0, -11);
  const startLook = new THREE.Vector3(activeX, 2.2, activeZ);
  const overview = new THREE.Vector3(mapCenter.x, 78, mapCenter.z + 2);
  const targetOverview = new THREE.Vector3(x, 50, z + 1.5);
  const finish = new THREE.Vector3(x, 2.2, z + 5.9);
  transition = {
    room,
    elapsed: 0,
    startClock: clock.elapsedTime,
    duration: 2.35,
    start,
    startLook,
    overview,
    overviewLook: mapCenter,
    targetOverview,
    targetLook: new THREE.Vector3(x, 0.4, z),
    finish,
    startFov: camera.fov,
    overviewFov: 52,
    endFov: 66
  };
  setActiveRoom(room);
  activeAssetRoomId = null;
  planTray.classList.remove("visible");
  pdfStage.classList.remove("visible");
}

function setActiveRoom(room) {
  if (activeRoom?.id === room.id) return;
  const hadActiveRoom = Boolean(activeRoom);
  activeRoom = room;
  if (hadActiveRoom) typeRoomCopy(room.copy);
  else roomCopy.textContent = room.copy;
  updateRoomPanel(room, hadActiveRoom);
  interfaceLayer.classList.toggle("home-active", room.id === "home");
  interfaceLayer.classList.toggle("about-active", room.id === "credits");
  updateAboutProfileVisibility();
  mapButtons.forEach((button) => button.classList.toggle("active", button.dataset.room === room.id));
  if (!transition) ensureRoomModelLoaded(room.id);
  if (!transition) updateProjectAssets(room);
}

function updateAboutProfileVisibility() {
  const shouldShow = activeRoom?.id === "credits" && !transition;
  aboutProfile.classList.toggle("visible", shouldShow);
}

mapButtons.forEach((button) => button.addEventListener("click", () => startRoomTransition(button.dataset.room)));
enterWorld.addEventListener("click", () => canvas.requestPointerLock());

document.addEventListener("pointerlockchange", () => {
  const locked = document.pointerLockElement === canvas;
  enterWorld.textContent = locked ? "click escape to leave first-person mode" : "Enter first-person mode";
  updateAboutProfileVisibility();
  if (!locked) {
    viewReset = {
      startClock: clock.elapsedTime,
      duration: 0.48,
      startYaw: yaw,
      startPitch: pitch
    };
    keys.clear();
  } else {
    viewReset = null;
  }
});

window.addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (event.code === "Escape" && document.pointerLockElement === canvas) document.exitPointerLock();
});
window.addEventListener("keyup", (event) => keys.delete(event.code));

window.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement === canvas) {
    yaw -= event.movementX * 0.0022;
    pitch -= event.movementY * 0.0022;
    pitch = THREE.MathUtils.clamp(pitch, -1.15, 1.15);
  } else if (isDragging && selectedExhibit) {
    const freeRotation = freeRotationRooms.has(selectedExhibit.userData.roomId);
    selectedExhibit.rotation.y += event.movementX * 0.012;
    if (freeRotation) {
      selectedExhibit.rotation.x += event.movementY * 0.012;
      selectedExhibit.rotation.x = THREE.MathUtils.clamp(selectedExhibit.rotation.x, -Math.PI, Math.PI);
    }
  }
});

window.addEventListener("mousedown", (event) => {
  if (event.target.closest?.("#pdfStage")) {
    isPanningPdf = true;
    lastPdfPointer.set(event.clientX, event.clientY);
    return;
  }
  if (document.pointerLockElement === canvas) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(exhibits.map((item) => item.group), true)[0];
  selectedExhibit = hit ? findExhibitRoot(hit.object) : null;
  isDragging = Boolean(selectedExhibit);
});
window.addEventListener("mouseup", () => {
  isDragging = false;
  isPanningPdf = false;
});

window.addEventListener("wheel", (event) => {
  if (!event.target.closest?.("#pdfStage")) return;
  event.preventDefault();
  pdfPaperZoom = THREE.MathUtils.clamp(pdfPaperZoom + event.deltaY * -0.0015, 0.65, 3.8);
  updatePdfPaperTransform();
}, { passive: false });

window.addEventListener("mousemove", (event) => {
  if (!isPanningPdf) return;
  pdfPaperPan.x += event.clientX - lastPdfPointer.x;
  pdfPaperPan.y += event.clientY - lastPdfPointer.y;
  lastPdfPointer.set(event.clientX, event.clientY);
  updatePdfPaperTransform();
});

function findExhibitRoot(object) {
  let current = object;
  while (current?.parent && !exhibits.some((item) => item.group === current)) current = current.parent;
  return exhibits.some((item) => item.group === current) ? current : null;
}

function smoothstep(value) {
  const x = THREE.MathUtils.clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
}

function easeInOut(value) {
  const x = THREE.MathUtils.clamp(value, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function updatePlayer(dt) {
  if (transition) {
    transition.elapsed = clock.elapsedTime - transition.startClock;
    const progress = THREE.MathUtils.clamp(transition.elapsed / transition.duration, 0, 1);
    const pos = new THREE.Vector3();
    const look = new THREE.Vector3();

    if (progress < 0.44) {
      const phase = smoothstep(progress / 0.44);
      pos.lerpVectors(transition.start, transition.overview, phase);
      look.lerpVectors(transition.startLook, transition.overviewLook, phase);
      camera.fov = THREE.MathUtils.lerp(transition.startFov, transition.overviewFov, phase);
    } else if (progress < 0.68) {
      const phase = easeInOut((progress - 0.44) / 0.24);
      pos.lerpVectors(transition.overview, transition.targetOverview, phase);
      look.lerpVectors(transition.overviewLook, transition.targetLook, phase);
      camera.fov = transition.overviewFov;
    } else {
      const phase = smoothstep((progress - 0.68) / 0.32);
      pos.lerpVectors(transition.targetOverview, transition.finish, phase);
      look.copy(transition.targetLook);
      camera.fov = THREE.MathUtils.lerp(transition.overviewFov, transition.endFov, phase);
    }

    camera.updateProjectionMatrix();
    player.position.set(pos.x, pos.y, pos.z);
    player.velocity.set(0, 0, 0);
    camera.position.copy(pos);
    camera.lookAt(look);
    if (progress >= 1) {
      const destinationRoom = transition.room;
      teleportTo(transition.room.id);
      camera.fov = transition.endFov;
      camera.updateProjectionMatrix();
      transition = null;
      updateAboutProfileVisibility();
      updateProjectAssets(destinationRoom);
      if (deferredModelRooms.has(destinationRoom.id)) {
        if (!loadedModels.has(destinationRoom.id)) {
          setTimeout(() => ensureRoomModelLoaded(destinationRoom.id), 180);
        }
      }
    }
    return;
  }

  if (viewReset) {
    const progress = THREE.MathUtils.clamp((clock.elapsedTime - viewReset.startClock) / viewReset.duration, 0, 1);
    const phase = easeInOut(progress);
    yaw = THREE.MathUtils.lerp(viewReset.startYaw, 0, phase);
    pitch = THREE.MathUtils.lerp(viewReset.startPitch, 0, phase);
    player.velocity.x = 0;
    player.velocity.z = 0;
    if (progress >= 1) {
      yaw = 0;
      pitch = 0;
      viewReset = null;
    }
  }

  const input = new THREE.Vector3();
  if (!viewReset) {
    if (keys.has("KeyW") || keys.has("ArrowUp")) input.z -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) input.z += 1;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) input.x -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) input.x += 1;
  }
  input.normalize();

  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const move = right.multiplyScalar(input.x).add(forward.multiplyScalar(input.z)).multiplyScalar(7.8);
  player.velocity.x = move.x;
  player.velocity.z = move.z;
  if (keys.has("Space") && Math.abs(player.velocity.y) < 0.08 && player.position.y < 2.25) player.velocity.y = 6.8;

  if (player.position.y < -8) teleportTo(activeRoom.id);
  camera.position.set(player.position.x, player.position.y + 0.62, player.position.z);
  camera.rotation.order = "YXZ";
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

function nearestRoom() {
  const p = new THREE.Vector2(player.position.x, player.position.z);
  let nearest = rooms[0];
  let dist = Infinity;
  rooms.forEach((room) => {
    const d = p.distanceTo(new THREE.Vector2(room.position[0], room.position[1]));
    if (d < dist) {
      dist = d;
      nearest = room;
    }
  });
  return nearest;
}

function updateWelcomeWorld(t) {
  const item = exhibits.find((exhibit) => exhibit.id === "home");
  if (!item) return;
  const welcomeWorld = item.group.children.find((child) => child.userData.isWelcomeWorld);
  if (!welcomeWorld) return;
  welcomeWorld.position.y = Math.sin(t * 0.9) * 0.16;
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.033);
  const t = clock.elapsedTime;
  const cycle = (Math.sin(t * 0.09) + 1) / 2;
  sun.position.set(Math.cos(t * 0.035) * 55, 24 + cycle * 14, Math.sin(t * 0.035) * 42);
  sun.intensity = 2.2 + cycle * 1.55;
  hemi.intensity = 1.15 + cycle * 0.55;
  clouds.forEach((cloud, i) => {
    const { baseX, baseY, baseZ, speed, phase } = cloud.userData;
    cloud.position.x = baseX + Math.sin(t * speed + phase) * 4.8;
    cloud.position.y = baseY + Math.sin(t * 0.18 + phase + i) * 0.38;
    cloud.position.z = baseZ + Math.cos(t * speed * 0.7 + phase) * 2.4;
    cloud.rotation.y = Math.sin(t * 0.05 + phase) * 0.08;
    cloud.visible = !transition;
  });
  world.step(1 / 60, dt, 3);
  updatePlayer(dt);

  exhibits.forEach((item, i) => {
    const shouldAnimate = item.id === activeRoom?.id || item.id === transition?.room.id || item.id === "home";
    if (shouldAnimate && (!isDragging || selectedExhibit !== item.group)) item.group.rotation.y += dt * item.spin;
    if (shouldAnimate && item.id !== "lamp") {
      const baseY = item.group.userData.baseY ?? 0;
      item.group.position.y = baseY + Math.sin(t * 1.4 + i) * 0.035;
    }
  });
  updateWelcomeWorld(t);

  if (activeRoom) {
    roomAccentLight.color.setHex(activeRoom.color);
    roomAccentLight.position.set(activeRoom.position[0], 5.2, activeRoom.position[1] + 1);
    roomAccentLight.intensity = 1.85 + Math.sin(t * 2.4) * 0.18;
    const homeActive = activeRoom.id === "home" && !transition;
    welcomeFrontLight.intensity = homeActive ? 8.5 : 0;
    welcomeFrontLight.position.set(activeRoom.position[0], 4.1, activeRoom.position[1] + 7.4);
    welcomeFrontLight.target.position.set(activeRoom.position[0], 1.85, activeRoom.position[1]);
  }

  if (!transition) {
    const room = nearestRoom();
    if (room.id !== activeRoom.id) {
      setActiveRoom(room);
    } else {
      updateProjectAssets(room);
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

setActiveRoom(rooms[0]);
document.body.classList.remove("app-loading");
animate();
setTimeout(() => {
  preloadExternalModels();
}, 650);
