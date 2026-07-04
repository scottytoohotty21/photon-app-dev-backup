/*
  MovePilot Survey App
  Extracted from the original single-file HTML so the app logic can be reviewed
  and maintained separately from markup and styling. Inline HTML event handlers are
  intentionally preserved, so these function declarations remain in global scope.
*/



// -----------------------------------------------------------------------------
// Reference data and constants
// -----------------------------------------------------------------------------
const PROPERTY_TYPES = ["House", "Apartment", "Bungalow", "Office", "Shop"];
const VEHICLE_TYPES = ["Shuttle van", "Transit van", "Luton / Low Loader", "7.5 tonne", "12 tonne", "15 tonne", "18 tonne", "20ft container", "40ft container"];
const MOVE_TYPES = ["Dom-local", "Dom-Distance", "Dom-To Store", "Dom-Ex Store", "Euro Part Load", "Euro Direct", "GPG", "LCL", "FCL"];
const OPERATING_BRANCHES = [
    "Aylesbury",
    "Crawley",
    "Edinburgh",
    "Ely",
    "Exeter",
    "Guildford",
    "London",
    "Solent",
    "York"
];
const BRANCH_DEPOTS = {
    Aylesbury: "Smeaton Cl, Aylesbury HP19 8UN",
    Crawley: "5 Kelvin Way, Crawley RH10 9SP",
    Edinburgh: "4 Eastfield Farm Rd, Penicuik EH26 8EZ",
    Ely: "Unit 40, Lancaster Way Business Park, ELY CB6 3NW",
    Exeter: "Windsor Court, Manaton Close, Matford Business Park, Exeter, Devon, EX2 8PF.",
    Guildford: "Slyfield Industrial Estate, Unit 4b, Opus Park, Moorfield Rd, Guildford GU1 1SZ",
    London: "",
    Solent: "Unit 8, Voyager Park, Portfield Rd, Portsmouth PO3 5GF",
    York: "Old Office Block Moor Lane Trading Estate, Sherburn in Elmet, Leeds LS25 6ES"
};
const PACK_OPTIONS = ["Owner Pack", "Fragile (china & Glassware) pack", "Full Packing", "Full Export Pack and Wrap", "Unload Only"];
const SALUTATIONS = ["Mr", "Miss", "Mrs", "Ms", "Other"];
        
const DEFAULT_ROOMS = [
    "Lounge",
    "Dining Room",
    "Kitchen",
    "Utility Room",
    "Study",
    "Hallway",
    "Loft",
    "Main Bedroom",
    "Bedroom 2",
    "Bedroom 3",
    "Bedroom 4",
    "Bedroom 5",
    "Bathroom",
    "2nd Collection Address",
    "Dressing Room",
    "Garden",
    "Garage",
    "Shed",
    "Conservatory",
    "Landing",
    "Eaves Cupboards",
    "Understairs Cupboard",
    "Playroom",
    "Snug",
    "TV Room",
    "Office"
];
// --- APP SETTINGS / DISPLAY CONVERSIONS ---
const MOVEPILOT_APP_SETTINGS_KEY = "movepilot_app_settings_v1";
const CUFT_PER_CBM = 35.314;
const DEFAULT_VOLUMETRIC_KG_PER_CBM = 167;



// -----------------------------------------------------------------------------
// Unit conversion helpers
// -----------------------------------------------------------------------------
function cuftToCbm(cuft) {
    return Number(cuft || 0) / CUFT_PER_CBM;
}

function formatCbmFromCuft(cuft) {
    return cuftToCbm(cuft).toFixed(2);
}

function cuftToVolumetricKg(cuft, kgPerCbm) {
    const cbm = cuftToCbm(cuft);
    return cbm * Number(kgPerCbm || DEFAULT_VOLUMETRIC_KG_PER_CBM);
}

function formatVolumetricKgFromCuft(cuft, kgPerCbm) {
    return Math.round(cuftToVolumetricKg(cuft, kgPerCbm));
}
function formatVolumeDisplayFromCuft(cuft) {
    const settings = getAppSettings();
    const cleanCuft = Number(cuft || 0);
    const parts = [cleanCuft + " cuft"];

    if (settings.showCbm) {
        parts.push(formatCbmFromCuft(cleanCuft) + " cbm");
    }

    if (settings.showVolumetricWeight) {
        parts.push(
            formatVolumetricKgFromCuft(
                cleanCuft,
                settings.volumetricKgPerCbm
            ) + " kg vol weight"
        );
    }

    return parts.join(" / ");
}
function getSurveyorDisplayName() {
    const settings = getAppSettings();
    return String(settings.surveyorName || "").trim();
}

function getSurveyorNameHtml() {
    const surveyorName = getSurveyorDisplayName();

    if (!surveyorName) {
        return "";
    }

    return `
        <div class="surveyor-name-line">
            Survey completed by: <span>${escapeHtml(surveyorName)}</span>
        </div>
    `;
}

function getPrintableSurveyorNameHtml() {
    const surveyorName = getSurveyorDisplayName();

    if (!surveyorName) {
        return "";
    }

    return `
        <div class="pdf-small-note pdf-surveyor-name">
            Survey completed by: <strong>${escapeHtml(surveyorName)}</strong>
        </div>
    `;
}
function getSurveyorSignatureDataUrl() {
    const settings = getAppSettings();
    return String(settings.surveyorSignatureDataUrl || "").trim();
}

function getSurveyorSignatureHtml() {
    const signatureDataUrl = getSurveyorSignatureDataUrl();

    if (!signatureDataUrl) {
        return "";
    }

    return `
        <div class="surveyor-signature-display">
            <div class="surveyor-signature-label">Surveyor Signature</div>
            <img src="${signatureDataUrl}" alt="Surveyor signature">
        </div>
    `;
}

function getPrintableSurveyorSignatureHtml() {
    const signatureDataUrl = getSurveyorSignatureDataUrl();

    if (!signatureDataUrl) {
        return "";
    }

    return `
        <div class="pdf-surveyor-signature">
            <div class="pdf-small-note">Surveyor Signature</div>
            <img src="${signatureDataUrl}" alt="Surveyor signature">
        </div>
    `;
}



// -----------------------------------------------------------------------------
// Local app settings
// -----------------------------------------------------------------------------
function getDefaultAppSettings() {
    return {
        activationCode: "",
        activationStatus: "dev",
        surveyorName: "",
        surveyorSignatureDataUrl: "",
        showCbm: false,
        showVolumetricWeight: false,
        volumetricKgPerCbm: DEFAULT_VOLUMETRIC_KG_PER_CBM
    };
}

function getAppSettings() {
    try {
        const saved = localStorage.getItem(MOVEPILOT_APP_SETTINGS_KEY);
        const parsed = saved ? JSON.parse(saved) : {};

        return {
            ...getDefaultAppSettings(),
            ...(parsed && typeof parsed === "object" ? parsed : {})
        };
    } catch (err) {
        console.warn("Could not load app settings", err);
        return getDefaultAppSettings();
    }
}

function saveAppSettings(settings) {
    try {
        localStorage.setItem(
            MOVEPILOT_APP_SETTINGS_KEY,
            JSON.stringify({
                ...getDefaultAppSettings(),
                ...(settings || {})
            })
        );
    } catch (err) {
        console.warn("Could not save app settings", err);
    }
}

function updateAppSetting(key, value) {
    const settings = getAppSettings();
    settings[key] = value;
    saveAppSettings(settings);
    return settings;
}
const DEFAULT_FLOORS = [
    "Basement",
    "Lower Ground",
    "Ground",
    "First",
    "Second",
    "Third",
    "Loft",
    "Outside"
];
const BOX_VOLUMES = {
    AP: 4,
    CG: 4,
    BOOK: 2,
    LINEN: 5,
    WR: 10,
    ap: 4,
    cg: 4,
    books: 2,
    linen: 5,
    wr: 10,
    PICTURE: 0,
WINE_DIVIDERS: 0,
BLUE_EDGING: 0,
POLY_CHIPS: 0,
    };



// -----------------------------------------------------------------------------
// Inventory catalogue data
// -----------------------------------------------------------------------------
const furnitureDB = [
    {item:"AC Unit / Humidifier", volume:10},
    {item:"Armchair", volume:20},
    {item:"Artwork", volume:5},
    {item:"Baby Bath", volume:5},
    {item:"Bags / Cases", volume:5},
    {item:"Barometer", volume:2},
    {item:"Barrel", volume:15},
    {item:"Barstool", volume:10},
    {item:"Basket", volume:5},
    {item:"Basketball Hoop", volume:40},
    {item:"Bathroom Cabinet", volume:5},
    {item:"BBQ", volume:30},
    {item:"BBQ (Weber Type)", volume:15},
    {item:"Bean Bag", volume:10},
    {item:"Cot / Childs Bed", volume:20},
    {item:"Bed (Single)", volume:30},
    {item:"Bed (Double)", volume:60},
    {item:"Bed (Queensize)", volume:65},
    {item:"Bed (Kingsize)", volume:70},
    {item:"Bed (SuperKing)", volume:90},
    {item:"Bunk Bed", volume:60},
    {item:"Bed (Cabin Bed)", volume:60},
    {item:"Bed Box", volume:10},
    {item:"Bedframe", volume:30},
    {item:"Bedside Table", volume:5},
    {item:"Bench", volume:35},
    {item:"Bike", volume:15},
    {item:"Bike (Child)", volume:10},
    {item:"Bin", volume:10},
    {item:"Bird Bath", volume:5},
    {item:"Bird Table", volume:5},
    {item:"Blanket Box", volume:10},
    {item:"Bookcase (Large)", volume:30},
    {item:"Bookcase (Medium)", volume:20},
    {item:"Bookcase (Small)", volume:10},
    {item:"Bookshelf", volume:2},
    {item:"Bureau", volume:20},
    {item:"Butchers Block", volume:20},
    {item:"Cabinet", volume:20},
    {item:"Cabinet (Large)", volume:50},
    {item:"Cabinet (Medium)", volume:30},
    {item:"Cabinet (Small)", volume:10},
    {item:"Canoe / Kayak", volume:35},
    {item:"Canvas Wardrobe", volume:45},
    {item:"Carver Chair", volume:10},
    {item:"Cat Tree", volume:15},
    {item:"CD/DVD Rack", volume:10},
    {item:"Dining Chair", volume:8},
    {item:"Dining Table", volume:30},
    {item:"Office Chair", volume:20},
    {item:"Chaise Longue", volume:45},
    {item:"Chandelier", volume:20},
    {item:"Changing Table", volume:20},
    {item:"Chest", volume:20},
    {item:"Chest Drawers (Large)", volume:30},
    {item:"Chest Drawers (Medium)", volume:20},
    {item:"Chest Drawers (Small)", volume:15},
    {item:"Chiminea", volume:20},
    {item:"China Cabinet", volume:20},
    {item:"Climbing Frame", volume:60},
    {item:"Clock", volume:2},
    {item:"Clock (Grandfather)", volume:35},
    {item:"Clock (Grandmother)", volume:20},
    {item:"Clothes Rack (Dryer)", volume:3},
    {item:"Clothes Rail", volume:15},
    {item:"Coat Stand", volume:15},
    {item:"Coffee Machine", volume:5},
    {item:"Coffee Table", volume:10},
    {item:"Computer", volume:5},
    {item:"Cooker", volume:30},
    {item:"Cot", volume:20},
    {item:"Crate (Plastic)", volume:5},
    {item:"Cushions (Scatter Cushions)", volume:5},
    {item:"Deck Chair", volume:10},
    {item:"Desk (Regular)", volume:30},
    {item:"Desk (Small)", volume:15},
    {item:"Desk (Large / Rolltop)", volume:45},
    {item:"Dishwasher", volume:15},
    {item:"Dog Bed", volume:10},
    {item:"Dolls House", volume:10},
    {item:"Dresser", volume:60},
    {item:"Dressing Table", volume:30},
    {item:"Drums", volume:20},
    {item:"Dryer", volume:15},
    {item:"Dustbin", volume:10},
    {item:"Fan (Table)", volume:2},
    {item:"Fan (Tall)", volume:10},
    {item:"Filing Cabinet", volume:15},
    {item:"Fire / Fireplace", volume:15},
    {item:"Fire Pit", volume:15},
    {item:"Fire Tools", volume:1},
    {item:"Fish Tank (Glass)", volume:30},
    {item:"Folding Bed", volume:10},
    {item:"Footstool", volume:5},
    {item:"Fridge (American)", volume:60},
    {item:"Fridge / Freezer (Regular)", volume:30},
    {item:"Fridge / Freezer (Small)", volume:15},
    {item:"Futon", volume:45},
    {item:"Garden Bench", volume:45},
    {item:"Garden Chair (Small)", volume:5},
    {item:"Garden Chair", volume:20},
    {item:"Garden Lounger", volume:20},
    {item:"Garden Table (Large)", volume:45},
    {item:"Garden Table (Small)", volume:20},
    {item:"Gardening Tools (Spade Type)", volume:5},
    {item:"Glass Top", volume:5},
    {item:"Golf Clubs", volume:10},
    {item:"Golf Trolley", volume:10},
    {item:"Guitar", volume:10},
    {item:"Gym (Cross Trainer)", volume:60},
    {item:"Gym (Peloton Type)", volume:45},
    {item:"Gym (Rowing Machine)", volume:30},
    {item:"Gym (Treadmill)", volume:60},
    {item:"Hall Stand", volume:45},
    {item:"Hall Table", volume:15},
    {item:"Hammock", volume:20},
    {item:"Headboard", volume:10},
    {item:"Heater", volume:5},
    {item:"Highchair", volume:10},
    {item:"Hose & Reel", volume:5},
    {item:"Incinerator", volume:10},
    {item:"Ironing Board", volume:10},
    {item:"Kallax 4 box", volume:10},
    {item:"Kallax 8 box", volume:20},
    {item:"Kallax 16 box", volume:30},
    {item:"Keyboard", volume:10},
    {item:"Kitchen Table", volume:30},
    {item:"Ladder", volume:10},
    {item:"Ladder (Extending)", volume:30},
    {item:"Lamp (Standard)", volume:10},
    {item:"Lamp (Table)", volume:4},
    {item:"Laundry Basket", volume:10},
    {item:"Lawnmower", volume:30},
    {item:"Light Fitting", volume:5},
    {item:"Linen Basket", volume:10},
    {item:"Mannequin / Dress Stand", volume:20},
    {item:"Mattress (Single)", volume:15},
    {item:"Mattress (Double)", volume:30},
    {item:"Mattress (Queensize)", volume:30},
    {item:"Mattress (Kingsize)", volume:30},
    {item:"Microwave", volume:5},
    {item:"Mirror", volume:2},
    {item:"Mirror (Medium)", volume:5},
    {item:"Mirror (Large)", volume:10},
    {item:"Mirror (Overmantle)", volume:15},
    {item:"Mop / Bucket", volume:10},
    {item:"Motorbike", volume:100},
    {item:"Nest Tables", volume:5},
    {item:"Ottoman", volume:20},
    {item:"Painting", volume:2},
    {item:"Painting (Medium)", volume:5},
    {item:"Painting (Large)", volume:10},
    {item:"Parasol", volume:10},
    {item:"Parasol (Large)", volume:30},
    {item:"Pbo (Packed By Owner Box)", volume:5},
    {item:"Piano (Upright)", volume:45},
    {item:"Piano (Electric)", volume:45},
    {item:"Piano (Baby Grand)", volume:150},
    {item:"Piano (Grand)", volume:150},
    {item:"Piano Stool", volume:5},
    {item:"Picture", volume:2},
    {item:"Plant Pot (Empty)", volume:5},
    {item:"Plastic Crate", volume:5},
    {item:"Plastic Drawers", volume:6},
    {item:"Pool / Snooker Table", volume:150},
    {item:"Pot Plant (Large)", volume:30},
    {item:"Pot Plant (Small)", volume:10},
    {item:"Pram / Pushchair", volume:15},
    {item:"Printer", volume:5},
    {item:"Racking", volume:20},
    {item:"Rocking Chair", volume:20},
    {item:"Rocking Horse", volume:30},
    {item:"Roof Box (Car)", volume:15},
    {item:"Rotary Line", volume:15},
    {item:"Rug (Large)", volume:30},
    {item:"Rug (Medium)", volume:20},
    {item:"Rug (Small)", volume:5},
    {item:"Safe", volume:10},
    {item:"Scooter (Child)", volume:5},
    {item:"Scooter (Moped)", volume:100},
    {item:"Screen / Room Divider", volume:30},
    {item:"Sewing Machine", volume:5},
    {item:"Shelving / Racking", volume:30},
    {item:"Shoe Rack", volume:5},
    {item:"Shredder", volume:5},
    {item:"Side Table (Large)", volume:15},
    {item:"Side Table (Medium)", volume:10},
    {item:"Sideboard", volume:60},
    {item:"Side Table", volume:5},
    {item:"Sit-on Lawnmower", volume:60},
    {item:"Ski Gear", volume:30},
    {item:"Sledge", volume:5},
    {item:"Slide", volume:30},
    {item:"Sofa 2 Seat", volume:45},
    {item:"Sofa 3 Seat", volume:60},
    {item:"Sofa 4 Seat", volume:70},
    {item:"Sofa Corner", volume:120},
    {item:"Speakers", volume:10},
    {item:"Step Ladder", volume:10},
    {item:"Stool", volume:5},
    {item:"Suitcase / Luggage", volume:8},
    {item:"Sundial", volume:10},
    {item:"Surfboard", volume:15},
    {item:"Swing", volume:30},
    {item:"Table (Large)", volume:60},
    {item:"Table (Small)", volume:10},
    {item:"Table Tennis Table", volume:60},
    {item:"Toddler Table & Chairs", volume:15},
    {item:"Trampoline", volume:20},
    {item:"Trouserpress", volume:8},
    {item:"Tumble Dryer", volume:15},
    {item:"Trunk", volume:10},
    {item:"TV", volume:10},
    {item:"TV Table (Media Unit)", volume:20},
    {item:"Vacuum Cleaner", volume:10},
    {item:"Valet Stand / Towel Rail", volume:10},
    {item:"Wall Unit", volume:45},
    {item:"Wardrobe (Single)", volume:30},
    {item:"Wardrobe (2-door)", volume:45},
    {item:"Wardrobe (3-door)", volume:60},
    {item:"Wardrobe (4-door)", volume:75},
    {item:"Wardrobe (sliding door)", volume:60},
    {item:"Washing Machine", volume:15},
    {item:"Water Butt", volume:15},
    {item:"Welsh Dresser", volume:60},
    {item:"Wheelbarrow", volume:15},
    {item:"Workbench", volume:10},
    {item:"Xmas Decs", volume:15},
    {item:"Xmas Tree", volume:10},
    ];

const inventoryCategories = {
    "Full List": [
        "AC Unit / Humidifier",
        "Armchair",
        "Artwork",
        "Baby Bath",
        "Bags / Cases",
        "Barometer",
        "Barrel",
        "Barstool",
        "Basket",
        "Basketball Hoop",
        "Bathroom Cabinet",
        "BBQ",
        "BBQ (Weber Type)",
        "Bean Bag",
        "Cot / Childs Bed",
        "Bed (Single)",
        "Bed (Double)",
        "Bed (Queensize)",
        "Bed (Kingsize)",
        "Bed (SuperKing)",
        "Bunk Bed",
        "Bed (Cabin Bed)",
        "Bed Box",
        "Bedframe",
        "Bedside Table",
        "Bench",
        "Bike",
        "Bike (Child)",
        "Bin",
        "Bird Bath",
        "Bird Table",
        "Blanket Box",
        "Bookcase (Large)",
        "Bookcase (Medium)",
        "Bookcase (Small)",
        "Bookshelf",
        "Bureau",
        "Butchers Block",
        "Cabinet",
        "Cabinet (Large)",
        "Cabinet (Medium)",
        "Cabinet (Small)",
        "Canoe / Kayak",
        "Canvas Wardrobe",
        "Carver Chair",
        "Cat Tree",
        "CD/DVD Rack",
        "Dining Chair",
        "Dining Table",
        "Office Chair",
        "Chaise Longue",
        "Chandelier",
        "Changing Table",
        "Chest",
        "Chest Drawers (Large)",
        "Chest Drawers (Medium)",
        "Chest Drawers (Small)",
        "Chiminea",
        "China Cabinet",
        "Climbing Frame",
        "Clock",
        "Clock (Grandfather)",
        "Clock (Grandmother)",
        "Clothes Rack (Dryer)",
        "Clothes Rail",
        "Coat Stand",
        "Coffee Machine",
        "Coffee Table",
        "Computer",
        "Cooker",
        "Cot",
        "Crate (Plastic)",
        "Cushions (Scatter Cushions)",
        "Deck Chair",
        "Desk (Regular)",
        "Desk (Small)",
        "Desk (Large / Rolltop)",
        "Dishwasher",
        "Dog Bed",
        "Dolls House",
        "Dresser",
        "Dressing Table",
        "Drums",
        "Dryer",
        "Dustbin",
        "Fan (Table)",
        "Fan (Tall)",
        "Filing Cabinet",
        "Fire / Fireplace",
        "Fire Pit",
        "Fire Tools",
        "Fish Tank (Glass)",
        "Folding Bed",
        "Footstool",
        "Fridge (American)",
        "Fridge / Freezer (Regular)",
        "Fridge / Freezer (Small)",
        "Futon",
        "Garden Bench",
        "Garden Chair (Small)",
        "Garden Chair",
        "Garden Lounger",
        "Garden Table (Large)",
        "Garden Table (Small)",
        "Gardening Tools (Spade Type)",
        "Glass Top",
        "Golf Clubs",
        "Golf Trolley",
        "Guitar",
        "Gym (Cross Trainer)",
        "Gym (Peloton Type)",
        "Gym (Rowing Machine)",
        "Gym (Treadmill)",
        "Hall Stand",
        "Hall Table",
        "Hammock",
        "Headboard",
        "Heater",
        "Highchair",
        "Hose & Reel",
        "Incinerator",
        "Ironing Board",
        "Kallax 4 box",
        "Kallax 8 box",
        "Kallax 16 box",
        "Keyboard",
        "Kitchen Table",
        "Ladder",
        "Ladder (Extending)",
        "Lamp (Standard)",
        "Lamp (Table)",
        "Laundry Basket",
        "Lawnmower",
        "Light Fitting",
        "Linen Basket",
        "Mannequin / Dress Stand",
        "Mattress (Single)",
        "Mattress (Double)",
        "Mattress (Queensize)",
        "Mattress (Kingsize)",
        "Microwave",
        "Mirror",
        "Mirror (Medium)",
        "Mirror (Large)",
        "Mirror (Overmantle)",
        "Mop / Bucket",
        "Motorbike",
        "Nest Tables",
        "Ottoman",
        "Painting",
        "Painting (Medium)",
        "Painting (Large)",
        "Parasol",
        "Parasol (Large)",
        "Pbo (Packed By Owner Box)",
        "Piano (Upright)",
        "Piano (Electric)",
        "Piano (Baby Grand)",
        "Piano (Grand)",
        "Piano Stool",
        "Picture",
        "Plant Pot (Empty)",
        "Plastic Crate",
        "Plastic Drawers",
        "Pool / Snooker Table",
        "Pot Plant (Large)",
        "Pot Plant (Small)",
        "Pram / Pushchair",
        "Printer",
        "Racking",
        "Rocking Chair",
        "Rocking Horse",
        "Roof Box (Car)",
        "Rotary Line",
        "Rug (Large)",
        "Rug (Medium)",
        "Rug (Small)",
        "Safe",
        "Scooter (Child)",
        "Scooter (Moped)",
        "Screen / Room Divider",
        "Sewing Machine",
        "Shelving / Racking",
        "Shoe Rack",
        "Shredder",
        "Side Table (Large)",
        "Side Table (Medium)",
        "Sideboard",
        "Side Table",
        "Sit-on Lawnmower",
        "Ski Gear",
        "Sledge",
        "Slide",
        "Sofa 2 Seat",
        "Sofa 3 Seat",
        "Sofa 4 Seat",
        "Sofa Corner",
        "Speakers",
        "Step Ladder",
        "Stool",
        "Suitcase / Luggage",
        "Sundial",
        "Surfboard",
        "Swing",
        "Table (Large)",
        "Table (Small)",
        "Table Tennis Table",
        "Toddler Table & Chairs",
        "Trampoline",
        "Trouserpress",
        "Tumble Dryer",
        "Trunk",
        "TV",
        "TV Table (Media Unit)",
        "Vacuum Cleaner",
        "Valet Stand / Towel Rail",
        "Wall Unit",
        "Wardrobe (Single)",
        "Wardrobe (2-door)",
        "Wardrobe (3-door)",
        "Wardrobe (4-door)",
        "Wardrobe (sliding door)",
        "Washing Machine",
        "Water Butt",
        "Welsh Dresser",
        "Wheelbarrow",
        "Workbench",
        "Xmas Decs",
        "Xmas Tree"
    ],

    "Upstairs": [
        "Artwork",
        "Baby Bath",
        "Bags / Cases",
        "Basket",
        "Bathroom Cabinet",
        "Bean Bag",
        "Cot / Childs Bed",
        "Bed (Single)",
        "Bed (Double)",
        "Bed (Queensize)",
        "Bed (Kingsize)",
        "Bed (SuperKing)",
        "Bunk Bed",
        "Bed (Cabin Bed)",
        "Bed Box",
        "Bedframe",
        "Bedside Table",
        "Blanket Box",
        "Bookcase (Large)",
        "Bookcase (Medium)",
        "Bookcase (Small)",
        "Bookshelf",
        "Bureau",
        "Cabinet",
        "Cabinet (Large)",
        "Cabinet (Medium)",
        "Cabinet (Small)",
        "Canvas Wardrobe",
        "Changing Table",
        "Chest",
        "Chest Drawers (Large)",
        "Chest Drawers (Medium)",
        "Chest Drawers (Small)",
        "Clock",
        "Clothes Rack (Dryer)",
        "Clothes Rail",
        "Computer",
        "Cot",
        "Cushions (Scatter Cushions)",
        "Desk (Regular)",
        "Desk (Small)",
        "Desk (Large / Rolltop)",
        "Dog Bed",
        "Dolls House",
        "Dresser",
        "Dressing Table",
        "Fan (Table)",
        "Fan (Tall)",
        "Filing Cabinet",
        "Folding Bed",
        "Footstool",
        "Futon",
        "Guitar",
        "Headboard",
        "Heater",
        "Highchair",
        "Ironing Board",
        "Kallax 4 box",
        "Kallax 8 box",
        "Kallax 16 box",
        "Keyboard",
        "Lamp (Standard)",
        "Lamp (Table)",
        "Laundry Basket",
        "Light Fitting",
        "Linen Basket",
        "Mannequin / Dress Stand",
        "Mattress (Single)",
        "Mattress (Double)",
        "Mattress (Queensize)",
        "Mattress (Kingsize)",
        "Mirror",
        "Mirror (Medium)",
        "Mirror (Large)",
        "Mirror (Overmantle)",
        "Ottoman",
        "Painting",
        "Painting (Medium)",
        "Painting (Large)",
        "Piano (Electric)",
        "Piano Stool",
        "Picture",
        "Plastic Crate",
        "Plastic Drawers",
        "Pram / Pushchair",
        "Printer",
        "Rocking Chair",
        "Rocking Horse",
        "Rug (Large)",
        "Rug (Medium)",
        "Rug (Small)",
        "Safe",
        "Screen / Room Divider",
        "Sewing Machine",
        "Shelving / Racking",
        "Shoe Rack",
        "Shredder",
        "Side Table",
        "Speakers",
        "Stool",
        "Suitcase / Luggage",
        "Toddler Table & Chairs",
        "Trouserpress",
        "Trunk",
        "TV",
        "TV Table (Media Unit)",
        "Vacuum Cleaner",
        "Valet Stand / Towel Rail",
        "Wardrobe (Single)",
        "Wardrobe (2-door)",
        "Wardrobe (3-door)",
        "Wardrobe (4-door)",
        "Wardrobe (sliding door)",
        "Xmas Decs",
        "Xmas Tree"
    ],

    "Downstairs": [
        "AC Unit / Humidifier",
        "Armchair",
        "Artwork",
        "Bags / Cases",
        "Barometer",
        "Barrel",
        "Barstool",
        "Basket",
        "Bathroom Cabinet",
        "Bean Bag",
        "Bench",
        "Blanket Box",
        "Bookcase (Large)",
        "Bookcase (Medium)",
        "Bookcase (Small)",
        "Bookshelf",
        "Bureau",
        "Cabinet",
        "Cabinet (Large)",
        "Cabinet (Medium)",
        "Cabinet (Small)",
        "Carver Chair",
        "CD/DVD Rack",
        "Dining Chair",
        "Dining Table",
        "Office Chair",
        "Chaise Longue",
        "Chandelier",
        "Chest",
        "China Cabinet",
        "Clock",
        "Clock (Grandfather)",
        "Clock (Grandmother)",
        "Coat Stand",
        "Coffee Table",
        "Computer",
        "Cushions (Scatter Cushions)",
        "Desk (Regular)",
        "Desk (Small)",
        "Desk (Large / Rolltop)",
        "Dog Bed",
        "Dresser",
        "Drums",
        "Fan (Table)",
        "Fan (Tall)",
        "Filing Cabinet",
        "Fire / Fireplace",
        "Fire Tools",
        "Fish Tank (Glass)",
        "Footstool",
        "Futon",
        "Glass Top",
        "Guitar",
        "Hall Stand",
        "Hall Table",
        "Heater",
        "Kallax 4 box",
        "Kallax 8 box",
        "Kallax 16 box",
        "Keyboard",
        "Lamp (Standard)",
        "Lamp (Table)",
        "Light Fitting",
        "Mannequin / Dress Stand",
        "Mirror",
        "Mirror (Medium)",
        "Mirror (Large)",
        "Mirror (Overmantle)",
        "Nest Tables",
        "Ottoman",
        "Painting",
        "Painting (Medium)",
        "Painting (Large)",
        "Piano (Upright)",
        "Piano (Electric)",
        "Piano (Baby Grand)",
        "Piano (Grand)",
        "Piano Stool",
        "Picture",
        "Plastic Crate",
        "Pool / Snooker Table",
        "Printer",
        "Racking",
        "Rocking Chair",
        "Rug (Large)",
        "Rug (Medium)",
        "Rug (Small)",
        "Safe",
        "Screen / Room Divider",
        "Sewing Machine",
        "Shelving / Racking",
        "Shoe Rack",
        "Shredder",
        "Side Table (Large)",
        "Side Table (Medium)",
        "Sideboard",
        "Side Table",
        "Sofa 2 Seat",
        "Sofa 3 Seat",
        "Sofa 4 Seat",
        "Sofa Corner",
        "Speakers",
        "Stool",
        "Suitcase / Luggage",
        "Table (Large)",
        "Table (Small)",
        "Table Tennis Table",
        "Toddler Table & Chairs",
        "Trunk",
        "TV",
        "TV Table (Media Unit)",
        "Vacuum Cleaner",
        "Valet Stand / Towel Rail",
        "Wall Unit",
        "Welsh Dresser",
        "Xmas Decs",
        "Xmas Tree"
    ],

    "Kitchen": [
        "AC Unit / Humidifier",
        "Barstool",
        "Basket",
        "Bin",
        "Butchers Block",
        "Cabinet",
        "Cabinet (Large)",
        "Cabinet (Medium)",
        "Cabinet (Small)",
        "Dining Chair",
        "Dining Table",
        "Chandelier",
        "Clock",
        "Clothes Rack (Dryer)",
        "Coffee Machine",
        "Cooker",
        "Crate (Plastic)",
        "Dishwasher",
        "Dryer",
        "Dustbin",
        "Fridge (American)",
        "Fridge / Freezer (Regular)",
        "Fridge / Freezer (Small)",
        "Heater",
        "Highchair",
        "Ironing Board",
        "Kitchen Table",
        "Lamp (Table)",
        "Light Fitting",
        "Microwave",
        "Mop / Bucket",
        "Plastic Crate",
        "Plastic Drawers",
        "Rug (Small)",
        "Shredder",
        "Stool",
        "Table (Small)",
        "Toddler Table & Chairs",
        "Tumble Dryer",
        "Vacuum Cleaner",
        "Washing Machine"
    ],

    "Outside": [
        "Baby Bath",
        "Barrel",
        "Basket",
        "Basketball Hoop",
        "BBQ",
        "BBQ (Weber Type)",
        "Bench",
        "Bike",
        "Bike (Child)",
        "Bin",
        "Bird Bath",
        "Bird Table",
        "Canoe / Kayak",
        "Cat Tree",
        "Chiminea",
        "Climbing Frame",
        "Deck Chair",
        "Dog Bed",
        "Dustbin",
        "Fire Pit",
        "Fish Tank (Glass)",
        "Garden Bench",
        "Garden Chair (Small)",
        "Garden Chair",
        "Garden Lounger",
        "Garden Table (Large)",
        "Garden Table (Small)",
        "Gardening Tools (Spade Type)",
        "Golf Clubs",
        "Golf Trolley",
        "Gym (Cross Trainer)",
        "Gym (Peloton Type)",
        "Gym (Rowing Machine)",
        "Gym (Treadmill)",
        "Hammock",
        "Hose & Reel",
        "Incinerator",
        "Ladder",
        "Ladder (Extending)",
        "Lawnmower",
        "Motorbike",
        "Parasol",
        "Parasol (Large)",
        "Plant Pot (Empty)",
        "Pot Plant (Large)",
        "Pot Plant (Small)",
        "Roof Box (Car)",
        "Rotary Line",
        "Scooter (Child)",
        "Scooter (Moped)",
        "Sit-on Lawnmower",
        "Ski Gear",
        "Sledge",
        "Slide",
        "Step Ladder",
        "Sundial",
        "Surfboard",
        "Swing",
        "Trampoline",
        "Water Butt",
        "Wheelbarrow",
        "Workbench",
        "Xmas Decs",
        "Xmas Tree"
    ]
};


// -----------------------------------------------------------------------------
// Default survey data shapes
// -----------------------------------------------------------------------------
function createEmptySequenceSchedule() {
    return {
        moveDate: "",
        loftVol: 0,
        loadRate: 125,
        unloadRate: 132,
        loadingVariant: "Standard",
        operatingBranch: "London",
        exportWrapVol: 0,
        manualDays: [],
        special: {
            frameBeds: 0,
            ottomanBeds: 0,
            divanBeds: 0,
            electricBeds: 0,
            bunkBeds: 0,
            cots: 0,
            diningTables: 0,
            wardrobes: 0,
            wardrobeItems: [],
            uprightPianos: 0,
            grandPianos: 0,
            grandfatherClocks: 0,
            appliances: 0,
            cratingItems: 0,
            customItemMinutes: 0,
            customItemNote: ""
        }
    };
}
function createEmptySequenceQuote() {
    return {
        customerPrice: 0,
        quoteNotes: "",
        pricingSaved: false,
        pricingLines: [],
        additionalCostLines: []
    };
}
function createEmptyJob(overrides = {}) {
    const now = new Date().toISOString();
    const defaultProperties = createDefaultProperties();
    const collection = defaultProperties[0] || {};

    return {
        id: Date.now(),
        ref: "",

        customer: {
            displayName: "",
            firstName: collection.firstName || "",
            surname: collection.surname || "",
            salutation: collection.salutation || "",
            homePhone: collection.homePhone || "",
            mobilePhone: collection.mobilePhone || "",
            email: collection.email || ""
        },

        survey: {
            status: "pending",
            isNew: true,
            isManual: false,
            createdAt: now,
            updatedAt: now,
            notes: ""
        },

        addresses: defaultProperties,
        sequences: [],

        inventory: {
            activeSequenceId: null,
            activeDeliveryId: null,
            activeFloor: "Ground",
            activeRoomName: "Hallway",
            customRooms: [],
            customFloors: [],
            activeCategory: "Full List",
            items: [],
            exclusions: [],
            voiceNotes: [],
            totals: {
                currentItemVolume: 0,
                totalVolume: 0
            }
        },

        planner: {
            moveDate: "",
            crewSize: "",
            vehicleType: "",
            estimatedHours: 0
        },

        costing: {
            crewCost: 0,
            vehicleCost: 0,
            otherCosts: 0,
            totalCost: 0
        },

        signature: {
            image: "",
            signedAt: ""
        },

        sync: {
            uploaded: false,
            lastUploadedAt: "",
            cloudId: "",
            crmId: ""
        },

        // current app compatibility
        name: "",
        status: "pending",
        isNew: true,
        isManual: false,
        notes: "",
        properties: defaultProperties,
        tel: "",
        email: "",

        ...overrides
    };
}
   

// -----------------------------------------------------------------------------
// Runtime state and local storage
// -----------------------------------------------------------------------------
const PHOTON_JOBS_STORAGE_KEY = "photon_jobs";

const storageHealth = {
    jobsReadFailed: false,
    jobsSaveFailed: false,
    lastError: ""
};

function rememberStorageError(context, error) {
    const message = error && error.message ? error.message : String(error || "Unknown storage error");
    storageHealth.lastError = context + ": " + message;

    if (typeof window !== "undefined" && window.console && typeof console.warn === "function") {
        console.warn("[MovePilot storage]", storageHealth.lastError);
    }
}

function readJsonFromLocalStorage(key, fallbackValue) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallbackValue;
        return JSON.parse(raw);
    } catch (error) {
        rememberStorageError("Could not read " + key, error);
        return fallbackValue;
    }
}

function writeJsonToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        rememberStorageError("Could not save " + key, error);
        return false;
    }
}

function createStarterJobs() {
    return [
    createEmptyJob({
        id: 101,
        ref: "#UK-22901",
        name: "SMITH, JONATHAN",
        status: "active",
        isNew: true,
        notes: "Client has large piano in basement. Handle with care.",
        tel: "07700 900456",
        email: "j.smith@example.com",
        customer: {
            displayName: "SMITH, JONATHAN",
            firstName: "Jonathan",
            surname: "Smith",
            salutation: "",
            homePhone: "",
            mobilePhone: "07700 900456",
            email: "j.smith@example.com"
        },
        survey: {
            status: "active",
            isNew: true,
            isManual: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: "Client has large piano in basement. Handle with care."
        }
    })
    ];
}

function loadJobsFromDevice() {
    const savedJobs = readJsonFromLocalStorage(PHOTON_JOBS_STORAGE_KEY, null);

    if (Array.isArray(savedJobs)) {
        return savedJobs;
    }

    if (savedJobs !== null) {
        storageHealth.jobsReadFailed = true;
        rememberStorageError(PHOTON_JOBS_STORAGE_KEY, "Saved jobs data was not a valid list.");
    }

    return createStarterJobs();
}

let jobs = loadJobsFromDevice();
        
let currentJob = null;
let activePropId = null;
let activeSeqId = null;
let inventoryItems = [];
let currentItemVolume = 0;
let totalVolume = 0;
let currentInventoryCategory = "Full List";
let inventorySearchText = "";
let lastAddedItemName = null;
let lastAddedRawEntryId = null;
let inventoryHistory = [];
let qtyResetTimer = null;
let selectedCrateUnit = "IN";
let selectedDamageOptions = [];
let selectedBedOption = "";
let selectedWardrobeOptions = [];
let listedCrateEditEntryKey = "";
let listedSequenceFilter = "__all__";
let listedDeliveryFilter = "__all__";
let listedTextFilter = "";
let simpleInputMode = "";
let simpleInputMeta = null;
let listedFlagsEntryKey = "";
let listedFlagsState = {
    dismantle: false,
    expWrap: false,
    crated: false,
    disconnect: false,
    handyman: false,
    excluded: false
};
let signaturePad = null;
let scheduleNumberEditMeta = null;
let plannerNotesExpanded = false;
let signaturePadCtx = null;
let signatureDrawing = false;

let surveyorSignaturePad = null;
let surveyorSignaturePadCtx = null;
let surveyorSignatureDrawing = false;
let surveyorSignatureLastX = 0;
let surveyorSignatureLastY = 0;
let signatureLastX = 0;
let signatureLastY = 0;
let signatureLocked = false;
let inventoryReturnContext = null;
let mileageTargetSequenceId = "";
let currentMileageRouteData = null;
function resetLiveInventorySessionState() {
    inventoryItems = [];
    currentItemVolume = 0;
    totalVolume = 0;
    currentInventoryCategory = "Full List";
    inventorySearchText = "";
    lastAddedItemName = null;
    lastAddedRawEntryId = null;
    inventoryHistory = [];
    inventoryReturnContext = null;

    listedSequenceFilter = "__all__";
    listedDeliveryFilter = "__all__";
    listedTextFilter = "";

    if (window.__listedEntryMap) {
        window.__listedEntryMap = {};
    }

    updateInventoryDisplay("No items added");
}

function getDefaultSequenceId() {
    if (!currentJob || !Array.isArray(currentJob.sequences) || currentJob.sequences.length === 0) {
        return null;
    }

    return currentJob.sequences[0].id;
}
function setActiveSequenceToDefault() {
    const defaultSeqId = getDefaultSequenceId();
    if (!defaultSeqId) return null;

    activeSeqId = defaultSeqId;
    return activeSeqId;
}
function saveInventoryContext() {
    if (!currentJob) return;
    if (!currentJob.inventory) currentJob.inventory = {};

    currentJob.inventory.activeSequenceId = activeSeqId || null;

    inventoryReturnContext = {
        sequenceId: currentJob.inventory.activeSequenceId || null,
        deliveryId: currentJob.inventory.activeDeliveryId || null,
        floorName: currentJob.inventory.activeFloor || "Ground",
        roomName: currentJob.inventory.activeRoomName || "Hallway"
    };
}

function getActiveInventoryContext() {
    const inventory = currentJob && currentJob.inventory ? currentJob.inventory : {};

    return {
        sequenceId: activeSeqId || null,
        deliveryId: inventory.activeDeliveryId || "",
        roomName: inventory.activeRoomName || "Hallway",
        floorName: inventory.activeFloor || "Ground"
    };
}
        

// -----------------------------------------------------------------------------
// Persistence helpers
// -----------------------------------------------------------------------------
function saveToDevice() {
    storageHealth.jobsSaveFailed = !writeJsonToLocalStorage(PHOTON_JOBS_STORAGE_KEY, jobs);
    return !storageHealth.jobsSaveFailed;
}

function ensureScheduleDataShape() {
    jobs.forEach(function(job) {
        if (!Array.isArray(job.sequences)) return;

        job.sequences.forEach(function(seq) {
            ensureSequenceScheduleShape(seq);
        });
    });
}

function getLockButtonContent(isLocked) {
    const iconColor = isLocked ? "#dc2626" : "#22c55e";
    const label = isLocked ? "Unlock" : "Lock";

    const shacklePath = isLocked
        ? `<path d="M8.5 11V8.8a3.5 3.5 0 0 1 6 0" fill="none" stroke="${iconColor}" stroke-width="1.8" stroke-linecap="round"/>`
        : `<path d="M8.5 11V8.8a3.5 3.5 0 1 1 7 0V11" fill="none" stroke="${iconColor}" stroke-width="1.8" stroke-linecap="round"/>`;

    return `
        <svg viewBox="0 0 24 24" class="lock-btn-icon" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="none" stroke="${iconColor}" stroke-width="1.8"/>
            ${shacklePath}
            <rect x="7" y="10.5" width="10" height="8" rx="2" fill="${iconColor}"/>
            <circle cx="12" cy="14" r="1.1" fill="#ffffff"/>
            <path d="M12 15.2v1.4" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        <span class="lock-btn-text">${label}</span>
    `;
}
function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

function createDefaultProperties() {
    const now = Date.now();

    return [
        {
            id: now,
            label: "Collection Address",
            line1: "10 Downing Street",
            country: "United Kingdom",
            salutation: "",
            clientName: "",
            firstName: "",
            surname: "",
            homePhone: "",
            mobilePhone: "",
            email: "",
            isCore: true,
            isSaved: false
        },
        {
            id: now + 1,
            label: "Delivery Address",
            line1: "42 Wallaby Way",
            country: "United Kingdom",
            contactName: "",
            contactPhone: "",
            isCore: true,
            isSaved: false
        },
        {
            id: now + 2,
            label: "Store",
            line1: "The Vaults, Unit B",
            country: "United Kingdom",
            contactName: "",
            contactPhone: "",
            isCore: true,
            isSaved: false
        }
    ];
}

function toggleSaveState(type) {
    if (type === 'address') {
        const prop = currentJob.properties.find(p => p.id === activePropId);
        prop.isSaved = !prop.isSaved;
        renderAddressUI();
    } else {
        const seq = currentJob.sequences.find(s => s.id == activeSeqId);
        seq.isSaved = !seq.isSaved;
        renderSequenceUI();
    }

    saveToDevice();
}

        

// -----------------------------------------------------------------------------
// Survey editor navigation
// -----------------------------------------------------------------------------
function openJob(id) {
    resetLiveInventorySessionState();

    currentJob = jobs.find(j => j.id === id);
    if (!currentJob) return;

    currentJob.properties = Array.isArray(currentJob.properties)
        ? currentJob.properties
        : (Array.isArray(currentJob.addresses) ? currentJob.addresses : createDefaultProperties());

    currentJob.addresses = currentJob.properties;

    if (!currentJob.customer) {
        currentJob.customer = {
            displayName: currentJob.name || "",
            firstName: "",
            surname: "",
            salutation: "",
            homePhone: "",
            mobilePhone: currentJob.tel || "",
            email: currentJob.email || ""
        };
    }

    if (!currentJob.survey) {
        currentJob.survey = {
            status: currentJob.status || "pending",
            isNew: !!currentJob.isNew,
            isManual: !!currentJob.isManual,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: currentJob.notes || ""
        };
    }

    if (!Array.isArray(currentJob.sequences)) {
        currentJob.sequences = [];
    }

    if (!currentJob.inventory) {
        currentJob.inventory = {
            activeSequenceId: null,
            activeDeliveryId: null,
            activeFloor: "Ground",
            activeRoomName: "Hallway",
            customRooms: [],
            customFloors: [],
            activeCategory: "Full List",
            items: [],
            exclusions: [],
            voiceNotes: [],
            totals: {
                currentItemVolume: 0,
                totalVolume: 0
            }
        };
    }

    currentJob.isNew = false;

    document.getElementById('hdr-name').innerText =
    currentJob.customer?.displayName || currentJob.name || "---";

document.getElementById('hdr-ref').innerText =
    currentJob.ref || "---";

    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-editor').classList.remove('hidden');

    activePropId = currentJob.properties[0].id;

if (!currentJob.sequences || currentJob.sequences.length === 0) {
    const id = Date.now();
    currentJob.sequences.push({
        id: id,
        moveType: "",
        packOption: "",
        vol: 0,
        isSaved: false,
        collections: [currentJob.properties[0].id],
        deliveries: [currentJob.properties[1] ? currentJob.properties[1].id : currentJob.properties[0].id],
        schedule: createEmptySequenceSchedule(),
        quote: createEmptySequenceQuote()
    });
    activeSeqId = id;
} else {
    setActiveSequenceToDefault();
}
if (!currentJob.inventory) currentJob.inventory = {};
currentJob.inventory.activeDeliveryId = null;

  if (!currentJob.inventory) currentJob.inventory = {};
if (!Array.isArray(currentJob.inventory.items)) currentJob.inventory.items = [];

currentItemVolume = 0;
totalVolume = 0;
currentInventoryCategory = "Full List";
inventorySearchText = "";
inventoryReturnContext = null;
lastAddedItemName = null;
lastAddedRawEntryId = null;
inventoryItems = [];
inventoryHistory = [];
            
ensureCostingStore();
currentJob.costingQuote.selectedSequenceId = String(activeSeqId || getDefaultSequenceId() || "");

renderAddressUI();
renderInventorySequenceDropdown();
renderInventoryDeliveryDropdown();
renderInventoryRoomDropdown();
renderInventoryFloorDropdown();
renderInventoryButtons();
updateInventoryHeaderReorderVisibility("");
renderScheduleSequenceDropdown();
loadManualScheduleFromActiveSequence();
rebuildLiveInventoryFromSequence(activeSeqId);
saveCalculatorFeedForActiveSequence();

/*
    Always open a customer on the Addresses tab.
    This prevents stale Listed Inventory / Inventory screens from showing
    the previous customer's data when moving between jobs from the dashboard.
*/
switchTab("address");

saveToDevice();
}

function ensurePropertyPhotoShape(prop) {
    if (!prop) return;

    if (!prop.photos || typeof prop.photos !== "object") {
        prop.photos = {};
    }

    if (!Array.isArray(prop.photos.access)) {
        prop.photos.access = [];
    }
}

function renderAddressAccessPhotosPanel(prop, isSaved) {
    ensurePropertyPhotoShape(prop);

    const photos = prop.photos.access || [];
    const maxPhotos = 4;
    const isAtLimit = photos.length >= maxPhotos;

    return `
        <div class="col-12">
            <div class="address-photo-card">
                <div class="address-photo-head">
                    <div>
                        <div class="address-photo-title">Access Photos</div>
                        <div class="address-photo-subtitle">Photos linked to this address only · ${photos.length}/${maxPhotos}</div>
                    </div>

                    <button
                        type="button"
                        class="address-photo-add-btn"
                        ${(isSaved || isAtLimit) ? "disabled" : ""}
                        onclick="document.getElementById('address-photo-input-${prop.id}').click()"
                    >
                        Add Access Photo
                    </button>

                    <input
                        id="address-photo-input-${prop.id}"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style="display:none"
                        onchange="handleAddressPhotoSelected(event, ${prop.id})"
                    >
                </div>

                ${
                    photos.length
                        ? `<div class="address-photo-grid">
                            ${photos.map(function(photoRef, index) {
    return `
        <div class="address-photo-thumb">
            <button
                type="button"
                class="address-photo-thumb-view"
                onclick="openPhotoViewModal('${photoRef.id}', 'Access Photo ${index + 1}')"
            >
                ${
                    photoRef.thumbDataUrl
                        ? `<img src="${photoRef.thumbDataUrl}" alt="Access photo ${index + 1}" class="address-photo-thumb-img">`
                        : `Photo ${index + 1}`
                }
            </button>

            ${
                isSaved
                    ? ""
                    : `<button
                        type="button"
                        class="address-photo-delete-btn"
                        title="Delete photo"
                        aria-label="Delete photo"
                        onclick="deleteAddressAccessPhoto(${prop.id}, '${photoRef.id}')"
                    >×</button>`
            }
        </div>
    `;
}).join("")}
                        </div>`
                        : `<div class="address-photo-empty">No access photos added</div>`
                }
            </div>
        </div>
    `;
}

function openAddressPhotoPicker(propId) {
    const input = document.getElementById("address-photo-input-" + propId);
    if (input) input.click();
}


// -----------------------------------------------------------------------------
// Photo storage
// -----------------------------------------------------------------------------
const PHOTO_DB_NAME = "MovePilotPhotoStore";
const PHOTO_DB_VERSION = 1;
const PHOTO_STORE_NAME = "photos";

function openPhotoDatabase() {
    return new Promise(function(resolve, reject) {
        const request = indexedDB.open(PHOTO_DB_NAME, PHOTO_DB_VERSION);

        request.onupgradeneeded = function(event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(PHOTO_STORE_NAME)) {
                db.createObjectStore(PHOTO_STORE_NAME, { keyPath: "id" });
            }
        };

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function() {
            reject(request.error);
        };
    });
}

function savePhotoBlobToIndexedDb(photoRecord) {
    return openPhotoDatabase().then(function(db) {
        return new Promise(function(resolve, reject) {
            const tx = db.transaction(PHOTO_STORE_NAME, "readwrite");
            const store = tx.objectStore(PHOTO_STORE_NAME);

            store.put(photoRecord);

            tx.oncomplete = function() {
                db.close();
                resolve(photoRecord.id);
            };

            tx.onerror = function() {
                db.close();
                reject(tx.error);
            };
        });
    });
}
function getPhotoBlobFromIndexedDb(photoId) {
    return openPhotoDatabase().then(function(db) {
        return new Promise(function(resolve, reject) {
            const tx = db.transaction(PHOTO_STORE_NAME, "readonly");
            const store = tx.objectStore(PHOTO_STORE_NAME);
            const request = store.get(photoId);

            request.onsuccess = function() {
                db.close();
                resolve(request.result || null);
            };

            request.onerror = function() {
                db.close();
                reject(request.error);
            };
        });
    });
}

function deletePhotoBlobFromIndexedDb(photoId) {
    return openPhotoDatabase().then(function(db) {
        return new Promise(function(resolve, reject) {
            const tx = db.transaction(PHOTO_STORE_NAME, "readwrite");
            const store = tx.objectStore(PHOTO_STORE_NAME);

            store.delete(photoId);

            tx.oncomplete = function() {
                db.close();
                resolve();
            };

            tx.onerror = function() {
                db.close();
                reject(tx.error);
            };
        });
    });
}

function createImageFromFile(file) {
    return new Promise(function(resolve, reject) {
        const reader = new FileReader();

        reader.onload = function(event) {
            const img = new Image();

            img.onload = function() {
                resolve(img);
            };

            img.onerror = reject;
            img.src = event.target.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function canvasToBlob(canvas, quality) {
    return new Promise(function(resolve) {
        canvas.toBlob(
            function(blob) {
                resolve(blob);
            },
            "image/jpeg",
            quality
        );
    });
}

async function compressImageFile(file, maxSize, quality) {
    const img = await createImageFromFile(file);

    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, quality);

    return {
        blob: blob,
        dataUrl: canvas.toDataURL("image/jpeg", quality),
        width: width,
        height: height
    };
}

function findPropertyById(propId) {
    if (!currentJob || !Array.isArray(currentJob.properties)) return null;

    return currentJob.properties.find(function(prop) {
        return String(prop.id) === String(propId);
    }) || null;
}

async function handleAddressPhotoSelected(event, propId) {
    const input = event.target;
    const file = input && input.files && input.files[0] ? input.files[0] : null;

    if (!file) return;

    const prop = findPropertyById(propId);
    if (!prop) return;

    ensurePropertyPhotoShape(prop);

    if (prop.photos.access.length >= 4) {
    await appAlert("Maximum 4 access photos per address.", "Photo Limit");
    input.value = "";
    return;
}

    try {
        const fullImage = await compressImageFile(file, 1600, 0.78);
        const thumbImage = await compressImageFile(file, 320, 0.72);

        const photoId = "photo_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);

        await savePhotoBlobToIndexedDb({
            id: photoId,
            blob: fullImage.blob,
            createdAt: new Date().toISOString(),
            scopeType: "address",
            scopeId: String(propId),
            category: "access",
            originalName: file.name || "",
            mimeType: "image/jpeg",
            width: fullImage.width,
            height: fullImage.height
        });

        prop.photos.access.push({
            id: photoId,
            category: "access",
            thumbDataUrl: thumbImage.dataUrl,
            createdAt: new Date().toISOString()
        });

        saveToDevice();
        renderAddressUI();
    } catch (err) {
    await appAlert("Photo could not be saved. Please try again.", "Photo Error");
}

    input.value = "";
}
let activePhotoObjectUrl = "";

async function openPhotoViewModal(photoId, title) {
    const overlay = document.getElementById("photo-view-overlay");
    const img = document.getElementById("photo-view-img");
    const titleEl = document.getElementById("photo-view-title");

    if (!overlay || !img) return;

    try {
        const photoRecord = await getPhotoBlobFromIndexedDb(photoId);

        if (!photoRecord || !photoRecord.blob) {
    await appAlert("Photo could not be loaded on this device.", "Photo Missing");
    return;
}

        if (activePhotoObjectUrl) {
            URL.revokeObjectURL(activePhotoObjectUrl);
            activePhotoObjectUrl = "";
        }

        activePhotoObjectUrl = URL.createObjectURL(photoRecord.blob);

        img.src = activePhotoObjectUrl;

        if (titleEl) {
            titleEl.innerText = title || "Photo";
        }

        overlay.style.display = "flex";
    } catch (err) {
    await appAlert("Photo could not be opened.", "Photo Error");
}
}

function closePhotoViewModal() {
    const overlay = document.getElementById("photo-view-overlay");
    const img = document.getElementById("photo-view-img");

    if (overlay) overlay.style.display = "none";

    if (img) {
        img.removeAttribute("src");
    }

    if (activePhotoObjectUrl) {
        URL.revokeObjectURL(activePhotoObjectUrl);
        activePhotoObjectUrl = "";
    }
}

async function deleteAddressAccessPhoto(propId, photoId) {
    const prop = findPropertyById(propId);
    if (!prop) return;

    ensurePropertyPhotoShape(prop);

    const confirmed = await appConfirm("Delete this access photo?", "Delete Photo");
if (!confirmed) return;

    prop.photos.access = prop.photos.access.filter(function(photoRef) {
        return String(photoRef.id) !== String(photoId);
    });

    try {
        await deletePhotoBlobFromIndexedDb(photoId);
    } catch (err) {
        // If the blob delete fails, still remove the reference from the job.
    }

    saveToDevice();
    renderAddressUI();
}
        

// -----------------------------------------------------------------------------
// Address tab
// -----------------------------------------------------------------------------
function renderAddressUI() {
         const prop = currentJob.properties.find(p => p.id === activePropId);
const isSaved = prop.isSaved;
const status = isSaved ? 'disabled' : '';
const isCollectionAddress = prop.id === currentJob.properties[0].id;
            const wrapper = document.getElementById('content-address');
            isSaved ? wrapper.classList.add('is-saved') : wrapper.classList.remove('is-saved');

            const saveBtn = document.getElementById('btn-save-address');
saveBtn.innerHTML = getLockButtonContent(isSaved);
saveBtn.className = `action-btn lock-btn ${isSaved ? 'btn-change' : 'btn-save'}`;
saveBtn.setAttribute('aria-label', isSaved ? 'Unlock address' : 'Lock address');
            document.getElementById('prop-selector').innerHTML = currentJob.properties.map(p => `<option value="${p.id}" ${p.id === activePropId ? 'selected' : ''}>${toTitleCase(p.label)}</option>`).join('');
            
           document.getElementById('address-editor-ui').innerHTML = `
    <div class="address-property-row">
    <div class="address-property-field">
        <label class="mini-label">Property Label</label>
        <input
            type="text"
            ${status}
            oninput="updatePropLabel(this.value)"
            class="input-field property-label-input"
            value="${toTitleCase(prop.label)}"
        >
    </div>
    ${(!prop.isCore && !isSaved) ? `<button onclick="deleteProperty(${prop.id})" class="address-property-delete">Delete Address</button>` : ''}
</div>

    ${isCollectionAddress ? `
    <div class="bg-white border border-slate-200 rounded-xl p-4">
        <div class="grid grid-cols-12 gap-3">
  <div class="col-span-2">
    <label class="mini-label">Salutation</label>
    <select ${status} onchange="updatePropData('salutation', this.value)" class="input-field">
        <option value="">-Select-</option>
        ${SALUTATIONS.map(s => `<option value="${s}" ${prop.salutation===s?'selected':''}>${s}</option>`).join('')}
    </select>
</div>
<div class="col-span-5">
    <label class="mini-label">First Name</label>
    <input type="text" ${status} oninput="updatePropData('firstName', this.value)" class="input-field" value="${prop.firstName || ''}">
</div>
<div class="col-span-5">
    <label class="mini-label">Surname</label>
    <input type="text" ${status} oninput="updatePropData('surname', this.value)" class="input-field" value="${prop.surname || ''}">
</div>
<div class="col-span-4">
    <label class="mini-label">Home Phone</label>
    <input type="text" ${status} oninput="updatePropData('homePhone', this.value)" class="input-field" value="${prop.homePhone || ''}">
</div>
<div class="col-span-4">
    <label class="mini-label">Mobile Phone</label>
    <input type="text" ${status} oninput="updatePropData('mobilePhone', this.value)" class="input-field" value="${prop.mobilePhone || ''}">
</div>
<div class="col-span-4">
    <label class="mini-label">Email</label>
    <input type="email" ${status} oninput="updatePropData('email', this.value)" class="input-field" value="${prop.email || ''}">
</div>
        </div>
    </div>
    ` : ''}

    <div class="prop-grid">
                    <div class="col-7"><label class="mini-label">1st line</label><input type="text" ${status} oninput="updatePropData('line1', this.value)" class="input-field" value="${prop.line1 || ''}"></div>
                    <div class="col-5"><label class="mini-label">Road</label><input type="text" ${status} oninput="updatePropData('road', this.value)" class="input-field" value="${prop.road || ''}"></div>
                    <div class="col-3"><label class="mini-label">Town</label><input type="text" ${status} oninput="updatePropData('city', this.value)" class="input-field" value="${prop.city || ''}"></div>
                    <div class="col-3"><label class="mini-label">County</label><input type="text" ${status} oninput="updatePropData('county', this.value)" class="input-field" value="${prop.county || ''}"></div>
                    <div class="col-3"><label class="mini-label">Postcode</label><input type="text" ${status} oninput="updatePropData('postcode', this.value)" class="input-field uppercase" value="${prop.postcode || ''}"></div>
                    <div class="col-3"><label class="mini-label">Country</label><input type="text" ${status} oninput="updatePropData('country', this.value)" class="input-field" value="${prop.country || 'United Kingdom'}"></div>
                    <div class="col-6"><label class="mini-label">Type</label><select ${status} onchange="updatePropData('type', this.value)" class="input-field"><option value="">-Select-</option>${PROPERTY_TYPES.map(t => `<option ${prop.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
                    <div class="col-6"><label class="mini-label">Vehicle Access</label><select ${status} onchange="updatePropData('access', this.value)" class="input-field"><option value="">-Select-</option>${VEHICLE_TYPES.map(v => `<option ${prop.access===v?'selected':''}>${v}</option>`).join('')}</select></div>
                    <div class="col-3"><label class="mini-label">Floor</label><input type="text" ${status} oninput="updatePropData('floor', this.value)" class="input-field" value="${prop.floor || ''}"></div>
                    <div class="col-3"><label class="mini-label">Stairs</label><input type="text" ${status} oninput="updatePropData('stairs', this.value)" class="input-field" value="${prop.stairs || ''}"></div>
                    <div class="col-3"><label class="mini-label">Lift</label><input type="text" ${status} oninput="updatePropData('lift', this.value)" class="input-field" value="${prop.lift || ''}"></div>
                    <div class="col-3"><label class="mini-label">Dist (m)</label><input type="number" ${status} oninput="updatePropData('distance', this.value)" class="input-field" value="${prop.distance || ''}"></div>
                    <div class="col-12"><label class="mini-label">Parking & Instructions</label><textarea ${status} oninput="updatePropData('parking', this.value)" class="input-field h-20">${prop.parking || ''}</textarea></div>
                ${renderAddressAccessPhotosPanel(prop, isSaved)}
                ${!isCollectionAddress ? `
    <div class="col-6">
        <label class="mini-label">Contact Name</label>
        <input type="text" ${status} oninput="updatePropData('contactName', this.value)" class="input-field" value="${prop.contactName || ''}">
    </div>
    <div class="col-6">
        <label class="mini-label">Contact Phone No.</label>
        <input type="text" ${status} oninput="updatePropData('contactPhone', this.value)" class="input-field" value="${prop.contactPhone || ''}">
    </div>
` : ''}
                </div>`;
            triggerPulse('address-editor-ui');
        }


// -----------------------------------------------------------------------------
// Inventory tab
// -----------------------------------------------------------------------------

// Inventory sequence and delivery controls
function renderInventorySequenceDropdown() {
    const dropdown = document.getElementById('inv-seq-select');
    if (!dropdown || !currentJob) return;

    const selectedSeqId = activeSeqId || getDefaultSequenceId();

    dropdown.innerHTML = currentJob.sequences.map((s, idx) => {
        const moveLabel = s.moveType || 'New Sequence';
        const packLabel = s.packOption || 'No Packing Set';
        const label = `Seq #${idx + 1}: ${moveLabel} / ${packLabel}`;

        return `<option value="${s.id}" ${s.id == selectedSeqId ? 'selected' : ''}>${label}</option>`;
    }).join('');
}

function getActiveInventorySequence() {
    if (!currentJob || !Array.isArray(currentJob.sequences)) return null;

    return currentJob.sequences.find(function(seq) {
        return String(seq.id) === String(activeSeqId);
    }) || null;
}

function getInventoryDeliveryOptions() {
    const seq = getActiveInventorySequence();
    if (!seq || !Array.isArray(seq.deliveries)) return [];

    return seq.deliveries.map(function(deliveryId) {
        const prop = currentJob.properties.find(function(p) {
            return String(p.id) === String(deliveryId);
        });

        return {
            id: deliveryId,
            label: prop ? getPropertyDisplayText(prop.id) : 'Unknown Address'
        };
    });
}

function renderInventoryDeliveryDropdown() {
    const dropdown = document.getElementById('inv-delivery-select');
    if (!dropdown || !currentJob) return;

    if (!currentJob.inventory) currentJob.inventory = {};

    const deliveryOptions = getInventoryDeliveryOptions();

    if (deliveryOptions.length === 0) {
        dropdown.innerHTML = `<option value="">No Delivery</option>`;
        currentJob.inventory.activeDeliveryId = null;
        return;
    }

    let selectedDeliveryId = currentJob.inventory.activeDeliveryId;

    const selectedStillExists = deliveryOptions.some(function(option) {
        return String(option.id) === String(selectedDeliveryId);
    });

    if (!selectedDeliveryId || !selectedStillExists) {
        selectedDeliveryId = deliveryOptions[0].id;
        currentJob.inventory.activeDeliveryId = selectedDeliveryId;
    }

    dropdown.innerHTML = deliveryOptions.map(function(option, idx) {
        const selected = String(option.id) === String(selectedDeliveryId) ? 'selected' : '';
        const label = (idx + 1) + '. ' + option.label;
        return '<option value="' + option.id + '" ' + selected + '>' + label + '</option>';
    }).join('');
}

function handleInventoryDeliveryChange(value) {
    if (!currentJob) return;
    if (!currentJob.inventory) currentJob.inventory = {};

    currentJob.inventory.activeSequenceId = activeSeqId || null;
    currentJob.inventory.activeDeliveryId = value;

    saveInventoryContext();
    saveToDevice();
}

// Raw inventory store
function ensureInventoryStore() {
    if (!currentJob.inventory) currentJob.inventory = {};

    if (!Array.isArray(currentJob.inventory.items)) {
        currentJob.inventory.items = [];
    }
}

function createRawInventoryEntryDefaults() {
    return {
        id: "raw_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        sequenceId: "",
        deliveryId: "",
        roomName: "",
        floorName: "",
        itemName: "",
        qty: 1,
        unitVolume: 0,
        totalVolume: 0,
        kind: "item",
        dismantle: false,
        expWrap: false,
        disconnect: false,
        handyman: false,
        excluded: false,
        note: "",
        crated: false,
        crateDims: null,
        damage: "",
        bedType: "",
        wardrobeTypes: [],
        pianoDetails: null,
        safeDetails: null
    };
}

function copyRawInventoryArray(value) {
    return Array.isArray(value) ? value.slice() : [];
}

function copyRawInventoryObject(value) {
    if (!value || typeof value !== "object") return null;

    try {
        return JSON.parse(JSON.stringify(value));
    } catch (err) {
        return null;
    }
}

function buildRawInventoryEntry(entryData) {
    entryData = entryData || {};

    const rawEntry = createRawInventoryEntryDefaults();

    rawEntry.sequenceId = entryData.sequenceId || "";
    rawEntry.deliveryId = entryData.deliveryId || "";
    rawEntry.roomName = entryData.roomName || "";
    rawEntry.floorName = entryData.floorName || "";
    rawEntry.itemName = entryData.itemName || "";
    rawEntry.qty = entryData.qty || 1;
    rawEntry.unitVolume = entryData.unitVolume || 0;
    rawEntry.totalVolume = entryData.totalVolume || 0;
    rawEntry.kind = entryData.kind || "item";
    rawEntry.dismantle = !!entryData.dismantle;
    rawEntry.expWrap = !!entryData.expWrap;
    rawEntry.disconnect = !!entryData.disconnect;
    rawEntry.handyman = !!entryData.handyman;
    rawEntry.excluded = !!entryData.excluded;
    rawEntry.note = entryData.note || "";
    rawEntry.crated = !!entryData.crated;
    rawEntry.crateDims = copyRawInventoryObject(entryData.crateDims);
    rawEntry.damage = entryData.damage || "";
    rawEntry.bedType = entryData.bedType || "";
    rawEntry.wardrobeTypes = copyRawInventoryArray(entryData.wardrobeTypes);
    rawEntry.pianoDetails = copyRawInventoryObject(entryData.pianoDetails);
    rawEntry.safeDetails = copyRawInventoryObject(entryData.safeDetails);

    if (entryData.photos && typeof entryData.photos === "object") {
        rawEntry.photos = copyRawInventoryObject(entryData.photos);
    }

    if (entryData.packedNoVolume !== undefined) {
        rawEntry.packedNoVolume = !!entryData.packedNoVolume;
    }

    if (entryData.materialOnly !== undefined) {
        rawEntry.materialOnly = !!entryData.materialOnly;
    }

    return rawEntry;
}

function commitRawInventoryEntry(rawEntry) {
    if (!rawEntry) return null;

    ensureInventoryStore();

    currentJob.inventory.items.push(rawEntry);
    lastAddedRawEntryId = rawEntry.id;

    return rawEntry.id;
}

function saveRawInventoryEntry(entryData) {
    if (!currentJob) return null;

    const rawEntry = buildRawInventoryEntry(entryData);
    const rawEntryId = commitRawInventoryEntry(rawEntry);

    saveToDevice();
    return rawEntryId;
}

function findRawInventoryEntry(rawEntryId) {
    if (!currentJob || !currentJob.inventory || !Array.isArray(currentJob.inventory.items)) return null;

    return currentJob.inventory.items.find(function(entry) {
        return entry.id === rawEntryId;
    }) || null;
}

function getLastRawInventoryEntry() {
    if (!lastAddedRawEntryId) return null;

    return findRawInventoryEntry(lastAddedRawEntryId);
}

function getRawInventoryEntryById(rawEntryId) {
    if (!currentJob || !currentJob.inventory || !Array.isArray(currentJob.inventory.items)) {
        return null;
    }

    return currentJob.inventory.items.find(function(entry) {
        return String(entry.id) === String(rawEntryId);
    }) || null;
}

async function markLastInventoryItemPackedNoVolume() {
    const rawEntry = getLastRawInventoryEntry();

    if (!rawEntry || rawEntry.kind === "note") {
        await appAlert("Add an inventory item first, then mark it as Packed / 0 Vol.", "Item Required");
        return;
    }

    const oldUnitVolume = Number(rawEntry.unitVolume || rawEntry.volume || 0);
    const qty = Number(rawEntry.qty || 1);

    rawEntry.packedNoVolume = true;
    rawEntry.materialOnly = false;
    rawEntry.unitVolume = 0;
    rawEntry.volume = 0;
    rawEntry.totalVolume = 0;

    const packedNote = "Packed / No Volume";

    if (rawEntry.note && !String(rawEntry.note).includes(packedNote)) {
        rawEntry.note = rawEntry.note + " · " + packedNote;
    } else if (!rawEntry.note) {
        rawEntry.note = packedNote;
    }

    let liveEntry = null;

    if (rawEntry.liveKey) {
        liveEntry = inventoryItems.find(function(item) {
            return item.liveKey === rawEntry.liveKey;
        });
    }

    if (!liveEntry && inventoryHistory && inventoryHistory.length) {
        const matchingHistory = inventoryHistory.slice().reverse().find(function(historyItem) {
            return String(historyItem.rawEntryId) === String(rawEntry.id);
        });

        if (matchingHistory && matchingHistory.liveKey) {
            liveEntry = inventoryItems.find(function(item) {
                return item.liveKey === matchingHistory.liveKey;
            });
        }
    }

    if (!liveEntry && rawEntry.itemName) {
        liveEntry = inventoryItems.find(function(item) {
            return item.item === rawEntry.itemName || item.displayName === rawEntry.itemName;
        });
    }

    if (liveEntry) {
        liveEntry.volume = 0;
        liveEntry.packedNoVolume = true;

        if (liveEntry.note && !String(liveEntry.note).includes(packedNote)) {
            liveEntry.note = liveEntry.note + " · " + packedNote;
        } else if (!liveEntry.note) {
            liveEntry.note = packedNote;
        }
    }

    currentItemVolume = 0;
    recalculateTotalVolume();

    saveToDevice();
    saveCalculatorFeedForActiveSequence();

    updateInventoryDisplay(
        (rawEntry.qty || qty) + " X " + (rawEntry.itemName || rawEntry.item || "ITEM") + " - PACKED / 0 VOL"
    );

    triggerInventoryPulse("total", "green");
    renderActionButtonStates();
    updateUndoButtonState();
}

// Live inventory display and item actions
function getLiveInventoryEntryForRaw(rawEntryId) {
    const rawEntry = findRawInventoryEntry(rawEntryId);
    if (!rawEntry) return null;

    const liveKey = getLiveInventoryGroupKey(rawEntry);

    return inventoryItems.find(function(i) {
        return i.liveKey === liveKey;
    }) || null;
}

function recalculateTotalVolume() {
    totalVolume = inventoryItems.reduce(function(sum, i) {
        if (i.excluded) return sum;
        return sum + (i.volume * i.qty);
    }, 0);
}

function renderActionButtonStates() {
    const dismantleBtn = document.getElementById("tool-dismantle");
    const expWrapBtn = document.getElementById("tool-expwrap");
    const disconnectBtn = document.getElementById("tool-disconnect");
    const handymanBtn = document.getElementById("tool-handyman");
    const excludeBtn = document.getElementById("tool-exclude");
    const crateBtn = document.getElementById("tool-crate");
    const damageBtn = document.getElementById("tool-damage");
    const photosBtn = document.getElementById("tool-photos");
    const packedZeroBtn = document.getElementById("tool-packed-zero");
    const rawEntry = getLastRawInventoryEntry();

    if (dismantleBtn) {
        dismantleBtn.classList.toggle("active", !!(rawEntry && rawEntry.dismantle));
    }

    if (expWrapBtn) {
        expWrapBtn.classList.toggle("active", !!(rawEntry && rawEntry.expWrap));
    }

    if (disconnectBtn) {
        disconnectBtn.classList.toggle("active", !!(rawEntry && rawEntry.disconnect));
    }

    if (handymanBtn) {
        handymanBtn.classList.toggle("active", !!(rawEntry && rawEntry.handyman));
    }

    if (excludeBtn) {
        excludeBtn.classList.toggle("exclude-active", !!(rawEntry && rawEntry.excluded));
    }

    if (crateBtn) {
        crateBtn.classList.toggle("active", !!(rawEntry && rawEntry.crated));
    }

    if (damageBtn) {
        damageBtn.classList.toggle("active", !!(rawEntry && rawEntry.damage));
    }

    if (packedZeroBtn) {
        packedZeroBtn.disabled = !(rawEntry && rawEntry.kind !== "note");
        packedZeroBtn.classList.toggle("active", !!(rawEntry && rawEntry.packedNoVolume));
    }

    if (photosBtn) {
        photosBtn.disabled = !(rawEntry && rawEntry.kind !== "note");

        const itemPhotoCount = rawEntry &&
            rawEntry.photos &&
            Array.isArray(rawEntry.photos.item)
            ? rawEntry.photos.item.length
            : 0;

        photosBtn.innerText = itemPhotoCount > 0
            ? "Photos (" + itemPhotoCount + ")"
            : "Photos";

        photosBtn.classList.toggle("active", itemPhotoCount > 0);
    }
}

function toggleItemAction(actionName) {
    const rawEntry = getLastRawInventoryEntry();
    if (!rawEntry) return;

    const isElectricBed = isBedRawEntry(rawEntry) && isElectricBedType(rawEntry.bedType);

    if (isElectricBed && actionName === "dismantle") {
        rawEntry.dismantle = false;
        rawEntry.handyman = true;

        saveToDevice();
        syncLiveInventoryFromRawForActiveSequence();
        recalculateTotalVolume();
        refreshCurrentInventorySelectionDisplay();
        renderActionButtonStates();

        updateInventoryDisplay("ELECTRIC MOTOR / TV BED [HANDYMAN REQUIRED]");
        triggerInventoryPulse("current", "blue");
        triggerInventoryPulse("total", "blue");
        triggerHaptic("light");
        updateUndoButtonState();
        saveCalculatorFeedForActiveSequence();
        return;
    }

    if (isElectricBed && actionName === "handyman") {
        rawEntry.handyman = true;

        saveToDevice();
        syncLiveInventoryFromRawForActiveSequence();
        recalculateTotalVolume();
        refreshCurrentInventorySelectionDisplay();
        renderActionButtonStates();

        updateInventoryDisplay("ELECTRIC MOTOR / TV BED [HANDYMAN REQUIRED]");
        triggerInventoryPulse("current", "blue");
        triggerInventoryPulse("total", "blue");
        triggerHaptic("light");
        updateUndoButtonState();
        saveCalculatorFeedForActiveSequence();
        return;
    }

    if (actionName === "dismantle") {
        rawEntry.dismantle = !rawEntry.dismantle;
    } else if (actionName === "expWrap") {
        rawEntry.expWrap = !rawEntry.expWrap;
    } else if (actionName === "disconnect") {
        rawEntry.disconnect = !rawEntry.disconnect;
    } else if (actionName === "handyman") {
        rawEntry.handyman = !rawEntry.handyman;
    } else if (actionName === "excluded") {
        rawEntry.excluded = !rawEntry.excluded;
    } else {
        return;
    }

    saveToDevice();
    syncLiveInventoryFromRawForActiveSequence();
    recalculateTotalVolume();
    refreshCurrentInventorySelectionDisplay();
    renderActionButtonStates();

    triggerInventoryPulse("current", "blue");
    triggerInventoryPulse("total", "blue");
    triggerHaptic("light");
    updateUndoButtonState();
    saveCalculatorFeedForActiveSequence();
}

function removeRawInventoryEntry(rawEntryId) {
    if (!currentJob || !currentJob.inventory || !Array.isArray(currentJob.inventory.items)) return;

    currentJob.inventory.items = currentJob.inventory.items.filter(function(entry) {
        return entry.id !== rawEntryId;
    });

    saveToDevice();
}

function getRawInventoryItemsForSequence(sequenceId) {
    if (!currentJob || !currentJob.inventory || !Array.isArray(currentJob.inventory.items)) {
        return [];
    }

    return currentJob.inventory.items.filter(function(entry) {
        return String(entry.sequenceId) === String(sequenceId);
    });
}

function getSequenceInventoryTotal(sequenceId) {
    const rawItems = getRawInventoryItemsForSequence(sequenceId);

    return rawItems.reduce(function(sum, entry) {
        if (entry.excluded) return sum;
        return sum + Number(entry.totalVolume || 0);
    }, 0);
}

function refreshInventoryVolumeDisplayForSequence(sequenceId) {
    const total = getSequenceInventoryTotal(sequenceId);
    totalVolume = total;

    const totalVolBox = document.getElementById("inv-total-volume");
    if (totalVolBox) {
        totalVolBox.innerText = total;
    }
}

function resetLiveInventoryForEmptySequence() {
    lastAddedItemName = null;
    lastAddedRawEntryId = null;
    currentItemVolume = 0;
    totalVolume = 0;
    updateInventoryDisplay("No items added");
}

function syncInventoryDisplayFromSequence(sequenceId) {
    const rawItems = getRawInventoryItemsForSequence(sequenceId);

    if (!rawItems.length) {
        resetLiveInventoryForEmptySequence();
        return;
    }

    const lastRaw = rawItems[rawItems.length - 1];

    lastAddedRawEntryId = lastRaw.id;
    lastAddedItemName = lastRaw.itemName || null;
    currentItemVolume = lastRaw.excluded ? 0 : Number(lastRaw.totalVolume || 0);

    totalVolume = getSequenceInventoryTotal(sequenceId);

    const tags = [];

    if (lastRaw.bedType) tags.push("[BED: " + String(lastRaw.bedType).toUpperCase() + "]");
    if (Array.isArray(lastRaw.wardrobeTypes) && lastRaw.wardrobeTypes.length) {
        tags.push("[WARDROBE: " + lastRaw.wardrobeTypes.join(", ").toUpperCase() + "]");
    }
    if (lastRaw.dismantle) tags.push("[DISMANTLE]");
    if (lastRaw.expWrap) tags.push("[EXP WRAP]");
    if (lastRaw.disconnect) tags.push("[DISCONNECT]");
    if (lastRaw.handyman) tags.push("[HANDYMAN]");
    if (lastRaw.crated && lastRaw.crateDims) {
        tags.push(
            "[CRATE: " +
            lastRaw.crateDims.l + " x " +
            lastRaw.crateDims.w + " x " +
            lastRaw.crateDims.h + " " +
            lastRaw.crateDims.unit + "]"
        );
    }
    if (lastRaw.damage) tags.push("[DAMAGE: " + String(lastRaw.damage).toUpperCase() + "]");
    if (lastRaw.excluded) tags.push("[EXCLUDED]");
    if (lastRaw.note) tags.push("[NOTE: " + String(lastRaw.note).toUpperCase() + "]");

    const label = (lastRaw.itemName || "ITEM").toUpperCase();
    const qty = Number(lastRaw.qty || 0);

    updateInventoryDisplay(
        qty + " X " + label + (tags.length ? " " + tags.join(" ") : "")
    );
}

function handleInventorySequenceChange(sequenceId) {
    if (!currentJob) return;

    activeSeqId = String(sequenceId);

    if (!currentJob.inventory) currentJob.inventory = {};
    currentJob.inventory.activeSequenceId = activeSeqId;
    currentJob.inventory.activeDeliveryId = null;

    inventoryReturnContext = {
        sequenceId: activeSeqId,
        deliveryId: null,
        floorName: currentJob.inventory.activeFloor || "Ground",
        roomName: currentJob.inventory.activeRoomName || "Hallway"
    };

    renderInventorySequenceDropdown();
    renderInventoryDeliveryDropdown();
    renderInventoryRoomDropdown();
    renderInventoryFloorDropdown();

    rebuildLiveInventoryFromSequence(activeSeqId);
    syncInventoryDisplayFromSequence(activeSeqId);

    renderActionButtonStates();
    updateUndoButtonState();
    saveCalculatorFeedForActiveSequence();
    saveToDevice();
}

// Schedule calculator feed from inventory
function getSequencePackOptionForCalculator(sequence) {
    const raw = String(sequence && sequence.packOption ? sequence.packOption : "").toLowerCase();

    if (
        raw.includes("fragile") ||
        raw.includes("china") ||
        raw.includes("glass") ||
        raw.includes("kitchenware")
    ) {
        return "cg";
    }

    if (
        raw.includes("full")
    ) {
        return "full";
    }

    return "none";
}

function buildCalculatorFeedForSequence(sequenceId) {
    if (!currentJob) return null;

    const sequence = currentJob.sequences.find(function(seq) {
        return String(seq.id) === String(sequenceId);
    });

    if (!sequence) return null;

    const rawItems = getRawInventoryItemsForSequence(sequenceId);

    let furnitureVol = 0;
    let disconnectApplianceCount = 0;
    let cratingItems = 0;
    let exportWrapVol = 0;

    let frameBedCount = 0;
    let ottomanBedCount = 0;
    let divanBedCount = 0;
    let electricBedCount = 0;
    let bunkBedCount = 0;
    let cotCount = 0;
    let diningTableCount = 0;
    let wardrobeCount = 0;
    let uprightPianoCount = 0;
    let grandPianoCount = 0;
    let grandfatherClockCount = 0;

    const wardrobeItems = [];

    const qty = {
        ap: 0,
        cg: 0,
        books: 0,
        linen: 0,
        wr: 0
    };

    rawItems.forEach(function(entry) {
        if (entry.excluded) return;

        const itemName = String(entry.itemName || "").toUpperCase().trim();
        const bedType = String(entry.bedType || "").trim();
        const entryQty = Number(entry.qty || 0);
        const unitVolume = Number(entry.unitVolume || 0);
        const totalVolume = Number(entry.totalVolume || 0);

        if (itemName === "AP BOX") {
            qty.ap += entryQty;
            return;
        }

        if (itemName === "CG BOX") {
            qty.cg += entryQty;
            return;
        }

        if (itemName === "BOOK BOX") {
            qty.books += entryQty;
            return;
        }

        if (itemName === "LINEN BOX") {
            qty.linen += entryQty;
            return;
        }

        if (itemName === "WR BOX") {
            qty.wr += entryQty;
            return;
        }

        if (
            entry.disconnect &&
            (
                itemName === "WASHING MACHINE" ||
                itemName === "DISHWASHER"
            )
        ) {
            disconnectApplianceCount += entryQty;
        }

        if (entry.crated) {
            cratingItems += entryQty;
        }

        if (entry.expWrap) {
            exportWrapVol += totalVolume || (unitVolume * entryQty);
        }

        if (
            itemName === "PIANO (UPRIGHT)" ||
            itemName === "PIANO (ELECTRIC)"
        ) {
            uprightPianoCount += entryQty;
        }

        if (
            itemName === "PIANO (BABY GRAND)" ||
            itemName === "PIANO (GRAND)"
        ) {
            grandPianoCount += entryQty;
        }

        if (itemName === "CLOCK (GRANDFATHER)") {
            grandfatherClockCount += entryQty;
        }

        if (entry.dismantle) {
            if (
                itemName === "BED (SINGLE)" ||
                itemName === "BED (DOUBLE)" ||
                itemName === "BED (QUEENSIZE)" ||
                itemName === "BED (KINGSIZE)" ||
                itemName === "BED (SUPERKING)"
            ) {
                if (bedType === "Frame") frameBedCount += entryQty;
                else if (bedType === "Ottoman") ottomanBedCount += entryQty;
                else if (bedType === "Divan") divanBedCount += entryQty;
                else if (bedType === "Electric Motor / TV") electricBedCount += entryQty;
            }

            if (itemName === "BUNK BED") {
                bunkBedCount += entryQty;
            }

            if (
                itemName === "COT / CHILDS BED" ||
                itemName === "COT / CHILD'S BED" ||
                itemName === "COT"
            ) {
                cotCount += entryQty;
            }

            if (itemName === "DINING TABLE") {
                diningTableCount += entryQty;
            }
            if (
                itemName === "WARDROBE (2-DOOR)" ||
                itemName === "WARDROBE (3-DOOR)" ||
                itemName === "WARDROBE (4-DOOR)"
            ) {
                wardrobeCount += entryQty;

                wardrobeItems.push({
                    itemName: entry.itemName || "",
                    qty: entryQty,
                    wardrobeTypes: Array.isArray(entry.wardrobeTypes) ? entry.wardrobeTypes : []
                });
            }
        }

        furnitureVol += totalVolume || (unitVolume * entryQty);
    });

    const seqIndex = currentJob.sequences.findIndex(function(seq) {
        return String(seq.id) === String(sequenceId);
    });

    return {
        jobId: currentJob.id,
        sequenceId: sequence.id,
        sequenceLabel: "Sequence " + (seqIndex + 1),
        packOption: getSequencePackOptionForCalculator(sequence),
        furnitureVol: Math.round(furnitureVol * 100) / 100,
        qty: qty,
        disconnectApplianceCount: disconnectApplianceCount,
        cratingItems: cratingItems,
        exportWrapVol: Math.round(exportWrapVol * 100) / 100,
        special: {
            frameBeds: frameBedCount,
            ottomanBeds: ottomanBedCount,
            divanBeds: divanBedCount,
            electricBeds: electricBedCount,
            bunkBeds: bunkBedCount,
            cots: cotCount,
            diningTables: diningTableCount,
            wardrobes: wardrobeCount,
            wardrobeItems: wardrobeItems,
            uprightPianos: uprightPianoCount,
            grandPianos: grandPianoCount,
            grandfatherClocks: grandfatherClockCount,
            cratingItems: cratingItems,
            exportWrapVol: Math.round(exportWrapVol * 100) / 100
        },
        createdAt: new Date().toISOString()
    };
}

function saveCalculatorFeedForActiveSequence() {
    if (!currentJob || !activeSeqId) return;

    const feed = buildCalculatorFeedForSequence(activeSeqId);
    if (!feed) return;

    localStorage.setItem("photon_calculator_feed", JSON.stringify(feed));

    if (typeof renderScheduleCalculator === "function") {
        renderScheduleCalculator();
    }

    if (typeof renderQuoteTab === "function") {
        const quoteTab = document.getElementById('content-quote');
        if (quoteTab && !quoteTab.classList.contains('hidden')) {
            renderQuoteTab();
        }
    }
}
function buildLiveInventoryKeyFromValues(data) {
    return [
        String(data.itemName || ""),
        String(data.roomName || ""),
        String(data.floorName || ""),
        String(data.deliveryId || ""),
        Number(data.unitVolume || 0),
        !!data.excluded,
        !!data.dismantle,
        !!data.expWrap,
        !!data.disconnect,
        !!data.handyman,
        String(data.note || ""),
        String(data.damage || ""),
        String(data.bedType || ""),
        Array.isArray(data.wardrobeTypes) ? data.wardrobeTypes.join("|") : "",
        data.pianoDetails ? JSON.stringify(data.pianoDetails) : "",
        !!data.crated,
        data.crateDims
            ? [
                data.crateDims.l || "",
                data.crateDims.w || "",
                data.crateDims.h || "",
                data.crateDims.unit || ""
            ].join("|")
            : ""
    ].join("||");
}

function getLiveInventoryGroupKey(entry) {
    return buildLiveInventoryKeyFromValues(entry || {});
}

function createLiveInventoryItemFromRaw(entry, liveKey) {
    return {
        liveKey: liveKey,
        item: entry.itemName,
        displayName: entry.itemName,
        volume: Number(entry.unitVolume || 0),
        qty: Number(entry.qty || 0),
        dismantle: !!entry.dismantle,
        expWrap: !!entry.expWrap,
        disconnect: !!entry.disconnect,
        handyman: !!entry.handyman,
        excluded: !!entry.excluded,
        roomName: entry.roomName || "",
        floorName: entry.floorName || "",
        deliveryId: entry.deliveryId || "",
        note: entry.note || "",
        damage: entry.damage || "",
        bedType: entry.bedType || "",
        wardrobeTypes: Array.isArray(entry.wardrobeTypes) ? entry.wardrobeTypes : [],
        pianoDetails: entry.pianoDetails || null,
        crated: !!entry.crated,
        crateDims: entry.crateDims || null
    };
}

function rebuildLiveInventoryFromSequence(sequenceId) {
    inventoryItems = [];
    currentItemVolume = 0;
    totalVolume = 0;
    lastAddedItemName = null;
    lastAddedRawEntryId = null;
    inventoryHistory = [];

    const rawItems = getRawInventoryItemsForSequence(sequenceId);

    if (!rawItems.length) {
        resetLiveInventoryForEmptySequence();
        updateUndoButtonState();
        renderActionButtonStates();
        return;
    }

    rawItems.forEach(function(entry) {
        const liveKey = getLiveInventoryGroupKey(entry);

        let existing = inventoryItems.find(function(i) {
            return i.liveKey === liveKey;
        });

        const qty = Number(entry.qty || 0);

        if (existing) {
            existing.qty += qty;
        } else {
            inventoryItems.push(createLiveInventoryItemFromRaw(entry, liveKey));
        }
    });

    const lastRaw = rawItems[rawItems.length - 1] || null;

    lastAddedRawEntryId = lastRaw ? lastRaw.id : null;
    lastAddedItemName = lastRaw ? lastRaw.itemName : null;

    currentItemVolume = 0;
    totalVolume = getSequenceInventoryTotal(sequenceId);

    updateInventoryDisplay("Sequence restored");
    updateUndoButtonState();
    renderActionButtonStates();
}

// Room and floor controls
function getRoomOptions() {
    if (!currentJob) return DEFAULT_ROOMS;

    if (!currentJob.inventory) currentJob.inventory = {};
    if (!Array.isArray(currentJob.inventory.customRooms)) {
        currentJob.inventory.customRooms = [];
    }

    return [...DEFAULT_ROOMS, ...currentJob.inventory.customRooms];
}

function renderInventoryRoomDropdown() {
    const dropdown = document.getElementById('inv-room-select');
    if (!dropdown || !currentJob) return;

    if (!currentJob.inventory) currentJob.inventory = {};
    if (!Array.isArray(currentJob.inventory.customRooms)) {
        currentJob.inventory.customRooms = [];
    }

    const currentRoom = currentJob.inventory.activeRoomName || "Hallway";
    const roomOptions = getRoomOptions();

    const addCustomOption = `<option value="__add_custom_room__">+ Add Custom Room</option>`;

    const roomOptionsHtml = roomOptions.map(function(room) {
        return `<option value="${room}" ${room === currentRoom ? 'selected' : ''}>${room}</option>`;
    }).join('');

    dropdown.innerHTML = addCustomOption + roomOptionsHtml;

    dropdown.value = roomOptions.includes(currentRoom) ? currentRoom : "Hallway";
}

function handleRoomChange(value) {
    if (!currentJob) return;

    if (!currentJob.inventory) currentJob.inventory = {};
    if (!Array.isArray(currentJob.inventory.customRooms)) {
        currentJob.inventory.customRooms = [];
    }

    if (qtyResetTimer) {
        clearTimeout(qtyResetTimer);
        qtyResetTimer = null;
    }

    if (value === "__add_custom_room__") {
        renderInventoryRoomDropdown();
        openSimpleInputModal({
            mode: "custom-room",
            title: "Add Custom Room",
            subtitle: "Add a room name not already in the list",
            label: "Room Name",
            placeholder: "e.g. Study",
            value: "",
            inputType: "text",
            inputMode: "text"
        });
        return;
    }

    currentJob.inventory.activeSequenceId = activeSeqId || null;
    currentJob.inventory.activeRoomName = value;
    resetInventoryQtyInput();
    lastAddedItemName = null;
    lastAddedRawEntryId = null;

    saveInventoryContext();
    saveToDevice();
}

function getFloorOptions() {
    if (!currentJob) return DEFAULT_FLOORS;

    if (!currentJob.inventory) currentJob.inventory = {};
    if (!Array.isArray(currentJob.inventory.customFloors)) {
        currentJob.inventory.customFloors = [];
    }

    return [...DEFAULT_FLOORS, ...currentJob.inventory.customFloors];
}

function renderInventoryFloorDropdown() {
    const dropdown = document.getElementById('inv-floor-select');
    if (!dropdown || !currentJob) return;

    if (!currentJob.inventory) currentJob.inventory = {};
    if (!Array.isArray(currentJob.inventory.customFloors)) {
        currentJob.inventory.customFloors = [];
    }

    const currentFloor = currentJob.inventory.activeFloor || "Ground";
    const floorOptions = getFloorOptions();

    dropdown.innerHTML =
        floorOptions.map(floor => {
            return `<option value="${floor}" ${floor === currentFloor ? 'selected' : ''}>${floor}</option>`;
        }).join('') +
        `<option value="__add_numbered_floor__">+ Add Numbered Floor</option>` +
        `<option value="__add_custom_floor__">+ Add Custom Floor</option>`;

    dropdown.value = floorOptions.includes(currentFloor) ? currentFloor : "Ground";
}

function formatNumberedFloorLabel(value) {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return null;

    if (num === 0) return "Ground";

    if (num === 1) return "First";
    if (num === 2) return "Second";
    if (num === 3) return "Third";

    const lastTwo = num % 100;
    const lastOne = num % 10;

    let suffix = "th";
    if (lastTwo < 11 || lastTwo > 13) {
        if (lastOne === 1) suffix = "st";
        else if (lastOne === 2) suffix = "nd";
        else if (lastOne === 3) suffix = "rd";
    }

    return `${num}${suffix} Floor`;
}

function handleFloorChange(value) {
    if (!currentJob) return;

    if (!currentJob.inventory) currentJob.inventory = {};
    if (!Array.isArray(currentJob.inventory.customFloors)) {
        currentJob.inventory.customFloors = [];
    }

    if (value === "__add_numbered_floor__") {
        renderInventoryFloorDropdown();
        openSimpleInputModal({
            mode: "numbered-floor",
            title: "Add Numbered Floor",
            subtitle: "Enter a number and Photon will format the floor name",
            label: "Floor Number",
            placeholder: "e.g. 4",
            value: "",
            inputType: "number",
            inputMode: "numeric"
        });
        return;
    }

    if (value === "__add_custom_floor__") {
        renderInventoryFloorDropdown();
        openSimpleInputModal({
            mode: "custom-floor",
            title: "Add Custom Floor",
            subtitle: "Add a floor name not already in the list",
            label: "Floor Name",
            placeholder: "e.g. Mezzanine",
            value: "",
            inputType: "text",
            inputMode: "text"
        });
        return;
    }

    currentJob.inventory.activeSequenceId = activeSeqId || null;
    currentJob.inventory.activeFloor = value;

    saveInventoryContext();
    saveToDevice();
}

// Inventory button order, search, and rendering
let inventoryButtonReorderMode = false;

function getInventoryButtonOrderKey(category) {
    return `movepilot_inventory_button_order_${category || "Full List"}`;
}

function getOrderedInventoryButtons(category) {
    const defaultItems = inventoryCategories[category] || [];
    const storageKey = getInventoryButtonOrderKey(category);

    let savedOrder = [];

    try {
        savedOrder = JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch (err) {
        savedOrder = [];
    }

    if (!Array.isArray(savedOrder) || !savedOrder.length) {
        return defaultItems.slice();
    }

    const defaultSet = new Set(defaultItems);

    const savedStillValid = savedOrder.filter(function(itemName) {
        return defaultSet.has(itemName);
    });

    const newDefaultItems = defaultItems.filter(function(itemName) {
        return !savedStillValid.includes(itemName);
    });

    return savedStillValid.concat(newDefaultItems);
}

function saveInventoryButtonOrder(category, orderedItems) {
    const storageKey = getInventoryButtonOrderKey(category);

    try {
        localStorage.setItem(storageKey, JSON.stringify(orderedItems));
    } catch (err) {
        console.warn("Could not save inventory button order", err);
    }
}
function getInventoryButtonUsageKey(category) {
    return "movePilot_inventory_button_usage_" + String(category || "Full List");
}

function getInventoryButtonUsageMap(category) {
    const storageKey = getInventoryButtonUsageKey(category);

    try {
        const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
        return {};
    }
}

function saveInventoryButtonUsageMap(category, usageMap) {
    const storageKey = getInventoryButtonUsageKey(category);

    try {
        localStorage.setItem(storageKey, JSON.stringify(usageMap || {}));
    } catch (err) {
        console.warn("Could not save inventory button usage", err);
    }
}

function recordInventoryButtonUse(itemName) {
    const category = currentInventoryCategory || "Full List";
    const usageMap = getInventoryButtonUsageMap(category);

    usageMap[itemName] = Number(usageMap[itemName] || 0) + 1;

    saveInventoryButtonUsageMap(category, usageMap);
}

function handleInventoryButtonClick(itemName) {
    recordInventoryButtonUse(itemName);
    addInventoryItem(itemName);
}

async function sortInventoryButtonsByMostUsed() {
    const category = currentInventoryCategory || "Full List";
    const orderedItems = getOrderedInventoryButtons(category);
    const usageMap = getInventoryButtonUsageMap(category);

    const hasAnyUsage = orderedItems.some(function(itemName) {
        return Number(usageMap[itemName] || 0) > 0;
    });

    if (!hasAnyUsage) {
        updateInventoryDisplay("NO USAGE DATA YET");
        return;
    }

    const confirmed = await appConfirm(
        "This will replace your current saved button order for " + category + " with your most-used order. Continue?",
        "Sort By Most Used"
    );

    if (!confirmed) return;

    orderedItems.sort(function(a, b) {
        const usageA = Number(usageMap[a] || 0);
        const usageB = Number(usageMap[b] || 0);

        if (usageB !== usageA) {
            return usageB - usageA;
        }

        return a.localeCompare(b);
    });

    saveInventoryButtonOrder(category, orderedItems);
    inventoryButtonReorderMode = false;

    updateInventoryReorderHeaderButton();
    renderInventoryButtons();

    updateInventoryDisplay("SORTED BY MOST USED");
}

function moveInventoryButton(itemName, direction) {
    const category = currentInventoryCategory || "Full List";
    const orderedItems = getOrderedInventoryButtons(category);
    const currentIndex = orderedItems.indexOf(itemName);

    if (currentIndex === -1) return;

    const newIndex = currentIndex + direction;

    if (newIndex < 0 || newIndex >= orderedItems.length) {
        updateInventoryDisplay("BUTTON CANNOT MOVE FURTHER");
        return;
    }

    const movedItem = orderedItems.splice(currentIndex, 1)[0];
    orderedItems.splice(newIndex, 0, movedItem);

    saveInventoryButtonOrder(category, orderedItems);
    renderInventoryButtons();

    updateInventoryDisplay(direction < 0 ? "BUTTON MOVED UP" : "BUTTON MOVED DOWN");
}

function updateInventoryHeaderReorderVisibility(activeTabName) {
    const headerActions = document.getElementById("inventory-reorder-header-actions");
    if (!headerActions) return;

    const shouldShow = activeTabName === "inventory";

    headerActions.classList.toggle("inventory-reorder-header-actions-hidden", !shouldShow);

    if (!shouldShow && inventoryButtonReorderMode) {
        inventoryButtonReorderMode = false;
        updateInventoryReorderHeaderButton();
        renderInventoryButtons();
    }
}

function updateInventoryReorderHeaderButton() {
    const btn = document.getElementById("inventory-reorder-header-btn");
    if (!btn) return;

    btn.innerText = inventoryButtonReorderMode ? "Done Reordering" : "Reorder Buttons";
    btn.classList.toggle("active", inventoryButtonReorderMode);
}

function toggleInventoryButtonReorderMode() {
    inventoryButtonReorderMode = !inventoryButtonReorderMode;
    updateInventoryReorderHeaderButton();
    renderInventoryButtons();

    updateInventoryDisplay(
        inventoryButtonReorderMode
            ? "BUTTON REORDER MODE ON"
            : "BUTTON REORDER MODE OFF"
    );
}

async function resetInventoryButtonOrder() {
    const category = currentInventoryCategory || "Full List";

    const confirmed = await appConfirm(
        "This will reset your saved button order for " + category + " back to default. Continue?",
        "Reset Button Order"
    );

    if (!confirmed) return;

    const storageKey = getInventoryButtonOrderKey(category);

    localStorage.removeItem(storageKey);
    inventoryButtonReorderMode = false;

    updateInventoryReorderHeaderButton();
    renderInventoryButtons();

    updateInventoryDisplay("BUTTON ORDER RESET");
}

function renderInventoryButtons() {
    const grid = document.getElementById('inventory-button-grid');
    const countEl = document.getElementById('inventory-search-count');
    if (!grid) return;

    const itemsToShow = getOrderedInventoryButtons(currentInventoryCategory);
    const search = (inventorySearchText || "").trim().toLowerCase();

    const filteredItems = !search
        ? itemsToShow
        : itemsToShow.filter(function(itemName) {
            return itemName.toLowerCase().includes(search);
        });

    const customInventoryItems = getCustomInventoryItems();

    const filteredCustomItems = !search
        ? customInventoryItems
        : customInventoryItems.filter(function(item) {
            return String(item.name || "").toLowerCase().includes(search);
        });

    if (countEl) {
        const totalButtonCount = itemsToShow.length + customInventoryItems.length;
        const filteredButtonCount = filteredItems.length + filteredCustomItems.length;

        if (!search) {
            countEl.innerText = `Showing all items (${totalButtonCount})`;
        } else {
            countEl.innerText = `Showing ${filteredButtonCount} of ${totalButtonCount} items`;
        }
    }

    if (!filteredItems.length && !filteredCustomItems.length) {
        grid.innerHTML = `
            <div class="col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-[10px] font-black uppercase text-slate-400">
                No matching items
            </div>
        `;
        return;
    }

    
    const itemButtonsHtml = filteredItems.map(function(itemName) {
        const safeItemName = itemName.replace(/'/g, "\\'");

        if (!inventoryButtonReorderMode) {
            return `<button class="item-btn inventory-furniture-btn" onclick="handleInventoryButtonClick('${safeItemName}')">${itemName}</button>`;
        }

        return `
            <div class="item-btn inventory-furniture-btn flex flex-col gap-1" style="height:auto; min-height:74px;">
                <div>${itemName}</div>
                <div class="flex gap-1 justify-center">
                    <button
                        class="inv-tool-btn"
                        style="min-height:26px; padding:4px 8px;"
                        onclick="moveInventoryButton('${safeItemName}', -1)"
                        type="button"
                    >
                        ↑
                    </button>
                    <button
                        class="inv-tool-btn"
                        style="min-height:26px; padding:4px 8px;"
                        onclick="moveInventoryButton('${safeItemName}', 1)"
                        type="button"
                    >
                        ↓
                    </button>
                </div>
            </div>
        `;
    }).join('');

    const customButtonsHtml = filteredCustomItems.map(function(item) {
        const safeCustomId = String(item.id || "").replace(/'/g, "\\'");
        const safeName = escapeHtml(String(item.name || "").trim());
        const safeVolume = escapeHtml(String(item.volume || 0));

        return `
            <button
                class="item-btn inventory-furniture-btn"
                onclick="addSavedCustomInventoryItem('${safeCustomId}')"
                title="Custom item · ${safeVolume} cuft"
            >
                ${safeName}
            </button>
        `;
    }).join('');

    grid.innerHTML = customButtonsHtml + itemButtonsHtml;
    updateInventoryReorderHeaderButton();
}

function setInventoryCategory(category, btn) {
    currentInventoryCategory = category;

    document.querySelectorAll('.inv-room-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    renderInventoryButtons();
}

function handleInventorySearch(value) {
    inventorySearchText = value || "";
    renderInventoryButtons();
}

function clearInventorySearch() {
    inventorySearchText = "";

    const input = document.getElementById("inventory-search-input");
    if (input) input.value = "";

    renderInventoryButtons();
}

// Shared modal helpers
function openScheduleNumberModal(rowId, fieldName, currentValue) {
    scheduleNumberEditMeta = {
        rowId: rowId,
        fieldName: fieldName
    };

    openSimpleInputModal({
        mode: "schedule-number",
        title: fieldName === "men" ? "Edit Crew" : "Edit Vans",
        subtitle: fieldName === "men"
            ? "Enter the crew required for this planner row"
            : "Enter the vans required for this planner row",
        label: fieldName === "men" ? "Crew" : "Vans",
        placeholder: fieldName === "men" ? "e.g. 5" : "e.g. 2",
        value: String(currentValue || 0),
        inputType: "number",
        inputMode: "numeric"
    });
}

function closeAllMovePilotModals(exceptId) {
    [
        "simple-input-overlay",
        "note-overlay",
        "misc-overlay",
        "piano-overlay",
        "safe-overlay",
        "listed-flags-overlay",
        "crate-overlay",
        "damage-overlay",
        "bed-overlay",
        "wardrobe-overlay",
        "app-modal-overlay",
        "inventory-photo-overlay",
        "photo-view-overlay"
    ].forEach(function(id) {
        if (id === exceptId) return;

        const el = document.getElementById(id);
        if (!el) return;

        el.style.display = "none";
        el.classList.remove("show");
    });
}

function resetSimpleInputModalHard() {
    const overlay = document.getElementById("simple-input-overlay");
    const input = document.getElementById("simple-input-field");

    if (overlay) {
        overlay.style.display = "none";
        overlay.classList.remove("show");
    }

    if (input) {
        input.disabled = false;
        input.readOnly = false;
        input.removeAttribute("disabled");
        input.removeAttribute("readonly");
        input.style.pointerEvents = "auto";
        input.style.userSelect = "text";
        input.blur();
    }

    simpleInputMode = "";
    simpleInputMeta = null;
}

function openSimpleInputModal(config) {
    const overlay = document.getElementById("simple-input-overlay");
    const title = document.getElementById("simple-input-title");
    const subtitle = document.getElementById("simple-input-subtitle");
    const label = document.getElementById("simple-input-label");
    const input = document.getElementById("simple-input-field");
    closeAllMovePilotModals("simple-input-overlay");

    if (!overlay || !title || !subtitle || !label || !input) return;

    simpleInputMode = config.mode || "";
    simpleInputMeta = config.meta || null;

    title.innerText = config.title || "Enter Value";
    subtitle.innerText = config.subtitle || "";
    label.innerText = config.label || "Value";
    input.value = config.value || "";
    input.placeholder = config.placeholder || "";
    input.type = config.inputType || "text";
    input.inputMode = config.inputMode || "text";

    input.disabled = false;
    input.readOnly = false;
    input.removeAttribute("disabled");
    input.removeAttribute("readonly");
    input.style.pointerEvents = "auto";
    input.style.userSelect = "text";

    input.oninput = function () {
        setModalErrorText("simple-input-error-text", "");
    };

    setModalErrorText("simple-input-error-text", "");
    overlay.style.display = "flex";

    setTimeout(function () {
        input.focus();
        input.select();
    }, 50);

    setTimeout(function () {
        input.focus();
        input.click();
    }, 250);

    setTimeout(function () {
        input.focus();
    }, 600);
}

function closeSimpleInputModal() {
    const overlay = document.getElementById("simple-input-overlay");
    const input = document.getElementById("simple-input-field");

    if (overlay) overlay.style.display = "none";
    if (input) {
        input.value = "";
        input.type = "text";
        input.inputMode = "text";
        input.placeholder = "";
    }

    setModalErrorText("simple-input-error-text", "");
    simpleInputMode = "";
    simpleInputMeta = null;
    scheduleNumberEditMeta = null;
}

function saveSimpleInputModal() {
    const input = document.getElementById("simple-input-field");
    if (!input || !currentJob) return;

    const rawValue = input.value.trim();

    if (simpleInputMode === "custom-room") {
        if (!currentJob.inventory) currentJob.inventory = {};
        if (!Array.isArray(currentJob.inventory.customRooms)) {
            currentJob.inventory.customRooms = [];
        }

        if (!rawValue) {
            setModalErrorText("simple-input-error-text", "Enter a room name");
            return;
        }

        setModalErrorText("simple-input-error-text", "");

        const alreadyExists = getRoomOptions().some(function(room) {
            return room.toLowerCase() === rawValue.toLowerCase();
        });

        if (!alreadyExists) {
            currentJob.inventory.customRooms.push(rawValue);
        }

        currentJob.inventory.activeRoomName = rawValue;
        renderInventoryRoomDropdown();
        resetInventoryQtyInput();
        lastAddedItemName = null;
        lastAddedRawEntryId = null;
        saveToDevice();
        closeSimpleInputModal();
        return;
    }

    if (simpleInputMode === "numbered-floor") {
        if (!currentJob.inventory) currentJob.inventory = {};
        if (!Array.isArray(currentJob.inventory.customFloors)) {
            currentJob.inventory.customFloors = [];
        }

        if (!rawValue) {
            setModalErrorText("simple-input-error-text", "Enter a floor number");
            return;
        }

        const floorLabel = formatNumberedFloorLabel(rawValue);
        if (!floorLabel) {
            setModalErrorText("simple-input-error-text", "Enter a valid floor number");
            return;
        }

        setModalErrorText("simple-input-error-text", "");

        const alreadyExists = getFloorOptions().some(function(floor) {
            return floor.toLowerCase() === floorLabel.toLowerCase();
        });

        if (!alreadyExists) {
            currentJob.inventory.customFloors.push(floorLabel);
        }

        currentJob.inventory.activeFloor = floorLabel;
        renderInventoryFloorDropdown();
        saveToDevice();
        closeSimpleInputModal();
        return;
    }

    if (simpleInputMode === "custom-floor") {
        if (!currentJob.inventory) currentJob.inventory = {};
        if (!Array.isArray(currentJob.inventory.customFloors)) {
            currentJob.inventory.customFloors = [];
        }

        if (!rawValue) {
            setModalErrorText("simple-input-error-text", "Enter a floor name");
            return;
        }

        setModalErrorText("simple-input-error-text", "");

        const alreadyExists = getFloorOptions().some(function(floor) {
            return floor.toLowerCase() === rawValue.toLowerCase();
        });

        if (!alreadyExists) {
            currentJob.inventory.customFloors.push(rawValue);
        }

        currentJob.inventory.activeFloor = rawValue;
        renderInventoryFloorDropdown();
        saveToDevice();
        closeSimpleInputModal();
        return;
    }

    if (simpleInputMode === "volume-override") {
        if (!lastAddedRawEntryId) return;

        const rawEntry = findRawInventoryEntry(lastAddedRawEntryId);
        if (!rawEntry) return;

        const item = getLiveInventoryEntryForRaw(lastAddedRawEntryId);
        if (!item) return;

        if (!rawValue) {
            setModalErrorText("simple-input-error-text", "Enter a unit volume");
            return;
        }

        const newVolume = parseFloat(rawValue);
        if (isNaN(newVolume) || newVolume <= 0) {
            setModalErrorText("simple-input-error-text", "Unit volume must be greater than 0");
            return;
        }

        setModalErrorText("simple-input-error-text", "");

        const previousVolume = item.volume;
        const previousRawVolume = rawEntry.unitVolume;

        rawEntry.unitVolume = newVolume;
        rawEntry.totalVolume = newVolume * rawEntry.qty;
        saveToDevice();

        syncLiveInventoryFromRawForActiveSequence();

        const refreshedRawEntry = findRawInventoryEntry(lastAddedRawEntryId);
        const refreshedItem = getLiveInventoryEntryForRaw(lastAddedRawEntryId);

        if (refreshedRawEntry && refreshedItem) {
            currentItemVolume = refreshedRawEntry.excluded ? 0 : Number(refreshedRawEntry.totalVolume || 0);

            inventoryHistory.push({
                type: "volume-edit",
                itemName: refreshedItem.item,
                previousVolume: previousVolume,
                newVolume: newVolume,
                rawEntryId: lastAddedRawEntryId,
                previousRawVolume: previousRawVolume
            });

            const labelText = refreshedItem.displayName || refreshedItem.item;
            updateInventoryDisplay(
                refreshedRawEntry.qty + " X " + String(labelText).toUpperCase() + " @ " + newVolume + " CUFT"
            );
        }

        triggerInventoryPulse("current", "blue");
        triggerInventoryPulse("total", "blue");
        triggerHaptic("medium");
        updateUndoButtonState();
        renderActionButtonStates();
        saveCalculatorFeedForActiveSequence();

        closeSimpleInputModal();
        return;
    }

    if (simpleInputMode === "listed-edit-qty") {
        const entryKey = simpleInputMeta && simpleInputMeta.entryKey;
        const mergedEntry = window.__listedEntryMap && window.__listedEntryMap[entryKey];
        if (!mergedEntry) return;

        const newQty = parseInt(rawValue, 10);
        if (isNaN(newQty) || newQty < 1) {
            setModalErrorText("simple-input-error-text", "Enter a valid quantity");
            return;
        }

        const rawMatches = getRawEntriesForListedEntry(mergedEntry);
        if (!rawMatches.length) return;

        const currentTotalQty = rawMatches.reduce(function(sum, raw) {
            return sum + Number(raw.qty || 0);
        }, 0);

        if (currentTotalQty < 1) return;

        if (newQty === currentTotalQty) {
            closeSimpleInputModal();
            return;
        }

        if (newQty > currentTotalQty) {
            const lastRaw = rawMatches[rawMatches.length - 1];
            const extraQty = newQty - currentTotalQty;
            lastRaw.qty = Number(lastRaw.qty || 0) + extraQty;
            lastRaw.totalVolume = Number(lastRaw.unitVolume || 0) * Number(lastRaw.qty || 0);
        } else {
            let qtyToRemove = currentTotalQty - newQty;

            for (let i = rawMatches.length - 1; i >= 0; i--) {
                const raw = rawMatches[i];
                const rawQty = Number(raw.qty || 0);

                if (qtyToRemove <= 0) break;

                if (rawQty <= qtyToRemove) {
                    qtyToRemove -= rawQty;
                    currentJob.inventory.items = currentJob.inventory.items.filter(function(item) {
                        return item.id !== raw.id;
                    });
                } else {
                    raw.qty = rawQty - qtyToRemove;
                    raw.totalVolume = Number(raw.unitVolume || 0) * raw.qty;
                    qtyToRemove = 0;
                }
            }
        }

        markInventoryChangedAfterSignatureAndSchedule(
            "Inventory quantity has changed since this schedule was calculated.",
            false
        );
        saveToDevice();

        if (String(activeSeqId || "") === String(mergedEntry.sequenceId || "")) {
            rebuildLiveInventoryFromSequence(activeSeqId);
        }

        renderListedInventory();
        renderActionButtonStates();
        updateUndoButtonState();
        saveCalculatorFeedForActiveSequence();
        closeSimpleInputModal();
        return;
    }

    if (simpleInputMode === "qty-override") {
        if (!lastAddedRawEntryId) return;

        const rawEntry = findRawInventoryEntry(lastAddedRawEntryId);
        if (!rawEntry) return;

        if (!rawValue) {
            setModalErrorText("simple-input-error-text", "Enter a valid quantity");
            return;
        }

        const newQty = parseInt(rawValue, 10);
        if (isNaN(newQty) || newQty < 1) {
            setModalErrorText("simple-input-error-text", "Enter a valid quantity");
            return;
        }

        setModalErrorText("simple-input-error-text", "");

        const previousRawQty = Number(rawEntry.qty || 1);
        if (previousRawQty === newQty) {
            closeSimpleInputModal();
            resetInventoryQtyInput();
            return;
        }

        rawEntry.qty = newQty;
        rawEntry.totalVolume = Number(rawEntry.unitVolume || 0) * newQty;

        inventoryHistory.push({
            type: "qty-edit",
            itemName: rawEntry.itemName,
            previousQty: previousRawQty,
            newQty: newQty,
            rawEntryId: rawEntry.id,
            previousRawQty: previousRawQty
        });

        saveToDevice();
        syncLiveInventoryFromRawForActiveSequence();
        recalculateTotalVolume();
        refreshCurrentInventorySelectionDisplay();

        triggerInventoryPulse("current", "blue");
        triggerInventoryPulse("total", "blue");
        triggerHaptic("medium");
        updateUndoButtonState();
        saveCalculatorFeedForActiveSequence();

        closeSimpleInputModal();
        resetInventoryQtyInput();
        return;
    }

    if (simpleInputMode === "schedule-number") {
        if (!scheduleNumberEditMeta || !scheduleNumberEditMeta.rowId || !scheduleNumberEditMeta.fieldName) {
            closeSimpleInputModal();
            return;
        }

        if (!rawValue) {
            setModalErrorText("simple-input-error-text", "Enter a valid number");
            return;
        }

        const newValue = parseInt(rawValue, 10);

        if (isNaN(newValue) || newValue < 0) {
            setModalErrorText("simple-input-error-text", "Enter a valid number");
            return;
        }

        if (scheduleNumberEditMeta.fieldName === "men" && newValue < 1) {
            setModalErrorText("simple-input-error-text", "Crew must be at least 1");
            return;
        }

        setModalErrorText("simple-input-error-text", "");

        updateScheduleDay(
            scheduleNumberEditMeta.rowId,
            scheduleNumberEditMeta.fieldName,
            newValue
        );

        closeSimpleInputModal();
        return;
    }

    if (simpleInputMode === "listed-edit-note") {
        const entryKey = simpleInputMeta && simpleInputMeta.entryKey;
        const mergedEntry = window.__listedEntryMap && window.__listedEntryMap[entryKey];

        if (!entryKey || !mergedEntry) {
            setModalErrorText("simple-input-error-text", "Could not find this inventory line. Close and try again.");
            return;
        }

        const rawMatches = getRawEntriesForListedEntry(mergedEntry);

        if (!rawMatches.length) {
            setModalErrorText("simple-input-error-text", "Could not find the original item. Close and try again.");
            return;
        }

        rawMatches.forEach(function(raw) {
            raw.note = rawValue;
        });

        markInventoryChangedAfterSignatureAndSchedule(
            "Inventory notes have changed since this schedule was calculated.",
            false
        );
        saveToDevice();

        if (String(activeSeqId || "") === String(mergedEntry.sequenceId || "")) {
            rebuildLiveInventoryFromSequence(activeSeqId);
        }

        renderListedInventory();
        renderActionButtonStates();
        updateUndoButtonState();
        saveCalculatorFeedForActiveSequence();

        closeSimpleInputModal();
        return;
    }
}

// Mileage and route helpers
function getMileageRouteMissingStops(routeData) {
    if (!routeData || !Array.isArray(routeData.stops)) return [];

    return routeData.stops.filter(function(stop) {
        return !String(stop.address || "").trim();
    });
}

function buildMileageRouteText(routeData) {
    if (!routeData || !Array.isArray(routeData.stops)) {
        return "";
    }

    const lines = [];

    lines.push("Branch: " + (routeData.branch || "-"));
    lines.push("Depot: " + (routeData.depotAddress || "MISSING DEPOT ADDRESS"));
    lines.push("Move Type: " + (routeData.moveType || "-"));
    lines.push("");
    lines.push("Primary Route:");

    routeData.stops.forEach(function(stop, index) {
        lines.push(
            (index + 1) + ". " +
            (stop.label || "-") +
            " — " +
            (stop.address || "MISSING ADDRESS")
        );
    });

    lines.push("");
    lines.push("Planner Travel Legs:");

    if (Array.isArray(routeData.plannerRows) && routeData.plannerRows.length) {
        routeData.plannerRows.forEach(function(row) {
            lines.push("");
            lines.push(
                "Row " + row.rowNumber +
                " · " + row.dayPart +
                " · " + row.task +
                " · Vans: " + row.vans
            );

            if (!row.legs.length) {
                lines.push("No travel legs added.");
                return;
            }

            row.legs.forEach(function(leg, index) {
                lines.push(
                    "  Leg " + (index + 1) + ": " +
                    leg.fromLabel + " → " + leg.toLabel +
                    " · " +
                    (leg.fromAddress || "MISSING FROM ADDRESS") +
                    " → " +
                    (leg.toAddress || "MISSING TO ADDRESS")
                );
            });
        });
    } else {
        lines.push("No planner travel legs found.");
    }

    return lines.join("\n");
}

function renderMileageRoutePreview(routeData) {
    const preview = document.getElementById("mileage-route-preview");
    const sourceText = document.getElementById("mileage-source-text");

    if (!preview) return;

    if (!routeData || !Array.isArray(routeData.stops)) {
        currentMileageRouteData = null;

        preview.innerHTML = `
            <div class="listed-stat-card" style="margin-bottom:12px;">
                <div class="listed-stat-label">Manual Mileage Entry</div>
                <div class="listed-stat-sub">
                    Use this when offline, or when mileage has already been checked elsewhere.
                </div>
            </div>
        `;

        if (sourceText) {
            sourceText.innerText = "Manual offline entry";
        }

        return;
    }

    currentMileageRouteData = routeData;

    if (sourceText) {
        sourceText.innerText = "Route built from Schedule sequence and planner rows";
    }

    const missingStops = getMileageRouteMissingStops(routeData);

    let plannerMissingCount = 0;
    let extraVanRows = [];

    if (Array.isArray(routeData.plannerRows)) {
        routeData.plannerRows.forEach(function(row) {
            if (Number(row.vans || 0) > 1) {
                extraVanRows.push(row);
            }

            row.legs.forEach(function(leg) {
                if (!String(leg.fromAddress || "").trim()) plannerMissingCount++;
                if (!String(leg.toAddress || "").trim()) plannerMissingCount++;
            });
        });
    }

    const warningHtml = missingStops.length || plannerMissingCount
        ? `
            <div class="validation-item validation-warn" style="margin-bottom:12px;">
                Missing address information found.
                <br>
                Primary route missing: ${missingStops.length}
                <br>
                Planner leg missing address points: ${plannerMissingCount}
            </div>
        `
        : `
            <div class="validation-item validation-ok" style="margin-bottom:12px;">
                Route and planner legs have address information.
            </div>
        `;

    const extraVanHtml = extraVanRows.length
        ? `
            <div class="validation-item validation-warn" style="margin-bottom:12px;">
                Extra van check:
                ${
                    extraVanRows.map(function(row) {
                        return `
                            <br>
                            Row ${row.rowNumber} · ${escapeHtml(row.task)} · Vans: ${row.vans}
                        `;
                    }).join("")
                }
                <br>
                Check whether mileage should be multiplied for these vans before saving total mileage to costing.
            </div>
        `
        : `
            <div class="validation-item validation-ok" style="margin-bottom:12px;">
                No planner rows currently show 2nd / 3rd vans.
            </div>
        `;

    const plannerRowsHtml = Array.isArray(routeData.plannerRows) && routeData.plannerRows.length
        ? routeData.plannerRows.map(function(row) {
            return `
                <div class="document-block" style="margin-top:10px;">
                    <div class="document-heading">
                        Planner Row ${row.rowNumber}: ${escapeHtml(row.dayPart)} · ${escapeHtml(row.task)}
                    </div>
                    <div class="document-line">
                        Vans: ${row.vans} · Men: ${row.men}
                    </div>
                    ${
                        row.legs.length
                            ? row.legs.map(function(leg, index) {
                                const missing =
                                    !String(leg.fromAddress || "").trim() ||
                                    !String(leg.toAddress || "").trim();

                                return `
                                    <div class="document-line" style="${missing ? 'color:#c2410c;' : ''}">
                                        Leg ${index + 1}: ${escapeHtml(leg.fromLabel)} → ${escapeHtml(leg.toLabel)}
                                        <br>
                                        ${escapeHtml(leg.fromAddress || "Missing from address")}
                                        →
                                        ${escapeHtml(leg.toAddress || "Missing to address")}
                                    </div>
                                `;
                            }).join("")
                            : `<div class="document-line">No travel legs added to this planner row.</div>`
                    }
                </div>
            `;
        }).join("")
        : `
            <div class="document-block">
                <div class="document-heading">Planner Travel Legs</div>
                <div class="document-line">No planner rows found.</div>
            </div>
        `;

    preview.innerHTML = `
        <div class="listed-stat-card" style="margin-bottom:12px;">
            <div class="listed-stat-label">Primary Route Preview</div>
            <div class="listed-stat-sub">Branch: ${escapeHtml(routeData.branch || "-")}</div>
            <div class="listed-stat-sub">Depot: ${escapeHtml(routeData.depotAddress || "Missing depot address")}</div>
            <div class="listed-stat-sub">Move Type: ${escapeHtml(routeData.moveType || "-")}</div>
        </div>

        ${warningHtml}
        ${extraVanHtml}

        <div class="space-y-3">
            ${
                routeData.stops.map(function(stop, index) {
                    const missing = !String(stop.address || "").trim();

                    return `
                        <div class="document-block" style="${missing ? 'border-color:#fed7aa;background:#fff7ed;' : ''}">
                            <div class="document-heading">
                                Primary Stop ${index + 1}: ${escapeHtml(stop.label || "-")}
                            </div>
                            <div class="document-line">
                                ${escapeHtml(stop.address || "Missing address")}
                            </div>
                        </div>
                    `;
                }).join("")
            }
        </div>

        <div style="height:12px"></div>

        <div class="listed-stat-card">
            <div class="listed-stat-label">Planner Day / Row Route Check</div>
            <div class="listed-stat-sub">
                This section checks the actual travel legs in the Manual Schedule Planner, including rows with extra vans.
            </div>
        </div>

        ${plannerRowsHtml}

        <div class="simple-input-actions" style="margin-top:14px;">
            <button type="button" class="simple-input-cancel-btn" onclick="copyMileageRouteToClipboard()">
                Copy Route
            </button>
            <button type="button" class="simple-input-save-btn" onclick="openMileageRouteInGoogleMaps()">
                Open Google Maps
            </button>
        </div>

        <div class="footer-note">
            Enter the total mileage you want costed. If multiple vans travel the same route, include the correct van-mile total based on your quoting policy.
        </div>
    `;
}

function openMileageModal(routeData = null, mileageValue = "") {
    const overlay = document.getElementById("mileage-overlay");
    const input = document.getElementById("mileage-input-field");

    if (!overlay || !input) return;

    const activeSeq = getActiveSequenceRecord();

    mileageTargetSequenceId = routeData && routeData.sequenceId
        ? String(routeData.sequenceId)
        : String(activeSeq ? activeSeq.id : (activeSeqId || ""));

    input.value = mileageValue === null || mileageValue === undefined ? "" : String(mileageValue);

    renderMileageRoutePreview(routeData);
    setModalErrorText("mileage-error-text", "");
    overlay.style.display = "flex";

    setTimeout(function () {
        input.focus();
        input.select();
    }, 50);
}

function closeMileageModal() {
    const overlay = document.getElementById("mileage-overlay");
    const input = document.getElementById("mileage-input-field");
    const preview = document.getElementById("mileage-route-preview");
    const sourceText = document.getElementById("mileage-source-text");

    if (overlay) overlay.style.display = "none";
    if (input) input.value = "";
    if (preview) preview.innerHTML = "";
    if (sourceText) sourceText.innerText = "Manual offline entry";

    mileageTargetSequenceId = "";
    currentMileageRouteData = null;
    setModalErrorText("mileage-error-text", "");
}

function saveMileageValueToSequenceCosting(sequenceId, mileageValue) {
    if (!currentJob || !sequenceId) return false;

    ensureCostingStore();

    const state = ensureQuoteSequenceState(sequenceId);
    if (!state) return false;

    if (!Array.isArray(state.pricingLines) || state.pricingLines.length === 0) {
        state.pricingLines = buildDefaultQuotePricingLines(sequenceId);
    }

    let mileageLine = state.pricingLines.find(function(line) {
        return line.label === "Mileage";
    });

    if (!mileageLine) {
        mileageLine = {
            id: createQuoteLineId(),
            label: "Mileage",
            customLabel: "",
            qty: 0,
            unitCost: 0.45
        };

        state.pricingLines.push(mileageLine);
    }

    mileageLine.qty = mileageValue;

    currentJob.costingQuote.selectedSequenceId = String(sequenceId);
    quotePricingSaved = false;

    saveToDevice();
    return true;
}

function saveMileageToCosting() {
    const input = document.getElementById("mileage-input-field");
    if (!input) return;

    const mileageValue = parseFloat(input.value);

    if (isNaN(mileageValue) || mileageValue < 0) {
        setModalErrorText("mileage-error-text", "Enter a valid mileage");
        return;
    }

    const sequenceId = mileageTargetSequenceId || String(activeSeqId || getQuoteSelectedSequenceId() || "");

    if (!sequenceId) {
        setModalErrorText("mileage-error-text", "No sequence selected");
        return;
    }

    const saved = saveMileageValueToSequenceCosting(sequenceId, mileageValue);

    if (!saved) {
        setModalErrorText("mileage-error-text", "Could not save mileage to costing");
        return;
    }

    closeMileageModal();

    const quoteTab = document.getElementById("content-quote");
    if (quoteTab && !quoteTab.classList.contains("hidden")) {
        renderQuoteTab();
    }

    updateInventoryDisplay("MILEAGE SENT TO COSTING");
}

function copyMileageRouteToClipboard() {
    const routeText = buildMileageRouteText(currentMileageRouteData);

    if (!routeText) {
        setModalErrorText("mileage-error-text", "No route to copy");
        return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(routeText).then(function() {
            setModalErrorText("mileage-error-text", "");
            updateInventoryDisplay("ROUTE COPIED");
        }).catch(function() {
            fallbackCopyMileageRoute(routeText);
        });

        return;
    }

    fallbackCopyMileageRoute(routeText);
}

function fallbackCopyMileageRoute(routeText) {
    const temp = document.createElement("textarea");
    temp.value = routeText;
    temp.style.position = "fixed";
    temp.style.left = "-9999px";
    temp.style.top = "0";

    document.body.appendChild(temp);
    temp.focus();
    temp.select();

    try {
        document.execCommand("copy");
        updateInventoryDisplay("ROUTE COPIED");
        setModalErrorText("mileage-error-text", "");
    } catch (err) {
        setModalErrorText("mileage-error-text", "Could not copy route");
    }

    document.body.removeChild(temp);
}

function buildGoogleMapsLegUrl(fromAddress, toAddress) {
    const from = String(fromAddress || "").trim();
    const to = String(toAddress || "").trim();

    if (!from || !to) {
        return "";
    }

    let url = "https://www.google.com/maps/dir/?api=1";
    url += "&travelmode=driving";
    url += "&origin=" + encodeURIComponent(from);
    url += "&destination=" + encodeURIComponent(to);

    return url;
}

async function openScheduleLegInGoogleMaps(dayId, legId) {
    const day = manualSchedule.find(function(row) {
        return String(row.id) === String(dayId);
    });

    if (!day) {
        await appAlert("Could not find this schedule row.", "Schedule Row Missing");
        return;
    }

    ensureScheduleRowShape(day);

    const leg = day.legs.find(function(item) {
        return String(item.id) === String(legId);
    });

    if (!leg) {
        await appAlert("Could not find this travel leg.", "Travel Leg Missing");
        return;
    }

    const branch = String(day.operatingBranch || "").trim();

    if (!branch) {
        await appAlert(
            "Select an Operating Branch on this schedule row before opening Google Maps.",
            "Operating Branch Required"
        );
        return;
    }

    const fromAddress = getScheduleLocationAddress(leg.from, branch);
    const toAddress = getScheduleLocationAddress(leg.to, branch);

    if (!fromAddress || !toAddress) {
        await appAlert(
            "Add both From and To addresses before opening Google Maps.",
            "Route Addresses Required"
        );
        return;
    }

    const url = buildGoogleMapsLegUrl(fromAddress, toAddress);

    if (!url) {
        await appAlert("Could not build Google Maps route.", "Route Error");
        return;
    }

    window.open(url, "_blank");
}

function buildGoogleMapsRouteUrl(routeData) {
    if (!routeData || !Array.isArray(routeData.stops)) return "";

    const usableStops = routeData.stops.filter(function(stop) {
        return String(stop.address || "").trim();
    });

    if (usableStops.length < 2) return "";

    const origin = usableStops[0].address;
    const destination = usableStops[usableStops.length - 1].address;
    const waypoints = usableStops.slice(1, -1).map(function(stop) {
        return stop.address;
    });

    let url = "https://www.google.com/maps/dir/?api=1";
    url += "&travelmode=driving";
    url += "&origin=" + encodeURIComponent(origin);
    url += "&destination=" + encodeURIComponent(destination);

    if (waypoints.length) {
        url += "&waypoints=" + encodeURIComponent(waypoints.join("|"));
    }

    return url;
}

function openMileageRouteInGoogleMaps() {
    const routeData = currentMileageRouteData;

    if (!routeData) {
        setModalErrorText("mileage-error-text", "No route built yet");
        return;
    }

    const missingStops = getMileageRouteMissingStops(routeData);

    if (missingStops.length) {
        setModalErrorText(
            "mileage-error-text",
            "Add missing addresses before opening Google Maps"
        );
        return;
    }

    const url = buildGoogleMapsRouteUrl(routeData);

    if (!url) {
        setModalErrorText("mileage-error-text", "Could not build Google Maps route");
        return;
    }

    window.open(url, "_blank");
}

// Sequence tab rendering
function renderSequenceUI() {
    const seq = currentJob.sequences.find(s => s.id == activeSeqId); 
            const isSaved = seq.isSaved;
            const status = isSaved ? 'disabled' : '';
            const wrapper = document.getElementById('content-sequence');
            isSaved ? wrapper.classList.add('is-saved') : wrapper.classList.remove('is-saved');

            const saveBtn = document.getElementById('btn-save-sequence');
saveBtn.innerHTML = getLockButtonContent(isSaved);
saveBtn.className = `action-btn lock-btn !h-12 !px-6 ${isSaved ? 'btn-change' : 'btn-save'}`;
saveBtn.setAttribute('aria-label', isSaved ? 'Unlock sequence' : 'Lock sequence');

            const selectedSeqId = activeSeqId || getDefaultSequenceId();

document.getElementById('seq-switcher').innerHTML = currentJob.sequences.map((s, idx) => {
    const moveLabel = s.moveType || 'New Sequence';
    const packLabel = s.packOption || 'No Packing Set';
    const label = `Seq #${idx + 1}: ${moveLabel} / ${packLabel}`;
    return `<option value="${s.id}" ${s.id == selectedSeqId ? 'selected' : ''}>${label}</option>`;
}).join('');
            
            document.getElementById('active-sequence-ui').innerHTML = `
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="mini-label">Move Type</label>
                        <select ${status} onchange="updateSeqField('moveType', this.value)" class="input-field border-2">
                            <option value="">-- Move Type --</option>
                            ${MOVE_TYPES.map(m => `<option value="${m}" ${seq.moveType===m?'selected':''}>${m}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="mini-label">Packing</label>
                        <select ${status} onchange="updateSeqField('packOption', this.value)" class="input-field border-2">
                            <option value="">-- Packing --</option>
                            ${PACK_OPTIONS.map(p => `<option value="${p}" ${seq.packOption===p?'selected':''}>${p}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="space-y-6 pt-4 border-t border-slate-200">
                    <div><label class="mini-label !text-blue-500 font-black">Collection Points</label>
                        ${seq.collections.map((cId, i) => `<div class="flex gap-2 mb-2"><select ${status} onchange="updateStop('collections', ${i}, this.value)" class="input-field bg-blue-50">${currentJob.properties.map(p => `<option value="${p.id}" ${cId==p.id?'selected':''}>${getPropertyDisplayText(p.id)}</option>`).join('')}</select>${i>0&&!isSaved?`<button onclick="removeStop('collections',${i})" class="px-2 text-red-500">×</button>`:''}</div>`).join('')}
                        ${!isSaved ? `<button onclick="addStop('collections')" class="add-stop-btn">+ Add Collection Stop</button>` : ''}
                    </div>
                    <div><label class="mini-label !text-green-600 font-black">Delivery Points</label>
                        ${seq.deliveries.map((dId, i) => `<div class="flex gap-2 mb-2"><select ${status} onchange="updateStop('deliveries', ${i}, this.value)" class="input-field bg-green-50">${currentJob.properties.map(p => `<option value="${p.id}" ${dId==p.id?'selected':''}>${getPropertyDisplayText(p.id)}</option>`).join('')}</select>${i>0&&!isSaved?`<button onclick="removeStop('deliveries',${i})" class="px-2 text-red-500">×</button>`:''}</div>`).join('')}
                        ${!isSaved ? `<button onclick="addStop('deliveries')" class="add-stop-btn">+ Add Delivery Stop</button>` : ''}
                    </div>
                </div>`;
            triggerPulse('active-sequence-ui');
        }

        function filterFiles() {
    const input = document.getElementById('fileSearch');
    const query = input ? input.value.trim().toLowerCase() : '';

    const cards = document.querySelectorAll('#job-list .job-card');

    cards.forEach(function(card) {
        const text = (card.innerText || card.textContent || '').toLowerCase();
        const isMatch = !query || text.includes(query);

        card.style.display = isMatch ? '' : 'none';
    });
}

function getDashboardSequenceVolume(job, sequenceId) {
    if (!job || !job.inventory || !Array.isArray(job.inventory.items)) {
        return 0;
    }

    return job.inventory.items.reduce(function(total, entry) {
        if (!entry || entry.excluded) return total;

        const entrySequenceId = String(entry.sequenceId || "");
        const targetSequenceId = String(sequenceId || "");

        if (entrySequenceId !== targetSequenceId) {
            return total;
        }

        return total + Number(entry.totalVolume || 0);
    }, 0);
}

function getDashboardSequencePrice(job, sequenceId) {
    const previousJob = currentJob;

    try {
        currentJob = job;

        const totals = getQuoteCommercialTotals(sequenceId);

        return totals && totals.customerPrice
            ? Number(totals.customerPrice || 0)
            : 0;
    } catch (err) {
        console.warn("Could not calculate dashboard sequence price", err);
        return 0;
    } finally {
        currentJob = previousJob;
    }
}

function formatDashboardMoney(value) {
    const amount = Number(value || 0);

    if (!amount) {
        return "£---";
    }

    return "£" + amount.toLocaleString("en-GB", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function dashboardJobHasMissingPrices(job) {
    const sequences = Array.isArray(job.sequences) ? job.sequences : [];

    return sequences.some(function(seq) {
        const volume = getDashboardSequenceVolume(job, seq.id);
        const price = getDashboardSequencePrice(job, seq.id);

        return volume > 0 && Number(price || 0) <= 0;
    });
}


// -----------------------------------------------------------------------------
// Dashboard rendering
// -----------------------------------------------------------------------------

// Dashboard list
function renderDashboard() {
    const isDevMode =
        typeof MOVEPILOT_DEV_SKIP_ACTIVATION !== "undefined" &&
        MOVEPILOT_DEV_SKIP_ACTIVATION;

    document.getElementById('job-list').innerHTML = jobs.map(j => {
        const safeSequences = Array.isArray(j.sequences) ? j.sequences : [];

        let seqBreakdown = safeSequences.length > 0
            ? `
                <div class="dashboard-seq-head">
                    <span>Sequence</span>
                    <span>Volume</span>
                    <span>Price</span>
                </div>

                ${safeSequences.map(function(s, index) {
                    const seqVolume = getDashboardSequenceVolume(j, s.id);
                    const seqPrice = getDashboardSequencePrice(j, s.id);

                    return `
                        <div class="seq-row dashboard-seq-row">
                            <div class="dashboard-seq-main">
                                <span class="dashboard-seq-title">Seq ${index + 1}: ${s.moveType || 'New Seq'}</span>
                                <span class="dashboard-seq-sub">${s.packOption || 'No Packing Set'}</span>
                            </div>

                            <span class="dashboard-seq-volume dashboard-volume-display">${formatVolumeDisplayFromCuft(seqVolume)}</span>
                            <span class="dashboard-seq-price ${Number(seqPrice || 0) <= 0 && seqVolume > 0 ? "missing" : ""}">
                                ${Number(seqPrice || 0) <= 0 && seqVolume > 0 ? "Price missing" : formatDashboardMoney(seqPrice)}
                            </span>
                        </div>
                    `;
                }).join('')}
            `
            : `<div class="text-[8px] text-slate-300 italic mt-2 uppercase font-bold">No sequences</div>`;

        const hasMissingPrices = dashboardJobHasMissingPrices(j);
        return `
            <div class="job-card status-${j.status || 'pending'}" onclick="openJob(${j.id})">
                <div class="flex justify-between items-start">
                    <div class="flex-grow">
                        <span class="pill pill-${j.status || 'pending'}">${j.status || 'pending'}</span>
                        ${j.isManual ? '<span class="pill pill-manual">Manual</span>' : ''}
                        ${j.isNew ? '<span class="pill pill-new">New</span>' : ''}
                        <h3 class="text-xl font-black text-slate-800 uppercase leading-none mt-1">${j.name || 'Unnamed Job'}</h3>
                        <p class="dashboard-job-ref">REF: <span>${j.ref || '---'}</span></p>
                        ${
                            hasMissingPrices
                                ? `<div class="dashboard-price-warning">Price missing on one or more sequences</div>`
                                : ""
                        }
                        ${j.notes ? `<div class="notes-preview">${j.notes}</div>` : ''}
                        <div class="mt-4 border-t pt-2">${seqBreakdown}</div>
                    </div>

                    <div class="flex flex-col gap-2 items-end">
                        <button onclick="handleUploadClick(event, ${j.id})" class="btn-upload-flat">Upload ↑</button>

                        <button type="button" onclick="event.stopPropagation(); event.preventDefault(); deleteDashboardJob(event, ${j.id}); return false;" class="btn-dashboard-delete">Delete</button>
                    </div>
                </div>
            </div>`;
    }).join('');

    filterFiles();
}

// Dashboard job actions
async function deleteDashboardJob(event, jobId) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    const job = jobs.find(function(j) {
        return j.id === jobId;
    });

    if (!job) {
        await appAlert("This survey file could not be found.", "Delete Unavailable");
        return;
    }

    const jobName =
        (job.customer && job.customer.displayName) ||
        job.name ||
        "this survey";

    const confirmed = await appConfirm(
        "Delete " + jobName + "? This removes the survey from this device.",
        "Delete Survey File"
    );

    if (!confirmed) return;

    jobs = jobs.filter(function(j) {
        return j.id !== jobId;
    });

    if (currentJob && currentJob.id === jobId) {
        currentJob = null;
    }

    saveToDevice();
    renderDashboard();

    await appAlert("Survey file deleted from this device.", "Deleted");
}

// Sequence actions
function addSequence() {
    const id = Date.now();

    currentJob.sequences.push({
        id: id,
        moveType: "",
        packOption: "",
        vol: 0,
        isSaved: false,
        collections: [currentJob.properties[0].id],
        deliveries: [currentJob.properties[1] ? currentJob.properties[1].id : currentJob.properties[0].id],
        schedule: createEmptySequenceSchedule(),
        quote: createEmptySequenceQuote()
    });

    activeSeqId = id;

    renderSequenceUI();
    renderInventorySequenceDropdown();
    renderInventoryDeliveryDropdown();
    renderScheduleSequenceDropdown();
    saveToDevice();
}

function copyInventoryItemsFromSequenceToSequence(sourceSequenceId, targetSequenceId) {
    if (!currentJob) return 0;

    if (!currentJob.inventory) {
        currentJob.inventory = {};
    }

    if (!Array.isArray(currentJob.inventory.items)) {
        currentJob.inventory.items = [];
    }

    const sourceItems = currentJob.inventory.items.filter(function(entry) {
        return String(entry.sequenceId) === String(sourceSequenceId);
    });

    if (!sourceItems.length) {
        return 0;
    }

    const copiedAt = Date.now();

    const copiedItems = sourceItems.map(function(entry, index) {
        const copiedEntry = JSON.parse(JSON.stringify(entry));

        copiedEntry.id = "raw_" + copiedAt + "_" + index + "_" + Math.random().toString(36).slice(2, 7);
        copiedEntry.sequenceId = targetSequenceId;

        return copiedEntry;
    });

    currentJob.inventory.items = currentJob.inventory.items.concat(copiedItems);

    return copiedItems.length;
}

function copyAdditionalCostLinesFromSequenceToSequence(sourceSequenceId, targetSequenceId) {
    const sourceState = ensureQuoteSequenceState(sourceSequenceId);
    const targetState = ensureQuoteSequenceState(targetSequenceId);

    if (!sourceState || !targetState) return;

    const sourceAdditionalLines = Array.isArray(sourceState.additionalCostLines)
        ? sourceState.additionalCostLines
        : [];

    targetState.additionalCostLines = sourceAdditionalLines.map(function(line) {
        const copiedLine = JSON.parse(JSON.stringify(line));

        copiedLine.id = createQuoteLineId();

        return copiedLine;
    });
}

let sequenceCopyFeedbackTimer = null;

function showSequenceCopyFeedback() {
    const feedbackEl = document.getElementById("sequence-copy-feedback");
    if (!feedbackEl) return;

    feedbackEl.innerText = "Sequence copied with inventory and additional costs.";
    feedbackEl.classList.add("show");

    if (sequenceCopyFeedbackTimer) {
        clearTimeout(sequenceCopyFeedbackTimer);
    }

    sequenceCopyFeedbackTimer = setTimeout(function() {
        feedbackEl.classList.remove("show");
    }, 3500);
}
function copySequence() {
    const sourceSequenceId = activeSeqId;
    const original = currentJob.sequences.find(s => s.id == sourceSequenceId);

    if (!original) return;

    const copy = JSON.parse(JSON.stringify(original));

    copy.schedule = copy.schedule || createEmptySequenceSchedule();
    copy.quote = copy.quote || createEmptySequenceQuote();

    copy.id = Date.now();
    copy.isSaved = false;

    copy.schedule.manualDays = Array.isArray(copy.schedule.manualDays)
        ? copy.schedule.manualDays.map(day => ({
            ...day,
            id: "day_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
            groupId: day.groupId || ("grp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7))
        }))
        : [];

    currentJob.sequences.push(copy);

    copyInventoryItemsFromSequenceToSequence(sourceSequenceId, copy.id);
    copyAdditionalCostLinesFromSequenceToSequence(sourceSequenceId, copy.id);

    activeSeqId = copy.id;

    if (currentJob.inventory) {
        currentJob.inventory.activeSequenceId = copy.id;
    }

    ensureCostingStore();
    currentJob.costingQuote.selectedSequenceId = String(copy.id);

    renderSequenceUI();
    renderInventorySequenceDropdown();
    renderInventoryDeliveryDropdown();
    renderScheduleSequenceDropdown();
    rebuildLiveInventoryFromSequence(activeSeqId);
    saveCalculatorFeedForActiveSequence();
    showSequenceCopyFeedback();
    saveToDevice();
}

function deleteSequence() {
    if (currentJob.sequences.length <= 1) return;

    currentJob.sequences = currentJob.sequences.filter(s => s.id != activeSeqId);
    activeSeqId = currentJob.sequences[0].id;

    renderSequenceUI();
    renderInventorySequenceDropdown();
    renderInventoryDeliveryDropdown();
    renderScheduleSequenceDropdown();
    saveToDevice();
}

// Property actions
function addProperty() {
    const newId = Date.now();

    currentJob.properties.push({ 
        id: newId, 
        label: "Add Address", 
        line1: "", 
        country: "United Kingdom", 
        contactName: "",
        contactPhone: "",
        isCore: false, 
        isSaved: false 
    });

    activePropId = newId; 

    renderAddressUI();
    saveToDevice();
}

function deleteProperty(id) {
    currentJob.properties = currentJob.properties.filter(p => p.id !== id);
    activePropId = currentJob.properties[0].id;

    renderAddressUI();
    saveToDevice();
}

function updateSeqField(f, v) {
    const seq = currentJob.sequences.find(s => s.id == activeSeqId);
    if (!seq) return;

    seq[f] = v;

    if (f === "moveType" && v === "Dom-Ex Store") {
        seq.packOption = "Unload Only";
    }

    if (f === "moveType" || f === "packOption") {
        markScheduleAutoBuildUpdateNeeded(
            "Move type or packing option has changed since this schedule was calculated.",
            false
        );
    }

    renderSequenceUI();
    renderInventorySequenceDropdown();
    saveToDevice();
}
function updateStop(type, idx, val) {
    currentJob.sequences.find(s => s.id == activeSeqId)[type][idx] = val;
}

function addStop(type) {
    currentJob.sequences.find(s => s.id == activeSeqId)[type].push(currentJob.properties[0].id);
    renderSequenceUI();
}

function removeStop(type, idx) {
    currentJob.sequences.find(s => s.id == activeSeqId)[type].splice(idx, 1);
    renderSequenceUI();
}

function updatePropLabel(v) {
    currentJob.properties.find(p => p.id === activePropId).label = v;
}

function updatePropData(f, v) {
    const prop = currentJob.properties.find(p => p.id === activePropId);
    prop[f] = v;

    const isCollectionAddress = activePropId === currentJob.properties[0].id;

    if (isCollectionAddress && (f === 'firstName' || f === 'surname')) {
        const firstName = (prop.firstName || '').trim();
        const surname = (prop.surname || '').trim();

        let newDisplayName = "";

        if (surname && firstName) {
            newDisplayName = `${surname}, ${firstName}`.toUpperCase();
        } else if (surname) {
            newDisplayName = surname.toUpperCase();
        } else if (firstName) {
            newDisplayName = firstName.toUpperCase();
        }

        currentJob.name = newDisplayName;

        if (!currentJob.customer) currentJob.customer = {};
        currentJob.customer.displayName = newDisplayName;
        currentJob.customer.firstName = firstName;
        currentJob.customer.surname = surname;

        const hdrName = document.getElementById('hdr-name');
        if (hdrName) hdrName.innerText = currentJob.customer.displayName || currentJob.name || "";
    }
}

function loadProperty(id) {
    activePropId = parseInt(id);
    renderAddressUI();
}

// Editor navigation
function loadSequence(id) {
    activeSeqId = id;
    loadManualScheduleFromActiveSequence();
    loadScheduleInputsFromActiveSequence();

    if (!currentJob.inventory) currentJob.inventory = {};

    currentJob.inventory.activeSequenceId = id;
    currentJob.inventory.activeDeliveryId = null;

    const qtyInput = document.getElementById("inv-qty");
    if (qtyInput) qtyInput.value = 1;

    renderSequenceUI();
    renderInventorySequenceDropdown();
    renderScheduleSequenceDropdown();
    renderInventoryDeliveryDropdown();

    saveInventoryContext();
    rebuildLiveInventoryFromSequence(activeSeqId);

    saveCalculatorFeedForActiveSequence();
    saveToDevice();
}

function triggerPulse(id) {
    const el = document.getElementById(id);

    if (el) {
        el.classList.remove('pulse-new');
        void el.offsetWidth;
        el.classList.add('pulse-new');
    }
}

function switchTab(t) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('content-' + t).classList.remove('hidden');
    document.getElementById('nav-' + t).classList.add('active');
    updateInventoryHeaderReorderVisibility(t);

    if (t === 'sequence') {
        if (!activeSeqId && currentJob && currentJob.inventory && currentJob.inventory.activeSequenceId) {
            activeSeqId = currentJob.inventory.activeSequenceId;
        }

        if (!activeSeqId) {
            setActiveSequenceToDefault();
        }

        renderSequenceUI();
    }

    if (t === 'address') {
        renderAddressUI();
    }

    if (t === 'inventory') {
        if (!currentJob.inventory) currentJob.inventory = {};

        const savedSequenceId = currentJob.inventory.activeSequenceId;
        const savedSequenceExists = savedSequenceId && currentJob.sequences.some(function(seq) {
            return String(seq.id) === String(savedSequenceId);
        });

        const hasReturnContext = (
            inventoryReturnContext &&
            inventoryReturnContext.sequenceId &&
            currentJob.sequences.some(function(seq) {
                return String(seq.id) === String(inventoryReturnContext.sequenceId);
            })
        );

        if (hasReturnContext) {
            activeSeqId = inventoryReturnContext.sequenceId;
            currentJob.inventory.activeSequenceId = inventoryReturnContext.sequenceId;
            currentJob.inventory.activeDeliveryId = inventoryReturnContext.deliveryId || null;
            currentJob.inventory.activeFloor = inventoryReturnContext.floorName || "Ground";
            currentJob.inventory.activeRoomName = inventoryReturnContext.roomName || "Hallway";
        } else if (savedSequenceExists) {
            activeSeqId = savedSequenceId;
        } else {
            setActiveSequenceToDefault();
            currentJob.inventory.activeSequenceId = activeSeqId;
        }

        renderInventorySequenceDropdown();
        renderInventoryDeliveryDropdown();
        renderInventoryRoomDropdown();
        renderInventoryFloorDropdown();
        renderInventoryButtons();
        rebuildLiveInventoryFromSequence(activeSeqId);
        syncInventoryDisplayFromSequence(activeSeqId);
        renderActionButtonStates();
        updateUndoButtonState();
        saveCalculatorFeedForActiveSequence();
    }

    if (t === 'schedule') {
        if (!activeSeqId && currentJob && currentJob.inventory && currentJob.inventory.activeSequenceId) {
            activeSeqId = currentJob.inventory.activeSequenceId;
        }
        if (!activeSeqId) {
            setActiveSequenceToDefault();
        }

        loadManualScheduleFromActiveSequence();
        loadScheduleInputsFromActiveSequence();
        saveCalculatorFeedForActiveSequence();
        renderScheduleSequenceDropdown();
        renderScheduleCalculator();
    }

    if (t === 'listed') {
        saveInventoryContext();

        const defaultSeqId = setActiveSequenceToDefault();
        listedSequenceFilter = defaultSeqId ? String(defaultSeqId) : "__all__";
        listedDeliveryFilter = "__all__";
        listedTextFilter = "";
        renderListedInventory();
    }

    if (t === 'quote') {
        ensureCostingStore();

        if (!currentJob.costingQuote.selectedSequenceId) {
            currentJob.costingQuote.selectedSequenceId = String(activeSeqId || getDefaultSequenceId() || "");
        }

        renderQuoteTab();
    }
}

// Manual job entry
function splitManualName(fullName) {
    const cleaned = (fullName || "").trim();

    if (!cleaned) {
        return { surname: "", firstName: "" };
    }

    if (cleaned.includes(",")) {
        const parts = cleaned.split(",");
        return {
            surname: (parts[0] || "").trim(),
            firstName: (parts.slice(1).join(",") || "").trim()
        };
    }

    // fallback if user forgets the comma
    const words = cleaned.split(/\s+/);
    return {
        surname: words[0] || "",
        firstName: words.slice(1).join(" ")
    };
}

function toggleManualArea() {
    const area = document.getElementById('manual-entry-area');
    area.style.display = (area.style.display === "block") ? "none" : "block";
    document.getElementById('timestamp-val').innerText = new Date().toLocaleString('en-GB');
}

function createManualJob() {
    const name = document.getElementById('m-name').value.trim();
    if (!name) return;

    const parsedName = splitManualName(name);
    const newProperties = createDefaultProperties();

    newProperties[0].firstName = parsedName.firstName;
    newProperties[0].surname = parsedName.surname;
    newProperties[0].clientName = name;

    const ref = document.getElementById('m-ref').value || "M-" + Math.floor(Math.random() * 900);
    const displayName = name.toUpperCase();

    const newJob = createEmptyJob({
        ref: ref,
        name: displayName,
        status: "pending",
        isNew: true,
        isManual: true,
        notes: "New manually created survey.",
        properties: newProperties,
        addresses: newProperties,
        customer: {
            displayName: displayName,
            firstName: parsedName.firstName,
            surname: parsedName.surname,
            salutation: "",
            homePhone: "",
            mobilePhone: "",
            email: ""
        },
        survey: {
            status: "pending",
            isNew: true,
            isManual: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: "New manually created survey."
        }
    });

    jobs.unshift(newJob);

    saveToDevice();
    renderDashboard();

    document.getElementById('m-name').value = "";
    document.getElementById('m-ref').value = "";

    toggleManualArea();
}

function exitToDashboard() {
    document.getElementById('view-editor').classList.add('hidden');
    document.getElementById('view-dashboard').classList.remove('hidden');
    renderDashboard();
}

// Simple costing helper
function calculateMoveCost() {
    let crew = parseFloat(document.getElementById("crew-cost").value) || 0;
    let vehicle = parseFloat(document.getElementById("vehicle-cost").value) || 0;
    let other = parseFloat(document.getElementById("other-costs").value) || 0;

    let total = crew + vehicle + other;
    document.getElementById("total-cost").value = total;
}

function getInventoryAddQty() {
    const qtyInput = document.getElementById("inv-qty");
    if (!qtyInput) return 1;

    const qty = parseInt(qtyInput.value, 10);
    return (Number.isFinite(qty) && qty > 0) ? qty : 1;
}
function addBox(boxCode) {
   const materialOnlyCodes = Object.keys(INVENTORY_MATERIAL_LABELS);

if (materialOnlyCodes.includes(boxCode)) {
    addInventoryMaterial(boxCode);
    return;
}

    const boxVolume = BOX_VOLUMES[boxCode];

    if (boxVolume === undefined || boxVolume === null) {
        return;
    }

    const clickedBtn =
        typeof event !== "undefined" && event && event.currentTarget
            ? event.currentTarget
            : null;

    const qtyInput = document.getElementById("inv-qty");
    const qty = getInventoryAddQty();

    const itemNameMap = {
        "AP": "AP BOX",
        "CG": "CG BOX",
        "BOOK": "BOOK BOX",
        "LINEN": "LINEN BOX",
        "WR": "WR BOX",
        "PICTURE": "PICTURE PACK"
    };

    const itemName = itemNameMap[boxCode] || (boxCode + " BOX");

    const inventoryContext = getActiveInventoryContext();
    const deliveryId = inventoryContext.deliveryId;
    const roomName = inventoryContext.roomName;
    const floorName = inventoryContext.floorName;
    const autoExportWrap = activeSequenceUsesFullExportPackAndWrap();

    const liveKey = getLiveInventoryGroupKey({
        itemName: itemName,
        deliveryId: deliveryId,
        roomName: roomName,
        floorName: floorName,
        unitVolume: boxVolume,
        excluded: false,
        dismantle: false,
        expWrap: false,
        note: "",
        damage: "",
        pianoDetails: null,
        crated: false,
        crateDims: null
    });

    lastAddedItemName = itemName;

    let existing = inventoryItems.find(function(i) {
        return i.liveKey === liveKey;
    });

    const previousQty = existing ? existing.qty : 0;

    if (existing) {
        existing.qty += qty;
    } else {
        inventoryItems.push({
            liveKey: liveKey,
            item: itemName,
            displayName: itemName,
            volume: boxVolume,
            qty: qty,
            roomName: roomName,
            floorName: floorName,
            deliveryId: deliveryId,
            dismantle: false,
            expWrap: false,
            excluded: false,
            note: "",
            damage: "",
            pianoDetails: null,
            crated: false,
            crateDims: null
        });
    }

    const rawEntryId = saveRawInventoryEntry({
        sequenceId: activeSeqId,
        deliveryId: deliveryId,
        roomName: roomName,
        floorName: floorName,
        itemName: itemName,
        qty: qty,
        unitVolume: boxVolume,
        totalVolume: boxVolume * qty,
        kind: "box"
    });

    inventoryHistory.push({
        type: "item",
        itemName: itemName,
        liveKey: liveKey,
        qtyAdded: qty,
        previousQty: previousQty,
        rawEntryId: rawEntryId
    });

    currentItemVolume = boxVolume * qty;
    recalculateTotalVolume();

    updateInventoryDisplay(qty + " X " + itemName);
    triggerInventoryPulse("qty", "blue");
    triggerInventoryPulse("total", "blue");
    pulseInventoryButton(clickedBtn);

    if (qtyInput) qtyInput.value = 1;

    renderActionButtonStates();
    updateUndoButtonState();
    saveCalculatorFeedForActiveSequence();
}

function addVolume(amount) {
    const clickedBtn =
        typeof event !== "undefined" && event && event.currentTarget
            ? event.currentTarget
            : null;
    const qtyInput = document.getElementById("inv-qty");
    const qty = getInventoryAddQty();
    const inventoryContext = getActiveInventoryContext();

    const volumeEntryName = "VOL-" + amount + "-" + Date.now();
    const displayName = amount + " CUFT";

    lastAddedItemName = volumeEntryName;

    inventoryItems.push({
        item: volumeEntryName,
        displayName: displayName,
        volume: amount,
        qty: qty,
        isManualVolume: true
    });

    const rawEntryId = saveRawInventoryEntry({
        sequenceId: inventoryContext.sequenceId,
        deliveryId: inventoryContext.deliveryId,
        roomName: inventoryContext.roomName,
        floorName: inventoryContext.floorName,
        itemName: displayName,
        qty: qty,
        unitVolume: amount,
        totalVolume: amount * qty,
        kind: "volume"
    });

    inventoryHistory.push({
        type: "volume",
        itemName: volumeEntryName,
        displayName: displayName,
        qtyAdded: qty,
        unitVolume: amount,
        rawEntryId: rawEntryId
    });

    currentItemVolume = amount * qty;
    recalculateTotalVolume();

    updateInventoryDisplay("+ " + qty + " X " + displayName);
    triggerInventoryPulse("qty", "blue");
    triggerInventoryPulse("total", "blue");
    pulseInventoryButton(clickedBtn);

    if (qtyInput) qtyInput.value = 1;
    renderActionButtonStates();
    updateUndoButtonState();
    saveCalculatorFeedForActiveSequence();
}

function isWardrobeRawEntry(rawEntry) {
    if (!rawEntry) return false;
    return isWardrobeInventoryItem(rawEntry.itemName);
}
function isBedInventoryItem(itemName) {
    const name = String(itemName || "").trim();
    return [
        "Bed (Single)",
        "Bed (Double)",
        "Bed (Queensize)",
        "Bed (Kingsize)",
        "Bed (SuperKing)"
    ].includes(name);
}

function isBedRawEntry(rawEntry) {
    if (!rawEntry) return false;
    return isBedInventoryItem(rawEntry.itemName);
}
function isElectricBedType(bedType) {
    return String(bedType || "").trim() === "Electric Motor / TV";
}

function isPianoInventoryItem(itemName) {
    const clean = String(itemName || "").trim().toUpperCase();

    return (
        clean === "PIANO (UPRIGHT)" ||
        clean === "PIANO (ELECTRIC)" ||
        clean === "PIANO (BABY GRAND)" ||
        clean === "PIANO (GRAND)"
    );
}

function isPianoRawEntry(rawEntry) {
    if (!rawEntry) return false;
    return isPianoInventoryItem(rawEntry.itemName);
}

let pendingPianoItemName = "";
let pendingPianoDetails = null;

function createDefaultPianoDetails() {
    return {
        collection: {
            floor: "ground",
            stairs: false,
            lift: false,
            tightAccess: false,
            specialistRequired: false
        },
        delivery: {
            floor: "ground",
            stairs: false,
            lift: false,
            tightAccess: false,
            specialistRequired: false
        }
    };
}

function getPianoFloorLabel(value) {
    const labels = {
        basement: "Basement",
        ground: "Ground",
        first: "1st",
        second: "2nd",
        above_second: "Above 2nd"
    };

    return labels[value] || "Ground";
}
let pendingSafeItemName = "";
let pendingSafeDetails = null;

function openSafeModalForInventoryItem(itemName) {
    closeAllMovePilotModals("safe-overlay");

    const overlay = document.getElementById("safe-overlay");
    const subtitle = document.getElementById("safe-subtitle");

    if (!overlay) return;

    pendingSafeItemName = itemName;
    pendingSafeDetails = createDefaultSafeDetails();

    if (subtitle) {
        subtitle.innerText = "Set safe access and weight details for " + itemName;
    }

    resetSafeModalFields();

    overlay.style.display = "flex";
}

function closeSafeModal() {
    const overlay = document.getElementById("safe-overlay");

    if (overlay) {
        overlay.style.display = "none";
    }

    setModalErrorText("safe-error-text", "");

    pendingSafeItemName = "";
    pendingSafeDetails = null;
}

function resetSafeModalFields() {
    const collectionFloorEl = document.getElementById("safe-collection-floor");
    const deliveryFloorEl = document.getElementById("safe-delivery-floor");
    const weightEl = document.getElementById("safe-weight-kg");

    if (collectionFloorEl) collectionFloorEl.value = "ground";
    if (deliveryFloorEl) deliveryFloorEl.value = "ground";
    if (weightEl) weightEl.value = "";
}

function readSafeModalDetails() {
    if (!pendingSafeDetails) {
        pendingSafeDetails = createDefaultSafeDetails();
    }

    const collectionFloorEl = document.getElementById("safe-collection-floor");
    const deliveryFloorEl = document.getElementById("safe-delivery-floor");
    const weightEl = document.getElementById("safe-weight-kg");

    pendingSafeDetails.collection.floor = collectionFloorEl ? collectionFloorEl.value : "ground";
    pendingSafeDetails.delivery.floor = deliveryFloorEl ? deliveryFloorEl.value : "ground";
    pendingSafeDetails.weightKg = weightEl ? String(weightEl.value || "").trim() : "";

    return JSON.parse(JSON.stringify(pendingSafeDetails));
}

function saveSafeModal() {
    const itemName = pendingSafeItemName;
    const safeDetails = readSafeModalDetails();

    if (!itemName) {
        setModalErrorText("safe-error-text", "No safe item selected.");
        return;
    }

    const weightText = String(safeDetails.weightKg || "").trim();

    if (weightText) {
        const weightNumber = Number(weightText);

        if (isNaN(weightNumber) || weightNumber < 0) {
            setModalErrorText("safe-error-text", "Enter a valid weight in kg, or leave blank if unknown.");
            return;
        }
    }

    setModalErrorText("safe-error-text", "");

    closeSafeModal();

    addInventoryItem(itemName, {
        safeDetails: safeDetails
    });
}

function openPianoModalForInventoryItem(itemName) {
    closeAllMovePilotModals("piano-overlay");
    const overlay = document.getElementById("piano-overlay");
    const subtitle = document.getElementById("piano-subtitle");

    if (!overlay) return;

    pendingPianoItemName = itemName;
    pendingPianoDetails = createDefaultPianoDetails();

    if (subtitle) {
        subtitle.innerText = "Set collection and delivery access for " + itemName;
    }

    resetPianoModalFields();
    renderPianoModalState();

    overlay.style.display = "flex";
}

function closePianoModal() {
    const overlay = document.getElementById("piano-overlay");

    if (overlay) {
        overlay.style.display = "none";
    }

    setModalErrorText("piano-error-text", "");

    pendingPianoItemName = "";
    pendingPianoDetails = null;
}

function resetPianoModalFields() {
    const collectionFloorEl = document.getElementById("piano-collection-floor");
    const deliveryFloorEl = document.getElementById("piano-delivery-floor");

    if (collectionFloorEl) collectionFloorEl.value = "ground";
    if (deliveryFloorEl) deliveryFloorEl.value = "ground";
}

function handlePianoFloorChange(side) {
    if (!pendingPianoDetails) {
        pendingPianoDetails = createDefaultPianoDetails();
    }

    if (!pendingPianoDetails[side]) return;

    const floorEl = document.getElementById("piano-" + side + "-floor");
    const selectedFloor = floorEl ? floorEl.value : "ground";

    pendingPianoDetails[side].floor = selectedFloor;

    if (selectedFloor !== "ground") {
        pendingPianoDetails[side].specialistRequired = true;
    }

    renderPianoModalState();
}
function togglePianoOption(side, optionName) {
    if (!pendingPianoDetails) {
        pendingPianoDetails = createDefaultPianoDetails();
    }

    if (!pendingPianoDetails[side]) return;

    pendingPianoDetails[side][optionName] = !pendingPianoDetails[side][optionName];

    renderPianoModalState();
}

function renderPianoModalState() {
    if (!pendingPianoDetails) return;

    ["collection", "delivery"].forEach(function(side) {
        ["stairs", "lift", "tightAccess", "specialistRequired"].forEach(function(optionName) {
            const btn = document.getElementById("piano-" + side + "-" + optionName);
            if (!btn) return;

            if (pendingPianoDetails[side][optionName]) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
    });
}

function readPianoModalDetails() {
    if (!pendingPianoDetails) {
        pendingPianoDetails = createDefaultPianoDetails();
    }

    const collectionFloorEl = document.getElementById("piano-collection-floor");
    const deliveryFloorEl = document.getElementById("piano-delivery-floor");

    pendingPianoDetails.collection.floor = collectionFloorEl ? collectionFloorEl.value : "ground";
pendingPianoDetails.delivery.floor = deliveryFloorEl ? deliveryFloorEl.value : "ground";

// Specialist is auto-selected when a non-ground floor is chosen,
// but the user can manually deselect it before saving.

return JSON.parse(JSON.stringify(pendingPianoDetails));
}

function savePianoModal() {
    const itemName = pendingPianoItemName;
    const pianoDetails = readPianoModalDetails();

    if (!itemName) {
        setModalErrorText("piano-error-text", "No piano item selected.");
        return;
    }

    closePianoModal();

    addInventoryItem(itemName, {
        pianoDetails: pianoDetails
    });
}
function activeSequenceUsesFullExportPackAndWrap() {
    if (!currentJob || !activeSeqId || !Array.isArray(currentJob.sequences)) {
        return false;
    }

    const seq = currentJob.sequences.find(function(sequence) {
        return String(sequence.id) === String(activeSeqId);
    });

    if (!seq) return false;

    return String(seq.packOption || "").trim().toLowerCase() === "full export pack and wrap";
}
function addInventoryItem(itemName, extraData) {
        let item = furnitureDB.find(function(i) {
        return i.item === itemName;
    });
    if (!item) return;

    extraData = extraData || {};

    if (isPianoInventoryItem(item.item) && !extraData.pianoDetails) {
        openPianoModalForInventoryItem(item.item);
        return;
    }
    if (isSafeInventoryItem(item.item) && !extraData.safeDetails) {
    openSafeModalForInventoryItem(item.item);
    return;
}

    const clickedBtn =
        typeof event !== "undefined" && event && event.currentTarget
            ? event.currentTarget
            : null;
    const qtyInput = document.getElementById("inv-qty");
    const qty = getInventoryAddQty();

    const inventoryContext = getActiveInventoryContext();
    const deliveryId = inventoryContext.deliveryId;
    const roomName = inventoryContext.roomName;
    const floorName = inventoryContext.floorName;
    const autoExportWrap = activeSequenceUsesFullExportPackAndWrap();

    const liveKey = getLiveInventoryGroupKey({
    itemName: item.item,
    deliveryId: deliveryId,
    roomName: roomName,
    floorName: floorName,
    unitVolume: item.volume,
    excluded: false,
    dismantle: false,
    expWrap: autoExportWrap,
    note: "",
    damage: "",
    pianoDetails: extraData.pianoDetails || null,
safeDetails: extraData.safeDetails || null,
crated: false,
crateDims: null
});

    lastAddedItemName = itemName;

    let existing = inventoryItems.find(function(i) {
        return i.liveKey === liveKey;
    });
    const previousQty = existing ? existing.qty : 0;

    if (existing) {
        existing.qty += qty;
    } else {
        inventoryItems.push({
            liveKey: liveKey,
            item: item.item,
            displayName: item.item,
            volume: item.volume,
            qty: qty,
            roomName: roomName,
            floorName: floorName,
            deliveryId: deliveryId,
            dismantle: false,
            expWrap: autoExportWrap,
            excluded: false,
            note: "",
            damage: "",
            crated: false,
            crateDims: null,
            pianoDetails: extraData.pianoDetails || null,
safeDetails: extraData.safeDetails || null
        });
    }

    const rawEntryId = saveRawInventoryEntry({
    sequenceId: inventoryContext.sequenceId,
    deliveryId: deliveryId,
    roomName: roomName,
    floorName: floorName,
    itemName: item.item,
    qty: qty,
    unitVolume: item.volume,
    totalVolume: item.volume * qty,
    kind: "item",
    expWrap: autoExportWrap,
    pianoDetails: extraData.pianoDetails || null,
    safeDetails: extraData.safeDetails || null
});

    inventoryHistory.push({
        type: "item",
        itemName: itemName,
        liveKey: liveKey,
        qtyAdded: qty,
        previousQty: previousQty,
        rawEntryId: rawEntryId
    });

    currentItemVolume = item.volume * qty;
    recalculateTotalVolume();

    updateInventoryDisplay(
    qty + " X " + item.item.toUpperCase() + (autoExportWrap ? " [EXP WRAP]" : "")
);
    triggerInventoryPulse("qty", "blue");
    triggerInventoryPulse("total", "blue");
    pulseInventoryButton(clickedBtn);

    if (qtyInput) qtyInput.value = 1;
renderActionButtonStates();
updateUndoButtonState();
markCustomerSignatureInventoryChanged();

markScheduleAutoBuildUpdateNeeded(
    "Inventory has changed since this schedule was calculated.",
    true
);

saveCalculatorFeedForActiveSequence();

if (isBedInventoryItem(item.item)) {
    addOrEditBedType();
}
if (isWardrobeInventoryItem(item.item)) {
    addOrEditWardrobeType();
}
}
const CUSTOM_INVENTORY_ITEMS_STORAGE_KEY = "MOVEPILOT_CUSTOM_INVENTORY_ITEMS";
let pendingCustomInventoryDeleteId = "";

function getCustomInventoryItems() {
    try {
        const raw = localStorage.getItem(CUSTOM_INVENTORY_ITEMS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];

        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.warn("Could not load custom inventory items", err);
        return [];
    }
}

function saveCustomInventoryItems(items) {
    try {
        localStorage.setItem(
            CUSTOM_INVENTORY_ITEMS_STORAGE_KEY,
            JSON.stringify(Array.isArray(items) ? items : [])
        );
    } catch (err) {
        console.warn("Could not save custom inventory items", err);
    }
}

function createCustomInventoryItemId() {
    return "custom_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}

function openCustomInventoryItemModal() {
    closeAllMovePilotModals("custom-item-overlay");

    const overlay = document.getElementById("custom-item-overlay");
    const nameInput = document.getElementById("custom-item-name-input");
    const volumeInput = document.getElementById("custom-item-volume-input");

    if (!overlay || !nameInput || !volumeInput) return;

    nameInput.value = "";
    volumeInput.value = "";
    setModalErrorText("custom-item-error-text", "");

    nameInput.oninput = function () {
        setModalErrorText("custom-item-error-text", "");
    };

    volumeInput.oninput = function () {
        setModalErrorText("custom-item-error-text", "");
    };

    overlay.style.display = "flex";

    setTimeout(function () {
        nameInput.focus();
    }, 50);
}

function closeCustomInventoryItemModal() {
    const overlay = document.getElementById("custom-item-overlay");
    const nameInput = document.getElementById("custom-item-name-input");
    const volumeInput = document.getElementById("custom-item-volume-input");

    if (overlay) overlay.style.display = "none";
    if (nameInput) nameInput.value = "";
    if (volumeInput) volumeInput.value = "";
    setModalErrorText("custom-item-error-text", "");
}

function saveCustomInventoryItemModal() {
    const nameInput = document.getElementById("custom-item-name-input");
    const volumeInput = document.getElementById("custom-item-volume-input");

    if (!nameInput || !volumeInput) return;

    const cleanName = nameInput.value.trim();
    const unitVolume = Number(volumeInput.value);

    if (!cleanName && (!volumeInput.value || String(volumeInput.value).trim() === "")) {
        setModalErrorText("custom-item-error-text", "Enter item name and unit volume");
        return;
    }

    if (!cleanName) {
        setModalErrorText("custom-item-error-text", "Enter an item name");
        return;
    }

    if (isNaN(unitVolume) || unitVolume <= 0) {
        setModalErrorText("custom-item-error-text", "Unit volume must be greater than 0");
        return;
    }

    const items = getCustomInventoryItems();
    const duplicate = items.find(function(item) {
        return String(item.name || "").trim().toLowerCase() === cleanName.toLowerCase();
    });

    if (duplicate) {
        duplicate.name = cleanName;
        duplicate.volume = unitVolume;
    } else {
        items.push({
            id: createCustomInventoryItemId(),
            name: cleanName,
            volume: unitVolume
        });
    }

    saveCustomInventoryItems(items);
    closeCustomInventoryItemModal();
    renderInventoryButtons();
}

function addSavedCustomInventoryItem(customItemId) {
    const item = getCustomInventoryItems().find(function(customItem) {
        return String(customItem.id) === String(customItemId);
    });

    if (!item) return;

    const nameInput = document.getElementById("misc-name-input");
    const volumeInput = document.getElementById("misc-volume-input");

    if (!nameInput || !volumeInput) return;

    nameInput.value = String(item.name || "").trim();
    volumeInput.value = Number(item.volume || 0);

    saveMiscModal();
}
function openDeleteCustomInventoryItemModal() {
    closeAllMovePilotModals("custom-item-delete-overlay");

    const overlay = document.getElementById("custom-item-delete-overlay");
    if (!overlay) return;

    renderCustomInventoryDeleteList();
    overlay.style.display = "flex";
}

function closeDeleteCustomInventoryItemModal() {
    const overlay = document.getElementById("custom-item-delete-overlay");
    if (overlay) overlay.style.display = "none";

    pendingCustomInventoryDeleteId = "";
}

function renderCustomInventoryDeleteList() {
    const list = document.getElementById("custom-item-delete-list");
    if (!list) return;

    const items = getCustomInventoryItems();

    if (!items.length) {
        pendingCustomInventoryDeleteId = "";

        list.innerHTML = `
            <div class="custom-item-delete-empty">
                No custom items saved
            </div>
        `;
        return;
    }

    list.innerHTML = items.map(function(item) {
        const safeId = String(item.id || "").replace(/'/g, "\\'");
        const safeName = escapeHtml(String(item.name || "").trim());
        const safeVolume = escapeHtml(String(item.volume || 0));
        const isPendingDelete = String(item.id || "") === String(pendingCustomInventoryDeleteId || "");

        if (isPendingDelete) {
            return `
                <div class="custom-item-delete-row custom-item-delete-row-confirm">
                    <div>
                        <div class="custom-item-delete-name">Delete ${safeName}?</div>
                        <div class="custom-item-delete-volume">${safeVolume} CUFT · This only removes the saved button</div>
                    </div>

                    <div class="custom-item-delete-confirm-actions">
                        <button
                            type="button"
                            class="custom-item-delete-cancel-btn"
                            onclick="cancelDeleteCustomInventoryItem()"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            class="custom-item-delete-confirm-btn"
                            onclick="confirmDeleteCustomInventoryItem('${safeId}')"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="custom-item-delete-row">
                <div>
                    <div class="custom-item-delete-name">${safeName}</div>
                    <div class="custom-item-delete-volume">${safeVolume} CUFT</div>
                </div>

                <button
                    type="button"
                    class="custom-item-delete-btn"
                    onclick="deleteCustomInventoryItem('${safeId}')"
                >
                    Delete
                </button>
            </div>
        `;
    }).join("");
}

function deleteCustomInventoryItem(customItemId) {
    pendingCustomInventoryDeleteId = String(customItemId || "");
    renderCustomInventoryDeleteList();
}

function cancelDeleteCustomInventoryItem() {
    pendingCustomInventoryDeleteId = "";
    renderCustomInventoryDeleteList();
}

function confirmDeleteCustomInventoryItem(customItemId) {
    const items = getCustomInventoryItems();

    const remainingItems = items.filter(function(item) {
        return String(item.id) !== String(customItemId);
    });

    pendingCustomInventoryDeleteId = "";

    saveCustomInventoryItems(remainingItems);
    renderInventoryButtons();
    renderCustomInventoryDeleteList();
}
function addMiscItem() {
    closeAllMovePilotModals("misc-overlay");
    const overlay = document.getElementById("misc-overlay");
    const nameInput = document.getElementById("misc-name-input");
    const volumeInput = document.getElementById("misc-volume-input");

    if (!overlay || !nameInput || !volumeInput) return;

    nameInput.value = "";
    volumeInput.value = "";
    setModalErrorText("misc-error-text", "");

    nameInput.oninput = function () {
    setModalErrorText("misc-error-text", "");
};

volumeInput.oninput = function () {
    setModalErrorText("misc-error-text", "");
};

overlay.style.display = "flex";

setTimeout(function () {
    nameInput.focus();
}, 50);
}
function setModalErrorText(elementId, message) {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (!message) {
        el.style.display = "none";
        el.innerText = "";
        return;
    }

    el.innerText = message;
    el.style.display = "block";
}

function closeMiscModal() {
    const overlay = document.getElementById("misc-overlay");
    const nameInput = document.getElementById("misc-name-input");
    const volumeInput = document.getElementById("misc-volume-input");

    if (overlay) overlay.style.display = "none";
    if (nameInput) nameInput.value = "";
    if (volumeInput) volumeInput.value = "";
    setModalErrorText("misc-error-text", "");
}

function saveMiscModal() {
    if (!currentJob) return;

    const nameInput = document.getElementById("misc-name-input");
    const volumeInput = document.getElementById("misc-volume-input");
    const qtyInput = document.getElementById("inv-qty");

    if (!nameInput || !volumeInput) return;

    const cleanName = nameInput.value.trim();
    const unitVolume = Number(volumeInput.value);

    if (!cleanName && (!volumeInput.value || String(volumeInput.value).trim() === "")) {
        setModalErrorText("misc-error-text", "Enter item name and unit volume");
        return;
    }

    if (!cleanName) {
        setModalErrorText("misc-error-text", "Enter an item name");
        return;
    }

    if (isNaN(unitVolume) || unitVolume <= 0) {
        setModalErrorText("misc-error-text", "Unit volume must be greater than 0");
        return;
    }

    setModalErrorText("misc-error-text", "");

    const qty = getInventoryAddQty();
    const miscKey = "MISC-" + cleanName.toUpperCase();

    const deliveryId = currentJob && currentJob.inventory ? currentJob.inventory.activeDeliveryId : "";
    const roomName = currentJob && currentJob.inventory ? currentJob.inventory.activeRoomName : "";
    const floorName = currentJob && currentJob.inventory ? currentJob.inventory.activeFloor : "";

    const liveKey = getLiveInventoryGroupKey({
        itemName: cleanName,
        deliveryId: deliveryId,
        roomName: roomName,
        floorName: floorName,
        unitVolume: unitVolume,
        excluded: false,
        dismantle: false,
        expWrap: false,
        disconnect: false,
        handyman: false,
        note: "",
        damage: "",
        bedType: "",
        wardrobeTypes: [],
        pianoDetails: null,
        crated: false,
        crateDims: null
    });

    lastAddedItemName = miscKey;

    let existing = inventoryItems.find(function(i) {
        return i.liveKey === liveKey;
    });

    const previousQty = existing ? existing.qty : 0;

    if (existing) {
        existing.qty += qty;
        existing.volume = unitVolume;
    } else {
        inventoryItems.push({
            liveKey: liveKey,
            item: miscKey,
            displayName: cleanName,
            volume: unitVolume,
            qty: qty,
            isMisc: true,
            roomName: roomName,
            floorName: floorName,
            deliveryId: deliveryId,
            dismantle: false,
            expWrap: false,
            disconnect: false,
            handyman: false,
            excluded: false,
            note: "",
            damage: "",
            bedType: "",
            wardrobeTypes: [],
            pianoDetails: null,
            crated: false,
            crateDims: null
        });
    }

    const rawEntryId = saveRawInventoryEntry({
        sequenceId: activeSeqId,
        deliveryId: deliveryId,
        roomName: roomName,
        floorName: floorName,
        itemName: cleanName,
        qty: qty,
        unitVolume: unitVolume,
        totalVolume: unitVolume * qty,
        kind: "misc",
        dismantle: false,
        expWrap: false,
        disconnect: false,
        handyman: false,
        excluded: false,
        note: "",
        damage: "",
        bedType: "",
        wardrobeTypes: [],
        pianoDetails: null,
        crated: false,
        crateDims: null
    });

    inventoryHistory.push({
        type: "item",
        itemName: miscKey,
        liveKey: liveKey,
        qtyAdded: qty,
        previousQty: previousQty,
        rawEntryId: rawEntryId
    });

    syncLiveInventoryFromRawForActiveSequence();
    recalculateTotalVolume();
    refreshCurrentInventorySelectionDisplay();

    updateInventoryDisplay(qty + " X " + cleanName.toUpperCase());

    triggerInventoryPulse("current", "blue");
    triggerInventoryPulse("total", "blue");
    updateUndoButtonState();
    renderActionButtonStates();
    saveCalculatorFeedForActiveSequence();
    saveToDevice();

    if (qtyInput) qtyInput.value = 1;

    closeMiscModal();
}
function addInventoryNote() {
    const rawEntry = getLastRawInventoryEntry();
    if (!rawEntry) return;
    if (rawEntry.kind === "note") return;

    const overlay = document.getElementById("note-overlay");
    const input = document.getElementById("note-input");

    if (!overlay || !input) return;

    input.value = rawEntry.note || "";

input.oninput = function () {
    setModalErrorText("note-error-text", "");
};

setModalErrorText("note-error-text", "");
overlay.style.display = "flex";

    setTimeout(function () {
        input.focus();
        input.selectionStart = input.value.length;
        input.selectionEnd = input.value.length;
    }, 50);
}
function addOrEditCrate() {
    const rawEntry = getLastRawInventoryEntry();
    if (!rawEntry) return;
    if (rawEntry.kind === "note") return;

    const overlay = document.getElementById("crate-overlay");
    const lengthInput = document.getElementById("crate-length");
    const widthInput = document.getElementById("crate-width");
    const heightInput = document.getElementById("crate-height");

    if (!overlay || !lengthInput || !widthInput || !heightInput) return;

    const existing = rawEntry.crateDims || {};

    selectedCrateUnit = existing.unit || "IN";
    setCrateUnit(selectedCrateUnit);

    lengthInput.value = existing.l || "";
widthInput.value = existing.w || "";
heightInput.value = existing.h || "";

lengthInput.oninput = function () {
    setModalErrorText("crate-error-text", "");
};
widthInput.oninput = function () {
    setModalErrorText("crate-error-text", "");
};
heightInput.oninput = function () {
    setModalErrorText("crate-error-text", "");
};

setModalErrorText("crate-error-text", "");

overlay.style.display = "flex";
}
function closeCrateModal() {
    const overlay = document.getElementById("crate-overlay");
    const lengthInput = document.getElementById("crate-length");
    const widthInput = document.getElementById("crate-width");
    const heightInput = document.getElementById("crate-height");

    if (overlay) overlay.style.display = "none";
    if (lengthInput) lengthInput.value = "";
    if (widthInput) widthInput.value = "";
    if (heightInput) heightInput.value = "";

    setModalErrorText("crate-error-text", "");

    selectedCrateUnit = "IN";
    listedCrateEditEntryKey = "";
    setCrateUnit("IN");
}

function setCrateUnit(unit) {
    selectedCrateUnit = unit;

    const inBtn = document.getElementById("crate-unit-in");
    const cmBtn = document.getElementById("crate-unit-cm");

    if (inBtn) inBtn.classList.toggle("active", unit === "IN");
    if (cmBtn) cmBtn.classList.toggle("active", unit === "CM");
}

function saveCrateModal() {
    if (listedCrateEditEntryKey) {
        saveListedCrateModal();
        return;
    }

    const rawEntry = getLastRawInventoryEntry();
    if (!rawEntry) return;
    if (rawEntry.kind === "note") return;

    const lengthInput = document.getElementById("crate-length");
    const widthInput = document.getElementById("crate-width");
    const heightInput = document.getElementById("crate-height");

    if (!lengthInput || !widthInput || !heightInput) return;

    const l = parseFloat(lengthInput.value);
    const w = parseFloat(widthInput.value);
    const h = parseFloat(heightInput.value);

    if (
        (!lengthInput.value || String(lengthInput.value).trim() === "") &&
        (!widthInput.value || String(widthInput.value).trim() === "") &&
        (!heightInput.value || String(heightInput.value).trim() === "")
    ) {
        setModalErrorText("crate-error-text", "Enter length, width and height");
        return;
    }

    if (isNaN(l) || isNaN(w) || isNaN(h)) {
        setModalErrorText("crate-error-text", "Enter valid crate dimensions");
        return;
    }

    if (l <= 0 || w <= 0 || h <= 0) {
        setModalErrorText("crate-error-text", "All dimensions must be greater than 0");
        return;
    }

    setModalErrorText("crate-error-text", "");

    rawEntry.crated = true;
    rawEntry.crateDims = {
        l: l,
        w: w,
        h: h,
        unit: selectedCrateUnit
    };

    saveToDevice();
    syncLiveInventoryFromRawForActiveSequence();
    recalculateTotalVolume();
    refreshCurrentInventorySelectionDisplay();
    renderActionButtonStates();

    triggerInventoryPulse("current", "blue");
    triggerInventoryPulse("total", "blue");
    updateUndoButtonState();
    saveCalculatorFeedForActiveSequence();

    closeCrateModal();
}
function openListedCrateModal(entryKey) {
    const mergedEntry = window.__listedEntryMap && window.__listedEntryMap[entryKey];
    if (!mergedEntry) return;

    setInventoryReturnContextFromEntry(mergedEntry);

    const overlay = document.getElementById("crate-overlay");
    const lengthInput = document.getElementById("crate-length");
    const widthInput = document.getElementById("crate-width");
    const heightInput = document.getElementById("crate-height");

    if (!overlay || !lengthInput || !widthInput || !heightInput) return;

    const existing = mergedEntry.crateDims || {};

    listedCrateEditEntryKey = entryKey;
    selectedCrateUnit = existing.unit || "IN";
    setCrateUnit(selectedCrateUnit);

    lengthInput.value = existing.l || "";
    widthInput.value = existing.w || "";
    heightInput.value = existing.h || "";

    lengthInput.oninput = function () {
        setModalErrorText("crate-error-text", "");
    };
    widthInput.oninput = function () {
        setModalErrorText("crate-error-text", "");
    };
    heightInput.oninput = function () {
        setModalErrorText("crate-error-text", "");
    };

    setModalErrorText("crate-error-text", "");
    overlay.style.display = "flex";
}

function saveListedCrateModal() {
    const mergedEntry = window.__listedEntryMap && window.__listedEntryMap[listedCrateEditEntryKey];
    if (!mergedEntry) return;

    const lengthInput = document.getElementById("crate-length");
    const widthInput = document.getElementById("crate-width");
    const heightInput = document.getElementById("crate-height");

    if (!lengthInput || !widthInput || !heightInput) return;

    const l = parseFloat(lengthInput.value);
    const w = parseFloat(widthInput.value);
    const h = parseFloat(heightInput.value);

    if (
        (!lengthInput.value || String(lengthInput.value).trim() === "") &&
        (!widthInput.value || String(widthInput.value).trim() === "") &&
        (!heightInput.value || String(heightInput.value).trim() === "")
    ) {
        setModalErrorText("crate-error-text", "Enter length, width and height");
        return;
    }

    if (isNaN(l) || isNaN(w) || isNaN(h)) {
        setModalErrorText("crate-error-text", "Enter valid crate dimensions");
        return;
    }

    if (l <= 0 || w <= 0 || h <= 0) {
        setModalErrorText("crate-error-text", "All dimensions must be greater than 0");
        return;
    }

    setModalErrorText("crate-error-text", "");

    const rawMatches = getRawEntriesForListedEntry(mergedEntry);
    if (!rawMatches.length) return;

    rawMatches.forEach(function(raw) {
        raw.crated = true;
        raw.crateDims = {
            l: l,
            w: w,
            h: h,
            unit: selectedCrateUnit
        };
    });

    saveToDevice();

    if (String(activeSeqId || "") === String(mergedEntry.sequenceId || "")) {
        rebuildLiveInventoryFromSequence(activeSeqId);
    }

    renderListedInventory();
    renderActionButtonStates();
    updateUndoButtonState();
    saveCalculatorFeedForActiveSequence();
    closeCrateModal();
}
function openAppSettingsModal() {
    populateAppSettingsModal();

    const overlay = document.getElementById("app-settings-overlay");
    if (!overlay) return;

    overlay.style.display = "flex";

    setTimeout(function() {
        initSurveyorSignaturePad();
    }, 0);
}
function getAppActivationStatusLabel(settings) {
    const cleanCode = String(settings.activationCode || "").trim();

    if (
        typeof MOVEPILOT_DEV_SKIP_ACTIVATION !== "undefined" &&
        MOVEPILOT_DEV_SKIP_ACTIVATION
    ) {
        return cleanCode
            ? "Dev Mode · Code Saved Locally"
            : "Dev Mode";
    }

    if (cleanCode) {
        return "Activation Code Saved Locally";
    }

    return "Not Activated";
}
function populateAppSettingsModal() {
    const settings = getAppSettings();

    const activationInput = document.getElementById("app-setting-activation-code");
const activationStatus = document.getElementById("app-activation-status");
const surveyorInput = document.getElementById("app-setting-surveyor-name");
const showCbmInput = document.getElementById("app-setting-show-cbm");
const showWeightInput = document.getElementById("app-setting-show-weight");
const kgInput = document.getElementById("app-setting-kg-per-cbm");

    if (activationInput) activationInput.value = settings.activationCode || "";
    if (activationStatus) activationStatus.innerText = getAppActivationStatusLabel(settings);
    if (surveyorInput) surveyorInput.value = settings.surveyorName || "";
    if (showCbmInput) showCbmInput.checked = !!settings.showCbm;
    if (showWeightInput) showWeightInput.checked = !!settings.showVolumetricWeight;
    if (kgInput) kgInput.value = Number(settings.volumetricKgPerCbm || DEFAULT_VOLUMETRIC_KG_PER_CBM);
}

function handleAppSettingInput(key, value) {
    const settings = updateAppSetting(key, String(value || ""));

    if (key === "activationCode") {
        const activationStatus = document.getElementById("app-activation-status");
        if (activationStatus) {
            activationStatus.innerText = getAppActivationStatusLabel(settings);
        }
    }
}

function handleAppSettingCheckbox(key, checked) {
    updateAppSetting(key, !!checked);
}

function handleAppSettingNumber(key, value) {
    const cleanValue = Number(value || 0);

    if (cleanValue > 0) {
        updateAppSetting(key, cleanValue);
    }
}
async function saveAppSettingsFromModal() {
    const activationInput = document.getElementById("app-setting-activation-code");
    const surveyorInput = document.getElementById("app-setting-surveyor-name");
    const showCbmInput = document.getElementById("app-setting-show-cbm");
    const showWeightInput = document.getElementById("app-setting-show-weight");
    const kgInput = document.getElementById("app-setting-kg-per-cbm");

    const settings = getAppSettings();

    settings.activationCode = activationInput ? String(activationInput.value || "") : settings.activationCode;
    settings.surveyorName = surveyorInput ? String(surveyorInput.value || "") : settings.surveyorName;
    settings.showCbm = showCbmInput ? !!showCbmInput.checked : !!settings.showCbm;
    settings.showVolumetricWeight = showWeightInput ? !!showWeightInput.checked : !!settings.showVolumetricWeight;

    const kgValue = kgInput ? Number(kgInput.value || 0) : Number(settings.volumetricKgPerCbm || DEFAULT_VOLUMETRIC_KG_PER_CBM);
    settings.volumetricKgPerCbm = kgValue > 0 ? kgValue : DEFAULT_VOLUMETRIC_KG_PER_CBM;

    saveAppSettings(settings);

    closeAppSettingsModal();

    await appAlert("Settings saved on this device.", "Settings Saved");
}

function closeAppSettingsModal() {
    const overlay = document.getElementById("app-settings-overlay");
    if (!overlay) return;

    overlay.style.display = "none";
}
function closeNoteModal() {
    const overlay = document.getElementById("note-overlay");
    const input = document.getElementById("note-input");

    if (overlay) overlay.style.display = "none";
    if (input) input.value = "";
    setModalErrorText("note-error-text", "");
}

function saveNoteModal() {
    const rawEntry = getLastRawInventoryEntry();
    if (!rawEntry) return;
    if (rawEntry.kind === "note") return;

    const input = document.getElementById("note-input");
    if (!input) return;

    const cleanNote = input.value.trim();
    if (!cleanNote) {
        setModalErrorText("note-error-text", "Enter a note or press cancel");
        return;
    }

    setModalErrorText("note-error-text", "");

    const previousNote = rawEntry.note || "";
    rawEntry.note = cleanNote;

    const lastHistoryAction = inventoryHistory[inventoryHistory.length - 1];
    const shouldMergeIntoItemUndo =
        lastHistoryAction &&
        lastHistoryAction.rawEntryId === rawEntry.id &&
        (lastHistoryAction.type === "item" || lastHistoryAction.type === "volume");

    if (!shouldMergeIntoItemUndo) {
        inventoryHistory.push({
            type: "note-edit",
            rawEntryId: rawEntry.id,
            previousNote: previousNote,
            newNote: cleanNote
        });
    }

    saveToDevice();
    syncLiveInventoryFromRawForActiveSequence();
    recalculateTotalVolume();
    refreshCurrentInventorySelectionDisplay();
    renderActionButtonStates();

    triggerInventoryPulse("current", "blue");
    triggerInventoryPulse("total", "blue");
    updateUndoButtonState();
    saveCalculatorFeedForActiveSequence();

    closeNoteModal();
}
function getConditionOptionMap() {
    return {
        "Dented": "damage-option-dented",
        "Scratched": "damage-option-scratched",
        "Marked": "damage-option-marked",
        "Cracked": "damage-option-cracked",
        "ECU": "damage-option-ecu",
        "Soiled": "damage-option-soiled",
        "Chipped": "damage-option-chipped",
        "Broken": "damage-option-broken"
    };
}

function getConditionOptionValues() {
    return Object.keys(getConditionOptionMap());
}

function parseConditionReportValue(value) {
    const rawValue = String(value || "").trim();

    if (!rawValue) {
        return {
            options: [],
            note: ""
        };
    }

    const splitParts = rawValue.split(" - ");
    const optionPart = splitParts[0] || "";
    const notePart = splitParts.slice(1).join(" - ").trim();

    const knownOptions = getConditionOptionValues();
    const selectedOptions = [];
    const unknownParts = [];

    optionPart.split(",").forEach(function(part) {
        const cleanPart = String(part || "").trim();
        if (!cleanPart) return;

        const matchedOption = knownOptions.find(function(option) {
            return option.toUpperCase() === cleanPart.toUpperCase();
        });

        if (matchedOption) {
            selectedOptions.push(matchedOption);
        } else {
            unknownParts.push(cleanPart);
        }
    });

    const noteBits = [];

    if (unknownParts.length) {
        noteBits.push(unknownParts.join(", "));
    }

    if (notePart) {
        noteBits.push(notePart);
    }

    if (!selectedOptions.length && !noteBits.length) {
        noteBits.push(rawValue);
    }

    return {
        options: selectedOptions,
        note: noteBits.join(" - ")
    };
}
let activeInventoryPhotoRawEntryId = "";

async function openInventoryPhotosModal() {
    const rawEntry = getLastRawInventoryEntry();

    if (!rawEntry || rawEntry.kind === "note") {
    await appAlert("Add or select an inventory item before adding photos.", "Item Required");
    return;
}

    activeInventoryPhotoRawEntryId = rawEntry.id;

    const overlay = document.getElementById("inventory-photo-overlay");
    const subtitle = document.getElementById("inventory-photo-subtitle");

    if (subtitle) {
        subtitle.innerText = String(rawEntry.itemName || "Selected item").toUpperCase();
    }

    renderInventoryPhotoList(rawEntry);

    if (overlay) {
        overlay.style.display = "flex";
    }
}

function closeInventoryPhotosModal() {
    const overlay = document.getElementById("inventory-photo-overlay");

    if (overlay) {
        overlay.style.display = "none";
    }

    activeInventoryPhotoRawEntryId = "";
}

function ensureRawEntryPhotoShape(rawEntry) {
    if (!rawEntry) return;

    if (!rawEntry.photos || typeof rawEntry.photos !== "object") {
        rawEntry.photos = {};
    }

    if (!Array.isArray(rawEntry.photos.item)) {
        rawEntry.photos.item = [];
    }
}

function renderInventoryPhotoList(rawEntry) {
    const list = document.getElementById("inventory-photo-list");
    if (!list || !rawEntry) return;

    ensureRawEntryPhotoShape(rawEntry);

    const photos = rawEntry.photos.item || [];

    if (!photos.length) {
        list.innerHTML = `<div class="inventory-photo-empty">No item photos added</div>`;
        return;
    }

    list.innerHTML = `
        <div class="inventory-photo-grid">
            ${photos.map(function(photoRef, index) {
    return `
        <div class="inventory-photo-thumb">
            <button
                type="button"
                class="address-photo-thumb-view"
                onclick="openPhotoViewModal('${photoRef.id}', 'Item Photo ${index + 1}')"
            >
                ${
                    photoRef.thumbDataUrl
                        ? `<img src="${photoRef.thumbDataUrl}" alt="Item photo ${index + 1}" class="address-photo-thumb-img">`
                        : `Photo ${index + 1}`
                }
            </button>

            <button
                type="button"
                class="address-photo-delete-btn"
                title="Delete photo"
                aria-label="Delete photo"
                onclick="deleteInventoryItemPhoto('${rawEntry.id}', '${photoRef.id}')"
            >×</button>
        </div>
    `;
}).join("")}
        </div>
    `;
}
async function handleInventoryPhotoSelected(event) {
    const input = event.target;
    const file = input && input.files && input.files[0] ? input.files[0] : null;

    if (!file) return;

    const rawEntry = getRawInventoryEntryById(activeInventoryPhotoRawEntryId);

    if (!rawEntry) {
    await appAlert("Selected inventory item could not be found.", "Item Missing");
    input.value = "";
    return;
}

    ensureRawEntryPhotoShape(rawEntry);

    if (rawEntry.photos.item.length >= 4) {
    await appAlert("Maximum 4 photos per inventory item.", "Photo Limit");
    input.value = "";
    return;
}
    try {
        const fullImage = await compressImageFile(file, 1600, 0.78);
        const thumbImage = await compressImageFile(file, 320, 0.72);

        const photoId = "photo_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);

        await savePhotoBlobToIndexedDb({
            id: photoId,
            blob: fullImage.blob,
            createdAt: new Date().toISOString(),
            scopeType: "inventory",
            scopeId: String(rawEntry.id),
            category: "item",
            originalName: file.name || "",
            mimeType: "image/jpeg",
            width: fullImage.width,
            height: fullImage.height
        });

        rawEntry.photos.item.push({
            id: photoId,
            category: "item",
            thumbDataUrl: thumbImage.dataUrl,
            createdAt: new Date().toISOString()
        });

        saveToDevice();
        syncLiveInventoryFromRawForActiveSequence();
        refreshCurrentInventorySelectionDisplay();
        renderActionButtonStates();
        saveCalculatorFeedForActiveSequence();

        renderInventoryPhotoList(rawEntry);
    } catch (err) {
    await appAlert("Photo could not be saved. Please try again.", "Photo Error");
}

    input.value = "";
}
async function deleteInventoryItemPhoto(rawEntryId, photoId) {
    const rawEntry = getRawInventoryEntryById(rawEntryId);

    if (!rawEntry) {
    await appAlert("Selected inventory item could not be found.", "Item Missing");
    return;
}

    ensureRawEntryPhotoShape(rawEntry);

    const confirmed = await appConfirm("Delete this item photo?", "Delete Photo");
if (!confirmed) return;

    rawEntry.photos.item = rawEntry.photos.item.filter(function(photoRef) {
        return String(photoRef.id) !== String(photoId);
    });

    try {
        await deletePhotoBlobFromIndexedDb(photoId);
    } catch (err) {
        // If blob delete fails, still remove the reference from the item.
    }

    saveToDevice();
    syncLiveInventoryFromRawForActiveSequence();
    refreshCurrentInventorySelectionDisplay();
    renderActionButtonStates();
    saveCalculatorFeedForActiveSequence();

    renderInventoryPhotoList(rawEntry);
}

function addOrEditDamage() {
    const rawEntry = getLastRawInventoryEntry();
    if (!rawEntry) return;
    if (rawEntry.kind === "note") return;

    selectedDamageOptions = [];

    const overlay = document.getElementById("damage-overlay");
    const customNote = document.getElementById("damage-custom-note");

    if (!overlay || !customNote) return;

    clearDamageOptionButtons();
    setModalErrorText("damage-error-text", "");

    const currentDamage = (rawEntry.damage || "").trim();
    const parsedCondition = parseConditionReportValue(currentDamage);

    selectedDamageOptions = parsedCondition.options;
    customNote.value = parsedCondition.note;

    updateDamageOptionButtons();

    overlay.style.display = "flex";
}

function closeDamageModal() {
    const overlay = document.getElementById("damage-overlay");
    const customNote = document.getElementById("damage-custom-note");

    if (overlay) overlay.style.display = "none";
    if (customNote) customNote.value = "";

    selectedDamageOptions = [];
    clearDamageOptionButtons();
    setModalErrorText("damage-error-text", "");
}

function selectDamageOption(option) {
    const existingIndex = selectedDamageOptions.indexOf(option);

    if (existingIndex >= 0) {
        selectedDamageOptions.splice(existingIndex, 1);
    } else {
        selectedDamageOptions.push(option);
    }

    updateDamageOptionButtons();
}

function clearDamageOptionButtons() {
    const map = getConditionOptionMap();

    Object.keys(map).forEach(function(option) {
        const btn = document.getElementById(map[option]);
        if (btn) btn.classList.remove("active");
    });
}

function updateDamageOptionButtons() {
    const map = getConditionOptionMap();

    Object.keys(map).forEach(function(option) {
        const btn = document.getElementById(map[option]);
        if (!btn) return;

        if (selectedDamageOptions.includes(option)) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

function highlightDamageOption(option) {
    if (!selectedDamageOptions.includes(option)) {
        selectedDamageOptions.push(option);
    }

    updateDamageOptionButtons();
}

function saveDamageModal() {
    const rawEntry = getLastRawInventoryEntry();
    if (!rawEntry) return;
    if (rawEntry.kind === "note") return;

    const customNoteEl = document.getElementById("damage-custom-note");
    const customNote = customNoteEl ? customNoteEl.value.trim() : "";

    let finalDamage = "";

    if (selectedDamageOptions.length && customNote) {
        finalDamage = selectedDamageOptions.join(", ") + " - " + customNote;
    } else if (selectedDamageOptions.length) {
        finalDamage = selectedDamageOptions.join(", ");
    } else if (customNote) {
        finalDamage = customNote;
    } else {
        setModalErrorText("damage-error-text", "Select a condition or enter a note");
        return;
    }

    setModalErrorText("damage-error-text", "");

    const previousDamage = rawEntry.damage || "";
    rawEntry.damage = finalDamage;

    const lastHistoryAction = inventoryHistory[inventoryHistory.length - 1];
    const shouldMergeIntoItemUndo =
        lastHistoryAction &&
        lastHistoryAction.rawEntryId === rawEntry.id &&
        (lastHistoryAction.type === "item" || lastHistoryAction.type === "volume");

    if (!shouldMergeIntoItemUndo) {
        inventoryHistory.push({
            type: "damage-edit",
            rawEntryId: rawEntry.id,
            previousDamage: previousDamage,
            newDamage: finalDamage
        });
    }

    saveToDevice();
    syncLiveInventoryFromRawForActiveSequence();
    recalculateTotalVolume();
    refreshCurrentInventorySelectionDisplay();
    renderActionButtonStates();

    triggerInventoryPulse("current", "blue");
    triggerInventoryPulse("total", "blue");
    updateUndoButtonState();
    saveCalculatorFeedForActiveSequence();

    closeDamageModal();
}
function addOrEditWardrobeType() {
    const rawEntry = getLastRawInventoryEntry();
    if (!rawEntry) return;
    if (!isWardrobeRawEntry(rawEntry)) return;

    selectedWardrobeOptions = Array.isArray(rawEntry.wardrobeTypes)
        ? rawEntry.wardrobeTypes.slice()
        : [];

    const overlay = document.getElementById("wardrobe-overlay");
    if (!overlay) return;

    updateWardrobeOptionButtons();
    setModalErrorText("wardrobe-error-text", "");
    overlay.style.display = "flex";
}

function closeWardrobeModal() {
    const overlay = document.getElementById("wardrobe-overlay");
    if (overlay) overlay.style.display = "none";

    selectedWardrobeOptions = [];
    updateWardrobeOptionButtons();
    setModalErrorText("wardrobe-error-text", "");
}

function toggleWardrobeOption(option) {
    const exists = selectedWardrobeOptions.includes(option);

    if (exists) {
        selectedWardrobeOptions = selectedWardrobeOptions.filter(function(item) {
            return item !== option;
        });
    } else {
        selectedWardrobeOptions.push(option);
    }

    updateWardrobeOptionButtons();
    setModalErrorText("wardrobe-error-text", "");
}

function updateWardrobeOptionButtons() {
    const map = {
        "Drawer-combi": "wardrobe-option-drawer",
        "Sliding door": "wardrobe-option-sliding",
        "Mirrored": "wardrobe-option-mirrored",
        "Hinged": "wardrobe-option-hinged"
    };

    Object.keys(map).forEach(function(option) {
        const btn = document.getElementById(map[option]);
        if (!btn) return;

        btn.classList.toggle("active", selectedWardrobeOptions.includes(option));
    });
}

function saveWardrobeModal() {
    const rawEntry = getLastRawInventoryEntry();
    if (!rawEntry) return;
    if (!isWardrobeRawEntry(rawEntry)) return;

    if (!selectedWardrobeOptions.length) {
        setModalErrorText("wardrobe-error-text", "Select at least one wardrobe type");
        return;
    }

   rawEntry.wardrobeTypes = selectedWardrobeOptions.slice();

    saveToDevice();
    syncLiveInventoryFromRawForActiveSequence();
    recalculateTotalVolume();
    refreshCurrentInventorySelectionDisplay();
    renderActionButtonStates();
    saveCalculatorFeedForActiveSequence();

    closeWardrobeModal();
}
function addOrEditBedType() {
    const rawEntry = getLastRawInventoryEntry();
    if (!rawEntry) return;
    if (!isBedRawEntry(rawEntry)) return;

    selectedBedOption = "";

    const overlay = document.getElementById("bed-overlay");
    if (!overlay) return;

    clearBedOptionButtons();

    const currentBedType = String(rawEntry.bedType || "").trim();
    if (currentBedType) {
        selectedBedOption = currentBedType;
        highlightBedOption(currentBedType);
    }

    setModalErrorText("bed-error-text", "");
    overlay.style.display = "flex";
}

function closeBedModal() {
    const overlay = document.getElementById("bed-overlay");
    if (overlay) overlay.style.display = "none";

    selectedBedOption = "";
    clearBedOptionButtons();
    setModalErrorText("bed-error-text", "");
}

function selectBedOption(option) {
    if (selectedBedOption === option) {
        selectedBedOption = "";
        clearBedOptionButtons();
        return;
    }

    selectedBedOption = option;
    highlightBedOption(option);
    setModalErrorText("bed-error-text", "");
}

function clearBedOptionButtons() {
    [
        "bed-option-frame",
        "bed-option-ottoman",
        "bed-option-divan",
        "bed-option-electric"
    ].forEach(function(id) {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove("active");
    });
}

function highlightBedOption(option) {
    clearBedOptionButtons();

    const map = {
        "Frame": "bed-option-frame",
        "Ottoman": "bed-option-ottoman",
        "Divan": "bed-option-divan",
        "Electric Motor / TV": "bed-option-electric"
    };

    const btnId = map[option];
    if (!btnId) return;

    const btn = document.getElementById(btnId);
    if (btn) btn.classList.add("active");
}

function saveBedModal() {
    const rawEntry = getLastRawInventoryEntry();
    if (!rawEntry) return;
    if (!isBedRawEntry(rawEntry)) return;

    if (!selectedBedOption) {
        setModalErrorText("bed-error-text", "Select a bed type");
        return;
    }

    rawEntry.bedType = selectedBedOption;

    if (isElectricBedType(selectedBedOption)) {
        rawEntry.handyman = true;
        rawEntry.dismantle = false;
    }

    saveToDevice();
    syncLiveInventoryFromRawForActiveSequence();
    recalculateTotalVolume();
    refreshCurrentInventorySelectionDisplay();
    renderActionButtonStates();
    saveCalculatorFeedForActiveSequence();

    closeBedModal();
}
function updateLastItemQty(newQty) {
    // Inline qty editing no longer used.
}
function openVolumeOverride() {
    if (!lastAddedRawEntryId) return;

    const rawEntry = findRawInventoryEntry(lastAddedRawEntryId);
    if (!rawEntry) return;

    const currentVolume = parseFloat(rawEntry.unitVolume) || 0;

    openSimpleInputModal({
        mode: "volume-override",
        title: "Override Volume",
        subtitle: "Set a new unit volume for the selected item",
        label: "Unit Volume (CUFT)",
        placeholder: "e.g. 12",
        value: String(currentVolume),
        inputType: "number",
        inputMode: "decimal"
    });
}
function pulseInventoryButton(buttonEl) {
    if (!buttonEl) return;

    buttonEl.classList.remove("item-click-flash");
    void buttonEl.offsetWidth;
    buttonEl.classList.add("item-click-flash");
}
function triggerInventoryPulse(target = "total", type = "blue") {
    let el = null;

    if (target === "qty") {
        el = document.getElementById("inv-qty");
    } else if (target === "total") {
        el = document.getElementById("inv-total-volume");
    } else if (target === "undo") {
        el = document.getElementById("undo-btn");
    } else if (target === "current") {
        el = document.getElementById("inv-current-volume");
    }

    if (!el) return;

    el.classList.remove("pulse-blue", "pulse-red");
    void el.offsetWidth;
    el.classList.add(type === "red" ? "pulse-red" : "pulse-blue");
}
function triggerHaptic(type = "light") {
    if (!("vibrate" in navigator)) return;

    if (type === "light") {
        navigator.vibrate(20);
    } else if (type === "medium") {
        navigator.vibrate(35);
    } else if (type === "error") {
        navigator.vibrate([30, 20, 30]);
    }
}
function pulseDashboardButton(buttonEl) {
    if (!buttonEl) return;

    buttonEl.classList.remove("pulse-dashboard");
    void buttonEl.offsetWidth;
    buttonEl.classList.add("pulse-dashboard");
}

function handleDashboardImportClick(event) {
    const btn = event && event.currentTarget ? event.currentTarget : null;
    pulseDashboardButton(btn);
    triggerHaptic("light");

    if (typeof downloadFromCloud === "function") {
        downloadFromCloud();
    }
}

function handleDashboardManualClick(event) {
    const btn = event && event.currentTarget ? event.currentTarget : null;
    pulseDashboardButton(btn);
    triggerHaptic("light");
    toggleManualArea();
}
async function handleUploadClick(event, jobId) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    const btn = event && event.currentTarget ? event.currentTarget : null;

    const job = jobs.find(function(j) {
        return j.id === jobId;
    });

    if (!job) {
        await appAlert("This survey file could not be found.", "Upload Unavailable");
        return;
    }

    if (dashboardJobHasMissingPrices(job)) {
        const confirmed = await appConfirm(
            "One or more sequences has volume but no customer price. Upload anyway?",
            "Price Missing"
        );

        if (!confirmed) {
            return;
        }
    }

    pulseDashboardButton(btn);
    triggerHaptic("light");

    if (typeof uploadToCloud === "function") {
        uploadToCloud(jobId);
    }
}
function updateUndoButtonState() {
    const undoBtn = document.getElementById("undo-btn");
    if (!undoBtn) return;

    if (inventoryHistory.length > 0) {
        undoBtn.disabled = false;
        undoBtn.classList.remove("opacity-50", "pointer-events-none");
    } else {
        undoBtn.disabled = true;
        undoBtn.classList.add("opacity-50", "pointer-events-none");
    }
}

function undoLastInventoryAction() {
    if (inventoryHistory.length === 0) return;

    const action = inventoryHistory.pop();

    if (action.type === "item") {
        const item = inventoryItems.find(function(i) {
            if (action.liveKey) return i.liveKey === action.liveKey;
            return i.item === action.itemName;
        });

        if (item) {
            item.qty = action.previousQty;

            if (item.qty <= 0) {
                inventoryItems = inventoryItems.filter(function(i) {
                    if (action.liveKey) return i.liveKey !== action.liveKey;
                    return i.item !== action.itemName;
                });
            }
        }

        if (action.rawEntryId) {
            removeRawInventoryEntry(action.rawEntryId);
        }

        recalculateTotalVolume();
        currentItemVolume = 0;

        updateInventoryDisplay("UNDO " + action.qtyAdded + " X " + action.itemName.toUpperCase());
    }

    else if (action.type === "volume") {
        inventoryItems = inventoryItems.filter(function(i) {
            return i.item !== action.itemName;
        });

        if (action.rawEntryId) {
            removeRawInventoryEntry(action.rawEntryId);
        }

        recalculateTotalVolume();
        currentItemVolume = 0;

        const label = action.displayName || (action.unitVolume + " CUFT");
        updateInventoryDisplay("UNDO " + action.qtyAdded + " X " + String(label).toUpperCase());
    }
    else if (action.type === "material") {
    const materials = ensureInventoryMaterialsStore();
    const previousValue = Number(materials[action.materialCode] || 0);
    const qtyToRemove = Number(action.qtyAdded || 0);

    materials[action.materialCode] = Math.max(0, previousValue - qtyToRemove);

    const label =
        INVENTORY_MATERIAL_LABELS[action.materialCode] ||
        action.materialCode ||
        "MATERIAL";

    saveToDevice();

    currentItemVolume = 0;
    recalculateTotalVolume();

    updateInventoryDisplay("UNDO " + qtyToRemove + " X " + String(label).toUpperCase());
}

    else if (action.type === "qty-edit") {
        if (action.rawEntryId) {
            const rawEntry = findRawInventoryEntry(action.rawEntryId);
            if (rawEntry && action.previousRawQty !== null && action.previousRawQty !== undefined) {
                rawEntry.qty = action.previousRawQty;
                rawEntry.totalVolume = rawEntry.unitVolume * rawEntry.qty;
                saveToDevice();
            }
        }

        syncLiveInventoryFromRawForActiveSequence();
        recalculateTotalVolume();

        const rawEntry = action.rawEntryId ? findRawInventoryEntry(action.rawEntryId) : null;
        const label = rawEntry ? (rawEntry.itemName || action.itemName) : action.itemName;
        updateInventoryDisplay("UNDO QTY " + String(label).toUpperCase());
    }

    else if (action.type === "volume-edit") {
        if (action.rawEntryId) {
            const rawEntry = findRawInventoryEntry(action.rawEntryId);
            if (rawEntry && action.previousRawVolume !== null && action.previousRawVolume !== undefined) {
                rawEntry.unitVolume = action.previousRawVolume;
                rawEntry.totalVolume = rawEntry.unitVolume * rawEntry.qty;
                saveToDevice();
            }
        }

        syncLiveInventoryFromRawForActiveSequence();
        recalculateTotalVolume();

        const label = action.itemName;
        updateInventoryDisplay("UNDO VOL " + String(label).toUpperCase());
    }

    else if (action.type === "note") {
        if (action.rawEntryId) {
            removeRawInventoryEntry(action.rawEntryId);
        }

        currentItemVolume = 0;
        updateInventoryDisplay("UNDO NOTE");
    }

    else if (action.type === "note-edit") {
        const rawEntry = findRawInventoryEntry(action.rawEntryId);
        if (rawEntry) {
            rawEntry.note = action.previousNote || "";
            saveToDevice();
            syncLiveInventoryFromRawForActiveSequence();

            const tags = [];
            if (rawEntry.dismantle) tags.push("[DISMANTLE]");
            if (rawEntry.expWrap) tags.push("[EXP WRAP]");
            if (rawEntry.disconnect) tags.push("[DISCONNECT]");
if (rawEntry.handyman) tags.push("[HANDYMAN]");
            if (rawEntry.excluded) tags.push("[EXCLUDED]");
            if (rawEntry.note) tags.push("[NOTE: " + rawEntry.note.toUpperCase() + "]");

            const label = (rawEntry.itemName || "ITEM").toUpperCase();
            updateInventoryDisplay(tags.length ? (label + " " + tags.join(" ")) : label);
        }
    }

    else if (action.type === "damage-edit") {
        const rawEntry = findRawInventoryEntry(action.rawEntryId);
        if (rawEntry) {
            rawEntry.damage = action.previousDamage || "";
            saveToDevice();
            syncLiveInventoryFromRawForActiveSequence();

            const tags = [];
            if (rawEntry.dismantle) tags.push("[DISMANTLE]");
            if (rawEntry.expWrap) tags.push("[EXP WRAP]");
            if (rawEntry.crated && rawEntry.crateDims) {
                tags.push("[CRATE: " + rawEntry.crateDims.l + " x " + rawEntry.crateDims.w + " x " + rawEntry.crateDims.h + " " + rawEntry.crateDims.unit + "]");
            }
            if (rawEntry.damage) tags.push("[DAMAGE: " + rawEntry.damage.toUpperCase() + "]");
            if (rawEntry.excluded) tags.push("[EXCLUDED]");
            if (rawEntry.note) tags.push("[NOTE: " + rawEntry.note.toUpperCase() + "]");

            const label = (rawEntry.itemName || "ITEM").toUpperCase();
            updateInventoryDisplay(tags.length ? (label + " " + tags.join(" ")) : label);
        }
    }

    triggerInventoryPulse("undo", "red");
    triggerInventoryPulse("total", "red");
    triggerHaptic("error");

    const qtyInput = document.getElementById("inv-qty");
    if (qtyInput) qtyInput.value = 1;

    renderActionButtonStates();
    updateUndoButtonState();
    saveCalculatorFeedForActiveSequence();
}
function updateInventoryDisplay(logText = "No items added") {
    const log = document.querySelector(".log-bar");
    const newCurrentVolValue = document.getElementById("inv-current-volume-value");
    const oldCurrentVolValue = document.querySelector(".vol-box span:last-child");
    const totalVolBox = document.getElementById("inv-total-volume");

    if (log) {
        log.innerText = logText;
    }

    if (newCurrentVolValue) {
        newCurrentVolValue.innerText = currentItemVolume;
    } else if (oldCurrentVolValue) {
        oldCurrentVolValue.innerText = currentItemVolume;
    }

    if (totalVolBox) {
        totalVolBox.innerText = totalVolume;
    }
}
function getPropertyDisplayText(propertyId) {
    if (!currentJob || !Array.isArray(currentJob.properties)) return "Unknown Address";

    const prop = currentJob.properties.find(function(p) {
        return String(p.id) === String(propertyId);
    });

    if (!prop) return "Unknown Address";

    const line1 = String(prop.line1 || "").trim();
    const label = String(prop.label || "").trim();

    return line1 || label || "Unknown Address";
}
                 function getPropertyLabelById(propertyId) {
    if (!currentJob || !Array.isArray(currentJob.properties)) return "Unknown Address";

    const prop = currentJob.properties.find(function(p) {
        return String(p.id) === String(propertyId);
    });

    return prop ? getPropertyDisplayText(prop.id) : "Unknown Address";
}

function getPropertyById(propertyId) {
    if (!currentJob || !Array.isArray(currentJob.properties)) return null;

    return currentJob.properties.find(function(prop) {
        return String(prop.id) === String(propertyId);
    }) || null;
}

function getFullAddressText(propertyId) {
    const prop = getPropertyById(propertyId);
    if (!prop) return "";

    return [
        prop.line1 || "",
        prop.road || "",
        prop.city || "",
        prop.county || "",
        prop.postcode || "",
        prop.country || ""
    ]
    .map(function(part) { return String(part || "").trim(); })
    .filter(Boolean)
    .join(", ");
}

function getStoreProperty() {
    if (!currentJob || !Array.isArray(currentJob.properties)) return null;

    return currentJob.properties.find(function(prop) {
        return String(prop.label || "").toLowerCase().includes("store");
    }) || null;
}

function getPropertyByLabelPart(labelPart) {
    if (!currentJob || !Array.isArray(currentJob.properties)) return null;

    const search = String(labelPart || "").toLowerCase();

    return currentJob.properties.find(function(prop) {
        return String(prop.label || "").toLowerCase().includes(search);
    }) || null;
}

function getScheduleLocationAddress(value, branch) {
    const raw = String(value || "").trim();

    if (!raw) return "";

    if (raw === "Depot") {
        return BRANCH_DEPOTS[branch] || "";
    }

    const directProp = getPropertyById(raw);
    if (directProp) {
        return getFullAddressText(directProp.id);
    }

    const lower = raw.toLowerCase();

    if (lower.includes("collection")) {
        const prop = getPropertyByLabelPart("collection");
        return prop ? getFullAddressText(prop.id) : "";
    }

    if (lower.includes("delivery")) {
        const prop = getPropertyByLabelPart("delivery");
        return prop ? getFullAddressText(prop.id) : "";
    }

    if (lower.includes("store")) {
        const prop = getPropertyByLabelPart("store");
        return prop ? getFullAddressText(prop.id) : "";
    }

    return raw;
}

function getScheduleLocationPreviewLabel(value) {
    const raw = String(value || "").trim();

    if (!raw) return "Missing Location";
    if (raw === "Depot") return "Depot";

    const directProp = getPropertyById(raw);
    if (directProp) {
        const label = String(directProp.label || "").trim();
        return label || getPropertyDisplayText(directProp.id);
    }

    return raw;
}

function buildMileagePlannerRows(branch) {
    const rows = [];

    manualSchedule.forEach(function(day, index) {
        ensureScheduleRowShape(day);

        const legs = Array.isArray(day.legs) ? day.legs : [];

        rows.push({
            rowNumber: index + 1,
            dayPart: day.dayPart || "Full Day",
            task: day.task || "-",
            vans: Math.max(0, Number(day.vans || 0)),
            men: Math.max(0, Number(day.men || 0)),
            legs: legs.map(function(leg) {
                return {
                    from: leg.from || "",
                    to: leg.to || "",
                    fromLabel: getScheduleLocationPreviewLabel(leg.from),
                    toLabel: getScheduleLocationPreviewLabel(leg.to),
                    fromAddress: getScheduleLocationAddress(leg.from, branch),
                    toAddress: getScheduleLocationAddress(leg.to, branch),
                    minutes: Math.max(0, Number(leg.minutes || 0))
                };
            })
        });
    });

    return rows;
}
function getOperatingBranchFromManualScheduleRows() {
    if (!Array.isArray(manualSchedule) || !manualSchedule.length) {
        return "";
    }

    const rows = manualSchedule.filter(function(day) {
        return day;
    });

    if (!rows.length) {
        return "";
    }

    /*
        Use same priority as availability:
        1. Completion Day row if present
        2. First schedule row
    */
    const completionRow = rows.find(function(day) {
        return String(day.completionWindow || "") === "Completion Day";
    });

    const sourceRow = completionRow || rows[0];

    return String(sourceRow.operatingBranch || "").trim();
}

function getMileageRouteData() {
    const seq = getActiveSequenceRecord();
    if (!seq) return null;

    const branch = getOperatingBranchFromManualScheduleRows();

if (!branch) {
    return null;
}

const depotAddress = BRANCH_DEPOTS[branch] || "";

    const firstCollectionId = Array.isArray(seq.collections) && seq.collections.length
        ? seq.collections[0]
        : null;

    const firstDeliveryId = Array.isArray(seq.deliveries) && seq.deliveries.length
        ? seq.deliveries[0]
        : null;

    const collectionAddress = firstCollectionId ? getFullAddressText(firstCollectionId) : "";
    const deliveryAddress = firstDeliveryId ? getFullAddressText(firstDeliveryId) : "";
    const storeProp = getStoreProperty();
    const storeAddress = storeProp ? getFullAddressText(storeProp.id) : "";

    const moveType = String(seq.moveType || "").toLowerCase();

    let routeStops = [];

    if (moveType.includes("to store")) {
        routeStops = [
            { type: "branch", label: branch + " Depot", address: depotAddress },
            { type: "collection", label: "Collection", address: collectionAddress },
            { type: "store", label: "Store", address: storeAddress },
            { type: "branch", label: branch + " Depot", address: depotAddress }
        ];
    } else if (moveType.includes("ex store")) {
        routeStops = [
            { type: "branch", label: branch + " Depot", address: depotAddress },
            { type: "store", label: "Store", address: storeAddress },
            { type: "delivery", label: "Delivery", address: deliveryAddress },
            { type: "branch", label: branch + " Depot", address: depotAddress }
        ];
    } else {
        routeStops = [
            { type: "branch", label: branch + " Depot", address: depotAddress },
            { type: "collection", label: "Collection", address: collectionAddress },
            { type: "delivery", label: "Delivery", address: deliveryAddress },
            { type: "branch", label: branch + " Depot", address: depotAddress }
        ];
    }

    return {
        branch: branch,
        depotAddress: depotAddress,
        moveType: seq.moveType || "",
        sequenceId: seq.id,
        stops: routeStops,
        plannerRows: buildMileagePlannerRows(branch)
    };
}

async function fetchMileageFromRoute() {
    const routeData = getMileageRouteData();

    if (!routeData) {
        await appAlert("No active sequence found.", "Sequence Required");
        return;
    }

    console.log("Mileage route preview:", routeData);

    openMileageModal(routeData, "");
}
function getScheduleLegLocationOptions() {
    const options = [
        { value: "Depot", label: "Depot" }
    ];

    if (!currentJob || !Array.isArray(currentJob.properties)) {
        return options;
    }

    currentJob.properties.forEach(function(prop) {
        const label = getPropertyDisplayText(prop.id);
        options.push({
            value: String(prop.id),
            label: label
        });
    });

    return options;
}


// -----------------------------------------------------------------------------
// Schedule and listed-inventory shared helpers
// -----------------------------------------------------------------------------
function renderScheduleLegLocationOptions(selectedValue) {
    const options = getScheduleLegLocationOptions();

    return options.map(function(option) {
        const selected = String(option.value) === String(selectedValue) ? "selected" : "";
        return `<option value="${escapeHtml(option.value)}" ${selected}>${escapeHtml(option.label)}</option>`;
    }).join("");
}

function getSequenceLabelById(sequenceId) {
    if (!currentJob || !Array.isArray(currentJob.sequences)) return "Unknown Sequence";

    const seqIndex = currentJob.sequences.findIndex(function(seq) {
        return String(seq.id) === String(sequenceId);
    });

    if (seqIndex === -1) return "Unknown Sequence";

    const seq = currentJob.sequences[seqIndex];
    const moveLabel = seq.moveType || "New Sequence";
    const packLabel = seq.packOption || "No Packing Set";

    return "Seq #" + (seqIndex + 1) + ": " + moveLabel + " / " + packLabel;
}

function collectListedAddressPhotos() {
    if (!currentJob || !Array.isArray(currentJob.properties)) {
        return [];
    }

    const photos = [];

    currentJob.properties.forEach(function(prop) {
        ensurePropertyPhotoShape(prop);

        const propertyLabel = toTitleCase(prop.label || "Address");

        prop.photos.access.forEach(function(photoRef, index) {
            photos.push({
                id: photoRef.id,
                thumbDataUrl: photoRef.thumbDataUrl || "",
                title: "Access Photo " + (index + 1),
                caption: propertyLabel,
                type: "address"
            });
        });
    });

    return photos;
}

function collectListedInventoryPhotos(items) {
    if (!Array.isArray(items)) {
        return [];
    }

    const photos = [];

    items.forEach(function(entry) {
        ensureRawEntryPhotoShape(entry);

        const qty = Number(entry.qty || 0);
        const itemName = String(entry.itemName || "Item").toUpperCase();

        entry.photos.item.forEach(function(photoRef, index) {
            photos.push({
                id: photoRef.id,
                thumbDataUrl: photoRef.thumbDataUrl || "",
                title: "Item Photo " + (index + 1),
                caption: qty + " x " + itemName,
                type: "inventory"
            });
        });
    });

    return photos;
}

function renderListedPhotoThumbs(photos) {
    if (!photos.length) {
        return `<div class="listed-photo-empty">No photos recorded</div>`;
    }

    return `
        <div class="listed-photo-grid">
            ${photos.map(function(photo, index) {
                return `
                    <div class="listed-photo-thumb">
                        <button
                            type="button"
                            class="listed-photo-thumb-btn"
                            onclick="openPhotoViewModal('${photo.id}', '${escapeHtml(photo.title)}')"
                        >
                            ${
                                photo.thumbDataUrl
                                    ? `<img src="${photo.thumbDataUrl}" alt="${escapeHtml(photo.title)}" class="listed-photo-thumb-img">`
                                    : `<div class="listed-photo-empty">Photo ${index + 1}</div>`
                            }
                        </button>
                        <div class="listed-photo-caption">${escapeHtml(photo.caption)}</div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function renderListedPhotoReview(items) {
    const container = document.getElementById("listed-photo-review");
    if (!container) return;

    const addressPhotos = collectListedAddressPhotos();
    const inventoryPhotos = collectListedInventoryPhotos(items);
    const totalPhotos = addressPhotos.length + inventoryPhotos.length;

    if (!totalPhotos) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
        <div class="listed-photo-card">
            <div class="listed-photo-head">
                <div>
                    <div class="listed-photo-title">Photo Review</div>
                    <div class="listed-photo-subtitle">${totalPhotos} photo${totalPhotos === 1 ? "" : "s"} recorded for this survey</div>
                </div>
            </div>

           <div class="listed-photo-section">
                <div class="listed-photo-section-title">Address Access Photos (${addressPhotos.length})</div>
                ${renderListedPhotoThumbs(addressPhotos)}
            </div>

            <div class="listed-photo-section">
                <div class="listed-photo-section-title">Inventory Item Photos (${inventoryPhotos.length})</div>
                ${renderListedPhotoThumbs(inventoryPhotos)}
            </div>
        </div>
    `;
}
function getListedInventoryItems() {
    if (!currentJob || !currentJob.inventory || !Array.isArray(currentJob.inventory.items)) {
        return [];
    }

    return currentJob.inventory.items.slice();
}

function getListedSequenceFilterOptions(items) {
    if (!currentJob || !Array.isArray(currentJob.sequences)) return [];

    const itemSequenceIds = {};
    items.forEach(function(entry) {
        const key = String(entry.sequenceId || "");
        if (key) itemSequenceIds[key] = true;
    });

    return currentJob.sequences
        .filter(function(seq) {
            return itemSequenceIds[String(seq.id)];
        })
        .map(function(seq) {
            return {
                value: String(seq.id),
                label: getSequenceLabelById(seq.id)
            };
        });
}

function getListedDeliveryFilterOptions(items) {
    const seen = {};
    const options = [];

    const sequenceScopedItems = items.filter(function(entry) {
        if (listedSequenceFilter === "__all__") return true;
        return String(entry.sequenceId || "") === String(listedSequenceFilter);
    });

    sequenceScopedItems.forEach(function(entry) {
        const key = String(entry.deliveryId || "");
        if (!key || seen[key]) return;

        seen[key] = true;
        options.push({
            value: key,
            label: getPropertyLabelById(key)
        });
    });

    return options;
}

function ensureListedReportOptions() {
    if (!currentJob) {
        return {
            showCbmLineItems: false
        };
    }

    if (!currentJob.listedReportOptions || typeof currentJob.listedReportOptions !== "object") {
        currentJob.listedReportOptions = {};
    }

    if (typeof currentJob.listedReportOptions.showCbmLineItems !== "boolean") {
        currentJob.listedReportOptions.showCbmLineItems = false;
    }

    return currentJob.listedReportOptions;
}

function shouldShowListedCbmLineItems() {
    const options = ensureListedReportOptions();
    return !!options.showCbmLineItems;
}

function formatListedLineVolumeDisplay(cuft, showUnitLabel) {
    const cleanCuft = Number(cuft || 0);

    if (shouldShowListedCbmLineItems()) {
        return formatCbmFromCuft(cleanCuft) + " CBM";
    }

    return showUnitLabel
        ? cleanCuft + " CUFT"
        : String(cleanCuft);
}
function formatListedSummaryVolumeDisplay(cuft) {
    const cleanCuft = Number(cuft || 0);

    if (shouldShowListedCbmLineItems()) {
        return formatCbmFromCuft(cleanCuft) + " CBM";
    }

    return cleanCuft + " cuft";
}

function handleListedCbmLineItemsToggle(checked) {
    const options = ensureListedReportOptions();
    options.showCbmLineItems = !!checked;

    saveToDevice();
    renderListedInventory();
}


// -----------------------------------------------------------------------------
// Listed inventory tab
// -----------------------------------------------------------------------------

// Listed filters and display options
function renderListedInventoryFilters(items) {
    const seqSelect = document.getElementById("listed-sequence-filter");
    const deliverySelect = document.getElementById("listed-delivery-filter");
    const textInput = document.getElementById("listed-text-filter");
    const cbmLineItemsInput = document.getElementById("listed-show-cbm-lines");

    if (!seqSelect || !deliverySelect) return;

    const seqOptions = getListedSequenceFilterOptions(items);
    const deliveryOptions = getListedDeliveryFilterOptions(items);

    const seqStillExists = seqOptions.some(function(option) {
        return option.value === String(listedSequenceFilter);
    });

    const deliveryStillExists = deliveryOptions.some(function(option) {
        return option.value === String(listedDeliveryFilter);
    });

    if (listedSequenceFilter !== "__all__" && !seqStillExists) {
        listedSequenceFilter = "__all__";
    }

    if (listedDeliveryFilter !== "__all__" && !deliveryStillExists) {
        listedDeliveryFilter = "__all__";
    }

    seqSelect.innerHTML =
        `<option value="__all__">All Sequences</option>` +
        seqOptions.map(function(option) {
            const selected = option.value === String(listedSequenceFilter) ? "selected" : "";
            return `<option value="${option.value}" ${selected}>${option.label}</option>`;
        }).join("");

    deliverySelect.innerHTML =
        `<option value="__all__">All Deliveries</option>` +
        deliveryOptions.map(function(option) {
            const selected = option.value === String(listedDeliveryFilter) ? "selected" : "";
            return `<option value="${option.value}" ${selected}>${option.label}</option>`;
        }).join("");

    if (textInput) {
        textInput.value = listedTextFilter || "";
    }

    if (cbmLineItemsInput) {
        cbmLineItemsInput.checked = shouldShowListedCbmLineItems();
    }
}

function handleListedSequenceFilterChange(value) {
    listedSequenceFilter = value || "__all__";
    listedDeliveryFilter = "__all__";
    renderListedInventory();
}

function handleListedDeliveryFilterChange(value) {
    listedDeliveryFilter = value || "__all__";
    renderListedInventory();
}

function handleListedTextFilterChange(value) {
    listedTextFilter = (value || "").trim().toLowerCase();
    renderListedInventory();
}

function filterListedInventoryItems(items) {
    return items.filter(function(entry) {
        const seqOk = listedSequenceFilter === "__all__" || String(entry.sequenceId || "") === String(listedSequenceFilter);
        const deliveryOk = listedDeliveryFilter === "__all__" || String(entry.deliveryId || "") === String(listedDeliveryFilter);

        const searchBlob = [
            entry.roomName || "",
            entry.floorName || "",
            entry.itemName || "",
            entry.note || "",
            entry.damage || ""
        ].join(" ").toLowerCase();

        const textOk = !listedTextFilter || searchBlob.includes(listedTextFilter);

        return seqOk && deliveryOk && textOk;
    });
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function setInventoryReturnContextFromEntry(entry) {
    if (!entry) return;

    inventoryReturnContext = {
        sequenceId: entry.sequenceId || null,
        deliveryId: entry.deliveryId || null,
        floorName: entry.floorName || "Ground",
        roomName: entry.roomName || "Hallway"
    };
}

// Listed item editing and raw-entry matching
function getRawEntriesForListedEntry(entry) {
    if (!currentJob || !currentJob.inventory || !Array.isArray(currentJob.inventory.items)) {
        return [];
    }

    const crateText = entry.crated && entry.crateDims
        ? [
            entry.crateDims.l || "",
            entry.crateDims.w || "",
            entry.crateDims.h || "",
            entry.crateDims.unit || ""
        ].join("|")
        : "";

    const safeText = entry.safeDetails
        ? JSON.stringify(entry.safeDetails)
        : "";

    return currentJob.inventory.items.filter(function(raw) {
        const rawCrateText = raw.crated && raw.crateDims
            ? [
                raw.crateDims.l || "",
                raw.crateDims.w || "",
                raw.crateDims.h || "",
                raw.crateDims.unit || ""
            ].join("|")
            : "";

        const rawSafeText = raw.safeDetails
            ? JSON.stringify(raw.safeDetails)
            : "";

        return (
            String(raw.sequenceId || "") === String(entry.sequenceId || "") &&
            String(raw.deliveryId || "") === String(entry.deliveryId || "") &&
            String(raw.roomName || "") === String(entry.roomName || "") &&
            String(raw.floorName || "") === String(entry.floorName || "") &&
            String(raw.itemName || "") === String(entry.itemName || "") &&
            Number(raw.unitVolume || 0) === Number(entry.unitVolume || 0) &&
            !!raw.excluded === !!entry.excluded &&
            !!raw.dismantle === !!entry.dismantle &&
            !!raw.expWrap === !!entry.expWrap &&
            !!raw.disconnect === !!entry.disconnect &&
            !!raw.handyman === !!entry.handyman &&
            String(raw.note || "") === String(entry.note || "") &&
            String(raw.damage || "") === String(entry.damage || "") &&
            String(raw.bedType || "") === String(entry.bedType || "") &&
            String(Array.isArray(raw.wardrobeTypes) ? raw.wardrobeTypes.join("|") : "") === String(Array.isArray(entry.wardrobeTypes) ? entry.wardrobeTypes.join("|") : "") &&
            !!raw.crated === !!entry.crated &&
            rawCrateText === crateText &&
            rawSafeText === safeText
        );
    });
}

function deleteListedEntry(entryKey) {
    if (!currentJob || !currentJob.inventory || !Array.isArray(currentJob.inventory.items)) return;

    const mergedEntry = window.__listedEntryMap && window.__listedEntryMap[entryKey];
    if (!mergedEntry) return;

    setInventoryReturnContextFromEntry(mergedEntry);

    const rawMatches = getRawEntriesForListedEntry(mergedEntry);
    if (!rawMatches.length) return;

    const rawIdsToDelete = rawMatches.map(function(raw) {
        return raw.id;
    });

    currentJob.inventory.items = currentJob.inventory.items.filter(function(raw) {
        return !rawIdsToDelete.includes(raw.id);
    });

    markScheduleAutoBuildUpdateNeeded(
        "Inventory has changed since this schedule was calculated.",
        false
    );
    markCustomerSignatureInventoryChanged();
    saveToDevice();

    if (String(activeSeqId || "") === String(mergedEntry.sequenceId || "")) {
        rebuildLiveInventoryFromSequence(activeSeqId);
    }

    renderListedInventory();
    renderActionButtonStates();
    updateUndoButtonState();
    saveCalculatorFeedForActiveSequence();
    updateInventoryDisplay("LISTED LINE DELETED");
}

function editListedEntryQty(entryKey) {
    const mergedEntry = window.__listedEntryMap && window.__listedEntryMap[entryKey];
    if (!mergedEntry) return;

    setInventoryReturnContextFromEntry(mergedEntry);

    openSimpleInputModal({
        mode: "listed-edit-qty",
        title: "Edit Quantity",
        subtitle: "Change the quantity for this listed line",
        label: "Quantity",
        placeholder: "e.g. 2",
        value: String(mergedEntry.qty || 1),
        inputType: "number",
        inputMode: "numeric",
        meta: { entryKey: entryKey }
    });
}

function editListedEntryNote(entryKey) {
    const mergedEntry = window.__listedEntryMap && window.__listedEntryMap[entryKey];
    if (!mergedEntry) return;

    setInventoryReturnContextFromEntry(mergedEntry);

    openSimpleInputModal({
        mode: "listed-edit-note",
        title: "Edit Note",
        subtitle: "Change the note for this listed line",
        label: "Note",
        placeholder: "Type note here...",
        value: String(mergedEntry.note || ""),
        inputType: "text",
        inputMode: "text",
        meta: { entryKey: entryKey }
    });
}

// Listed flags modal
function openListedFlagsModal(entry) {
    const overlay = document.getElementById("listed-flags-overlay");
    if (!overlay || !entry) return;

    listedFlagsState = {
        dismantle: !!entry.dismantle,
        expWrap: !!entry.expWrap,
        crated: !!entry.crated,
        disconnect: !!entry.disconnect,
        handyman: !!entry.handyman,
        excluded: !!entry.excluded
    };

    updateListedFlagsModalButtons();
    overlay.style.display = "flex";
}

function closeListedFlagsModal() {
    const overlay = document.getElementById("listed-flags-overlay");
    if (overlay) overlay.style.display = "none";

    listedFlagsEntryKey = "";
    listedFlagsState = {
        dismantle: false,
        expWrap: false,
        crated: false,
        disconnect: false,
        handyman: false,
        excluded: false
    };
}

function updateListedFlagsModalButtons() {
    const map = {
        dismantle: "listed-flag-dismantle",
        expWrap: "listed-flag-expwrap",
        crated: "listed-flag-crate",
        disconnect: "listed-flag-disconnect",
        handyman: "listed-flag-handyman",
        excluded: "listed-flag-exclude"
    };

    Object.keys(map).forEach(function(key) {
        const btn = document.getElementById(map[key]);
        if (!btn) return;
        btn.classList.toggle("active", !!listedFlagsState[key]);
    });
}

function toggleListedFlag(flagName) {
    if (!listedFlagsState.hasOwnProperty(flagName)) return;
    listedFlagsState[flagName] = !listedFlagsState[flagName];
    updateListedFlagsModalButtons();
}

function editListedEntryFlags(entryKey) {
    const mergedEntry = window.__listedEntryMap && window.__listedEntryMap[entryKey];
    if (!mergedEntry) return;

    listedFlagsEntryKey = entryKey;
    setInventoryReturnContextFromEntry(mergedEntry);
    openListedFlagsModal(mergedEntry);
}

function saveListedFlagsModal() {
    if (!listedFlagsEntryKey) return;

    const mergedEntry = window.__listedEntryMap && window.__listedEntryMap[listedFlagsEntryKey];
    if (!mergedEntry) {
        closeListedFlagsModal();
        return;
    }

    const rawMatches = getRawEntriesForListedEntry(mergedEntry);
    if (!rawMatches.length) {
        closeListedFlagsModal();
        return;
    }

    const wantsCrate = !!listedFlagsState.crated;
    const hadCrateBefore = !!mergedEntry.crated;

    rawMatches.forEach(function(raw) {
        raw.dismantle = !!listedFlagsState.dismantle;
        raw.expWrap = !!listedFlagsState.expWrap;
        raw.disconnect = !!listedFlagsState.disconnect;
        raw.handyman = !!listedFlagsState.handyman;
        raw.excluded = !!listedFlagsState.excluded;

        if (!wantsCrate) {
            raw.crated = false;
            raw.crateDims = null;
        }
    });

    markInventoryChangedAfterSignatureAndSchedule(
        "Inventory flags have changed since this schedule was calculated.",
        false
    );
    saveToDevice();

    if (wantsCrate && !hadCrateBefore) {
        const entryKey = listedFlagsEntryKey;
        closeListedFlagsModal();
        openListedCrateModal(entryKey);
        return;
    }

    if (String(activeSeqId || "") === String(mergedEntry.sequenceId || "")) {
        rebuildLiveInventoryFromSequence(activeSeqId);
    }

    renderListedInventory();
    renderActionButtonStates();
    updateUndoButtonState();
    saveCalculatorFeedForActiveSequence();
    updateInventoryDisplay("LISTED FLAGS UPDATED");
    closeListedFlagsModal();
}

// Listed specialist tags
function getPianoFloorDisplayLabel(value) {
    const labels = {
        basement: "BASEMENT",
        ground: "GROUND",
        first: "1ST",
        second: "2ND",
        above_second: "ABOVE 2ND"
    };

    return labels[value] || "GROUND";
}

function getPianoSideDisplayText(sideDetails) {
    if (!sideDetails) return "";

    const parts = [
        getPianoFloorDisplayLabel(sideDetails.floor)
    ];

    if (sideDetails.stairs) parts.push("STAIRS");
    if (sideDetails.lift) parts.push("LIFT");
    if (sideDetails.tightAccess) parts.push("TIGHT ACCESS");
    if (sideDetails.specialistRequired) parts.push("SPECIALIST");

    return parts.join(" / ");
}

function getPianoDetailsListedTag(pianoDetails) {
    if (!pianoDetails) return "";

    const collectionText = getPianoSideDisplayText(pianoDetails.collection);
    const deliveryText = getPianoSideDisplayText(pianoDetails.delivery);

    if (!collectionText && !deliveryText) return "";

    return "PIANO: COL " + collectionText + " → DEL " + deliveryText;
}
function isSafeInventoryItem(itemName) {
    return String(itemName || "").trim().toUpperCase() === "SAFE";
}

function createDefaultSafeDetails() {
    return {
        collection: {
            floor: "ground"
        },
        delivery: {
            floor: "ground"
        },
        weightKg: ""
    };
}

function getSafeFloorDisplayText(floor) {
    const clean = String(floor || "ground").trim();

    if (clean === "basement") return "BASEMENT";
    if (clean === "ground") return "GROUND";
    if (clean === "first") return "1ST";
    if (clean === "second") return "2ND";
    if (clean === "above_second") return "ABOVE 2ND";

    return clean.toUpperCase();
}

function safeRequiresHeavyLiftReviewFromDetails(safeDetails) {
    if (!safeDetails) return false;

    const weightKg = Number(safeDetails.weightKg || 0);

    return weightKg > 100;
}

function entryRequiresSafeHeavyLiftReview(entry) {
    if (!entry || !entry.safeDetails) return false;
    return safeRequiresHeavyLiftReviewFromDetails(entry.safeDetails);
}

function getSafeDetailsListedTag(safeDetails) {
    if (!safeDetails) return "";

    const collectionFloor = getSafeFloorDisplayText(
        safeDetails.collection && safeDetails.collection.floor
    );

    const deliveryFloor = getSafeFloorDisplayText(
        safeDetails.delivery && safeDetails.delivery.floor
    );

    const weightKg = String(safeDetails.weightKg || "").trim();

    let text = "SAFE: COL " + collectionFloor + " → DEL " + deliveryFloor;

    if (weightKg) {
        text += " / WEIGHT: " + weightKg + "KG";
    } else {
        text += " / WEIGHT: NOT KNOWN";
    }

    if (safeRequiresHeavyLiftReviewFromDetails(safeDetails)) {
        text += " — HEAVY LIFTING TEAM REQUIRED";
    }

    return text;
}

// Listed merge keys and photo refs
function getInventoryEntryPhotoCount(entry) {
    if (!entry || !entry.photos || !Array.isArray(entry.photos.item)) {
        return 0;
    }

    return entry.photos.item.length;
}

function mergeInventoryEntryPhotoRefs(targetEntry, sourceEntry) {
    if (!targetEntry || !sourceEntry) return;

    if (!targetEntry.photos || typeof targetEntry.photos !== "object") {
        targetEntry.photos = {};
    }

    if (!Array.isArray(targetEntry.photos.item)) {
        targetEntry.photos.item = [];
    }

    if (
        sourceEntry.photos &&
        Array.isArray(sourceEntry.photos.item)
    ) {
        sourceEntry.photos.item.forEach(function(photoRef) {
            const alreadyExists = targetEntry.photos.item.some(function(existingRef) {
                return String(existingRef.id) === String(photoRef.id);
            });

            if (!alreadyExists) {
                targetEntry.photos.item.push(photoRef);
            }
        });
    }
}

function getListedEntryMergeKey(entry) {
    const crateText = entry.crated && entry.crateDims
        ? [
            entry.crateDims.l || "",
            entry.crateDims.w || "",
            entry.crateDims.h || "",
            entry.crateDims.unit || ""
        ].join("|")
        : "";

    return [
        entry.sequenceId || "",
        entry.deliveryId || "",
        entry.roomName || "",
        entry.floorName || "",
        entry.itemName || "",
        Number(entry.unitVolume || 0),
        !!entry.excluded,
        !!entry.dismantle,
        !!entry.expWrap,
        !!entry.disconnect,
        !!entry.handyman,
        entry.note || "",
        entry.damage || "",
        entry.bedType || "",
        Array.isArray(entry.wardrobeTypes) ? entry.wardrobeTypes.join("|") : "",
        entry.pianoDetails ? JSON.stringify(entry.pianoDetails) : "",
        entry.safeDetails ? JSON.stringify(entry.safeDetails) : "",
        !!entry.crated,
        crateText
    ].join("||");
}

function mergeListedInventoryEntries(items) {
    const mergedMap = {};

    items.forEach(function(entry) {
        const key = getListedEntryMergeKey(entry);

        if (!mergedMap[key]) {
            mergedMap[key] = {
                ...entry,
                qty: Number(entry.qty || 0),
                totalVolume: entry.excluded ? 0 : Number(entry.totalVolume || 0)
            };
            return;
        }

        mergedMap[key].qty += Number(entry.qty || 0);

        mergeInventoryEntryPhotoRefs(mergedMap[key], entry);

        if (!entry.excluded) {
            mergedMap[key].totalVolume += Number(entry.totalVolume || 0);
        }
    });

    return Object.values(mergedMap);
}

// Materials summary
const INVENTORY_MATERIAL_LABELS = {
    TV_CARTON: "TV Carton",
    WINE_DIVIDERS: "Wine Dividers",
    BLUE_EDGING: "Blue Edging",
    POLY_CHIPS: "Poly Chips",
    GOLF_CLUB: "Golf Club Carton",
    BIKE_BOX: "Bike Box",
    MATTRESS_BAG_SINGLE: "Mattress Bag Single",
    MATTRESS_BAG_DOUBLE: "Mattress Bag Double",
    MATTRESS_BAG_KINGSIZE: "Mattress Bag Kingsize",
    ARMCHAIR_COVER: "Armchair Cover",
    SOFA_COVER_2: "2-Seater Cover",
    SOFA_COVER_3: "3-Seater Cover",
    SOFA_COVER_4: "4-Seater Cover"
};

function ensureInventoryMaterialsStore() {
    if (!currentJob) return {};

    if (!currentJob.inventory) {
        currentJob.inventory = {};
    }

    if (!currentJob.inventory.materials || typeof currentJob.inventory.materials !== "object") {
        currentJob.inventory.materials = {};
    }

    Object.keys(INVENTORY_MATERIAL_LABELS).forEach(function(code) {
        if (typeof currentJob.inventory.materials[code] !== "number") {
            currentJob.inventory.materials[code] = 0;
        }
    });

    return currentJob.inventory.materials;
}

function addInventoryMaterial(materialCode) {
    if (!currentJob) return;

    const clickedBtn =
        typeof event !== "undefined" && event && event.currentTarget
            ? event.currentTarget
            : null;

    const materials = ensureInventoryMaterialsStore();
    const qty = getInventoryAddQty();
    const label = INVENTORY_MATERIAL_LABELS[materialCode] || materialCode;

    materials[materialCode] = Number(materials[materialCode] || 0) + qty;

    inventoryHistory.push({
        type: "material",
        materialCode: materialCode,
        qtyAdded: qty
    });

    saveToDevice();

    updateInventoryDisplay(qty + " X " + label.toUpperCase() + " - MATERIALS");

    triggerInventoryPulse("qty", "blue");
    triggerInventoryPulse("total", "blue");
    pulseInventoryButton(clickedBtn);

    const qtyInput = document.getElementById("inv-qty");
    if (qtyInput) qtyInput.value = 1;

    updateUndoButtonState();
}

function buildMaterialsSummary(items) {
    const summary = {
        apBoxes: 0,
        cgBoxes: 0,
        bookBoxes: 0,
        linenBoxes: 0,
        wrBoxes: 0,

        singleMattressBags: 0,
        doubleMattressBags: 0,
        kingMattressBags: 0,

        armchairCovers: 0,
        sofa2Covers: 0,
        sofa3Covers: 0,
        sofa4Covers: 0,

        picturePacks: 0,
        tvCartons: 0,
        golfClubCartons: 0,
        bikeBoxes: 0,
        blueEdging: 0,
        polyChips: 0,
        wineDividers: 0
    };

    if (Array.isArray(items)) {
        items.forEach(function(entry) {
            if (!entry || entry.excluded) return;

            const itemName = String(entry.itemName || "").trim().toUpperCase();
            const qty = Number(entry.qty || 0);

            if (itemName === "AP BOX") summary.apBoxes += qty;
            else if (itemName === "CG BOX") summary.cgBoxes += qty;
            else if (itemName === "BOOK BOX") summary.bookBoxes += qty;
            else if (itemName === "LINEN BOX") summary.linenBoxes += qty;
            else if (itemName === "WR BOX") summary.wrBoxes += qty;

            else if (
                itemName === "BED (SINGLE)" ||
                itemName === "BED (CABIN BED)" ||
                itemName === "MATTRESS (SINGLE)"
            ) {
                summary.singleMattressBags += qty;
            }
            else if (itemName === "BUNK BED") {
                summary.singleMattressBags += (qty * 2);
            }
            else if (
                itemName === "BED (DOUBLE)" ||
                itemName === "BED (QUEENSIZE)" ||
                itemName === "MATTRESS (DOUBLE)" ||
                itemName === "MATTRESS (QUEENSIZE)"
            ) {
                summary.doubleMattressBags += qty;
            }
            else if (
                itemName === "BED (KINGSIZE)" ||
                itemName === "BED (SUPERKING)" ||
                itemName === "MATTRESS (KINGSIZE)"
            ) {
                summary.kingMattressBags += qty;
            }

            else if (itemName === "ARMCHAIR") summary.armchairCovers += qty;
            else if (itemName === "SOFA 2 SEAT") summary.sofa2Covers += qty;
            else if (itemName === "SOFA 3 SEAT") summary.sofa3Covers += qty;
            else if (itemName === "SOFA 4 SEAT") summary.sofa4Covers += qty;

            else if (itemName === "PICTURE PACK") summary.picturePacks += qty;
        });
    }

    const materialStore =
        currentJob &&
        currentJob.inventory &&
        currentJob.inventory.materials
            ? currentJob.inventory.materials
            : {};

    summary.tvCartons += Number(materialStore.TV_CARTON || 0);
    summary.wineDividers += Number(materialStore.WINE_DIVIDERS || 0);
    summary.blueEdging += Number(materialStore.BLUE_EDGING || 0);
    summary.polyChips += Number(materialStore.POLY_CHIPS || 0);
    summary.golfClubCartons += Number(materialStore.GOLF_CLUB || 0);
    summary.bikeBoxes += Number(materialStore.BIKE_BOX || 0);

    summary.singleMattressBags += Number(materialStore.MATTRESS_BAG_SINGLE || 0);
    summary.doubleMattressBags += Number(materialStore.MATTRESS_BAG_DOUBLE || 0);
    summary.kingMattressBags += Number(materialStore.MATTRESS_BAG_KINGSIZE || 0);

    summary.armchairCovers += Number(materialStore.ARMCHAIR_COVER || 0);
    summary.sofa2Covers += Number(materialStore.SOFA_COVER_2 || 0);
    summary.sofa3Covers += Number(materialStore.SOFA_COVER_3 || 0);
    summary.sofa4Covers += Number(materialStore.SOFA_COVER_4 || 0);

    return summary;
}

// Listed summaries and responsibility notes
function buildListedSummary(items) {
    let includedVolume = 0;
    let excludedCount = 0;
    let lineCount = items.length;

    const excludedItems = [];
    const exclusionNotes = [];

    items.forEach(function(entry) {
        if (entry.excluded) {
            excludedCount += Number(entry.qty || 0);

            const itemLabel = formatListedItemRoomLine(
                entry,
                `${Number(entry.qty || 0)} x ${String(entry.itemName || "-").toUpperCase()}`
            );

            excludedItems.push(itemLabel);

            if (entry.note && String(entry.note).trim()) {
                exclusionNotes.push(
                    `${itemLabel} — ${String(entry.note).trim()}`
                );
            }
        } else {
            includedVolume += Number(entry.totalVolume || 0);
        }
    });

    return {
        includedVolume: includedVolume,
        excludedCount: excludedCount,
        lineCount: lineCount,
        excludedItems: excludedItems,
        exclusionNotes: exclusionNotes
    };
}

// Customer responsibility notes
const DEFAULT_CUSTOMER_RESPONSIBILITY_NOTES = [
    "Customer to bring all loft effects down to an accessible area prior to crew arrival, unless loft handling has been specifically agreed.",
    "Customer to remove/unscrew wall-mounted items, fixtures and fittings prior to crew arrival, unless handyman service has been specifically agreed.",
    "Customer to disconnect appliances prior to crew arrival, unless disconnection has been specifically requested and agreed.",
    "Customer to uncable IT, TV, audio and media equipment prior to crew arrival.",
    "Customer is responsible for arranging parking, permits, suspensions or access permissions unless this has been specifically requested and agreed.",
    "Customer is responsible for transporting lithium-ion (Li-ion) batteries and any restricted/prohibited items not accepted for removal."
];

function ensureCustomerResponsibilityNotes() {
    if (!currentJob) return [];

    if (!Array.isArray(currentJob.customerResponsibilityNotes)) {
        currentJob.customerResponsibilityNotes = DEFAULT_CUSTOMER_RESPONSIBILITY_NOTES.slice();
    }

    return currentJob.customerResponsibilityNotes;
}

function updateCustomerResponsibilityNote(index, value) {
    if (!currentJob) return;

    ensureCustomerResponsibilityNotes();

    if (
        index < 0 ||
        index >= currentJob.customerResponsibilityNotes.length
    ) {
        return;
    }

    currentJob.customerResponsibilityNotes[index] = String(value || "");
    saveToDevice();
}

function deleteCustomerResponsibilityNote(index) {
    if (!currentJob) return;

    ensureCustomerResponsibilityNotes();

    currentJob.customerResponsibilityNotes.splice(index, 1);
    saveToDevice();
    renderListedInventory();
}

function addCustomerResponsibilityNote() {
    if (!currentJob) return;

    ensureCustomerResponsibilityNotes();

    currentJob.customerResponsibilityNotes.unshift("");
    saveToDevice();
    renderListedInventory();
}

// Crew instruction notes
function ensureCrewInstructionNotes() {
    if (!currentJob) return [];

    if (!Array.isArray(currentJob.crewInstructionNotes)) {
        currentJob.crewInstructionNotes = [];
    }

    return currentJob.crewInstructionNotes;
}

function updateCrewInstructionNote(index, value) {
    if (!currentJob) return;

    ensureCrewInstructionNotes();

    if (
        index < 0 ||
        index >= currentJob.crewInstructionNotes.length
    ) {
        return;
    }

    currentJob.crewInstructionNotes[index] = String(value || "");
    saveToDevice();
}

function deleteCrewInstructionNote(index) {
    if (!currentJob) return;

    ensureCrewInstructionNotes();

    currentJob.crewInstructionNotes.splice(index, 1);
    saveToDevice();
    renderListedInventory();
}

function addCrewInstructionNote() {
    if (!currentJob) return;

    ensureCrewInstructionNotes();

    currentJob.crewInstructionNotes.unshift("");
    saveToDevice();
    renderListedInventory();
}

function entryRequiresPianoSpecialist(entry) {
    if (!entry || !entry.pianoDetails) return false;

    const collection = entry.pianoDetails.collection || {};
    const delivery = entry.pianoDetails.delivery || {};

    return !!(
        collection.specialistRequired ||
        delivery.specialistRequired
    );
}
function buildResponsibilitiesSummary(summary, items) {
    const excludedItems = Array.isArray(summary.excludedItems) ? summary.excludedItems : [];
    const exclusionNotes = Array.isArray(summary.exclusionNotes) ? summary.exclusionNotes : [];
    const editableNotes = ensureCustomerResponsibilityNotes();

    const autoNotes = [];

    const handymanItems = [];
    const pianoItems = [];
    const safeItems = [];

    if (Array.isArray(items)) {
        items.forEach(function(entry) {
            if (!entry || entry.excluded) return;

            const qty = Number(entry.qty || 0);
            const itemName = String(entry.itemName || "Item").trim();
            const itemUpper = itemName.toUpperCase();

            const roomName =
                entry.roomName ||
                entry.room ||
                entry.location ||
                "";

            const entryNote = String(entry.note || "").trim();

            let modalDetail = "";

            if (entry.bedType) {
                modalDetail = String(entry.bedType).trim();
            }

            if (isWardrobeInventoryItem(itemName)) {
                const wardrobeDetail = String(formatWardrobeTypes(entry) || "").trim();

                if (wardrobeDetail && wardrobeDetail !== "Type not set") {
                    modalDetail = wardrobeDetail;
                }
            }

            if (
                itemUpper === "PIANO (UPRIGHT)" ||
                itemUpper === "PIANO (ELECTRIC)" ||
                itemUpper === "PIANO (BABY GRAND)" ||
                itemUpper === "PIANO (GRAND)"
            ) {
                const pianoDetail = String(getPianoDetailsListedTag(entry.pianoDetails) || "").trim();

                if (pianoDetail) {
                    modalDetail = pianoDetail;
                }
            }

            if (itemUpper === "SAFE") {
                const safeDetail = String(getSafeDetailsListedTag(entry.safeDetails) || "").trim();

                if (safeDetail) {
                    modalDetail = safeDetail;
                }
            }

const line =
    (roomName ? roomName + ": " : "") +
    (qty ? qty + " x " : "") +
    itemName +
    (modalDetail ? " — " + modalDetail : "") +
    (entryNote ? " — " + entryNote : "");

    if (entry.handyman) {
        handymanItems.push(line);
    }

            if (
                (
                    itemUpper === "PIANO (UPRIGHT)" ||
                    itemUpper === "PIANO (ELECTRIC)" ||
                    itemUpper === "PIANO (BABY GRAND)" ||
                    itemUpper === "PIANO (GRAND)"
                ) &&
                entryRequiresPianoSpecialist(entry)
            ) {
                pianoItems.push(line);
            }

            if (
                itemUpper === "SAFE" &&
                entryRequiresSafeHeavyLiftReview(entry)
            ) {
                safeItems.push(line);
            }
        });
    }

    if (handymanItems.length) {
        autoNotes.push("Handyman required at additional cost, or client to arrange themselves prior to crew arrival.");
        autoNotes.push("Handyman required for: " + handymanItems.join(", ") + ".");
    }

    if (pianoItems.length) {
        autoNotes.push("Piano specialist required at additional cost, or client to arrange themselves prior to crew arrival.");
        autoNotes.push("Piano specialist required for: " + pianoItems.join(", ") + ".");
    }

    if (safeItems.length) {
        autoNotes.push("Heavy lifting team required at additional cost, or client to arrange themselves prior to crew arrival.");
        autoNotes.push("Heavy lifting team required for: " + safeItems.join(", ") + ".");
    }

    return {
        hasContent:
            excludedItems.length > 0 ||
            exclusionNotes.length > 0 ||
            autoNotes.length > 0 ||
            editableNotes.length > 0,

        excludedItems: excludedItems,
        exclusionNotes: exclusionNotes,
        autoNotes: autoNotes,
        editableNotes: editableNotes
    };
}
function activeSequenceShouldCondenseExportWrapSummary() {
    if (!currentJob || !activeSeqId || !Array.isArray(currentJob.sequences)) {
        return false;
    }

    const seq = currentJob.sequences.find(function(sequence) {
        return String(sequence.id) === String(activeSeqId);
    });

    if (!seq) return false;

    return String(seq.packOption || "").trim().toLowerCase() === "full export pack and wrap";
}
function getListedItemRoomLabel(entry) {
    if (!entry) return "";

    return String(
        entry.roomName ||
        entry.room ||
        entry.roomLabel ||
        entry.location ||
        ""
    ).trim();
}

function formatListedItemRoomLine(entry, baseLine) {
    const cleanBaseLine = String(baseLine || "").trim();
    const roomLabel = getListedItemRoomLabel(entry);

    if (!roomLabel) {
        return cleanBaseLine;
    }

    return cleanBaseLine + " (" + roomLabel + ")";
}
// Crew instruction summary
function buildCrewInstructionsSummary(items) {
    const summary = {
        dismantle: [],
        exportWrap: [],
        crate: [],
        disconnect: [],
        handyman: [],
        damage: [],
        notes: [],
        specialHandling: [],
        beds: [],
        wardrobes: [],
        pianos: []
    };

    const condenseExportWrapSummary = activeSequenceShouldCondenseExportWrapSummary();
    const manualCrewNotes = ensureCrewInstructionNotes().filter(function(note) {
        return String(note || "").trim();
    });

    manualCrewNotes.forEach(function(note) {
        summary.notes.push(String(note).trim());
    });

    if (!Array.isArray(items)) return summary;

    items.forEach(function(entry) {
        if (!entry || entry.excluded) return;

        const qty = Number(entry.qty || 0);
        const itemName = String(entry.itemName || "-").toUpperCase();

        const bedSuffix = entry.bedType
            ? ` — ${String(entry.bedType).toUpperCase()}`
            : "";

        const baseLine = `${qty} x ${itemName}${bedSuffix}`;
        const roomLine = formatListedItemRoomLine(entry, baseLine);
        const isPianoItem =
            itemName === "PIANO (UPRIGHT)" ||
            itemName === "PIANO (ELECTRIC)" ||
            itemName === "PIANO (BABY GRAND)" ||
            itemName === "PIANO (GRAND)";

        if (isPianoItem) {
            const pianoListedTag = getPianoDetailsListedTag(entry.pianoDetails);
    summary.specialHandling.push(
        pianoListedTag
            ? `${roomLine} — ${pianoListedTag}`
            : roomLine
    );
        }

        if (itemName === "SAFE") {
            const safeListedTag = getSafeDetailsListedTag(entry.safeDetails);

    summary.specialHandling.push(
        safeListedTag
            ? `${roomLine} — ${safeListedTag}`
            : roomLine
    );
        }

        if (entry.dismantle) {
    if (isWardrobeInventoryItem(entry.itemName)) {
        summary.dismantle.push(
            `${roomLine} — ${String(formatWardrobeTypes(entry)).toUpperCase()}`
        );
    } else {
        summary.dismantle.push(roomLine);
    }
}

        if (entry.expWrap && !condenseExportWrapSummary) {
    summary.exportWrap.push(roomLine);
}

        if (entry.crated) {
    if (entry.crateDims) {
        summary.crate.push(
            `${roomLine} — ${entry.crateDims.l} x ${entry.crateDims.w} x ${entry.crateDims.h} ${entry.crateDims.unit}`
        );
    } else {
        summary.crate.push(roomLine);
    }
}

        if (entry.disconnect) {
    summary.disconnect.push(roomLine);
}

        if (entry.damage) {
    summary.damage.push(`${roomLine} — ${String(entry.damage).trim()}`);
}

        const noteBelongsToCustomerResponsibilities =
            entry.handyman ||
            entryRequiresPianoSpecialist(entry);

        if (
            entry.note &&
            String(entry.note).trim() &&
            !noteBelongsToCustomerResponsibilities
        ) {
    summary.notes.push(`${roomLine} — ${String(entry.note).trim()}`);
        }
    });

    if (condenseExportWrapSummary) {
        const hasExportWrappedItems = items.some(function(entry) {
            return entry && !entry.excluded && entry.expWrap;
        });

        if (hasExportWrappedItems) {
            summary.exportWrap = [
            "Full export pack and wrap selected — all furniture items to be export wrapped."
            ];
        }
    }
    return summary;
}

function renderListedSummary(summary, materials, crewInstructions) {
    const footerBar = document.getElementById("listed-footer-summary");
    if (!footerBar) return;

    const responsibilities = buildResponsibilitiesSummary(summary, crewInstructions);
    const crew = buildCrewInstructionsSummary(crewInstructions);

    footerBar.innerHTML = `
        <div class="signature-wrap">
            <div class="signature-head">
                <div>
                    <div class="signature-title">Customer Signature</div>
                    <div class="signature-subtitle">Sign with finger or stylus</div>
                </div>

                <div class="signature-actions">
                    <button class="signature-btn clear" onclick="clearSignaturePad()">Clear</button>
                    <button class="signature-btn save" onclick="saveSignaturePad()">Save</button>
                </div>
            </div>

            <div class="signature-pad-shell">
                <canvas id="signature-pad" class="signature-pad"></canvas>
            </div>

            <div class="signature-status-row">
                <div class="signature-meta">
                    Signed:
                    <span id="signature-signed-at">
                        ${
                            currentJob && currentJob.signature && currentJob.signature.signedAt
                                ? new Date(currentJob.signature.signedAt).toLocaleString("en-GB")
                                : "Not signed"
                        }
                    </span>
                </div>

                <div
                    id="signature-lock-badge"
                    class="signature-lock-badge"
                    style="${
                        currentJob && currentJob.signature && currentJob.signature.signedAt
                            ? ""
                            : "display:none;"
                    }"
                >
                    <svg viewBox="0 0 24 24" class="signature-lock-icon" aria-hidden="true">
                        <path
                            d="M8 10V7.8a4 4 0 1 1 8 0V10"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                        <rect
                            x="6"
                            y="10"
                            width="12"
                            height="10"
                            rx="2"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        />
                    </svg>
                    Locked
                </div>
                        </div>

                        ${getCustomerSignatureWarningHtml()}
${getSurveyorNameHtml()}
${getSurveyorSignatureHtml()}
        </div>

        <div class="listed-stat-card">
            <div class="listed-stat-label">Included Volume & Materials Summary</div>
            <div class="listed-stat-value listed-volume-display">${formatListedSummaryVolumeDisplay(summary.includedVolume)}</div>
<div class="listed-stat-sub">Included volume counted</div>

            <div class="grid grid-cols-2 gap-4 text-[10px] font-black text-slate-900 uppercase leading-5 mt-4">
                <div class="space-y-1">
                    <div class="text-slate-400 pb-1">Cartons</div>
                    <div>AP Boxes: ${materials.apBoxes}</div>
                    <div>CG Boxes: ${materials.cgBoxes}</div>
                    <div>Book Boxes: ${materials.bookBoxes}</div>
                    <div>Linen Boxes: ${materials.linenBoxes}</div>
                    <div>WR Boxes: ${materials.wrBoxes}</div>

                    <div class="pt-2 text-slate-400">Mattress Bags</div>
                    <div>Single: ${materials.singleMattressBags}</div>
                    <div>Double: ${materials.doubleMattressBags}</div>
                    <div>King: ${materials.kingMattressBags}</div>
                </div>

                <div class="space-y-1">
                    <div class="text-slate-400 pb-1">Sofa Covers</div>
                    <div>Armchair: ${materials.armchairCovers}</div>
                    <div>2-Seater: ${materials.sofa2Covers}</div>
                    <div>3-Seater: ${materials.sofa3Covers}</div>
                    <div>4-Seater: ${materials.sofa4Covers}</div>

                    ${
    materials.picturePacks ||
    materials.tvCartons ||
    materials.wineDividers ||
    materials.blueEdging ||
    materials.polyChips ||
    materials.golfClubCartons ||
    materials.bikeBoxes
        ? `
            <div class="pt-2 text-slate-400">Special Packs / Materials</div>
            ${materials.picturePacks ? `<div>Picture Packs: ${materials.picturePacks}</div>` : ""}
            ${materials.tvCartons ? `<div>TV Cartons: ${materials.tvCartons}</div>` : ""}
            ${materials.wineDividers ? `<div>Wine Dividers: ${materials.wineDividers}</div>` : ""}
            ${materials.blueEdging ? `<div>Blue Edging: ${materials.blueEdging}</div>` : ""}
            ${materials.polyChips ? `<div>Poly Chips: ${materials.polyChips}</div>` : ""}
            ${materials.golfClubCartons ? `<div>Golf Club Cartons: ${materials.golfClubCartons}</div>` : ""}
            ${materials.bikeBoxes ? `<div>Bike Boxes: ${materials.bikeBoxes}</div>` : ""}
        `
        : ""
}
                </div>
            </div>
        </div>

        <div class="listed-stat-card">
    <div class="listed-stat-label">Exclusions & Customer Responsibilities</div>

    <div class="space-y-3 text-[10px] font-black text-slate-900 uppercase leading-5">
        <div>
            <div class="text-slate-400 pb-1">Excluded Items (${summary.excludedCount})</div>
            ${
                responsibilities.excludedItems.length
                    ? responsibilities.excludedItems.map(function(item) {
                        return `<div>${escapeHtml(item)}</div>`;
                    }).join("")
                    : `<div class="text-slate-400 italic">None</div>`
            }
        </div>

        <div>
            <div class="text-slate-400 pb-1">Auto Responsibilities</div>
            ${
                responsibilities.autoNotes.length || responsibilities.exclusionNotes.length
                    ? `
                        ${responsibilities.autoNotes.map(function(note) {
                            return `<div>${escapeHtml(note)}</div>`;
                        }).join("")}
                        ${responsibilities.exclusionNotes.map(function(note) {
                            return `<div>${escapeHtml(note)}</div>`;
                        }).join("")}
                    `
                    : `<div class="text-slate-400 italic">None</div>`
            }
        </div>

        <div>
            <div class="text-slate-400 pb-1">Editable Customer Responsibility Notes</div>

            ${
                responsibilities.editableNotes.length
                    ? responsibilities.editableNotes.map(function(note, index) {
                        return `
                            <div class="customer-responsibility-edit-row">
                                <textarea
                                    class="customer-responsibility-input"
                                    oninput="updateCustomerResponsibilityNote(${index}, this.value)"
                                >${escapeHtml(note)}</textarea>

                                <button
                                    type="button"
                                    class="customer-responsibility-delete"
                                    onclick="deleteCustomerResponsibilityNote(${index})"
                                    title="Remove responsibility note"
                                    aria-label="Remove responsibility note"
                                >×</button>
                            </div>
                        `;
                    }).join("")
                    : `<div class="text-slate-400 italic">No editable responsibility notes</div>`
            }

            <button
                type="button"
                class="customer-responsibility-add"
                onclick="addCustomerResponsibilityNote()"
            >
                + Add Responsibility Note
            </button>
        </div>
    </div>
</div>

                <div class="listed-stat-card">
            <div class="listed-stat-label">Crew Instructions / Responsibilities</div>

            <div class="space-y-3 text-[10px] font-black text-slate-900 uppercase leading-5">
                <div>
                    <div class="text-slate-400 pb-1">Dismantle / Reassemble</div>
                    ${
                        crew.dismantle.length
                            ? crew.dismantle.map(function(item) {
                                return `<div>${escapeHtml(item)}</div>`;
                            }).join("")
                            : `<div class="text-slate-400 italic">None</div>`
                    }
                </div>

                <div>
                    <div class="text-slate-400 pb-1">Export Wrap</div>
                    ${
                        crew.exportWrap.length
                            ? crew.exportWrap.map(function(item) {
                                return `<div>${escapeHtml(item)}</div>`;
                            }).join("")
                            : `<div class="text-slate-400 italic">None</div>`
                    }
                </div>

                <div>
                    <div class="text-slate-400 pb-1">Crates</div>
                    ${
                        crew.crate.length
                            ? crew.crate.map(function(item) {
                                return `<div>${escapeHtml(item)}</div>`;
                            }).join("")
                            : `<div class="text-slate-400 italic">None</div>`
                    }
                </div>

                <div>
                    <div class="text-slate-400 pb-1">Notes</div>

                    ${
                        crew.notes.length
                            ? crew.notes.map(function(item) {
                                return `<div>${escapeHtml(item)}</div>`;
                            }).join("")
                            : `<div class="text-slate-400 italic">None</div>`
                    }

                    <div class="mt-2">
                        ${
                            ensureCrewInstructionNotes().length
                                ? ensureCrewInstructionNotes().map(function(note, index) {
                                    return `
                                        <div class="customer-responsibility-edit-row">
                                            <textarea
                                                class="customer-responsibility-input"
                                                oninput="updateCrewInstructionNote(${index}, this.value)"
                                            >${escapeHtml(note)}</textarea>

                                            <button
                                                type="button"
                                                class="customer-responsibility-delete"
                                                onclick="deleteCrewInstructionNote(${index})"
                                                title="Remove crew instruction note"
                                                aria-label="Remove crew instruction note"
                                            >×</button>
                                        </div>
                                    `;
                                }).join("")
                                : ``
                        }

                        <button
                            type="button"
                            class="customer-responsibility-add"
                            onclick="addCrewInstructionNote()"
                        >
                            + Add Crew Note
                        </button>
                    </div>
                </div>
                <div>
    <div class="text-slate-400 pb-1">Special Handling</div>
    ${
        crew.specialHandling.length
            ? crew.specialHandling.map(function(item) {
                return `<div>${escapeHtml(item)}</div>`;
            }).join("")
            : `<div class="text-slate-400 italic">None</div>`
    }
</div>

                <div>
                    <div class="text-slate-400 pb-1">Disconnect</div>
                    ${
                        crew.disconnect.length
                            ? crew.disconnect.map(function(item) {
                                return `<div>${escapeHtml(item)}</div>`;
                            }).join("")
                            : `<div class="text-slate-400 italic">None</div>`
                    }
                </div>

                <div>
                    <div class="text-slate-400 pb-1">Condition</div>
                    ${
                        crew.damage.length
                            ? crew.damage.map(function(item) {
                                return `<div>${escapeHtml(item)}</div>`;
                            }).join("")
                            : `<div class="text-slate-400 italic">None</div>`
                    }
                </div>
            </div>
        </div>
    `;

    setTimeout(function() {
        initSignaturePad();
    }, 0);
}

function getListedBoxOrder(itemName) {
    const name = String(itemName || "").toUpperCase().trim();

    if (name === "AP BOX") return 1;
    if (name === "CG BOX") return 2;
    if (name === "BOOK BOX") return 3;
    if (name === "LINEN BOX") return 4;
    if (name === "WR BOX") return 5;
    if (name === "PICTURE PACK") return 6;
if (name === "WINE DIVIDERS") return 7;
if (name === "BLUE EDGING") return 8;
if (name === "POLY CHIPS") return 9;

    return 999;
}

function isListedBoxItem(itemName) {
    return getListedBoxOrder(itemName) !== 999;
}

function sortListedRoomEntries(entries) {
    return entries
        .map(function(entry, index) {
            return {
                entry: entry,
                index: index
            };
        })
        .sort(function(a, b) {
            const aExcluded = !!a.entry.excluded;
            const bExcluded = !!b.entry.excluded;

            // exclusions always last
            if (aExcluded !== bExcluded) {
                return aExcluded ? 1 : -1;
            }

            const aIsBox = isListedBoxItem(a.entry.itemName);
            const bIsBox = isListedBoxItem(b.entry.itemName);

            // boxes go below normal items
            if (aIsBox !== bIsBox) {
                return aIsBox ? 1 : -1;
            }

            // within the same group, keep original add order
            return a.index - b.index;
        })
        .map(function(item) {
            return item.entry;
        });
}
function groupInventoryItemsForListedView(items) {
    const grouped = {};

    items.forEach(function(entry) {
        const sequenceLabel = getSequenceLabelById(entry.sequenceId);
        const deliveryLabel = getPropertyLabelById(entry.deliveryId);
        const sectionKey = sequenceLabel + "||" + deliveryLabel;
        const roomKey = (entry.roomName || "-") + "||" + (entry.floorName || "-");

        if (!grouped[sectionKey]) {
            grouped[sectionKey] = {
                sequenceLabel: sequenceLabel,
                deliveryLabel: deliveryLabel,
                rooms: {},
                totalVolume: 0
            };
        }

        if (!grouped[sectionKey].rooms[roomKey]) {
            grouped[sectionKey].rooms[roomKey] = {
                roomName: entry.roomName || "-",
                floorName: entry.floorName || "-",
                entries: [],
                totalVolume: 0
            };
        }

        grouped[sectionKey].rooms[roomKey].entries.push(entry);

        if (!entry.excluded) {
            grouped[sectionKey].rooms[roomKey].totalVolume += Number(entry.totalVolume || 0);
            grouped[sectionKey].totalVolume += Number(entry.totalVolume || 0);
        }
    });

    return Object.values(grouped).map(function(section) {
        return {
            sequenceLabel: section.sequenceLabel,
            deliveryLabel: section.deliveryLabel,
            totalVolume: section.totalVolume,
            rooms: Object.values(section.rooms).map(function(room) {
                return {
                    roomName: room.roomName,
                    floorName: room.floorName,
                    totalVolume: room.totalVolume,
                    entries: sortListedRoomEntries(mergeListedInventoryEntries(room.entries))
                };
            })
        };
    });
}

function renderListedInventory() {
    const container = document.getElementById("listed-inventory-output");
    if (!container || !currentJob) return;

    const allItems = getListedInventoryItems();
    renderListedInventoryFilters(allItems);

    const filteredItems = filterListedInventoryItems(allItems);

    if (filteredItems.length === 0) {
    container.innerHTML = `<div class="p-12 text-center text-slate-400 font-bold italic uppercase">No inventory matches current view</div>`;
    renderListedPhotoReview([]);
    renderListedSummary(
        buildListedSummary([]),
        buildMaterialsSummary([])
    );
    return;
}

    const listedSummary = buildListedSummary(filteredItems);
const materialsSummary = buildMaterialsSummary(filteredItems);

renderListedSummary(listedSummary, materialsSummary, filteredItems);
renderListedPhotoReview(filteredItems);

window.__listedEntryMap = {};
    const groupedSections = groupInventoryItemsForListedView(filteredItems);

    if (groupedSections.length === 0) {
    container.innerHTML = `<div class="p-12 text-center text-slate-400 font-bold italic uppercase">No inventory matches current view</div>`;
    renderListedPhotoReview(filteredItems);
    return;
}

    container.innerHTML = groupedSections.map(function(section) {
        const roomBlocks = section.rooms.map(function(room) {
            const rows = room.entries.map(function(entry) {
                const entryKey = getListedEntryMergeKey(entry);
                window.__listedEntryMap = window.__listedEntryMap || {};
                window.__listedEntryMap[entryKey] = entry;

                const tags = [];

if (entry.bedType) tags.push("BED: " + String(entry.bedType).toUpperCase());
if (Array.isArray(entry.wardrobeTypes) && entry.wardrobeTypes.length) {
    tags.push("WARDROBE: " + entry.wardrobeTypes.join(", ").toUpperCase());
}

const pianoListedTag = getPianoDetailsListedTag(entry.pianoDetails);
if (pianoListedTag) tags.push(pianoListedTag);

const photoCount = getInventoryEntryPhotoCount(entry);
if (photoCount > 0) tags.push("PHOTOS: " + photoCount);

if (entry.dismantle) tags.push("DISMANTLE");
if (entry.expWrap) tags.push("EXP WRAP");
if (entry.disconnect) tags.push("DISCONNECT");
if (entry.handyman) tags.push("HANDYMAN");
                if (entry.crated) {
                    if (entry.crateDims) {
                        tags.push(
                            "CRATE: " +
                            entry.crateDims.l + " x " +
                            entry.crateDims.w + " x " +
                            entry.crateDims.h + " " +
                            entry.crateDims.unit
                        );
                    } else {
                        tags.push("CRATE");
                    }
                }
                if (entry.damage) tags.push("CONDITION: " + entry.damage.toUpperCase());
                if (entry.excluded) tags.push("EXCLUDED");
                if (entry.note) tags.push("NOTE: " + entry.note.toUpperCase());

                const tagText = tags.length ? ` [${tags.join("] [")}]` : "";
                const isExcluded = !!entry.excluded;

                return `
                    <tr class="border-t border-slate-200 ${isExcluded ? 'bg-slate-50' : ''}">
                        <td class="py-2 pr-2 text-[10px] font-bold uppercase align-top break-words ${isExcluded ? 'text-slate-500 italic opacity-70' : 'text-slate-900'}">
                            ${entry.itemName || "-"}${tagText}
                        </td>
                        <td class="py-2 px-1 text-[10px] font-black uppercase text-center align-top ${isExcluded ? 'text-slate-400 italic' : 'text-blue-600'}">
                            ${entry.qty || 0}
                        </td>
                        <td class="py-2 px-1 text-[10px] font-black uppercase text-center align-top ${isExcluded ? 'text-slate-300 italic' : 'text-slate-700'}">
                            ${isExcluded ? '' : formatListedLineVolumeDisplay(entry.unitVolume || 0)}
                        </td>
                        <td class="py-2 px-1 text-[10px] font-black uppercase text-center align-top ${isExcluded ? 'text-slate-300 italic' : 'text-slate-900'}">
                            ${isExcluded ? '' : formatListedLineVolumeDisplay(entry.totalVolume || 0)}
                        </td>
                        <td class="py-2 pl-1 align-top">
                            <div class="listed-row-actions">
                                <button class="listed-action-btn listed-action-qty" onclick="editListedEntryQty('${escapeHtml(entryKey)}')">Qty</button>
<button class="listed-action-btn listed-action-flags" onclick="editListedEntryFlags('${escapeHtml(entryKey)}')">Flags</button>
<button class="listed-action-btn listed-action-note" onclick="editListedEntryNote('${escapeHtml(entryKey)}')">Note</button>
<button class="listed-action-btn listed-action-delete delete" onclick="deleteListedEntry('${escapeHtml(entryKey)}')">×</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");

            return `
                <div class="listed-room-block mt-4">
                    <div class="listed-room-head">
                        <div>
                            <div class="listed-room-title">${room.roomName}</div>
                            <div class="text-[9px] font-bold text-slate-400 uppercase mt-1">Floor: ${room.floorName}</div>
                        </div>
                        <div class="listed-room-total">${formatListedLineVolumeDisplay(room.totalVolume, true)}</div>
                    </div>

                    <div class="p-4">
                        <table class="w-full table-fixed">
                            <thead>
                                <tr class="border-b border-slate-300">
                                    <th class="w-[44%] text-left py-2 pr-2 text-[9px] font-black text-slate-400 uppercase">Item</th>
                                    <th class="w-[10%] text-center py-2 px-1 text-[9px] font-black text-slate-400 uppercase">Qty</th>
                                    <th class="w-[14%] text-center py-2 px-1 text-[9px] font-black text-slate-400 uppercase">Unit Vol</th>
                                    <th class="w-[16%] text-center py-2 px-1 text-[9px] font-black text-slate-400 uppercase">Total Vol</th>
                                    <th class="w-[16%] text-center py-2 pl-1 text-[9px] font-black text-slate-400 uppercase">Edit</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }).join("");

        return `
            <div class="border border-slate-200 rounded-2xl overflow-hidden">
                <div class="bg-slate-900 px-4 py-3">
                    <div class="text-[11px] font-black text-white uppercase">${section.sequenceLabel}</div>
                    <div class="text-[10px] font-bold text-blue-300 uppercase mt-1">Delivery To: ${section.deliveryLabel}</div>
                </div>

                <div class="p-4">
                    ${roomBlocks}

                    <div class="mt-4 pt-3 border-t border-slate-200 text-right">
                        <span class="text-[10px] font-black text-slate-400 uppercase mr-2">Section Total</span>
                        <span class="text-sm font-black text-blue-600">${formatListedLineVolumeDisplay(section.totalVolume, true)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}
function resetInventoryQtyInput() {
    const qtyInput = document.getElementById("inv-qty");
    if (qtyInput) qtyInput.value = 1;
}
function openQtyOverride() {
    if (!lastAddedRawEntryId) return;

    const rawEntry = findRawInventoryEntry(lastAddedRawEntryId);
    if (!rawEntry) return;

    openSimpleInputModal({
        mode: "qty-override",
        title: "Override Quantity",
        subtitle: "Set a new quantity for the selected item",
        label: "Quantity",
        placeholder: "e.g. 2",
        value: String(rawEntry.qty || 1),
        inputType: "number",
        inputMode: "numeric"
    });
}

function refreshCurrentInventorySelectionDisplay() {
    if (!lastAddedRawEntryId) {
        currentItemVolume = 0;
        updateInventoryDisplay("No items added");
        renderActionButtonStates();
        return;
    }

    const rawEntry = findRawInventoryEntry(lastAddedRawEntryId);
    if (!rawEntry) {
        currentItemVolume = 0;
        updateInventoryDisplay("No items added");
        renderActionButtonStates();
        return;
    }

    currentItemVolume = rawEntry.excluded ? 0 : Number(rawEntry.totalVolume || 0);

    const tags = [];
if (rawEntry.bedType) tags.push("[BED: " + String(rawEntry.bedType).toUpperCase() + "]");
if (Array.isArray(rawEntry.wardrobeTypes) && rawEntry.wardrobeTypes.length) {
    tags.push("[WARDROBE: " + rawEntry.wardrobeTypes.join(", ").toUpperCase() + "]");
}
if (rawEntry.dismantle) tags.push("[DISMANTLE]");
if (rawEntry.expWrap) tags.push("[EXP WRAP]");
if (rawEntry.disconnect) tags.push("[DISCONNECT]");
if (rawEntry.handyman) tags.push("[HANDYMAN]");
    if (rawEntry.crated && rawEntry.crateDims) {
        tags.push(
            "[CRATE: " +
            rawEntry.crateDims.l + " x " +
            rawEntry.crateDims.w + " x " +
            rawEntry.crateDims.h + " " +
            rawEntry.crateDims.unit + "]"
        );
    }
    if (rawEntry.damage) tags.push("[DAMAGE: " + String(rawEntry.damage).toUpperCase() + "]");
    if (rawEntry.excluded) tags.push("[EXCLUDED]");
    if (rawEntry.note) tags.push("[NOTE: " + String(rawEntry.note).toUpperCase() + "]");

    const label = (rawEntry.itemName || "ITEM").toUpperCase();
    const qty = Number(rawEntry.qty || 0);

    updateInventoryDisplay(
        qty + " X " + label + (tags.length ? " " + tags.join(" ") : "")
    );

    renderActionButtonStates();
}

function getCleanInventoryQtyValue(rawValue) {
    let qty = parseInt(rawValue, 10);
    if (isNaN(qty) || qty < 1) qty = 1;
    return qty;
}

function syncLiveInventoryFromRawForActiveSequence() {
    if (!currentJob || !activeSeqId) return;
    rebuildLiveInventoryFromSequence(activeSeqId);
}



// -----------------------------------------------------------------------------
// Signature, export, and sharing helpers
// -----------------------------------------------------------------------------
function initSurveyorSignaturePad() {
    const canvas = document.getElementById("surveyor-signature-pad");
    if (!canvas) return;

    surveyorSignaturePad = canvas;
    surveyorSignaturePadCtx = canvas.getContext("2d");

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 120;

    surveyorSignaturePadCtx.lineCap = "round";
    surveyorSignaturePadCtx.lineJoin = "round";
    surveyorSignaturePadCtx.lineWidth = 2.5;
    surveyorSignaturePadCtx.strokeStyle = "#0f172a";
    surveyorSignaturePadCtx.clearRect(0, 0, canvas.width, canvas.height);

    const settings = getAppSettings();

    if (settings.surveyorSignatureDataUrl) {
        loadSurveyorSignatureImageToCanvas(settings.surveyorSignatureDataUrl);
        updateSurveyorSignatureStatus(true);
    } else {
        updateSurveyorSignatureStatus(false);
    }

    canvas.onmousedown = startSurveyorSignatureDraw;
    canvas.onmousemove = moveSurveyorSignatureDraw;
    canvas.onmouseup = endSurveyorSignatureDraw;
    canvas.onmouseleave = endSurveyorSignatureDraw;

    canvas.ontouchstart = startSurveyorSignatureDraw;
    canvas.ontouchmove = moveSurveyorSignatureDraw;
    canvas.ontouchend = endSurveyorSignatureDraw;
}

function getSurveyorSignaturePoint(e) {
    if (!surveyorSignaturePad) return { x: 0, y: 0 };

    const rect = surveyorSignaturePad.getBoundingClientRect();
    const source = e.touches && e.touches.length ? e.touches[0] : e;

    return {
        x: source.clientX - rect.left,
        y: source.clientY - rect.top
    };
}

function startSurveyorSignatureDraw(e) {
    if (!surveyorSignaturePadCtx) return;

    if (e && e.preventDefault) e.preventDefault();

    const point = getSurveyorSignaturePoint(e);
    surveyorSignatureDrawing = true;
    surveyorSignatureLastX = point.x;
    surveyorSignatureLastY = point.y;
}

function moveSurveyorSignatureDraw(e) {
    if (!surveyorSignatureDrawing || !surveyorSignaturePadCtx) return;

    if (e && e.preventDefault) e.preventDefault();

    const point = getSurveyorSignaturePoint(e);

    surveyorSignaturePadCtx.beginPath();
    surveyorSignaturePadCtx.moveTo(surveyorSignatureLastX, surveyorSignatureLastY);
    surveyorSignaturePadCtx.lineTo(point.x, point.y);
    surveyorSignaturePadCtx.stroke();

    surveyorSignatureLastX = point.x;
    surveyorSignatureLastY = point.y;
}

function endSurveyorSignatureDraw() {
    surveyorSignatureDrawing = false;
}

function saveSurveyorSignaturePad() {
    if (!surveyorSignaturePad) return;

    const settings = getAppSettings();
    settings.surveyorSignatureDataUrl = surveyorSignaturePad.toDataURL("image/png");
    saveAppSettings(settings);

    updateSurveyorSignatureStatus(true);
    updateInventoryDisplay("SURVEYOR SIGNATURE SAVED");
}

function clearSurveyorSignaturePad() {
    if (!surveyorSignaturePad || !surveyorSignaturePadCtx) return;

    surveyorSignaturePadCtx.clearRect(
        0,
        0,
        surveyorSignaturePad.width,
        surveyorSignaturePad.height
    );

    const settings = getAppSettings();
    settings.surveyorSignatureDataUrl = "";
    saveAppSettings(settings);

    updateSurveyorSignatureStatus(false);
    updateInventoryDisplay("SURVEYOR SIGNATURE CLEARED");
}

function loadSurveyorSignatureImageToCanvas(imageData) {
    if (!surveyorSignaturePadCtx || !surveyorSignaturePad || !imageData) return;

    const img = new Image();

    img.onload = function() {
        surveyorSignaturePadCtx.clearRect(
            0,
            0,
            surveyorSignaturePad.width,
            surveyorSignaturePad.height
        );

        surveyorSignaturePadCtx.drawImage(
            img,
            0,
            0,
            surveyorSignaturePad.width,
            surveyorSignaturePad.height
        );
    };

    img.src = imageData;
}

function updateSurveyorSignatureStatus(hasSignature) {
    const status = document.getElementById("surveyor-signature-status");
    if (!status) return;

    status.innerText = hasSignature
        ? "Surveyor signature saved on this device."
        : "No surveyor signature saved.";
}
function getCustomerSignatureRecord() {
    if (!currentJob) {
        return { image: "", signedAt: "", inventoryChangedAfterSigning: false };
    }

    if (!currentJob.signature || typeof currentJob.signature !== "object") {
        currentJob.signature = {
            image: "",
            signedAt: "",
            inventoryChangedAfterSigning: false
        };
    }

    if (typeof currentJob.signature.inventoryChangedAfterSigning !== "boolean") {
        currentJob.signature.inventoryChangedAfterSigning = false;
    }

    return currentJob.signature;
}

function hasCustomerSignatureSaved() {
    const signature = getCustomerSignatureRecord();
    return !!(signature.image && signature.signedAt);
}

function markCustomerSignatureInventoryChanged() {
    if (!currentJob) return;

    const signature = getCustomerSignatureRecord();

    if (!signature.image || !signature.signedAt) {
        return;
    }

    signature.inventoryChangedAfterSigning = true;
}
function markInventoryChangedAfterSignatureAndSchedule(reason, shouldSave) {
    markCustomerSignatureInventoryChanged();

    if (typeof markScheduleAutoBuildUpdateNeeded === "function") {
        markScheduleAutoBuildUpdateNeeded(
            reason || "Inventory has changed since this schedule was calculated.",
            false
        );
    }

    if (shouldSave !== false) {
        saveToDevice();
    }
}

function clearCustomerSignatureInventoryChanged() {
    const signature = getCustomerSignatureRecord();
    signature.inventoryChangedAfterSigning = false;
}

function getCustomerSignatureWarningHtml() {
    const signature = getCustomerSignatureRecord();

    if (!signature.image || !signature.signedAt || !signature.inventoryChangedAfterSigning) {
        return "";
    }

    return `
        <div class="signature-warning">
            Inventory changed after signature — customer may need to sign again.
        </div>
    `;
}
function initSignaturePad() {
    const canvas = document.getElementById("signature-pad");
    if (!canvas) return;

    signaturePad = canvas;
    signaturePadCtx = canvas.getContext("2d");

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 140;

    signaturePadCtx.lineCap = "round";
    signaturePadCtx.lineJoin = "round";
    signaturePadCtx.lineWidth = 2.5;
    signaturePadCtx.strokeStyle = "#0f172a";
    signaturePadCtx.clearRect(0, 0, canvas.width, canvas.height);

    const hasSavedSignature = !!(
        currentJob &&
        currentJob.signature &&
        currentJob.signature.image
    );

    signatureLocked = hasSavedSignature;
    canvas.classList.toggle("locked", signatureLocked);

    if (hasSavedSignature) {
        loadSignatureImageToCanvas(currentJob.signature.image);
    }

    canvas.onmousedown = startSignatureDraw;
    canvas.onmousemove = moveSignatureDraw;
    canvas.onmouseup = endSignatureDraw;
    canvas.onmouseleave = endSignatureDraw;

    canvas.ontouchstart = startSignatureDraw;
    canvas.ontouchmove = moveSignatureDraw;
    canvas.ontouchend = endSignatureDraw;
}

function getSignaturePoint(e) {
    if (!signaturePad) return { x: 0, y: 0 };

    const rect = signaturePad.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    }

    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function startSignatureDraw(e) {
    if (!signaturePadCtx) return;
    if (signatureLocked) return;

    e.preventDefault();

    const point = getSignaturePoint(e);
    signatureDrawing = true;
    signatureLastX = point.x;
    signatureLastY = point.y;
}

function moveSignatureDraw(e) {
    if (!signatureDrawing || !signaturePadCtx) return;

    e.preventDefault();

    const point = getSignaturePoint(e);

    signaturePadCtx.beginPath();
    signaturePadCtx.moveTo(signatureLastX, signatureLastY);
    signaturePadCtx.lineTo(point.x, point.y);
    signaturePadCtx.stroke();

    signatureLastX = point.x;
    signatureLastY = point.y;
}

function endSignatureDraw(e) {
    if (!signatureDrawing) return;
    if (e) e.preventDefault();

    signatureDrawing = false;
}

function clearSignaturePad() {
    if (!signaturePad || !signaturePadCtx || !currentJob) return;

    signaturePadCtx.clearRect(0, 0, signaturePad.width, signaturePad.height);

    if (!currentJob.signature) {
        currentJob.signature = { image: "", signedAt: "" };
    }

    currentJob.signature.image = "";
currentJob.signature.signedAt = "";
currentJob.signature.inventoryChangedAfterSigning = false;

    signatureLocked = false;
    signaturePad.classList.remove("locked");

        const signedAtEl = document.getElementById("signature-signed-at");
    if (signedAtEl) signedAtEl.innerText = "Not signed";

    const lockBadge = document.getElementById("signature-lock-badge");
if (lockBadge) {
    lockBadge.style.display = "none";
}

const signatureWarning = document.querySelector(".signature-warning");
if (signatureWarning) {
    signatureWarning.remove();
}

saveToDevice();
}

function saveSignaturePad() {
    if (!signaturePad || !currentJob) return;

    if (!currentJob.signature) {
        currentJob.signature = { image: "", signedAt: "" };
    }

    currentJob.signature.image = signaturePad.toDataURL("image/png");
    currentJob.signature.signedAt = new Date().toISOString();
    currentJob.signature.inventoryChangedAfterSigning = false;

    signatureLocked = true;
    signaturePad.classList.add("locked");

        const signedAtEl = document.getElementById("signature-signed-at");
    if (signedAtEl) {
        signedAtEl.innerText = new Date(currentJob.signature.signedAt).toLocaleString("en-GB");
    }

    const lockBadge = document.getElementById("signature-lock-badge");
    if (lockBadge) {
        lockBadge.style.display = "inline-flex";
    }

    saveToDevice();
    updateInventoryDisplay("SIGNATURE SAVED");
}

function loadSignatureImageToCanvas(imageData) {
    if (!signaturePadCtx || !signaturePad) return;
    if (!imageData) return;

    const img = new Image();
    img.onload = function() {
        signaturePadCtx.clearRect(0, 0, signaturePad.width, signaturePad.height);
        signaturePadCtx.drawImage(img, 0, 0, signaturePad.width, signaturePad.height);
    };
    img.src = imageData;
}
// Printable listed inventory content
function getPrintableListedSections(items) {
    const groupedSections = groupInventoryItemsForListedView(items);

    return groupedSections.map(function(section) {
        const roomBlocks = section.rooms.map(function(room) {
            const rows = room.entries.map(function(entry) {
                const tags = [];

                if (entry.dismantle) tags.push("DISMANTLE");
                if (entry.expWrap) tags.push("EXP WRAP");
                if (entry.crated) {
    if (entry.crateDims) {
        tags.push(
            "CRATE: " +
            entry.crateDims.l + " x " +
            entry.crateDims.w + " x " +
            entry.crateDims.h + " " +
            entry.crateDims.unit
        );
    } else {
        tags.push("CRATE");
    }
}
                if (entry.damage) tags.push("CONDITION: " + entry.damage.toUpperCase());

const pianoListedTag = getPianoDetailsListedTag(entry.pianoDetails);
if (pianoListedTag) tags.push(pianoListedTag);

const photoCount = getInventoryEntryPhotoCount(entry);
if (photoCount > 0) tags.push("PHOTOS: " + photoCount);

if (entry.excluded) tags.push("EXCLUDED");
const noteTagHtml = entry.note && String(entry.note).trim()
    ? ` <span class="pdf-inline-note">[NOTE: ${escapeHtml(String(entry.note).trim().toUpperCase())}]</span>`
    : "";
                const tagText = tags.length ? " [" + tags.join("] [") + "]" : "";
                const isExcluded = !!entry.excluded;

                return `
                    <tr>
                        <td class="item-cell ${isExcluded ? 'excluded' : ''}">
                            ${escapeHtml(entry.itemName || "-")}${escapeHtml(tagText)}${noteTagHtml}
                        </td>
                        <td class="num-cell ${isExcluded ? 'excluded' : ''}">${entry.qty || 0}</td>
                        <td class="num-cell ${isExcluded ? 'excluded' : ''}">${isExcluded ? "" : formatListedLineVolumeDisplay(entry.unitVolume || 0)}</td>
                        <td class="num-cell ${isExcluded ? 'excluded' : ''}">${isExcluded ? "" : formatListedLineVolumeDisplay(entry.totalVolume || 0)}</td>
                    </tr>
                `;
            }).join("");

            return `
                <div class="pdf-room-block">
                    <div class="pdf-room-head">
                        <div>
                            <div class="pdf-room-title">${escapeHtml(room.roomName)}</div>
                            <div class="pdf-room-floor">Floor: ${escapeHtml(room.floorName)}</div>
                        </div>
                        <div class="pdf-room-total">${formatListedLineVolumeDisplay(room.totalVolume, true)}</div>
                    </div>

                    <table class="pdf-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Unit Vol</th>
                                <th>Total Vol</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            `;
        }).join("");

        return `
            <div class="pdf-section">
                <div class="pdf-section-head">
                    <div class="pdf-section-title">${escapeHtml(section.sequenceLabel)}</div>
                    <div class="pdf-section-subtitle">Delivery To: ${escapeHtml(section.deliveryLabel)}</div>
                </div>

                <div class="pdf-section-body">
                    ${roomBlocks}
                    <div class="pdf-section-total">
                        <span>Section Total</span>
                        <strong>${formatListedLineVolumeDisplay(section.totalVolume, true)}</strong>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function getPrintableMaterialsHtml(materials) {
    const hasSpecialMaterials =
        materials.picturePacks ||
        materials.tvCartons ||
        materials.wineDividers ||
        materials.blueEdging ||
        materials.polyChips ||
        materials.golfClubCartons ||
        materials.bikeBoxes;

    return `
        <div class="pdf-materials-grid">
            <div>
                <div class="pdf-mini-head">Cartons</div>
                <div>AP Boxes: ${materials.apBoxes}</div>
                <div>CG Boxes: ${materials.cgBoxes}</div>
                <div>Book Boxes: ${materials.bookBoxes}</div>
                <div>Linen Boxes: ${materials.linenBoxes}</div>
                <div>WR Boxes: ${materials.wrBoxes}</div>

                <div class="pdf-mini-head space-top">Mattress Bags</div>
                <div>Single: ${materials.singleMattressBags}</div>
                <div>Double: ${materials.doubleMattressBags}</div>
                <div>King: ${materials.kingMattressBags}</div>
            </div>

            <div>
                <div class="pdf-mini-head">Sofa Covers</div>
                <div>Armchair: ${materials.armchairCovers}</div>
                <div>2-Seater: ${materials.sofa2Covers}</div>
                <div>3-Seater: ${materials.sofa3Covers}</div>
                <div>4-Seater: ${materials.sofa4Covers}</div>

                ${
                    hasSpecialMaterials
                        ? `
                            <div class="pdf-mini-head space-top">Special Packs / Materials</div>
                            ${materials.picturePacks ? `<div>Picture Packs: ${materials.picturePacks}</div>` : ""}
                            ${materials.tvCartons ? `<div>TV Cartons: ${materials.tvCartons}</div>` : ""}
                            ${materials.wineDividers ? `<div>Wine Dividers: ${materials.wineDividers}</div>` : ""}
                            ${materials.blueEdging ? `<div>Blue Edging: ${materials.blueEdging}</div>` : ""}
                            ${materials.polyChips ? `<div>Poly Chips: ${materials.polyChips}</div>` : ""}
                            ${materials.golfClubCartons ? `<div>Golf Club Cartons: ${materials.golfClubCartons}</div>` : ""}
                            ${materials.bikeBoxes ? `<div>Bike Boxes: ${materials.bikeBoxes}</div>` : ""}
                        `
                        : ""
                }
            </div>
        </div>
    `;
}
function getPrintableResponsibilitiesHtml(summary, items) {
    const responsibilities = buildResponsibilitiesSummary(summary, items);

    if (!responsibilities.hasContent) {
        return `<div class="pdf-small-note">No exclusions or customer responsibility notes recorded</div>`;
    }

    const editableNotes = responsibilities.editableNotes.filter(function(note) {
        return String(note || "").trim();
    });

    return `
        <div class="pdf-responsibility-list">
            <div class="pdf-mini-head">Excluded Items (${summary.excludedCount || 0})</div>
            ${
                responsibilities.excludedItems.length
                    ? responsibilities.excludedItems.map(function(item) {
                        return `<div>${escapeHtml(item)}</div>`;
                    }).join("")
                    : `<div>None</div>`
            }

            <div class="pdf-mini-head space-top">Customer Responsibility Notes</div>
            ${
                editableNotes.length
                    ? editableNotes.map(function(note) {
                        return `<div>${escapeHtml(note)}</div>`;
                    }).join("")
                    : `<div>None recorded</div>`
            }

            <div class="pdf-mini-head space-top">Additional Customer Responsibilities</div>
            ${
                responsibilities.autoNotes.length || responsibilities.exclusionNotes.length
                    ? `
                        ${responsibilities.autoNotes.map(function(note) {
                            return `<div>${escapeHtml(note)}</div>`;
                        }).join("")}
                        ${responsibilities.exclusionNotes.map(function(note) {
                            return `<div>${escapeHtml(note)}</div>`;
                        }).join("")}
                    `
                    : `<div>None</div>`
            }
        </div>
    `;
}

function getPrintableCrewInstructionsHtml(items) {
    const crew = buildCrewInstructionsSummary(items);

    return `
        <div class="pdf-materials-grid">
            <div>
                <div class="pdf-mini-head">Notes</div>
                ${
                    crew.notes.length
                        ? crew.notes.map(function(item) {
                            return `<div>${escapeHtml(item)}</div>`;
                        }).join("")
                        : `<div>None</div>`
                }

                <div class="pdf-mini-head space-top">Dismantle / Reassemble</div>
                ${
                    crew.dismantle.length
                        ? crew.dismantle.map(function(item) {
                            return `<div>${escapeHtml(item)}</div>`;
                        }).join("")
                        : `<div>None</div>`
                }

                <div class="pdf-mini-head space-top">Export Wrap</div>
                ${
                    crew.exportWrap.length
                        ? crew.exportWrap.map(function(item) {
                            return `<div>${escapeHtml(item)}</div>`;
                        }).join("")
                        : `<div>None</div>`
                }

                <div class="pdf-mini-head space-top">Crates</div>
                ${
                    crew.crate.length
                        ? crew.crate.map(function(item) {
                            return `<div>${escapeHtml(item)}</div>`;
                        }).join("")
                        : `<div>None</div>`
                }
            </div>

            <div>
                <div class="pdf-mini-head">Condition</div>
                ${
                    crew.damage.length
                        ? crew.damage.map(function(item) {
                            return `<div>${escapeHtml(item)}</div>`;
                        }).join("")
                        : `<div>None</div>`
                }

                <div class="pdf-mini-head space-top">Disconnect</div>
                ${
                    crew.disconnect.length
                        ? crew.disconnect.map(function(item) {
                            return `<div>${escapeHtml(item)}</div>`;
                        }).join("")
                        : `<div>None</div>`
                }

                <div class="pdf-mini-head space-top">Special Handling</div>
                ${
                    crew.specialHandling.length
                        ? crew.specialHandling.map(function(item) {
                            return `<div>${escapeHtml(item)}</div>`;
                        }).join("")
                        : `<div>None</div>`
                }
            </div>
        </div>
    `;
}
let movePilotPrintWindowWatcher = null;
function runPostPrintCleanup() {
    closeAllMovePilotModals();

    if (typeof resetSimpleInputModalHard === "function") {
        resetSimpleInputModalHard();
    }

    try {
        window.focus();
    } catch (err) {
        // Some browsers/tablets ignore this.
    }
}
function makeSafePdfFilenamePart(value) {
    return String(value || "")
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
        .replace(/\s+/g, "_")
        .slice(0, 50) || "MovePilot";
}

// Printable/PDF styling
function getListedInventoryDownloadCss() {
    return `
        .pdf-download-doc {
    width: 740px;
    background: #ffffff;
    color: #0f172a;
    font-family: Arial, sans-serif;
    font-size: 12px;
    line-height: 1.4;
    padding: 22px;
    box-sizing: border-box;
}

        .pdf-topbar {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 20px;
            border-bottom: 2px solid #cbd5e1;
            padding-bottom: 12px;
        }

        .pdf-title {
            font-size: 22px;
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 4px;
        }

        .pdf-sub {
            font-size: 11px;
            color: #475569;
            text-transform: uppercase;
            margin-top: 2px;
        }

        .pdf-section {
            border: 1px solid #cbd5e1;
            margin-bottom: 14px;
            page-break-inside: auto;
        }

        .pdf-section-head {
            background: #0f172a;
            color: white;
            padding: 10px 12px;
        }

        .pdf-section-title {
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
        }

        .pdf-section-subtitle {
            font-size: 10px;
            margin-top: 4px;
            text-transform: uppercase;
            color: #cbd5e1;
        }

        .pdf-section-body {
            padding: 12px;
        }

        .pdf-room-block {
            margin-bottom: 10px;
            border: 1px solid #e2e8f0;
            page-break-inside: avoid;
        }

        .pdf-room-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            background: #f8fafc;
            padding: 6px 8px;
            border-bottom: 1px solid #e2e8f0;
        }

        .pdf-room-title {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
        }

        .pdf-room-floor {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            margin-top: 2px;
        }

        .pdf-room-total {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
        }

        .pdf-table {
            width: 100%;
            border-collapse: collapse;
        }

        .pdf-table th,
        .pdf-table td {
            border-bottom: 1px solid #e2e8f0;
            padding: 5px 6px;
            vertical-align: top;
            font-size: 10px;
            line-height: 1.25;
        }

        .pdf-table th {
            text-align: left;
            font-size: 9px;
            text-transform: uppercase;
            color: #64748b;
        }

        .item-cell {
            width: 55%;
            font-weight: 500;
            text-transform: uppercase;
            color: #334155;
        }

        .pdf-inline-note {
            font-style: italic;
            font-weight: 400;
        }

        .num-cell {
            width: 15%;
            text-align: center;
            font-weight: 500;
            text-transform: uppercase;
            color: #334155;
        }

        .excluded {
            color: #94a3b8;
            font-style: italic;
        }

        .pdf-section-total {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding-top: 10px;
            margin-top: 10px;
            border-top: 1px solid #cbd5e1;
            text-transform: uppercase;
            font-size: 11px;
        }

        .pdf-footer-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(220px, 0.75fr);
    gap: 12px;
    align-items: stretch;
}

        .pdf-responsibilities-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-top: 14px;
            page-break-inside: auto;
            align-items: start;
        }

        .pdf-card-full {
            grid-column: span 2;
        }

        .pdf-card {
            border: 1px solid #cbd5e1;
            padding: 14px;
            background: #f8fafc;
            page-break-inside: avoid;
        }

        .pdf-card-title {
            font-size: 11px;
            font-weight: 750;
            text-transform: uppercase;
            margin-bottom: 10px;
            color: #475569;
        }

        .pdf-big-stat {
            font-size: 28px;
            font-weight: 800;
            line-height: 1;
            margin-bottom: 6px;
        }
        .pdf-volume-display {
    font-size: 22px;
    line-height: 1.12;
    word-break: normal;
}

        .pdf-small-note {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
        }
        .pdf-surveyor-name {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
}
.pdf-surveyor-signature {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
}

.pdf-surveyor-signature img {
    display: block;
    width: 100%;
    max-height: 58px;
    object-fit: contain;
    object-position: left center;
}

        .pdf-materials-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            font-size: 10px;
            font-weight: 500;
            text-transform: uppercase;
            line-height: 1.45;
            color: #334155;
        }

        .pdf-responsibility-list {
            font-size: 10.5px;
            font-weight: 500;
            text-transform: none;
            line-height: 1.45;
            color: #334155;
        }

        .pdf-responsibility-list .pdf-mini-head,
        .pdf-mini-head {
            color: #0f172a;
            font-size: 10.5px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            margin-bottom: 5px;
        }

        .space-top {
            margin-top: 12px;
        }

        .pdf-signature-image {
    width: 100%;
    max-height: 120px;
    object-fit: contain;
    display: block;
    background: white;
    border: 1px solid #cbd5e1;
}

        .pdf-signature-empty {
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: 1px dashed #cbd5e1;
    color: #94a3b8;
    text-transform: uppercase;
    font-size: 11px;
}
    `;
}
// PDF share/download state
let listedInventoryPreparedSharePayload = null;
let listedInventoryPreparedShareFileName = "";

function clearListedInventoryPreparedShare() {
    listedInventoryPreparedSharePayload = null;
    listedInventoryPreparedShareFileName = "";
}

// --- Helper functions for old tablets ---
function isOldTablet() {
    const ua = navigator.userAgent.toLowerCase();
    // Simple check for older Samsung/Android tablets (2018-2019)
    return /samsung|android/.test(ua) && /2018|2019/.test(ua);
}

function getHtml2CanvasScale() {
    // Use lower scale for old tablets to reduce memory usage
    return isOldTablet() ? 1.0 : 1.35;
}

function getListedInventoryPdfOptions(fileName) {
    return {
        margin: [8, 8, 8, 8],
        filename: fileName,
        image: {
            type: "jpeg",
            quality: 0.84
        },
        html2canvas: {
            scale: getHtml2CanvasScale(),
            useCORS: true,
            backgroundColor: "#ffffff"
        },
        jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait"
        },
        pagebreak: {
            mode: ["css", "legacy"],
            avoid: [".pdf-room-block"]
        }
    };
}

function buildListedInventoryPdfContext(filteredItems) {
    const listedSummary = buildListedSummary(filteredItems);
    const materialsSummary = buildMaterialsSummary(filteredItems);
    const crewSummaryHtml = getPrintableCrewInstructionsHtml(filteredItems);
    const sectionsHtml = getPrintableListedSections(filteredItems);

    const customerName =
        (currentJob.customer && currentJob.customer.displayName) ||
        currentJob.name ||
        "---";

    const reference = currentJob.ref || "---";

    const signedAt =
        currentJob.signature && currentJob.signature.signedAt
            ? new Date(currentJob.signature.signedAt).toLocaleString("en-GB")
            : "Not signed";

    const signatureHtml =
        currentJob.signature && currentJob.signature.image
            ? `<img src="${currentJob.signature.image}" class="pdf-signature-image" alt="Signature">`
            : `<div class="pdf-signature-empty">No signature saved</div>`;

    const fileName =
        "MovePilot_Listed_Inventory_" +
        makeSafePdfFilenamePart(customerName) +
        "_" +
        makeSafePdfFilenamePart(reference) +
        ".pdf";

    return {
        filteredItems,
        listedSummary,
        materialsSummary,
        crewSummaryHtml,
        sectionsHtml,
        customerName,
        reference,
        signedAt,
        signatureHtml,
        fileName
    };
}

function createListedInventoryPdfWrapper(pdfContext) {
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-10000px";
    wrapper.style.top = "0";
    wrapper.style.background = "#ffffff";
    wrapper.style.zIndex = "-1";

    wrapper.innerHTML = `
        <style>${getListedInventoryDownloadCss()}</style>

        <div class="pdf-download-doc">
            <div class="pdf-topbar">
                <div>
                    <div class="pdf-title">MovePilot Listed Inventory</div>
                    <div class="pdf-sub">Customer: ${escapeHtml(pdfContext.customerName)}</div>
                    <div class="pdf-sub">Ref: ${escapeHtml(pdfContext.reference)}</div>
                </div>

                <div>
                    <div class="pdf-sub">Exported: ${new Date().toLocaleString("en-GB")}</div>
                </div>
            </div>

            ${pdfContext.sectionsHtml}

            <div class="pdf-footer-grid">
                <div class="pdf-card">
                    <div class="pdf-card-title">Customer Signature</div>
                    ${pdfContext.signatureHtml}
                    <div class="pdf-small-note" style="margin-top: 8px;">Signed: ${escapeHtml(pdfContext.signedAt)}</div>
                    ${getPrintableSurveyorNameHtml()}
                    ${getPrintableSurveyorSignatureHtml()}
                </div>

                <div class="pdf-card">
                    <div class="pdf-card-title">Included Volume & Materials Summary</div>
                    <div class="pdf-big-stat pdf-volume-display">${formatListedSummaryVolumeDisplay(pdfContext.listedSummary.includedVolume)}</div>
                    <div class="pdf-small-note">Included volume counted</div>
                    <div style="margin-top:12px;">
                        ${getPrintableMaterialsHtml(pdfContext.materialsSummary)}
                    </div>
                </div>
            </div>

            <div class="pdf-responsibilities-grid">
                <div class="pdf-card pdf-card-full">
                    <div class="pdf-card-title">Crew Instructions / Responsibilities</div>
                    ${pdfContext.crewSummaryHtml}
                </div>

                <div class="pdf-card pdf-card-full">
                    <div class="pdf-card-title">Exclusions & Customer Responsibilities</div>
                    ${getPrintableResponsibilitiesHtml(pdfContext.listedSummary, pdfContext.filteredItems)}
                </div>
            </div>
        </div>
    `;

    return wrapper;
}

async function shareListedInventoryPdf() {
    clearListedInventoryPreparedShare();

    if (!currentJob) {
        await appAlert("No active job found.", "Share PDF");
        return;
    }

    if (typeof html2pdf === "undefined") {
        await appAlert(
            "PDF generator is not loaded. The file html2pdf.bundle.min.js may not be available on this device.",
            "PDF Library Missing"
        );
        return;
    }

    const allItems = getListedInventoryItems();
    const filteredItems = filterListedInventoryItems(allItems);

    if (!filteredItems.length) {
        await appAlert("No listed inventory to share.", "Export Unavailable");
        return;
    }

    let wrapper = null;

    try {
        const pdfContext = buildListedInventoryPdfContext(filteredItems);
        wrapper = createListedInventoryPdfWrapper(pdfContext);

        document.body.appendChild(wrapper);

        const pdfElement = wrapper.querySelector(".pdf-download-doc");

        if (!pdfElement) {
            await appAlert("PDF element could not be found.", "PDF Share Failed");
            return;
        }

        await appAlert("Creating PDF now. This may take a few seconds on older tablets.", "PDF Share");

        const pdfBlob = await html2pdf()
            .set(getListedInventoryPdfOptions(pdfContext.fileName))
            .from(pdfElement)
            .outputPdf("blob");

        const pdfFile = new File(
            [pdfBlob],
            pdfContext.fileName,
            { type: "application/pdf" }
        );

        listedInventoryPreparedSharePayload = {
            files: [pdfFile],
            title: pdfContext.fileName,
            text: "MovePilot listed inventory PDF"
        };
        listedInventoryPreparedShareFileName = pdfContext.fileName;

        openListedPdfReadyModal();
        bindPdfShareButton(pdfFile);
    } catch (err) {
        console.error("Share PDF failed:", err);

        await appAlert(
            "The PDF could not be prepared for sharing: " +
            (err && err.message ? err.message : err),
            "PDF Share Failed"
        );
    } finally {
        if (wrapper) {
            wrapper.remove();
        }
    }
}
// PDF ready modal
function openListedPdfReadyModal() {
    const overlay = document.getElementById("pdf-ready-overlay");
    if (!overlay) return;
    overlay.style.display = "flex";
}

function closeListedPdfReadyModal() {
    const overlay = document.getElementById("pdf-ready-overlay");
    const downloadLink = document.getElementById("pdf-download-link");

    if (downloadLink && downloadLink.dataset.objectUrl) {
        try {
            URL.revokeObjectURL(downloadLink.dataset.objectUrl);
        } catch (err) {}

        downloadLink.dataset.objectUrl = "";
        downloadLink.href = "#";
        downloadLink.style.display = "none";
    }

    if (overlay) overlay.style.display = "none";
}

async function sharePreparedListedInventoryPdf(event) {
    var preparedFile = null;
    var downloadLink = document.getElementById("pdf-download-link");

    if (!listedInventoryPreparedSharePayload || !listedInventoryPreparedSharePayload.files || !listedInventoryPreparedSharePayload.files[0]) {
        await appAlert("No prepared PDF was found. Please create the PDF again.", "Share PDF");
        closeListedPdfReadyModal();
        return;
    }

    preparedFile = listedInventoryPreparedSharePayload.files[0];
    return tryShareListedInventoryPdfFromGesture(preparedFile, downloadLink, event);
}

async function saveListedInventoryPdfToDevice() {
    try {
        if (typeof closeAllMovePilotModals === "function") {
            closeAllMovePilotModals();
        }
    } catch (modalErr) {
        console.warn("Could not close modals before PDF save:", modalErr);
    }

    if (!currentJob) {
        await appAlert("No active job is open, so the PDF cannot be saved.", "PDF Save Unavailable");
        return;
    }

    if (typeof html2pdf === "undefined") {
        await appAlert(
            "PDF generator is not loaded. The file html2pdf.bundle.min.js may not be available on this device.",
            "PDF Library Missing"
        );
        return;
    }

    const allItems = getListedInventoryItems();
    const filteredItems = filterListedInventoryItems(allItems);

    if (!filteredItems.length) {
        await appAlert("No listed inventory to save.", "Export Unavailable");
        return;
    }

    const pdfContext = buildListedInventoryPdfContext(filteredItems);
    const wrapper = createListedInventoryPdfWrapper(pdfContext);

    document.body.appendChild(wrapper);

    const pdfElement = wrapper.querySelector(".pdf-download-doc");

    try {
        await appAlert("Creating PDF now. This may take a few seconds on older tablets.", "PDF Save");

        const pdfBlob = await html2pdf()
            .set(getListedInventoryPdfOptions(pdfContext.fileName))
            .from(pdfElement)
            .outputPdf("blob");

        const pdfUrl = URL.createObjectURL(pdfBlob);

        const downloadLink = document.createElement("a");
        downloadLink.href = pdfUrl;
        downloadLink.download = pdfContext.fileName;
        downloadLink.style.display = "none";

        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();

        // -----------------------------
        // SAFER fallback for old tablets
        // -----------------------------
        let openedFallback = false;
        try {
            const fallbackWindow = window.open(pdfUrl, "_blank");
            openedFallback = !!fallbackWindow;
        } catch (_) {
            openedFallback = false;
        }

        setTimeout(function() {
            URL.revokeObjectURL(pdfUrl);
        }, 120000);

        await appAlert(
            openedFallback
                ? "PDF created. If it did not save automatically, use the opened PDF tab to save or share it."
                : "PDF created. If it did not appear in Downloads, use Review / Print PDF as a fallback on this tablet.",
            "PDF Save Complete"
        );
    } catch (err) {
        console.error("Save PDF to device failed:", err);

        await appAlert(
            "The PDF could not be saved on this device. Please use Review / Print PDF as a fallback.",
            "PDF Save Failed"
        );
    } finally {
        wrapper.remove();
    }
}
// Browser print/review fallback
async function printListedInventoryPdf() {
    closeAllMovePilotModals();
    if (!currentJob) return;

    const allItems = getListedInventoryItems();
    const filteredItems = filterListedInventoryItems(allItems);

    if (!filteredItems.length) {
        await appAlert("No listed inventory to export.", "Export Unavailable");
        return;
    }

    const pdfContext = buildListedInventoryPdfContext(filteredItems);

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
        await appAlert(
            "The print window could not be opened. Please allow pop-ups for this app and try again.",
            "Print Window Blocked"
        );
        return;
    }

    if (movePilotPrintWindowWatcher) {
        clearInterval(movePilotPrintWindowWatcher);
        movePilotPrintWindowWatcher = null;
    }

    movePilotPrintWindowWatcher = setInterval(function() {
        if (printWindow.closed) {
            clearInterval(movePilotPrintWindowWatcher);
            movePilotPrintWindowWatcher = null;
            runPostPrintCleanup();
        }
    }, 500);

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>MovePilot Listed Inventory PDF</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    color: #0f172a;
                    margin: 24px;
                    font-size: 12px;
                    line-height: 1.4;
                }

                .pdf-topbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 20px;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #cbd5e1;
                    padding-bottom: 12px;
                }

                .pdf-title {
                    font-size: 22px;
                    font-weight: 800;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                }

                .pdf-sub {
                    font-size: 11px;
                    color: #475569;
                    text-transform: uppercase;
                    margin-top: 2px;
                }

                                .pdf-section {
    border: 1px solid #cbd5e1;
    margin-bottom: 14px;
    page-break-inside: auto;
}

                .pdf-section-head {
                    background: #0f172a;
                    color: white;
                    padding: 10px 12px;
                }

                .pdf-section-title {
                    font-size: 13px;
                    font-weight: 800;
                    text-transform: uppercase;
                }

                .pdf-section-subtitle {
                    font-size: 10px;
                    margin-top: 4px;
                    text-transform: uppercase;
                    color: #cbd5e1;
                }

                .pdf-section-body {
                    padding: 12px;
                }

                .pdf-room-block {
    margin-bottom: 10px;
    border: 1px solid #e2e8f0;
    page-break-inside: avoid;
}

                .pdf-room-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    background: #f8fafc;
    padding: 6px 8px;
    border-bottom: 1px solid #e2e8f0;
}

                .pdf-room-title {
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                }

                .pdf-room-floor {
                    font-size: 10px;
                    color: #64748b;
                    text-transform: uppercase;
                    margin-top: 2px;
                }

                .pdf-room-total {
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                }

                .pdf-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .pdf-table th,
.pdf-table td {
    border-bottom: 1px solid #e2e8f0;
    padding: 5px 6px;
    vertical-align: top;
    font-size: 10px;
    line-height: 1.25;
}

.pdf-table th {
    text-align: left;
    font-size: 9px;
    text-transform: uppercase;
    color: #64748b;
}

               .item-cell {
    width: 55%;
    font-weight: 500;
    text-transform: uppercase;
    color: #334155;
}
.pdf-inline-note {
    font-style: italic;
    font-weight: 400;
}

                .num-cell {
    width: 15%;
    text-align: center;
    font-weight: 500;
    text-transform: uppercase;
    color: #334155;
}

                .excluded {
                    color: #94a3b8;
                    font-style: italic;
                }

                .pdf-section-total {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    padding-top: 10px;
                    margin-top: 10px;
                    border-top: 1px solid #cbd5e1;
                    text-transform: uppercase;
                    font-size: 11px;
                }

                .pdf-footer-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(220px, 0.75fr);
    gap: 12px;
    align-items: stretch;
}
.pdf-responsibilities-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 14px;
    page-break-inside: auto;
    align-items: start;
}

.pdf-card-full {
    grid-column: span 2;
}

                .pdf-card {
    border: 1px solid #cbd5e1;
    padding: 14px;
    background: #f8fafc;
    page-break-inside: avoid;
}

                .pdf-card-title {
    font-size: 11px;
    font-weight: 750;
    text-transform: uppercase;
    margin-bottom: 10px;
    color: #475569;
}

                .pdf-big-stat {
                    font-size: 28px;
                    font-weight: 800;
                    line-height: 1;
                    margin-bottom: 6px;
                }
                .pdf-volume-display {
    font-size: 22px;
    line-height: 1.12;
    word-break: normal;
}

                .pdf-small-note {
                    font-size: 10px;
                    color: #64748b;
                    text-transform: uppercase;
                }
                .pdf-surveyor-name {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
}
.pdf-surveyor-signature {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
}

.pdf-surveyor-signature img {
    display: block;
    width: 100%;
    max-height: 58px;
    object-fit: contain;
    object-position: left center;
}

                .pdf-materials-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    line-height: 1.45;
    color: #334155;
}
                .pdf-responsibility-list {
    font-size: 10.5px;
    font-weight: 500;
    text-transform: none;
    line-height: 1.45;
    color: #334155;
}

.pdf-responsibility-list .pdf-mini-head {
    color: #0f172a;
    font-size: 10.5px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

                .pdf-mini-head {
    color: #0f172a;
    font-size: 10.5px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 5px;
}

                .space-top {
                    margin-top: 12px;
                }

                .pdf-signature-image {
                    width: 100%;
                    max-height: 140px;
                    object-fit: contain;
                    display: block;
                    background: white;
                    border: 1px solid #cbd5e1;
                }

                .pdf-signature-empty {
                    height: 140px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    border: 1px dashed #cbd5e1;
                    color: #94a3b8;
                    text-transform: uppercase;
                    font-size: 11px;
                }

.pdf-screen-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    background: #eff6ff;
    border: 1.5px solid #bfdbfe;
    border-bottom-color: #93c5fd;
    border-radius: 12px;
    padding: 10px 12px;
    margin-bottom: 14px;
    color: #1e3a8a;
    font-size: 12px;
    font-weight: 800;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

.pdf-screen-actions-text {
    line-height: 1.35;
}

.pdf-screen-actions-buttons {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
}

.pdf-screen-btn {
    border: 1.5px solid #2563eb;
    border-bottom-color: #1e40af;
    background: #2563eb;
    color: white;
    border-radius: 10px;
    padding: 9px 12px;
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    cursor: pointer;
}

.pdf-screen-btn.secondary {
    background: white;
    color: #334155;
    border-color: #cbd5e1;
    border-bottom-color: #94a3b8;
}

.pdf-screen-btn:active {
    transform: scale(0.98);
}
                @media screen {
    html {
        background: #e2e8f0;
    }

    body {
        width: 210mm;
        min-height: 297mm;
        margin: 16px auto;
        padding: 12mm;
        background: #ffffff;
        font-size: 12px;
        line-height: 1.4;
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
        box-sizing: border-box;
    }

    .pdf-screen-actions {
        position: sticky;
        top: 10px;
        z-index: 50;
    }
}

@page {
    size: A4 portrait;
    margin: 12mm;
}

@media print {
    .pdf-screen-actions {
        display: none !important;
    }

    html,
    body {
        width: 210mm;
        min-height: 297mm;
        background: white !important;
    }

    body {
        margin: 0;
        font-size: 12px;
        box-shadow: none;
        max-width: none;
        padding: 0;
    }

    .pdf-section {
        page-break-inside: auto;
        break-inside: auto;
    }

    .pdf-room-block {
        page-break-inside: avoid;
        break-inside: avoid;
    }

    .pdf-card {
        page-break-inside: avoid;
        break-inside: avoid;
    }
}
            </style>
        </head>
        <body>
            <div class="pdf-topbar">
                <div>
                    <div class="pdf-title">MovePilot Listed Inventory</div>
                    <div class="pdf-sub">Customer: ${escapeHtml(pdfContext.customerName)}</div>
                    <div class="pdf-sub">Ref: ${escapeHtml(pdfContext.reference)}</div>
                </div>

                <div>
                    <div class="pdf-sub">Exported: ${new Date().toLocaleString("en-GB")}</div>
                </div>
            </div>
            <div class="pdf-screen-actions">
                <div class="pdf-screen-actions-text">
                    <strong>Review Copy:</strong> Check this with the customer. Use Print / Save PDF when ready.
                </div>

                <div class="pdf-screen-actions-buttons">
                    <button type="button" class="pdf-screen-btn" onclick="window.print()">Print / Save PDF</button>
                    <button type="button" class="pdf-screen-btn secondary" onclick="window.close()">Close Preview</button>
                </div>
            </div>

            ${pdfContext.sectionsHtml}

            <div class="pdf-footer-grid">
                <div class="pdf-card">
                    <div class="pdf-card-title">Customer Signature</div>
                    ${pdfContext.signatureHtml}
                    <div class="pdf-small-note" style="margin-top: 8px;">Signed: ${escapeHtml(pdfContext.signedAt)}</div>
                    ${getPrintableSurveyorNameHtml()}
                    ${getPrintableSurveyorSignatureHtml()}
                </div>

                <div class="pdf-card">
                    <div class="pdf-card-title">Included Volume & Materials Summary</div>
                    <div class="pdf-big-stat pdf-volume-display">${formatListedSummaryVolumeDisplay(pdfContext.listedSummary.includedVolume)}</div>
                    <div class="pdf-small-note">Included volume counted</div>
                    <div style="margin-top:12px;">
                        ${getPrintableMaterialsHtml(pdfContext.materialsSummary)}
                    </div>
                </div>
            </div>

            <div class="pdf-responsibilities-grid">
                <div class="pdf-card pdf-card-full">
                    <div class="pdf-card-title">Crew Instructions / Responsibilities</div>
                    ${pdfContext.crewSummaryHtml}
                </div>

                <div class="pdf-card pdf-card-full">
                    <div class="pdf-card-title">Exclusions & Customer Responsibilities</div>
                    ${getPrintableResponsibilitiesHtml(pdfContext.listedSummary, pdfContext.filteredItems)}
                </div>
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();

    printWindow.onafterprint = function() {
        runPostPrintCleanup();

        try {
            printWindow.close();
        } catch (err) {
            // Some browsers may block this.
        }
    };

    setTimeout(function() {
        printWindow.focus();
    }, 400);
}
/* =========================
   COSTING & QUOTING STATE
========================= */

/* =========================
   AVAILABILITY CACHE
========================= */

const PHOTON_AVAILABILITY_CACHE_KEY = "photon_availability_cache";

function getDefaultAvailabilityCache() {
    return {
        refreshedAt: "",
        source: "Local fallback",
        dates: {
            "2026-05-01": "green",
            "2026-05-02": "blue",
            "2026-05-03": "yellow"
        }
    };
}

function getAvailabilityCache() {
    const raw = localStorage.getItem(PHOTON_AVAILABILITY_CACHE_KEY);

    if (!raw) {
        return getDefaultAvailabilityCache();
    }

    try {
        const parsed = JSON.parse(raw);

        if (!parsed || typeof parsed !== "object") {
            return getDefaultAvailabilityCache();
        }

        if (!parsed.dates || typeof parsed.dates !== "object") {
            parsed.dates = {};
        }

        if (!parsed.source) {
            parsed.source = "Cached availability";
        }

        if (!parsed.refreshedAt) {
            parsed.refreshedAt = "";
        }

        return parsed;
    } catch (err) {
        return getDefaultAvailabilityCache();
    }
}

function saveAvailabilityCache(cache) {
    return writeJsonToLocalStorage(PHOTON_AVAILABILITY_CACHE_KEY, cache);
}

function getAvailabilityBandForDate(dateValue) {
    const cleanDate = String(dateValue || "").trim();

    if (!cleanDate) {
        return "green";
    }

    const cache = getAvailabilityCache();
    const band = cache.dates && cache.dates[cleanDate];

    return band || "green";
}

function getAvailabilityRefreshText() {
    const cache = getAvailabilityCache();

    if (!cache.refreshedAt) {
        return "Using local fallback availability";
    }

    return "Last refreshed: " + new Date(cache.refreshedAt).toLocaleString("en-GB") + " · " + cache.source;
}

function buildSampleAvailabilityRefreshData() {
    return {
        refreshedAt: new Date().toISOString(),
        source: "Sample refreshed availability",
        dates: {
            "2026-05-01": "green",
            "2026-05-02": "green",
            "2026-05-03": "blue",
            "2026-05-04": "yellow",
            "2026-05-05": "blue",
            "2026-05-06": "green",
            "2026-05-07": "yellow",
            "2026-05-08": "green",
            "2026-05-09": "blue",
            "2026-05-10": "yellow"
        }
    };
}

async function refreshAvailabilityCacheSample() {
    const sampleData = buildSampleAvailabilityRefreshData();
    const saved = saveAvailabilityCache(sampleData);

    if (!saved) {
        await appAlert(
            "Availability could not be saved on this device.",
            "Availability Refresh Failed"
        );
        return;
    }

    const statusEl = document.getElementById("quote-availabilityRefreshStatus");
    if (statusEl) {
        statusEl.innerText = getAvailabilityRefreshText();
    }

    const seq = getQuoteSelectedSequence();
    if (seq) {
        updateQuoteCommercialDisplays(String(seq.id));
    }
}
const QUOTE_MANDATORY_LABELS = ["Vans", "Crew", "Mileage", "Consumables", "Cartons", "Export Wrap", "Nights Out"];
const QUOTE_PRICING_DEFAULTS = [
    { label: "Vans", qty: 0, unitCost: 120 },
    { label: "Crew", qty: 0, unitCost: 200 },
    { label: "Mileage", qty: 0, unitCost: 1.20 },
    { label: "Consumables", qty: 1, unitCost: 60 },
    { label: "Cartons", qty: 0, unitCost: 2.5 },
    { label: "Export Wrap", qty: 0, unitCost: 0.3 },
    { label: "Overtime", qty: 0, unitCost: 20 },
    { label: "Nights Out", qty: 0, unitCost: 40 }
];

const QUOTE_OPTIONAL_COST_CHOICES = [
    "Custom",
    "Handyman",
    "Parking Admin",
    "Hoist / Crane",
    "Ferry",
    "Crating",
    "Shuttle Surcharge"
];
const QUOTE_CORE_COST_CHOICES = [
    "Vans",
    "Crew",
    "Mileage",
    "Consumables",
    "Cartons",
    "Export Wrap",
    "Overtime",
    "Nights Out",
    "Crates",
    "Admin Fee",
    "Custom"
];

const QUOTE_ADDITIONAL_SERVICE_CHOICES = [
    "Custom",
    "Handyman",
    "Piano Specialist",
    "Heavy Lifting Team",
    "Parking Admin",
    "Hoist / Crane",
    "Ferry",
    "Crating",
    "Shuttle Surcharge",
    "Electrician",
    "Plumber",
    "Cleaner",
    "Decorator",
    "Specialist Contractor"
];

const AVAILABILITY_MARGIN_BANDS = {
    green: {
        label: "Green Availability",
        baseMargin: 10,
        className: "green"
    },
    blue: {
        label: "Blue Availability",
        baseMargin: 20,
        className: "blue"
    },
    yellow: {
        label: "Yellow Availability",
        baseMargin: 30,
        className: "yellow"
    }
};

/*
    Phase 2 local placeholder availability map.
    Later, this can be refreshed from CRM/server.
    Format:
    "YYYY-MM-DD": "green" / "blue" / "yellow"
*/
const LOCAL_AVAILABILITY_BY_DATE = {
    "2026-05-01": "green",
    "2026-05-02": "blue",
    "2026-05-03": "yellow"
};
/*
    Temporary date-based availability margin test.
    Later this can be replaced by CRM/server availability rates.

    Format:
    "YYYY-MM-DD": margin percentage
*/

/*
    Temporary branch + date availability margin test.
    Later this can be replaced by CRM/server availability rates.

    Format:
    "Branch|YYYY-MM-DD": availability result
*/
const TEST_AVAILABILITY_MARGIN_BY_BRANCH_DATE = {
    "Aylesbury|2026-06-30": {
        marginPct: 10,
        band: "green",
        label: "Good Availability"
    },
    "Aylesbury|2026-07-01": {
        marginPct: 20,
        band: "blue",
        label: "Medium Availability"
    },
    "Aylesbury|2026-07-03": {
        marginPct: 35,
        band: "red",
        label: "High Demand Availability"
    },

    "Edinburgh|2026-06-30": {
        marginPct: 35,
        band: "red",
        label: "High Demand Availability"
    },
    "Edinburgh|2026-07-01": {
        marginPct: 20,
        band: "blue",
        label: "Medium Availability"
    },
    "Edinburgh|2026-07-03": {
        marginPct: 10,
        band: "green",
        label: "Good Availability"
    }
};

const QUOTE_AVAILABILITY_BANDS = [
    {
        id: "",
        label: "Select Band",
        cssClass: "availability-band-grey",
        minMargin: 0,
        maxMargin: 0
    },
    {
        id: "green",
        label: "Green",
        cssClass: "availability-band-green",
        minMargin: 10,
        maxMargin: 20
    },
    {
        id: "blue",
        label: "Blue",
        cssClass: "availability-band-blue",
        minMargin: 20,
        maxMargin: 30
    },
    {
        id: "yellow",
        label: "Yellow",
        cssClass: "availability-band-yellow",
        minMargin: 30,
        maxMargin: 40
    },
    {
        id: "red",
        label: "Red",
        cssClass: "availability-band-red",
        minMargin: 40,
        maxMargin: 50
    }
];

/*
    Later, the server/CRM refresh can fill this table.

    Format:
    "Branch|YYYY-MM-DD": "green"
    "Branch|YYYY-MM-DD": "blue"
    "Branch|YYYY-MM-DD": "yellow"
    "Branch|YYYY-MM-DD": "red"
*/
const AVAILABILITY_RATE_TABLE = {
    // Example:
    // "Guildford|2026-05-14": "yellow",
    // "London|2026-05-15": "green"
};

let quotePricingSaved = false;

function ensureCostingStore() {
    if (!currentJob) return;

    if (!currentJob.costingQuote) {
        currentJob.costingQuote = {
            selectedSequenceId: "",
            bySequence: {}
        };
    }

    if (!currentJob.costingQuote.bySequence) {
        currentJob.costingQuote.bySequence = {};
    }
}

function createEmptyQuoteSequenceState() {
    return {
        customerPrice: 0,
        quoteNotes: "",
        pricingLines: [],
        additionalCostLines: [],
        competition: {
            partnerCrewUnsuitable: false,
            competitorName: "",
            competitorPrice: 0,
            notes: ""
        },
        availabilityPricing: {
            moveDate: "",
            band: "",
            uplift: 0,
            appliedSuggestedPrice: 0
        }
    };
}

function ensureQuoteSequenceState(sequenceId) {
    ensureCostingStore();
    if (!currentJob || !sequenceId) return null;

    if (!currentJob.costingQuote.bySequence[String(sequenceId)]) {
        currentJob.costingQuote.bySequence[String(sequenceId)] = createEmptyQuoteSequenceState();
    }

    const state = currentJob.costingQuote.bySequence[String(sequenceId)];

    if (!Array.isArray(state.pricingLines)) state.pricingLines = [];
    if (!Array.isArray(state.additionalCostLines)) state.additionalCostLines = [];
    if (typeof state.quoteNotes !== "string") state.quoteNotes = "";
    if (typeof state.customerPrice !== "number") state.customerPrice = Number(state.customerPrice || 0);

    if (!state.competition || typeof state.competition !== "object") {
        state.competition = {
            competitorName: "",
            competitorPrice: 0,
            partnerCrewUnsuitable: false,
            notes: ""
        };
    }

    if (typeof state.competition.competitorName !== "string") {
        state.competition.competitorName = "";
    }

    state.competition.competitorPrice = Number(state.competition.competitorPrice || 0);

    if (state.competition.partnerCrewUnsuitable === undefined) {
        state.competition.partnerCrewUnsuitable = false;
    }

    state.competition.partnerCrewUnsuitable = !!state.competition.partnerCrewUnsuitable;

    if (typeof state.competition.notes !== "string") {
        state.competition.notes = "";
    }

    if (!state.availabilityPricing || typeof state.availabilityPricing !== "object") {
        state.availabilityPricing = {
            moveDate: "",
            band: "",
            uplift: 0,
            appliedSuggestedPrice: 0
        };
    }

    if (state.availabilityPricing.band === "green" && !state.availabilityPricing.moveDate) {
        state.availabilityPricing.band = "";
    }

    if (typeof state.availabilityPricing.moveDate !== "string") {
        state.availabilityPricing.moveDate = "";
    }

    if (!AVAILABILITY_MARGIN_BANDS[state.availabilityPricing.band]) {
        state.availabilityPricing.band = "green";
    }

    state.availabilityPricing.uplift = Math.max(
        0,
        Math.min(10, Number(state.availabilityPricing.uplift || 0))
    );

    state.availabilityPricing.appliedSuggestedPrice = Number(
        state.availabilityPricing.appliedSuggestedPrice || 0
    );

    if (!Array.isArray(state.availabilityPricing.dates)) {
        state.availabilityPricing.dates = [];
    }

    if (state.availabilityPricing.faderValue === undefined) {
        state.availabilityPricing.faderValue = 5;
    }

    if (state.availabilityPricing.lastSuggestedMarginPct === undefined) {
        state.availabilityPricing.lastSuggestedMarginPct = 0;
    }

    if (state.availabilityPricing.lastSuggestedSellPrice === undefined) {
        state.availabilityPricing.lastSuggestedSellPrice = 0;
    }

    if (typeof state.availabilityPricing.lastAppliedAt !== "string") {
        state.availabilityPricing.lastAppliedAt = "";
    }

    return state;
}

function getQuoteSelectedSequenceId() {
    if (!currentJob || !Array.isArray(currentJob.sequences) || currentJob.sequences.length === 0) {
        return "";
    }

    ensureCostingStore();

    const savedId = currentJob.costingQuote.selectedSequenceId;
    const exists = currentJob.sequences.some(function(seq) {
        return String(seq.id) === String(savedId);
    });

    if (exists) return String(savedId);

    return String(activeSeqId || currentJob.sequences[0].id);
}

function setQuoteSelectedSequenceId(sequenceId) {
    ensureCostingStore();
    if (!currentJob) return;

    currentJob.costingQuote.selectedSequenceId = String(sequenceId || "");
    quotePricingSaved = false;
    saveToDevice();
}

function getPricingDateFromSchedule(sequenceId) {
    if (!currentJob || !Array.isArray(currentJob.sequences)) {
        return {
            date: "",
            source: "none",
            label: "No schedule found"
        };
    }

    const seq = currentJob.sequences.find(function(sequence) {
        return String(sequence.id) === String(sequenceId);
    });

    if (!seq || !seq.schedule || !Array.isArray(seq.schedule.manualDays)) {
        return {
            date: "",
            source: "none",
            label: "No schedule rows found"
        };
    }

    const rowsWithDates = seq.schedule.manualDays.filter(function(row) {
        return !!getScheduleRowDateValue(row);
    });

    if (!rowsWithDates.length) {
        return {
            date: "",
            source: "none",
            label: "No schedule row date entered"
        };
    }

    const completionDayRow = rowsWithDates.find(function(row) {
        return String(row.completionWindow || "") === "Completion Day";
    });

    if (completionDayRow) {
        return {
            date: getScheduleRowDateValue(completionDayRow),
            source: "completion",
            label: "Using Completion Day date"
        };
    }

    return {
        date: getScheduleRowDateValue(rowsWithDates[0]),
        source: "first",
        label: "No Completion Day set — using first schedule date"
    };
}

function getAvailabilityBandForScheduleDate(sequenceId, dateValue) {
    if (!dateValue) return "";

    const seq = currentJob && Array.isArray(currentJob.sequences)
        ? currentJob.sequences.find(function(sequence) {
            return String(sequence.id) === String(sequenceId);
        })
        : null;

    const branch = getOperatingBranchForSequence(sequenceId);

if (!branch) {
    return "";
}

    const branchKey = branch + "|" + dateValue;

    if (AVAILABILITY_RATE_TABLE && AVAILABILITY_RATE_TABLE[branchKey]) {
        return AVAILABILITY_RATE_TABLE[branchKey];
    }

    if (LOCAL_AVAILABILITY_BY_DATE && LOCAL_AVAILABILITY_BY_DATE[dateValue]) {
        return LOCAL_AVAILABILITY_BY_DATE[dateValue];
    }

    return "";
}

function syncQuoteAvailabilityDateFromSchedule(sequenceId) {
    const state = ensureQuoteSequenceState(sequenceId);
    if (!state) return;

    if (!state.availabilityPricing || typeof state.availabilityPricing !== "object") {
        state.availabilityPricing = {
            moveDate: "",
            band: "",
            uplift: 0,
            appliedSuggestedPrice: 0
        };
    }

    const scheduleDateInfo = getPricingDateFromSchedule(sequenceId);
    const scheduleDate = scheduleDateInfo.date || "";
    const availabilityBand = getAvailabilityBandForScheduleDate(sequenceId, scheduleDate);

    state.availabilityPricing.moveDate = scheduleDate;
    state.availabilityPricing.dateSource = scheduleDateInfo.source;
    state.availabilityPricing.dateSourceLabel = scheduleDateInfo.label;

    if (availabilityBand) {
        state.availabilityPricing.band = availabilityBand;
    }

    if (!state.availabilityPricing.band) {
        state.availabilityPricing.band = "";
    }
}
function getQuoteSelectedSequence() {
    if (!currentJob || !Array.isArray(currentJob.sequences)) return null;

    const selectedId = getQuoteSelectedSequenceId();

    return currentJob.sequences.find(function(seq) {
        return String(seq.id) === String(selectedId);
    }) || currentJob.sequences[0] || null;
}

function quoteMoney(value) {
    return Number(value || 0).toFixed(2);
}

function createQuoteLineId() {
    return "quote_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}

function getQuoteSequenceFeed(sequenceId) {
    if (!currentJob) return null;

    return buildCalculatorFeedForSequence(sequenceId);
}

function getQuoteScheduleRows(sequenceId) {
    const seq = currentJob && currentJob.sequences
        ? currentJob.sequences.find(function(s) { return String(s.id) === String(sequenceId); })
        : null;

    if (!seq || !seq.schedule || !Array.isArray(seq.schedule.manualDays)) return [];

    return seq.schedule.manualDays.map(function(day) {
        return {
            ...day,
            vans: Math.max(0, Number(day.vans) || 1)
        };
    });
}

function calcQuoteScheduleTotals(sequenceId) {
    const rows = getQuoteScheduleRows(sequenceId);
    const grouped = {};

    rows.forEach(function(row) {
        const groupKey = String(row.groupId || row.id || "");

        if (!grouped[groupKey]) {
            grouped[groupKey] = {
    vans: 0,
    crew: 0,
    nightsOut: 0,
    overtime: 0,
    hasNightOut: false
};
        }

        const men = Number(row.men || 0);
        const vans = Number(row.vans || 0);

        grouped[groupKey].vans = Math.max(grouped[groupKey].vans, vans);
        grouped[groupKey].crew = Math.max(grouped[groupKey].crew, men);

        const isNightOutTask =
            String(row.task || "") === "Load and Travel" ||
            String(row.task || "") === "Deliver and Crew Return";

        const isNightOutSelected = !!row.nightsOut;

        if (isNightOutTask || isNightOutSelected) {
            grouped[groupKey].hasNightOut = true;
        }
        grouped[groupKey].overtime += Math.max(0, Number(row.overtimeHours || 0)) * men;
    });

    return Object.values(grouped).reduce(function(acc, day) {
    acc.vans += Number(day.vans || 0);
    acc.crew += Number(day.crew || 0);
    acc.overtime += Number(day.overtime || 0);

    if (day.hasNightOut) {
        acc.nightsOut += Number(day.crew || 0);
    }

    return acc;
}, { vans: 0, crew: 0, nightsOut: 0, overtime: 0 });
}

function buildDefaultQuotePricingLines(sequenceId) {
    const feed = getQuoteSequenceFeed(sequenceId);
    const scheduleTotals = calcQuoteScheduleTotals(sequenceId);

    const cartonQty = feed
        ? Number(feed.qty.ap || 0) +
          Number(feed.qty.cg || 0) +
          Number(feed.qty.books || 0) +
          Number(feed.qty.linen || 0) +
          Number(feed.qty.wr || 0)
        : 0;

    const exportWrapQty = feed
        ? Number(
            (feed.special && feed.special.exportWrapVol) ||
            feed.exportWrapVol ||
            0
          )
        : 0;

    return QUOTE_PRICING_DEFAULTS.map(function(item) {
        let qty = Number(item.qty || 0);

        if (item.label === "Vans") qty = scheduleTotals.vans;
        if (item.label === "Crew") qty = scheduleTotals.crew;
        if (item.label === "Cartons") qty = cartonQty;
        if (item.label === "Export Wrap") qty = exportWrapQty;
        if (item.label === "Overtime") qty = scheduleTotals.overtime;
        if (item.label === "Nights Out") qty = scheduleTotals.nightsOut;

        return {
            id: createQuoteLineId(),
            label: item.label,
            customLabel: "",
            qty: qty,
            unitCost: Number(item.unitCost || 0)
        };
    });
}
function syncQuoteAdminFeeCoreLine(sequenceId) {
    const state = ensureQuoteSequenceState(sequenceId);
    if (!state) return;

    if (!Array.isArray(state.pricingLines)) {
        state.pricingLines = [];
    }

    let adminLine = state.pricingLines.find(function(line) {
        return line.autoCoreCost === "adminFee";
    });

    if (!adminLine) {
        adminLine = state.pricingLines.find(function(line) {
            return String(line.label || "") === "Admin Fee";
        });
    }

    if (adminLine) {
        adminLine.label = "Admin Fee";
        adminLine.customLabel = "";
        adminLine.qty = 1;
        adminLine.unitCost = 25;
        adminLine.autoCoreCost = "adminFee";
        adminLine.locked = true;
        adminLine.needsCostEntry = false;
        return;
    }

    state.pricingLines.push({
        id: createQuoteLineId(),
        label: "Admin Fee",
        customLabel: "",
        qty: 1,
        unitCost: 25,
        autoCoreCost: "adminFee",
        locked: true,
        needsCostEntry: false
    });
}

function getQuotePricingLines(sequenceId) {
    const state = ensureQuoteSequenceState(sequenceId);
    if (!state) return [];

    if (!state.pricingLines.length) {
        state.pricingLines = buildDefaultQuotePricingLines(sequenceId);
    }

    syncQuotePricingFromSchedule(sequenceId);
    syncQuoteAdminFeeCoreLine(sequenceId);

    return state.pricingLines;
}

function getQuoteAdditionalCostLines(sequenceId) {
    const state = ensureQuoteSequenceState(sequenceId);
    if (!state) return [];

    if (!state.additionalCostLines.length) {
        state.additionalCostLines = [];
    }

    return state.additionalCostLines;
}

function sequenceNeedsHeavyLiftingTeamCost(sequenceId) {
    const rawItems = getRawInventoryItemsForSequence(sequenceId).filter(function(entry) {
        return !entry.excluded;
    });

    return rawItems.some(function(entry) {
        return (
            String(entry.itemName || "").trim().toUpperCase() === "SAFE" &&
            entryRequiresSafeHeavyLiftReview(entry)
        );
    });
}
function syncQuoteTriggeredCostRows(sequenceId) {
    const state = ensureQuoteSequenceState(sequenceId);
    if (!state) return;

    if (!Array.isArray(state.pricingLines)) state.pricingLines = [];
    if (!Array.isArray(state.additionalCostLines)) state.additionalCostLines = [];

    const rawItems = getRawInventoryItemsForSequence(sequenceId).filter(function(entry) {
        return !entry.excluded;
    });

    const hasCrates = rawItems.some(function(entry) {
        return !!entry.crated;
    });

    const hasHandyman = rawItems.some(function(entry) {
        return !!entry.handyman;
    });
    const needsHeavyLiftingTeam = sequenceNeedsHeavyLiftingTeamCost(sequenceId);

    const existingCratesLine = state.pricingLines.find(function(line) {
        return line.label === "Crates";
    });

    if (hasCrates && !existingCratesLine) {
        state.pricingLines.push({
            id: createQuoteLineId(),
            label: "Crates",
            customLabel: "",
            qty: 1,
            unitCost: 0,
            autoFromInventory: true,
            needsCostEntry: true
        });
    }

    const existingHandymanLine = state.additionalCostLines.find(function(line) {
        return line.label === "Handyman";
    });

    if (hasHandyman && !existingHandymanLine) {
        state.additionalCostLines.push({
            id: createQuoteLineId(),
            label: "Handyman",
            customLabel: "",
            qty: 1,
            unitCost: 0,
            autoFromInventory: true,
            needsCostEntry: true
        });
    }
    const existingHeavyLiftingLine = state.additionalCostLines.find(function(line) {
    return line.autoFromInventory === "heavyLiftingTeam";
});

if (needsHeavyLiftingTeam && !existingHeavyLiftingLine) {
    state.additionalCostLines.push({
        id: createQuoteLineId(),
        label: "Heavy Lifting Team",
        customLabel: "",
        qty: 1,
        unitCost: 0,
        autoFromInventory: "heavyLiftingTeam",
        needsCostEntry: true
    });
}

if (needsHeavyLiftingTeam && existingHeavyLiftingLine) {
    existingHeavyLiftingLine.label = "Heavy Lifting Team";
    existingHeavyLiftingLine.customLabel = "";
    existingHeavyLiftingLine.qty = Number(existingHeavyLiftingLine.qty || 0) > 0
        ? Number(existingHeavyLiftingLine.qty || 0)
        : 1;
    existingHeavyLiftingLine.needsCostEntry = Number(existingHeavyLiftingLine.unitCost || 0) <= 0;
}
}
function syncQuotePricingFromSchedule(sequenceId) {
    const state = ensureQuoteSequenceState(sequenceId);
    if (!state || !Array.isArray(state.pricingLines)) return;
    syncQuoteTriggeredCostRows(sequenceId);

    const scheduleTotals = calcQuoteScheduleTotals(sequenceId);
    const feed = getQuoteSequenceFeed(sequenceId);

    const cartonQty = feed
        ? Number(feed.qty.ap || 0) +
          Number(feed.qty.cg || 0) +
          Number(feed.qty.books || 0) +
          Number(feed.qty.linen || 0) +
          Number(feed.qty.wr || 0)
        : 0;

    const exportWrapQty = feed
        ? Number(
            (feed.special && feed.special.exportWrapVol) ||
            feed.exportWrapVol ||
            0
          )
        : 0;

    state.pricingLines = state.pricingLines.map(function(line) {
        if (line.label === "Vans") return { ...line, qty: scheduleTotals.vans };
        if (line.label === "Crew") return { ...line, qty: scheduleTotals.crew };
        if (line.label === "Cartons") return { ...line, qty: cartonQty };
        if (line.label === "Export Wrap") return { ...line, qty: exportWrapQty };
        if (line.label === "Overtime") return { ...line, qty: scheduleTotals.overtime };
        if (line.label === "Nights Out") return { ...line, qty: scheduleTotals.nightsOut };
        return line;
    });
}

function calcQuoteLineTotal(line) {
    return Number(line.qty || 0) * Number(line.unitCost || 0);
}

function calcQuoteCoreCostTotal(sequenceId) {
    return getQuotePricingLines(sequenceId).reduce(function(sum, line) {
        return sum + calcQuoteLineTotal(line);
    }, 0);
}

function calcQuoteAdditionalCostTotal(sequenceId) {
    return getQuoteAdditionalCostLines(sequenceId).reduce(function(sum, line) {
        if (!line.label) return sum;
        return sum + calcQuoteLineTotal(line);
    }, 0);
}

function getQuoteCommercialTotals(sequenceId) {
    const state = ensureQuoteSequenceState(sequenceId);
    if (!state) {
        return {
            coreCosts: 0,
            additionalCosts: 0,
            totalCostBase: 0,
            customerPrice: 0,
            grossMargin: 0,
            grossMarginPct: 0
        };
    }

    const coreCosts = calcQuoteCoreCostTotal(sequenceId);
    const additionalCosts = calcQuoteAdditionalCostTotal(sequenceId);
    const totalCostBase = coreCosts;
    const customerPrice = Number(state.customerPrice || 0);
    const grossMargin = customerPrice - totalCostBase;
    const grossMarginPct = customerPrice > 0 ? (grossMargin / customerPrice) * 100 : 0;

    return {
        coreCosts: coreCosts,
        additionalCosts: additionalCosts,
        totalCostBase: totalCostBase,
        customerPrice: customerPrice,
        grossMargin: grossMargin,
        grossMarginPct: grossMarginPct
    };
}

function calculateAvailabilityMargin(band, faderValue) {
    if (!band || !band.id) return 0;

    const cleanFader = Math.max(0, Math.min(10, Number(faderValue || 0)));
    const range = Number(band.maxMargin || 0) - Number(band.minMargin || 0);

    return Math.round((Number(band.minMargin || 0) + ((range * cleanFader) / 10)) * 100) / 100;
}

function calculateSellPriceFromMargin(costBase, marginPct) {
    const cost = Number(costBase || 0);
    const margin = Number(marginPct || 0);

    if (cost <= 0 || margin <= 0 || margin >= 95) {
        return 0;
    }

    return Math.round((cost / (1 - (margin / 100))) * 100) / 100;
}

function getAvailabilityDateUsedForSequence(sequenceId) {
    if (!currentJob || !Array.isArray(currentJob.sequences)) return "";

    const seq = currentJob.sequences.find(function(s) {
        return String(s.id) === String(sequenceId);
    });

    if (!seq || !seq.schedule || !Array.isArray(seq.schedule.manualDays)) {
        return "";
    }

    const rows = seq.schedule.manualDays.filter(function(day) {
        return day && String(day.date || "").trim();
    });

    if (!rows.length) {
        return "";
    }

    const completionRow = rows.find(function(day) {
        return String(day.completionWindow || "") === "Completion Day";
    });

    if (completionRow && completionRow.date) {
        return String(completionRow.date || "").trim();
    }

    return String(rows[0].date || "").trim();
}
function getOperatingBranchForSequence(sequenceId) {
    if (!currentJob || !Array.isArray(currentJob.sequences)) return "";

    const seq = currentJob.sequences.find(function(s) {
        return String(s.id) === String(sequenceId);
    });

    if (!seq || !seq.schedule || !Array.isArray(seq.schedule.manualDays)) {
        return "";
    }

    const rows = seq.schedule.manualDays.filter(function(day) {
        return day;
    });

    if (!rows.length) {
        return "";
    }

    /*
        Use the same row priority as the availability date:
        1. Completion Day row if present
        2. First schedule row
    */
    const completionRow = rows.find(function(day) {
        return String(day.completionWindow || "") === "Completion Day";
    });

    const sourceRow = completionRow || rows[0];

    return String(sourceRow.operatingBranch || "").trim();
}

function getTestAvailabilityForBranchDate(branchValue, dateValue) {
    const cleanBranch = String(branchValue || "").trim();
    const cleanDate = String(dateValue || "").trim();

    if (!cleanBranch || !cleanDate) {
        return null;
    }

    const lookupKey = cleanBranch + "|" + cleanDate;
    const result = TEST_AVAILABILITY_MARGIN_BY_BRANCH_DATE[lookupKey];

    if (!result || typeof result.marginPct !== "number") {
        return null;
    }

    return {
        branch: cleanBranch,
        date: cleanDate,
        marginPct: Number(result.marginPct || 0),
        label: result.label || "Availability Rate",
        cssClass: result.band || "green"
    };
}

function updateAvailabilityManualBand(sequenceId, bandId) {
    const pricing = getAvailabilityPricingState(sequenceId);
    if (!pricing) return;

    pricing.manualBand = String(bandId || "green");
    pricing.band = pricing.manualBand;

    quotePricingSaved = false;
    saveToDevice();

    renderQuoteAvailabilityPricingPanel(sequenceId);
    updateQuoteCommercialDisplays(sequenceId);
}

function updateAvailabilityFader(sequenceId, value) {
    const pricing = getAvailabilityPricingState(sequenceId);
    if (!pricing) return;

    const cleanValue = Number(value || 0);
    pricing.faderValue = Math.max(0, Math.min(10, cleanValue));

    /*
        Keep older availability shape in sync too,
        in case any previous function still reads uplift.
    */
    pricing.uplift = pricing.faderValue;

    quotePricingSaved = false;
    saveToDevice();

    renderQuoteAvailabilityPricingPanel(sequenceId);
    updateQuoteCommercialDisplays(sequenceId);
}


// -----------------------------------------------------------------------------
// Costing and quote tab
// -----------------------------------------------------------------------------
function renderQuoteAvailabilityPricingPanel(sequenceId) {
    const target = document.getElementById("quote-availabilityPricingCard");
    if (!target) return;

    const pricing = getAvailabilityPricingState(sequenceId);
    const totals = getQuoteCommercialTotals(sequenceId);

    if (!pricing) {
        target.innerHTML = `
            <div class="quote-date-confirm-line warn">
                No availability pricing state found
            </div>
        `;
        return;
    }

    const dateUsed = getAvailabilityDateUsedForSequence(sequenceId);
    const dateLabel = dateUsed
        ? new Date(dateUsed + "T00:00:00").toLocaleDateString("en-GB")
        : "";

    const branchUsed = getOperatingBranchForSequence(sequenceId);
    const dateAvailability = getTestAvailabilityForBranchDate(branchUsed, dateUsed);

    /*
        Manual band remains as fallback only.
        If the schedule date has a test availability rate,
        the app uses that instead of the dropdown.
    */
    if (!pricing.manualBand) {
        pricing.manualBand = pricing.band || "green";
    }

    const manualBandId = String(pricing.manualBand || "green");

    const manualBand = QUOTE_AVAILABILITY_BANDS.find(function(item) {
        return item.id === manualBandId;
    }) || QUOTE_AVAILABILITY_BANDS.find(function(item) {
        return item.id === "green";
    });

    const uplift = Math.max(0, Math.min(10, Number(pricing.faderValue || 0)));

    const baseMarginPct = dateAvailability
        ? Number(dateAvailability.marginPct || 0)
        : calculateAvailabilityMargin(manualBand, 0);

    const marginPct = baseMarginPct + uplift;

    const suggestedSellPrice = calculateSellPriceFromMargin(
        totals.totalCostBase,
        marginPct
    );

    const displayLabel = dateAvailability
        ? dateAvailability.label
        : manualBand && manualBand.label
            ? manualBand.label + " Manual Fallback"
            : "Manual Fallback";

    const displayClass = dateAvailability
        ? dateAvailability.cssClass
        : manualBand && manualBand.id
            ? manualBand.id
            : "";

    target.innerHTML = `
        <div class="availability-pricing-card">
            <div class="availability-refresh-row">
                <div class="availability-refresh-topline">
                    <div class="availability-refresh-title">
                        Availability Source
                    </div>

                    <button
                        type="button"
                        class="availability-refresh-btn"
                        onclick="refreshAvailabilityCacheSample()"
                    >
                        Refresh Availability
                    </button>
                </div>

                <div
                    id="quote-availabilityRefreshStatus"
                    class="availability-refresh-status"
                >
                    ${escapeHtml(getAvailabilityRefreshText())}
                </div>
            </div>

            ${
                dateUsed
                    ? `
                        <div class="quote-date-confirm-line">
                            Using schedule date: ${dateLabel}
                        </div>
                    `
                    : `
                        <div class="quote-date-confirm-line warn">
                            No schedule date entered yet
                        </div>
                    `
            }

            ${
                branchUsed
                    ? `
                        <div class="quote-date-confirm-line">
                            Using operating branch: ${escapeHtml(branchUsed)}
                        </div>
                    `
                    : `
                        <div class="quote-date-confirm-line warn">
                            No operating branch selected yet
                        </div>
                    `
            }

            ${
                dateAvailability
                    ? `
                        <div>
                            <label class="mini-label">Availability Rate</label>
                            <div class="availability-band-pill ${displayClass}">
                                ${escapeHtml(displayLabel)} · ${quoteMoney(baseMarginPct)}%
                            </div>
                            <div class="listed-stat-sub" style="margin-top:6px;">
                                Matched from branch/date test table
                            </div>
                        </div>
                    `
                    : `
                        <div>
                            <label class="mini-label">Availability Band</label>
                            <select
                                class="field"
                                onchange="updateAvailabilityManualBand('${sequenceId}', this.value)"
                            >
                                ${QUOTE_AVAILABILITY_BANDS
                                    .filter(function(band) {
                                        return band.id;
                                    })
                                    .map(function(band) {
                                        return `
                                            <option value="${band.id}" ${band.id === manualBandId ? "selected" : ""}>
                                                ${band.label} · ${band.minMargin}% to ${band.maxMargin}%
                                            </option>
                                        `;
                                    }).join("")}
                            </select>

                            <div style="height:6px"></div>

                            <div class="availability-band-pill ${displayClass}">
                                ${escapeHtml(displayLabel)}
                            </div>

                            <div class="listed-stat-sub" style="margin-top:6px;">
                                No date rate found yet, using manual fallback
                            </div>
                        </div>
                    `
            }

            <div class="availability-slider-row">
                <label class="mini-label">Margin Uplift</label>
                <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value="${uplift}"
                    class="availability-slider"
                    oninput="updateAvailabilityFader('${sequenceId}', this.value)"
                >
                <div class="text-[10px] font-bold text-slate-500 uppercase">
                    Base margin: ${quoteMoney(baseMarginPct)}% · Suggested margin: ${quoteMoney(marginPct)}%
                </div>
            </div>

            <div class="availability-suggested-price">
                <div class="listed-stat-label">Suggested Price</div>
                <div class="listed-stat-value">${quoteMoney(suggestedSellPrice)}</div>
                <div class="listed-stat-sub">
                    Based on current cost base and availability margin
                </div>
            </div>

            <button
                type="button"
                class="availability-apply-btn quote-action-pulse-btn"
                onclick="applyAvailabilitySuggestedPrice('${sequenceId}', ${Number(suggestedSellPrice || 0)}, this)"
            >
                Apply Suggested Price
            </button>
        </div>
    `;
}

function buildQuoteScopeSnapshot(sequenceId) {
    const seq = currentJob && currentJob.sequences
        ? currentJob.sequences.find(function(s) { return String(s.id) === String(sequenceId); })
        : null;

    if (!seq) {
        return {
            moveType: "Not set",
            packingType: "Not set",
            includedVolume: 0,
            cartonsTotal: 0,
            exportWrapQty: 0,
            specialCount: 0,
            excludedCount: 0
        };
    }

    const feed = getQuoteSequenceFeed(sequenceId);
    const rawItems = getRawInventoryItemsForSequence(sequenceId);

    let excludedCount = 0;
    let specialCount = 0;

    rawItems.forEach(function(item) {
        if (item.excluded) excludedCount += Number(item.qty || 0);

        if (
            item.dismantle ||
            item.expWrap ||
            item.disconnect ||
            item.handyman ||
            item.crated ||
            item.damage ||
            item.note
        ) {
            specialCount += Number(item.qty || 0);
        }
    });

    const cartonsTotal = feed
        ? Number(feed.qty.ap || 0) + Number(feed.qty.cg || 0) + Number(feed.qty.books || 0) + Number(feed.qty.linen || 0) + Number(feed.qty.wr || 0)
        : 0;

    return {
        moveType: seq.moveType || "Not set",
        packingType: seq.packOption || "Not set",
        includedVolume: Number(feed ? feed.furnitureVol || 0 : 0),
        cartonsTotal: cartonsTotal,
        exportWrapQty: Number(seq.schedule ? seq.schedule.exportWrapVol || 0 : 0),
        specialCount: specialCount,
        excludedCount: excludedCount
    };
}

function renderQuoteSequenceSelect() {
    const select = document.getElementById("quote-sequenceSelect");
    if (!select || !currentJob || !Array.isArray(currentJob.sequences)) return;

    const selectedId = getQuoteSelectedSequenceId();

    select.innerHTML = currentJob.sequences.map(function(seq, idx) {
        const moveLabel = seq.moveType || "New Sequence";
        const packLabel = seq.packOption || "No Packing Set";
        const label = "Seq #" + (idx + 1) + ": " + moveLabel + " / " + packLabel;
        const selected = String(seq.id) === String(selectedId) ? "selected" : "";
        return '<option value="' + seq.id + '" ' + selected + '>' + label + '</option>';
    }).join("");
}

function renderQuotePricingContext(sequenceId) {
    const target = document.getElementById("quote-pricingContextCard");
    if (!target) return;

    const snap = buildQuoteScopeSnapshot(sequenceId);

    target.innerHTML = `
        <div class="grid grid-cols-2 gap-3">
            <div class="listed-stat-card">
                <div class="listed-stat-label">Move Type</div>
                <div class="listed-stat-value" style="font-size:14px;">${escapeHtml(snap.moveType)}</div>
            </div>

            <div class="listed-stat-card">
                <div class="listed-stat-label">Packing Type</div>
                <div class="listed-stat-value" style="font-size:14px;">${escapeHtml(snap.packingType)}</div>
            </div>

            <div class="listed-stat-card">
                <div class="listed-stat-label">Included Volume</div>
                <div class="listed-stat-value">${snap.includedVolume}</div>
                <div class="listed-stat-sub">Furniture cuft</div>
            </div>

            <div class="listed-stat-card">
                <div class="listed-stat-label">Cartons Total</div>
                <div class="listed-stat-value">${snap.cartonsTotal}</div>
                <div class="listed-stat-sub">All carton types</div>
            </div>

            <div class="listed-stat-card col-span-2">
                <div class="listed-stat-label">Export Wrap</div>
                <div class="listed-stat-value">${snap.exportWrapQty}</div>
                <div class="listed-stat-sub">Current schedule value</div>
            </div>
        </div>
    `;
}





function updateQuoteCommercialDisplays(sequenceId) {
    const totals = getQuoteCommercialTotals(sequenceId);

    const totalCostsEl = document.getElementById("quote-totalCosts");
    const additionalEl = document.getElementById("quote-additionalCostsTotalDisplay");
    const customerEl = document.getElementById("quote-customerPriceDisplay");
    const marginEl = document.getElementById("quote-grossMarginDisplay");
    const marginSubEl = document.getElementById("quote-grossMarginSub");

    if (totalCostsEl) totalCostsEl.textContent = quoteMoney(totals.totalCostBase);
    if (additionalEl) additionalEl.textContent = quoteMoney(totals.additionalCosts);
    if (customerEl) customerEl.textContent = quoteMoney(totals.customerPrice);
    if (marginEl) marginEl.textContent = quoteMoney(totals.grossMargin);

    if (marginSubEl) {
        marginSubEl.textContent = totals.customerPrice > 0
            ? `${quoteMoney(totals.grossMarginPct)}% margin on sell price${quotePricingSaved ? " · saved" : " · unsaved changes"}`
            : `Customer price minus total costs${quotePricingSaved ? " · saved" : " · unsaved changes"}`;
    }

    renderQuoteCommercialSummary(sequenceId);
    renderQuoteCompetitionCard(sequenceId);
    renderQuoteAdditionalBreakdown(sequenceId);
    renderQuoteAvailabilityPricingPanel(sequenceId);
}

function renderQuoteTabShellOnly() {
    const seq = getQuoteSelectedSequence();
    if (!seq) return;

    const sequenceId = String(seq.id);
    const state = ensureQuoteSequenceState(sequenceId);

    renderQuoteSequenceSelect();

    const customerInput = document.getElementById("quote-customerPriceInput");
    const notesInput = document.getElementById("quote-quoteNotesInput");
    const availabilityStatus = document.getElementById("quote-availabilityRefreshStatus");

    if (customerInput) customerInput.value = Number(state.customerPrice || 0);
    if (notesInput) notesInput.value = state.quoteNotes || "";

    if (availabilityStatus) {
        availabilityStatus.innerText = getAvailabilityRefreshText();
    }

    updateQuoteCommercialDisplays(sequenceId);
}

function handleQuoteSequenceChange(value) {
    if (!value) return;
    setQuoteSelectedSequenceId(value);
    renderQuoteTab();
}

function handleQuoteAvailabilityUpliftChange(sequenceId, value) {
    const state = ensureQuoteSequenceState(sequenceId);
    if (!state) return;

    if (!state.availabilityPricing || typeof state.availabilityPricing !== "object") {
        state.availabilityPricing = {
            moveDate: "",
            band: "",
            uplift: 0,
            appliedSuggestedPrice: 0
        };
    }

    state.availabilityPricing.uplift = Number(value || 0);

    quotePricingSaved = false;
    saveToDevice();

    renderQuoteAvailabilityPricingPanel(sequenceId);
}
function handleQuoteCustomerPriceChange(value) {
    const seq = getQuoteSelectedSequence();
    if (!seq) return;

    const state = ensureQuoteSequenceState(seq.id);
    state.customerPrice = Number(value || 0);
    quotePricingSaved = false;
    saveToDevice();
    updateQuoteCommercialDisplays(String(seq.id));
}

function handleQuoteNotesChange(value) {
    const seq = getQuoteSelectedSequence();
    if (!seq) return;

    const state = ensureQuoteSequenceState(seq.id);
    state.quoteNotes = String(value || "");
    quotePricingSaved = false;
    saveToDevice();
}

async function handleQuoteCreateQuote() {
    const seq = getQuoteSelectedSequence();
    if (!seq) return;

    const sequenceId = String(seq.id);
    const state = ensureQuoteSequenceState(sequenceId);
    const totals = getQuoteCommercialTotals(sequenceId);
    const scope = buildQuoteScopeSnapshot(sequenceId);
    
    const coreLines = getQuotePricingLines(sequenceId)
        .map(function(line) {
            const label = getQuoteLineLabel(line) || line.label || "Line";
            return label + ": £" + quoteMoney(calcQuoteLineTotal(line));
        })
        .join("\n");

    const additionalLines = getQuoteAdditionalCostLines(sequenceId)
        .filter(function(line) { return !!line.label; })
        .map(function(line) {
            const label = getQuoteLineLabel(line) || line.label || "Line";
            return label + ": £" + quoteMoney(calcQuoteLineTotal(line));
        })
        .join("\n");

    const quoteText =
`QUOTE SUMMARY

Sequence:
${getSequenceLabelById(sequenceId)}

Move Type:
${scope.moveType}

Packing Type:
${scope.packingType}

Included Volume:
${scope.includedVolume} cuft

Cartons:
${scope.cartonsTotal}

CORE COSTS
${coreLines || "None"}

OPTIONAL ADDITIONAL SERVICES
${additionalLines || "None"}

TOTAL COST BASE
£${quoteMoney(totals.totalCostBase)}

CUSTOMER PRICE
£${quoteMoney(totals.customerPrice)}

GROSS MARGIN
£${quoteMoney(totals.grossMargin)} (${quoteMoney(totals.grossMarginPct)}%)

QUOTE NOTES
${state.quoteNotes || "None"}
`;

    await appAlert(quoteText, "Quote Summary");
}
function pulseQuoteActionButton(buttonEl) {
    if (!buttonEl) return;

    buttonEl.classList.remove("quote-action-pulse-hit");

    void buttonEl.offsetWidth;

    buttonEl.classList.add("quote-action-pulse-hit");

    if (navigator.vibrate) {
        navigator.vibrate(20);
    }

    setTimeout(function() {
        buttonEl.classList.remove("quote-action-pulse-hit");
    }, 450);
}
async function applyAvailabilitySuggestedPrice(sequenceId, suggestedPrice, buttonEl) {
    const state = ensureQuoteSequenceState(sequenceId);
    const availability = getAvailabilityPricingState(sequenceId);

    if (!state || !availability) return;

    const cleanPrice = Number(suggestedPrice || 0);

    if (!cleanPrice || cleanPrice <= 0) {
    await appAlert(
        "No suggested price available yet. Check the cost base and availability margin.",
        "Suggested Price Unavailable"
    );
        return;
    }

    pulseQuoteActionButton(buttonEl);

    state.customerPrice = cleanPrice;
    availability.appliedSuggestedPrice = cleanPrice;
    availability.lastAppliedAt = new Date().toISOString();

    quotePricingSaved = false;
    saveToDevice();

    const input = document.getElementById("quote-customerPriceInput");
    if (input) {
        input.value = cleanPrice;
    }

    const display = document.getElementById("quote-customerPriceDisplay");
    if (display) {
        display.textContent = quoteMoney(cleanPrice);
    }

    updateQuoteCommercialDisplays(sequenceId);
    renderQuoteAvailabilityPricingPanel(sequenceId);
}

async function handleQuoteSavePricing() {
    const seq = getQuoteSelectedSequence();
    if (!seq) return;

    const sequenceId = String(seq.id);
    ensureQuoteSequenceState(sequenceId);

    quotePricingSaved = true;
    saveToDevice();
    updateQuoteCommercialDisplays(sequenceId);

    await appAlert("Pricing saved.", "Pricing Saved");
}

function bindQuoteShellEvents() {
    const sequenceSelect = document.getElementById("quote-sequenceSelect");
    const customerInput = document.getElementById("quote-customerPriceInput");
    const notesInput = document.getElementById("quote-quoteNotesInput");
    const saveBtn = document.getElementById("quote-savePricingBtn");

    if (sequenceSelect) {
        sequenceSelect.onchange = function() {
            handleQuoteSequenceChange(this.value);
        };
    }

    if (customerInput) {
        customerInput.oninput = function() {
            handleQuoteCustomerPriceChange(this.value);
        };
    }

    if (notesInput) {
        notesInput.oninput = function() {
            handleQuoteNotesChange(this.value);
        };
    }

    if (saveBtn) {
    saveBtn.onclick = function() {
        pulseQuoteActionButton(this);
        handleQuoteSavePricing();
    };
}
}
function renderQuoteCommercialSummary(sequenceId) {
    const target = document.getElementById("quote-commercialSummaryCard");
    if (!target) return;

    const totals = getQuoteCommercialTotals(sequenceId);

    target.innerHTML = `
        <div class="grid grid-cols-2 gap-3">
            <div class="listed-stat-card">
                <div class="listed-stat-label">Total Cost Base</div>
                <div class="listed-stat-value">${quoteMoney(totals.totalCostBase)}</div>
            </div>
            <div class="listed-stat-card">
                <div class="listed-stat-label">Sell Price</div>
                <div class="listed-stat-value">${quoteMoney(totals.customerPrice)}</div>
            </div>
            <div class="listed-stat-card">
                <div class="listed-stat-label">Gross Margin £</div>
                <div class="listed-stat-value">${quoteMoney(totals.grossMargin)}</div>
            </div>
            <div class="listed-stat-card">
                <div class="listed-stat-label">Gross Margin %</div>
                <div class="listed-stat-value">${quoteMoney(totals.grossMarginPct)}%</div>
            </div>
        </div>
    `;
}
function renderQuoteCompetitionCard(sequenceId) {
    const target = document.getElementById("quote-competitionCard");
    if (!target) return;

    const state = ensureQuoteSequenceState(sequenceId);
    if (!state) return;

    const competition = state.competition || {
        competitorName: "",
        competitorPrice: 0,
        partnerCrewUnsuitable: false,
        notes: ""
    };

    target.innerHTML = `
    <div class="space-y-3">
        <label class="quote-competition-check">
            <input
                type="checkbox"
                ${competition.partnerCrewUnsuitable ? "checked" : ""}
                onchange="updateQuoteCompetitionField('${sequenceId}', 'partnerCrewUnsuitable', this.checked)"
            >
            <span>Partner Crew unsuitable for this client / job</span>
        </label>

        <div>
            <label class="mini-label">Competitor Name</label>
            <input
                type="text"
                class="field quote-cost-editable-field"
                value="${escapeHtml(competition.competitorName || "")}"
                oninput="updateQuoteCompetitionField('${sequenceId}', 'competitorName', this.value)"
                placeholder="e.g. Local mover"
            >
        </div>

        <div>
            <label class="mini-label">Competitor Price (£)</label>
            <input
                type="number"
                min="0"
                step="1"
                class="field quote-cost-editable-field"
                value="${Number(competition.competitorPrice || 0)}"
                oninput="updateQuoteCompetitionField('${sequenceId}', 'competitorPrice', this.value)"
            >
        </div>

        <div>
            <label class="mini-label">Competition Notes</label>
            <textarea
                class="field quote-competition-notes"
                oninput="updateQuoteCompetitionField('${sequenceId}', 'notes', this.value)"
                placeholder="What are they offering? Any inclusions/exclusions?"
            >${escapeHtml(competition.notes || "")}</textarea>
        </div>
    </div>
`;
}

function updateQuoteCompetitionField(sequenceId, fieldName, value) {
    const state = ensureQuoteSequenceState(sequenceId);
    if (!state) return;

    if (!state.competition || typeof state.competition !== "object") {
        state.competition = {
            competitorName: "",
            competitorPrice: 0,
            partnerCrewUnsuitable: false,
            notes: ""
        };
    }

    if (fieldName === "competitorName") {
        state.competition.competitorName = String(value || "");
    }

    if (fieldName === "competitorPrice") {
        state.competition.competitorPrice = Number(value || 0);
    }

    if (fieldName === "partnerCrewUnsuitable") {
    state.competition.partnerCrewUnsuitable = !!value;
}

    if (fieldName === "notes") {
        state.competition.notes = String(value || "");
    }

    quotePricingSaved = false;
    saveToDevice();
}

function getAvailabilityPricingState(sequenceId) {
    const state = ensureQuoteSequenceState(sequenceId);
    if (!state) return null;

    if (!state.availabilityPricing) {
        state.availabilityPricing = {
            moveDate: "",
            band: "green",
            uplift: 0,
            appliedSuggestedPrice: 0
        };
    }

    return state.availabilityPricing;
}

function renderQuoteAdditionalBreakdown(sequenceId) {
    const target = document.getElementById("quote-additionalCostsBreakdownCard");
    if (!target) return;

    const lines = getQuoteAdditionalCostLines(sequenceId).filter(function(line) {
        return !!line.label;
    });

    if (!lines.length) {
        target.innerHTML = `
            <div class="document-block">
                <div class="document-heading">Optional Additional Cost Services</div>
                <div class="document-empty">No optional services added</div>
            </div>
        `;
        return;
    }

    target.innerHTML = `
        <div class="document-block">
            <div class="document-heading">Optional Additional Cost Services</div>
            <div class="document-lines">
                ${lines.map(function(line) {
                    const label = line.customLabel || (line.label === "Custom" ? "Custom" : line.label);
                    return `<div class="document-line">• ${escapeHtml(label)} — ${quoteMoney(calcQuoteLineTotal(line))}</div>`;
                }).join("")}
            </div>
        </div>
    `;
}

function getScheduleRowDateValue(row) {
    if (!row) return "";

    return String(
        row.date ||
        row.scheduleDate ||
        row.moveDate ||
        row.rowDate ||
        ""
    ).trim();
}

// Inert legacy renderer retained until its encoded template can be removed safely.
function supersededRenderQuoteAvailabilityPanel(sequenceId) {
    const target = document.getElementById("quote-availabilityCard");
    if (!target) return;

    const state = ensureQuoteSequenceState(sequenceId);
    if (!state) return;

    if (!state.availabilityByDate || typeof state.availabilityByDate !== "object") {
        state.availabilityByDate = {};
    }

    const scheduleDates = supersededGetQuoteScheduleDates(sequenceId);

    if (!scheduleDates.length) {
        target.innerHTML = `
            <div class="document-block">
                <div class="document-heading">Schedule Dates</div>
                <div class="document-empty">No dated schedule rows found yet</div>
                <div class="footer-note">
                    Add dates on the Schedule tab first. Those dates will appear here for availability banding.
                </div>
            </div>
        `;
        return;
    }

    const activeDateBands = {};

    scheduleDates.forEach(function(dateValue) {
        activeDateBands[dateValue] = state.availabilityByDate[dateValue] || "none";
    });

    const highestBand = supersededGetHighestAvailabilityBand(activeDateBands);

    target.innerHTML = `
        <div class="quote-availability-list">
            ${
                scheduleDates.map(function(dateValue) {
                    const selectedBandId = state.availabilityByDate[dateValue] || "none";

                    return `
                        <div class="quote-availability-row">
                            <div class="quote-availability-date">
                                ${escapeHtml(supersededFormatQuoteAvailabilityDate(dateValue))}
                            </div>

                            <select
                                class="quote-availability-select"
                                onchange="supersededUpdateQuoteAvailabilityBand('${sequenceId}', '${escapeHtml(dateValue)}', this.value)"
                            >
                                ${
                                    QUOTE_AVAILABILITY_BANDS.map(function(band) {
                                        const selected = band.id === selectedBandId ? "selected" : "";
                                        const label = band.id === "none"
                                            ? band.label
                                            : band.label + " — " + band.marginPct + "%";

                                        return `<option value="${band.id}" ${selected}>${label}</option>`;
                                    }).join("")
                                }
                            </select>
                        </div>
                    `;
                }).join("")
            }
        </div>

        <div class="quote-availability-summary ${highestBand.id}">
            Availability pricing basis:
            ${
                highestBand.id === "none"
                    ? "Not set yet"
                    : highestBand.label + " / " + highestBand.marginPct + "% margin"
            }
            <br>
            ${escapeHtml(highestBand.note)}
        </div>

        <div class="footer-note">
            Phase 4A only stores the availability bands. It does not change the quote price yet.
        </div>
    `;
}
function renderQuoteTab() {
renderQuoteFringeWarning();
    renderQuoteTabShellOnly();
    bindQuoteShellEvents();

    const seq = getQuoteSelectedSequence();
    if (!seq) return;

    const sequenceId = String(seq.id);

syncQuotePricingFromSchedule(sequenceId);
syncQuoteAvailabilityDateFromSchedule(sequenceId);
syncQuotePianoSpecialistAdditionalCost(sequenceId);

renderQuotePricingGrid(sequenceId);
renderQuoteAdditionalCostsGrid(sequenceId);
renderQuoteAvailabilityPricingPanel(sequenceId);

    const addPricingBtn = document.getElementById("quote-addPricingLineBtn");
    const addAdditionalBtn = document.getElementById("quote-addAdditionalCostLineBtn");

    if (addPricingBtn) {
        addPricingBtn.onclick = addQuotePricingLine;
    }

    if (addAdditionalBtn) {
        addAdditionalBtn.onclick = addQuoteAdditionalCostLine;
    }

    updateQuoteCommercialDisplays(sequenceId);
}
const BOX_RATES = {
    ap: 10,
    cg: 4,
    books: 15,
    linen: 10,
    wr: 8
};

const SPECIAL_MINUTES = {
    frame: 30,
    bunk: 60,
    upright: 50,
    grand: 120,
    clock: 60,
    appliance: 60,
    crate: 30
};


const DAY_PARTS = ["Full Day", "AM", "PM"];

const TASK_OPTIONS = [
    "Pack",
    "Load",
    "Travel",
    "Deliver",
    "Pack + Load"
];

const TRAVEL_PATTERN_OPTIONS = [
    "None",
    "A-B",
    "B-C",
    "C-A",
    "A-B-A",
    "A-B-C",
    "B-C-A",
    "A-B-C-A"
];

const TRAVEL_SPEED_OPTIONS = [
    { value: "London", label: "London 16mph", mph: 16 },
    { value: "Road", label: "Road 30mph", mph: 30 },
    { value: "Motorway", label: "Motorway 42mph", mph: 42 },
    { value: "Manual", label: "Manual", mph: 0 }
];

const COMPLETION_WINDOWS = [
    "None",
    "Completion Day"
];

function getQuoteLineLabel(line) {
    if (!line) return "";
    if (line.label === "Custom") {
        return line.customLabel || "";
    }
    return line.label || "";
}
function getQuoteLineById(sequenceId, lineId, lineType) {
    const state = ensureQuoteSequenceState(sequenceId);
    if (!state) return null;

    const targetLines = lineType === "additional"
        ? state.additionalCostLines
        : state.pricingLines;

    return targetLines.find(function(item) {
        return item.id === lineId;
    }) || null;
}

function refreshQuoteLineTotal(sequenceId, lineId, lineType) {
    const line = getQuoteLineById(sequenceId, lineId, lineType);
    const totalEl = document.getElementById(`quote-line-total-${lineType}-${lineId}`);
    if (!line || !totalEl) return;

    totalEl.textContent = quoteMoney(calcQuoteLineTotal(line));
}

function updateQuoteLine(sequenceId, lineId, field, value, lineType, shouldRerender = false) {
    const state = ensureQuoteSequenceState(sequenceId);
    if (!state) return;

    const targetLines = lineType === "additional"
        ? state.additionalCostLines
        : state.pricingLines;

    const line = targetLines.find(function(item) {
        return item.id === lineId;
    });

    if (!line) return;

    if (field === "label") {
        line.label = value;
        if (value !== "Custom") {
            line.customLabel = "";
        }
    } else if (field === "customLabel") {
        line.customLabel = value;
    } else if (field === "qty") {
        line.qty = Number(value || 0);
    } else if (field === "unitCost") {
    line.unitCost = Number(value || 0);

    if (line.unitCost > 0) {
        line.needsCostEntry = false;
    } else if (line.autoFromInventory) {
        line.needsCostEntry = true;
    }
}

    quotePricingSaved = false;
    saveToDevice();

    if (shouldRerender) {
        renderQuoteTab();
        return;
    }

    refreshQuoteLineTotal(sequenceId, lineId, lineType);
    updateQuoteCommercialDisplays(String(sequenceId));
}

function addQuotePricingLine() {
    const seq = getQuoteSelectedSequence();
    if (!seq) return;

    const state = ensureQuoteSequenceState(seq.id);
    state.pricingLines.push({
        id: createQuoteLineId(),
        label: "Custom",
        customLabel: "",
        qty: 0,
        unitCost: 0
    });

    quotePricingSaved = false;
    saveToDevice();
    renderQuoteTab();
}

function sequenceNeedsPianoSpecialistCost(sequenceId) {
    const items = getRawInventoryItemsForSequence(sequenceId);

    return items.some(function(entry) {
        if (!isPianoRawEntry(entry)) return false;

        const details = entry.pianoDetails || {};

        return !!(
            (details.collection && details.collection.specialistRequired) ||
            (details.delivery && details.delivery.specialistRequired)
        );
    });
}

function syncQuotePianoSpecialistAdditionalCost(sequenceId) {
    const state = ensureQuoteSequenceState(sequenceId);
    if (!state) return;

    if (!Array.isArray(state.additionalCostLines)) {
        state.additionalCostLines = [];
    }

    const needsPianoSpecialist = sequenceNeedsPianoSpecialistCost(sequenceId);

    const existingLine = state.additionalCostLines.find(function(line) {
        return line.autoFromInventory === "pianoSpecialist";
    });

    if (!needsPianoSpecialist) {
        return;
    }

    if (existingLine) {
        existingLine.label = "Piano Specialist";
        existingLine.customLabel = "";
        existingLine.qty = Number(existingLine.qty || 0) > 0 ? Number(existingLine.qty || 0) : 1;
        existingLine.needsCostEntry = Number(existingLine.unitCost || 0) <= 0;
        return;
    }

    state.additionalCostLines.push({
        id: createQuoteLineId(),
        label: "Piano Specialist",
        customLabel: "",
        qty: 1,
        unitCost: 0,
        autoFromInventory: "pianoSpecialist",
        needsCostEntry: true
    });
}
function addQuoteAdditionalCostLine() {
    const seq = getQuoteSelectedSequence();
    if (!seq) return;

    const state = ensureQuoteSequenceState(seq.id);
    state.additionalCostLines.push({
        id: createQuoteLineId(),
        label: "Custom",
        customLabel: "",
        qty: 0,
        unitCost: 0
    });

    quotePricingSaved = false;
    saveToDevice();
    renderQuoteTab();
}

function deleteQuoteLine(sequenceId, lineId, lineType) {
    const state = ensureQuoteSequenceState(sequenceId);
    if (!state) return;

   if (lineType === "additional") {
    state.additionalCostLines = state.additionalCostLines.filter(function(line) {
        return line.id !== lineId;
    });
} else {
    const lineToDelete = state.pricingLines.find(function(line) {
        return line.id === lineId;
    });

    if (lineToDelete && lineToDelete.autoCoreCost === "adminFee") {
        return;
    }

    state.pricingLines = state.pricingLines.filter(function(line) {
        return line.id !== lineId;
    });
}

    quotePricingSaved = false;
    saveToDevice();
    renderQuoteTab();
}

function renderQuotePricingGrid(sequenceId) {
    const grid = document.getElementById("quote-pricingGrid");
    if (!grid) return;

    const lines = getQuotePricingLines(sequenceId);

    grid.innerHTML = `
        <div class="space-y-3">
            ${lines.map(function(line) {
                const total = calcQuoteLineTotal(line);
const isCustom = line.label === "Custom";
const isAdminFee = line.autoCoreCost === "adminFee";
const needsCostEntry = !!line.needsCostEntry && Number(line.unitCost || 0) <= 0;

                return `
                    <div class="pricing-row ${isCustom ? "pricing-row-custom" : ""}">
                        <div class="quote-line-grid">
                            <div class="quote-type-wrap">
                                <label class="mini-label">Cost Type</label>
                                <select
    class="field"
    ${isAdminFee ? "disabled" : ""}
    onchange="updateQuoteLine('${sequenceId}','${line.id}','label',this.value,'core',true)"
>
                                    ${QUOTE_CORE_COST_CHOICES.map(function(choice) {
                                        return `<option value="${choice}" ${line.label === choice ? "selected" : ""}>${choice}</option>`;
                                    }).join("")}
                                </select>
                            </div>

                            <div class="quote-custom-label-wrap">
    <label class="mini-label">Custom Label</label>
    <input
        type="text"
        class="field quote-cost-editable-field"
        value="${escapeHtml(line.customLabel || "")}"
        ${isCustom ? "" : "disabled"}
        oninput="updateQuoteLine('${sequenceId}','${line.id}','customLabel',this.value,'core',false)"
        placeholder=""
    >
</div>

                            <div class="quote-qty-wrap">
                                <label class="mini-label">Qty</label>
                                <input
    type="number"
    min="0"
    step="1"
    class="field quote-cost-editable-field"
    value="${Number(line.qty || 0)}"
    ${isAdminFee ? "disabled" : ""}
    oninput="updateQuoteLine('${sequenceId}','${line.id}','qty',this.value,'core',false)"
>
                            
                            </div>

                            <div class="quote-unit-wrap">
    <label class="mini-label">Unit Cost</label>
    <input
    type="number"
    min="0"
    step="1"
    class="field quote-cost-editable-field ${needsCostEntry ? 'quote-cost-needs-entry' : ''}"
    value="${Number(line.unitCost || 0)}"
    ${isAdminFee ? "disabled" : ""}
    oninput="updateQuoteLine('${sequenceId}','${line.id}','unitCost',this.value,'core',false)"
>
    ${
        needsCostEntry
            ? `<div class="quote-cost-required-note">Cost required</div>`
            : ""
    }
</div>

                            <div class="quote-total-wrap">
                                <label class="mini-label">Total</label>
                                <div
                                    id="quote-line-total-core-${line.id}"
                                    class="field quote-line-total"
                                >${quoteMoney(total)}</div>
                            </div>

                            <div class="quote-del-wrap">
    ${
        isAdminFee
            ? ""
            : `<button
                type="button"
                class="quote-delete-x-btn"
                title="Delete this cost row"
                aria-label="Delete this cost row"
                onclick="deleteQuoteLine('${sequenceId}','${line.id}','core')"
            >
                ×
            </button>`
    }
</div>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function renderQuoteAdditionalCostsGrid(sequenceId) {
    const grid = document.getElementById("quote-additionalCostsGrid");
    if (!grid) return;

    const lines = getQuoteAdditionalCostLines(sequenceId);

    if (!lines.length) {
        grid.innerHTML = `
            <div class="border border-slate-200 rounded-xl p-4 text-[10px] font-bold uppercase text-slate-400">
                No optional services added
            </div>
        `;
        return;
    }

    grid.innerHTML = `
        <div class="space-y-3">
            ${lines.map(function(line) {
                const total = calcQuoteLineTotal(line);
                const isCustom = line.label === "Custom";
                const needsCostEntry = !!line.needsCostEntry && Number(line.unitCost || 0) <= 0;

                return `
                    <div class="pricing-row ${isCustom ? "pricing-row-custom" : ""}">
                        <div class="quote-line-grid">
                            <div class="quote-type-wrap">
                                <label class="mini-label">Service Type</label>
                                <select class="field" onchange="updateQuoteLine('${sequenceId}','${line.id}','label',this.value,'additional',true)">
                                    ${QUOTE_ADDITIONAL_SERVICE_CHOICES.map(function(choice) {
                                        return `<option value="${choice}" ${line.label === choice ? "selected" : ""}>${choice}</option>`;
                                    }).join("")}
                                </select>
                            </div>

                            <div class="quote-custom-label-wrap">
                                <label class="mini-label">Custom Label</label>
                                <input
                                        type="text"
    class="field quote-cost-editable-field"
    value="${escapeHtml(line.customLabel || "")}"
                                    ${isCustom ? "" : "disabled"}
                                    oninput="updateQuoteLine('${sequenceId}','${line.id}','customLabel',this.value,'additional',false)"
                                    placeholder=""
                                >
                            </div>

                            <div class="quote-qty-wrap">
                                <label class="mini-label">Qty</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                   class="field quote-cost-editable-field"
value="${Number(line.qty || 0)}"
oninput="updateQuoteLine('${sequenceId}','${line.id}','qty',this.value,'additional',false)"
                                >
                            </div>

                            <div class="quote-unit-wrap">
    <label class="mini-label">Unit Cost</label>
    <input
        type="number"
        min="0"
        step="1"
        class="field quote-cost-editable-field ${needsCostEntry ? 'quote-cost-needs-entry' : ''}"
        value="${Number(line.unitCost || 0)}"
        oninput="updateQuoteLine('${sequenceId}','${line.id}','unitCost',this.value,'additional',false)"
    >
    ${
        needsCostEntry
            ? `<div class="quote-cost-required-note">Cost required</div>`
            : ""
    }
</div>

                            <div class="quote-total-wrap">
                                <label class="mini-label">Total</label>
                                <div
                                    id="quote-line-total-additional-${line.id}"
                                    class="field quote-line-total"
                                >${quoteMoney(total)}</div>
                            </div>

                            <div class="quote-del-wrap">
                               <button
    type="button"
    class="quote-delete-x-btn"
    title="Delete this additional cost row"
    aria-label="Delete this additional cost row"
    onclick="deleteQuoteLine('${sequenceId}','${line.id}','additional')"
>
    ×
</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function createId(){
    return `day_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
}
let manualSchedule = getDefaultManualScheduleRows();
function getActiveSequenceRecord() {
    if (!currentJob || !Array.isArray(currentJob.sequences)) return null;

    return currentJob.sequences.find(function(seq) {
        return String(seq.id) === String(activeSeqId);
    }) || null;
}

function ensureSequenceScheduleShape(seq) {
    if (!seq) return null;

    if (!seq.schedule) {
        seq.schedule = createEmptySequenceSchedule();
    }

    const defaults = createEmptySequenceSchedule();

    delete seq.schedule.depotToCollectionMinutes;
    delete seq.schedule.collectionToDeliveryMinutes;
    delete seq.schedule.deliveryToDepotMinutes;
    delete seq.schedule.depotToCollectionHours;
    delete seq.schedule.collectionToDeliveryHours;
    delete seq.schedule.deliveryToDepotHours;

    if (seq.schedule.loftVol === undefined) seq.schedule.loftVol = defaults.loftVol;
    if (seq.schedule.loadRate === undefined) seq.schedule.loadRate = defaults.loadRate;
    if (seq.schedule.unloadRate === undefined) seq.schedule.unloadRate = defaults.unloadRate;
    if (seq.schedule.loadingVariant === undefined) seq.schedule.loadingVariant = defaults.loadingVariant;
    if (seq.schedule.operatingBranch === undefined) seq.schedule.operatingBranch = defaults.operatingBranch;
    if (seq.schedule.exportWrapVol === undefined) seq.schedule.exportWrapVol = defaults.exportWrapVol;

    if (!Array.isArray(seq.schedule.manualDays)) {
        seq.schedule.manualDays = [];
    }

    if (!seq.schedule.special || typeof seq.schedule.special !== "object") {
        seq.schedule.special = createEmptySequenceSchedule().special;
    }

    if (seq.schedule.special.frameBeds === undefined) seq.schedule.special.frameBeds = defaults.special.frameBeds;
    if (seq.schedule.special.ottomanBeds === undefined) seq.schedule.special.ottomanBeds = defaults.special.ottomanBeds;
    if (seq.schedule.special.divanBeds === undefined) seq.schedule.special.divanBeds = defaults.special.divanBeds;
    if (seq.schedule.special.electricBeds === undefined) seq.schedule.special.electricBeds = defaults.special.electricBeds;
    if (seq.schedule.special.bunkBeds === undefined) seq.schedule.special.bunkBeds = defaults.special.bunkBeds;
    if (seq.schedule.special.cots === undefined) seq.schedule.special.cots = defaults.special.cots;
    if (seq.schedule.special.diningTables === undefined) seq.schedule.special.diningTables = defaults.special.diningTables;
    if (seq.schedule.special.wardrobes === undefined) seq.schedule.special.wardrobes = defaults.special.wardrobes;

    if (!Array.isArray(seq.schedule.special.wardrobeItems)) {
        seq.schedule.special.wardrobeItems = defaults.special.wardrobeItems;
    }

    if (seq.schedule.special.uprightPianos === undefined) seq.schedule.special.uprightPianos = defaults.special.uprightPianos;
    if (seq.schedule.special.grandPianos === undefined) seq.schedule.special.grandPianos = defaults.special.grandPianos;
    if (seq.schedule.special.grandfatherClocks === undefined) seq.schedule.special.grandfatherClocks = defaults.special.grandfatherClocks;
    if (seq.schedule.special.appliances === undefined) seq.schedule.special.appliances = defaults.special.appliances;
    if (seq.schedule.special.cratingItems === undefined) seq.schedule.special.cratingItems = defaults.special.cratingItems;
    if (seq.schedule.special.customItemMinutes === undefined) seq.schedule.special.customItemMinutes = defaults.special.customItemMinutes;
    if (seq.schedule.special.customItemNote === undefined) seq.schedule.special.customItemNote = defaults.special.customItemNote;

    return seq.schedule;
}

function createManualScheduleRow(overrides) {
    const row = {
        id: createId(),
        groupId: createId(),
        dayPart: "Full Day",
        task: "Load and Deliver",
        completionWindow: "None",
        date: "",
        vans: 1,
        men: 2,
        hours: 8,
        nightsOut: false,
        overtimeHours: 0,
        operatingBranch: "",
        legs: []
    };

    return Object.assign(row, overrides || {});
}

function getDefaultManualScheduleRows() {
    return [createManualScheduleRow()];
}

function createEmptyScheduleLeg(from = "Depot", to = "", minutes = 0, miles = 0, roadType = "Road") {
    return {
        id: createId(),
        from: String(from || "Depot"),
        to: String(to || ""),
        miles: Math.max(0, Number(miles) || 0),
        roadType: String(roadType || "Road"),
        minutes: Math.max(0, Number(minutes) || 0)
    };
}
function getTravelSpeedOption(roadType) {
    return TRAVEL_SPEED_OPTIONS.find(function(option) {
        return option.value === roadType;
    }) || TRAVEL_SPEED_OPTIONS[1];
}

function calculateTravelMinutesFromMiles(miles, roadType) {
    const cleanMiles = Math.max(0, Number(miles) || 0);
    const speedOption = getTravelSpeedOption(roadType);

    if (!speedOption || !speedOption.mph) {
        return 0;
    }

    return Math.round((cleanMiles / speedOption.mph) * 60);
}

function renderTravelSpeedOptions(selectedRoadType) {
    return TRAVEL_SPEED_OPTIONS.map(function(option) {
        const selected = String(option.value) === String(selectedRoadType || "Road") ? "selected" : "";
        return `<option value="${escapeHtml(option.value)}" ${selected}>${escapeHtml(option.label)}</option>`;
    }).join("");
}

function getScheduleLegMiles(day) {
    if (!day || !Array.isArray(day.legs)) return 0;

    return day.legs.reduce(function(sum, leg) {
        return sum + Math.max(0, Number(leg.miles || 0));
    }, 0);
}

function getPlannerMileageSummary() {
    const summary = {
        costedMileage: 0,
        rowsWithMileage: 0,
        extraVanRows: 0
    };

    if (!Array.isArray(manualSchedule)) {
        return summary;
    }

    manualSchedule.forEach(function(day) {
        ensureScheduleRowShape(day);

        const routeMiles = getScheduleLegMiles(day);
        const vans = Math.max(1, Number(day.vans || 1));
        const costedMiles = routeMiles * vans;

        if (routeMiles > 0) {
            summary.rowsWithMileage += 1;
        }

        if (vans > 1) {
            summary.extraVanRows += 1;
        }

        summary.costedMileage += costedMiles;
    });

    return summary;
}

function syncPlannerMileageToCosting(sequenceId) {
    if (!currentJob || !sequenceId) return;

    const mileageSummary = getPlannerMileageSummary();

    saveMileageValueToSequenceCosting(
        sequenceId,
        mileageSummary.costedMileage
    );
}

function ensureScheduleRowShape(day) {
    if (!day || typeof day !== "object") return day;

    if (!Array.isArray(day.legs)) {
        day.legs = [];
    }

    const labelToIdMap = {};
    if (currentJob && Array.isArray(currentJob.properties)) {
        currentJob.properties.forEach(function(prop) {
            const label = getPropertyDisplayText(prop.id);
            labelToIdMap[String(label)] = String(prop.id);
        });
    }

    day.legs = day.legs.map(function(leg) {
        let from = String(leg.from || "").trim();
        let to = String(leg.to || "").trim();

        if (from === "Collection") from = "Collection Address";
        if (to === "Collection") to = "Collection Address";
        if (from === "Delivery") from = "Delivery Address";
        if (to === "Delivery") to = "Delivery Address";

        if (from !== "Depot" && labelToIdMap[from]) {
            from = labelToIdMap[from];
        }

        if (to !== "Depot" && labelToIdMap[to]) {
            to = labelToIdMap[to];
        }

        const roadType = leg.roadType || "Road";
        const miles = Math.max(0, Number(leg.miles || 0));

        let minutes = Math.max(0, Number(leg.minutes || 0));

        if (roadType !== "Manual" && miles > 0) {
            minutes = calculateTravelMinutesFromMiles(miles, roadType);
        }

        return {
            id: leg.id || createId(),
            from: from || "Depot",
            to: to || "",
            miles: miles,
            roadType: roadType,
            minutes: minutes
        };
    });

    return day;
}

function convertTravelPatternToLegs(day, schedule) {
    if (Array.isArray(day.legs) && day.legs.length) {
        return day.legs;
    }

    const pattern = String(day.travelPattern || "None");

    const seq = getActiveSequenceRecord();
    const firstCollectionId = seq && Array.isArray(seq.collections) && seq.collections.length
        ? String(seq.collections[0])
        : "";
    const firstDeliveryId = seq && Array.isArray(seq.deliveries) && seq.deliveries.length
        ? String(seq.deliveries[0])
        : "";

    const legs = [];

    if (pattern === "A-B") {
        legs.push(createEmptyScheduleLeg("Depot", firstCollectionId, 0));
    } else if (pattern === "B-C") {
        legs.push(createEmptyScheduleLeg(firstCollectionId, firstDeliveryId, 0));
    } else if (pattern === "C-A") {
        legs.push(createEmptyScheduleLeg(firstDeliveryId, "Depot", 0));
    } else if (pattern === "A-B-A") {
        legs.push(createEmptyScheduleLeg("Depot", firstCollectionId, 0));
        legs.push(createEmptyScheduleLeg(firstCollectionId, "Depot", 0));
    } else if (pattern === "A-B-C") {
        legs.push(createEmptyScheduleLeg("Depot", firstCollectionId, 0));
        legs.push(createEmptyScheduleLeg(firstCollectionId, firstDeliveryId, 0));
    } else if (pattern === "B-C-A") {
        legs.push(createEmptyScheduleLeg(firstCollectionId, firstDeliveryId, 0));
        legs.push(createEmptyScheduleLeg(firstDeliveryId, "Depot", 0));
    } else if (pattern === "A-B-C-A") {
        legs.push(createEmptyScheduleLeg("Depot", firstCollectionId, 0));
        legs.push(createEmptyScheduleLeg(firstCollectionId, firstDeliveryId, 0));
        legs.push(createEmptyScheduleLeg(firstDeliveryId, "Depot", 0));
    }

    return legs;
}

function getRowLegHours(day) {
    if (!day || !Array.isArray(day.legs)) return 0;

    const totalMinutes = day.legs.reduce(function(sum, leg) {
        return sum + Math.max(0, Number(leg.minutes || 0));
    }, 0);

    return round2(totalMinutes / 60);
}
function getFirstRowLegHours(day) {
    if (!day || !Array.isArray(day.legs) || !day.legs.length) return 0;

    const firstLeg = day.legs[0];
    return round2(Math.max(0, Number(firstLeg.minutes || 0)) / 60);
}

function commitManualScheduleEdit() {
    saveManualScheduleToActiveSequence();
    renderScheduleCalculator();
}

function addScheduleLeg(dayId) {
    manualSchedule = manualSchedule.map(function(day) {
        if (day.id !== dayId) return day;

        ensureScheduleRowShape(day);
        day.legs.push(createEmptyScheduleLeg());
        return day;
    });

    commitManualScheduleEdit();
}

function updateScheduleLeg(dayId, legId, field, value) {
    manualSchedule = manualSchedule.map(function(day) {
        if (day.id !== dayId) return day;

        ensureScheduleRowShape(day);

        day.legs = day.legs.map(function(leg) {
            if (leg.id !== legId) return leg;

            const updatedLeg = {
                ...leg
            };

            if (field === "miles") {
                updatedLeg.miles = Math.max(0, Number(value) || 0);

                if (updatedLeg.roadType !== "Manual") {
                    updatedLeg.minutes = calculateTravelMinutesFromMiles(
                        updatedLeg.miles,
                        updatedLeg.roadType
                    );
                }

                return updatedLeg;
            }

            if (field === "roadType") {
                updatedLeg.roadType = String(value || "Road");

                if (updatedLeg.roadType !== "Manual") {
                    updatedLeg.minutes = calculateTravelMinutesFromMiles(
                        updatedLeg.miles,
                        updatedLeg.roadType
                    );
                }

                return updatedLeg;
            }

            if (field === "minutes") {
                updatedLeg.minutes = Math.max(0, Number(value) || 0);
                updatedLeg.roadType = "Manual";
                return updatedLeg;
            }

            updatedLeg[field] = value;
            return updatedLeg;
        });

        return day;
    });

    commitManualScheduleEdit();
}

function removeScheduleLeg(dayId, legId) {
    manualSchedule = manualSchedule.map(function(day) {
        if (day.id !== dayId) return day;

        ensureScheduleRowShape(day);
        day.legs = day.legs.filter(function(leg) {
            return leg.id !== legId;
        });

        return day;
    });

    commitManualScheduleEdit();
}

function renderScheduleLegs(day, state, totals) {
    ensureScheduleRowShape(day);

    const addressOptions = getScheduleLegLocationOptions();

    const getLegLabel = function(value) {
        const match = addressOptions.find(function(option) {
            return String(option.value) === String(value);
        });
        return match ? match.label : value;
    };

        const vans = Math.max(1, Number(day.vans || 1));

    return `
        <div class="schedule-legs-shell">
            <div class="schedule-legs-head">
       <div>
        <div class="mini-label">Travel Legs</div>
    </div>

                <button
                    type="button"
                    class="schedule-btn schedule-add-leg-btn"
                    onclick="addScheduleLeg('${day.id}')"
                >
                    Add Leg
                </button>
            </div>

            ${
                vans > 1
                    ? `
                        <div class="validation-item validation-warn" style="margin-bottom:10px;">
                            Extra van check: this row has ${vans} vans. If Manual Mileage Entry: Remember to allow for additional van mileage.
                        </div>
                    `
                    : ""
            }

                        ${buildScheduleRowCompactTimeSummary(day, state, totals)}

            <div class="schedule-legs-list">
                <div class="text-[10px] font-bold text-slate-400" style="text-transform:none; margin-bottom:4px;">
    Use Get Route to check Google Maps, then enter the mileage for this travel leg.
</div>
                ${
                    day.legs.length
                        ? day.legs.map(function(leg) {
                            return `
                                <div class="schedule-leg-row">
                                    <div>
                                        <label class="mini-label">From</label>
                                        <select
                                            class="field"
                                            onchange="updateScheduleLeg('${day.id}','${leg.id}','from',this.value)"
                                            title="${escapeHtml(getLegLabel(leg.from || ""))}"
                                        >
                                            ${renderScheduleLegLocationOptions(leg.from || "")}
                                        </select>
                                    </div>

                                    <div>
                                        <label class="mini-label">To</label>
                                        <select
                                            class="field"
                                            onchange="updateScheduleLeg('${day.id}','${leg.id}','to',this.value)"
                                            title="${escapeHtml(getLegLabel(leg.to || ""))}"
                                        >
                                            ${renderScheduleLegLocationOptions(leg.to || "")}
                                        </select>
                                    </div>

                                    <div>
                                        <label class="mini-label">Miles</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            class="field"
                                            value="${Number(leg.miles || 0)}"
                                            onchange="updateScheduleLeg('${day.id}','${leg.id}','miles',this.value)"
                                            placeholder="0"
                                        >
                                    </div>

                                    <div>
                                        <label class="mini-label">Road Type</label>
                                        <select
                                            class="field"
                                            onchange="updateScheduleLeg('${day.id}','${leg.id}','roadType',this.value)"
                                        >
                                            ${renderTravelSpeedOptions(leg.roadType || "Road")}
                                        </select>
                                    </div>

                                    <div>
    <label class="mini-label">Minutes</label>
    <input
        type="number"
        min="0"
        class="field"
        value="${Number(leg.minutes || 0)}"
        onchange="updateScheduleLeg('${day.id}','${leg.id}','minutes',this.value)"
        placeholder="0"
    >
</div>

<div>
    <label class="mini-label">Route</label>
    <button
        type="button"
        class="schedule-btn"
        style="width:100%;padding:0 8px;"
        onclick="openScheduleLegInGoogleMaps('${day.id}','${leg.id}')"
    >
        Get
    </button>
</div>

<div>
    <label class="mini-label">Remove</label>
    <button
        type="button"
        class="schedule-leg-delete-btn"
        title="Remove this travel leg"
        aria-label="Remove this travel leg"
        onclick="removeScheduleLeg('${day.id}','${leg.id}')"
    >
        ×
    </button>
</div>
                                </div>
                            `;
                        }).join("")
                        : `
                            <div class="text-[10px] font-bold uppercase text-slate-400">
                                No travel legs added
                            </div>
                        `
                }
            </div>
        </div>
    `;
}

function copyManualScheduleLeg(leg) {
    const roadType = leg.roadType || "Road";
    const miles = Math.max(0, Number(leg.miles || 0));

    let minutes = Math.max(0, Number(leg.minutes || 0));

    if (roadType !== "Manual" && miles > 0) {
        minutes = calculateTravelMinutesFromMiles(miles, roadType);
    }

    return {
        id: leg.id || createId(),
        from: String(leg.from || "").trim(),
        to: String(leg.to || "").trim(),
        miles: miles,
        roadType: roadType,
        minutes: minutes
    };
}

function copyManualScheduleRow(day, legs) {
    const safeDayPart = day.dayPart || "Full Day";
    const safeLegs = Array.isArray(legs) ? legs : [];

    return {
        id: day.id || createId(),
        groupId: day.groupId || createId(),
        dayPart: safeDayPart,
        task: day.task || "Load and Deliver",
        travelPattern: day.travelPattern || "None",
        completionWindow: day.completionWindow || "None",
        date: day.date || "",
        men: Math.max(0, Number(day.men) || 0),
        vans: Math.max(0, Number(day.vans) || 0),
        hours: safeDayPart === "Full Day" ? 8 : 4,
        nightsOut: !!day.nightsOut,
        overtimeHours: Math.max(0, Number(day.overtimeHours || 0)),
        operatingBranch: day.operatingBranch || "",
        legs: safeLegs.map(copyManualScheduleLeg)
    };
}

function loadManualScheduleFromActiveSequence() {
    const seq = getActiveSequenceRecord();
    if (!seq) {
        manualSchedule = getDefaultManualScheduleRows();
        return;
    }

    const schedule = ensureSequenceScheduleShape(seq);

    if (!Array.isArray(schedule.manualDays) || schedule.manualDays.length === 0) {
        schedule.manualDays = getDefaultManualScheduleRows();
    }

    manualSchedule = schedule.manualDays.map(function(day) {
        ensureScheduleRowShape(day);

        let safeLegs = Array.isArray(day.legs) ? day.legs : [];

        if (!safeLegs.length && day.travelPattern) {
            safeLegs = convertTravelPatternToLegs(day, schedule);
        }

        return copyManualScheduleRow(day, safeLegs);
    });
}

function saveManualScheduleToActiveSequence() {
    const seq = getActiveSequenceRecord();
    if (!seq) return;

    const schedule = ensureSequenceScheduleShape(seq);

    schedule.manualDays = manualSchedule.map(function(day) {
        ensureScheduleRowShape(day);
        return copyManualScheduleRow(day, day.legs);
    });

    syncPlannerMileageToCosting(seq.id);

    saveToDevice();
}

function renderScheduleSequenceDropdown() {
    const dropdown = document.getElementById("schedule-seq-select");
    if (!dropdown || !currentJob || !Array.isArray(currentJob.sequences)) return;

    const selectedSeqId = activeSeqId || getDefaultSequenceId();

    dropdown.innerHTML = currentJob.sequences.map(function(seq, idx) {
        const moveLabel = seq.moveType || "New Sequence";
        const packLabel = seq.packOption || "No Packing Set";
        const label = "Seq #" + (idx + 1) + ": " + moveLabel + " / " + packLabel;
        const selected = String(seq.id) === String(selectedSeqId) ? "selected" : "";
        return '<option value="' + seq.id + '" ' + selected + '>' + label + '</option>';
    }).join("");
}

function handleScheduleSequenceChange(sequenceId) {
    if (!sequenceId) return;
    loadSequence(sequenceId);
    switchTab('schedule');
}
function setInventoryFedField(el, value) {
    if (!el) return;

    const cleanValue = Number(value || 0);

    el.value = cleanValue;

    if (cleanValue > 0) {
        el.classList.add("field-fed-from-inventory");
    } else {
        el.classList.remove("field-fed-from-inventory");
    }
}
function loadScheduleInputsFromActiveSequence() {
    const seq = getActiveSequenceRecord();
    if (!seq) return;

    const schedule = ensureSequenceScheduleShape(seq);
    const photonFeed = getPhotonFeed();

    const loftVolEl = document.getElementById("loftVol");
    const loadRateEl = document.getElementById("loadRate");
    const unloadRateEl = document.getElementById("unloadRate");
    const loadingVariantEl = document.getElementById("loadingVariant");
    const svcCustomMinutesEl = document.getElementById("svc_custom_minutes");
    const svcCustomNoteEl = document.getElementById("svc_custom_note");
    const exportWrapVolEl = document.getElementById("exportWrapVol");

    if (loftVolEl) loftVolEl.value = schedule.loftVol;
    if (loadRateEl) loadRateEl.value = schedule.loadRate;
    if (unloadRateEl) unloadRateEl.value = schedule.unloadRate;
    if (loadingVariantEl) loadingVariantEl.value = schedule.loadingVariant || "Standard";

    if (svcCustomMinutesEl) svcCustomMinutesEl.value = schedule.special.customItemMinutes;
    if (svcCustomNoteEl) svcCustomNoteEl.value = schedule.special.customItemNote;

    setInventoryFedField(exportWrapVolEl, photonFeed.special?.exportWrapVol || 0);
}

function saveScheduleInputsToActiveSequence() {
    const seq = getActiveSequenceRecord();
    if (!seq) return;

    const schedule = ensureSequenceScheduleShape(seq);

    const getNum = function(id, fallback) {
        const el = document.getElementById(id);
        if (!el) return fallback;
        const value = parseFloat(el.value);
        return Number.isFinite(value) ? value : fallback;
    };

    const getText = function(id, fallback) {
        const el = document.getElementById(id);
        if (!el) return fallback;
        return String(el.value || "").trim();
    };

    schedule.loftVol = getNum("loftVol", 0);
    schedule.loadRate = getNum("loadRate", 125);
    schedule.unloadRate = getNum("unloadRate", 132);
    schedule.loadingVariant = getText("loadingVariant", "Standard");

    schedule.special.customItemMinutes = getNum("svc_custom_minutes", 0);
    schedule.special.customItemNote = getText("svc_custom_note", "");
    schedule.special.uprightPianos = getNum("svc_upright", 0);
    schedule.special.grandPianos = getNum("svc_grand", 0);
    schedule.special.grandfatherClocks = getNum("svc_clock", 0);
  
    saveToDevice();
}

function handleScheduleInputChange() {
    saveScheduleInputsToActiveSequence();
    renderScheduleCalculator();

    const quoteTab = document.getElementById("content-quote");
    if (quoteTab && !quoteTab.classList.contains("hidden")) {
        renderQuoteTab();
    }
}
function getLoadingScenarioFromMoveType(moveType) {
    const raw = String(moveType || "").toLowerCase();

    if (raw.includes("to store")) return "intoStore";
    if (raw.includes("ex store")) return "exStore";

    return "direct";
}

function getAutoBuildMoveMode(moveType) {
    return getLoadingScenarioFromMoveType(moveType);
}
function getLoadingProfile(loadingVariant, loadingScenario) {
    const variant = String(loadingVariant || "Standard");
    const scenario = String(loadingScenario || "direct");

    if (scenario === "exStore") {
    return {
        label: "Ex Store",
        loadingApplies: false,
        unloadingApplies: true,

        // Loading not applicable
        morningEquivalentRate: 0,
        pmAfterAmEquivalentRate: 0,

        // Ex-store unloading rates
        unloadRate: 115,
        pmAfterAmUnloadRate: 91
    };
}

    if (scenario === "intoStore") {
        if (variant === "Slow") {
            return {
                label: "Slow / Into Store",
                loadingApplies: true,
                unloadingApplies: false,

                // Into-store loading rates
                morningEquivalentRate: 50,
                pmAfterAmEquivalentRate: 50,

                // Unloading not applicable
                unloadRate: 0
            };
        }

        return {
            label: "Standard / Into Store",
            loadingApplies: true,
            unloadingApplies: false,

            // Into-store loading rates
            morningEquivalentRate: 66,
            pmAfterAmEquivalentRate: 66,

            // Unloading not applicable
            unloadRate: 0
        };
    }

    if (variant === "Slow") {
        return {
            label: "Slow / Direct",
            loadingApplies: true,
            unloadingApplies: true,

            // Keep existing direct slow logic
            morningEquivalentRate: 100,
            pmAfterAmEquivalentRate: 45,

            // Keep existing direct unload rate
            unloadRate: 132
        };
    }

    return {
        label: "Standard / Direct",
        loadingApplies: true,
        unloadingApplies: true,

        // Keep existing direct standard logic
        morningEquivalentRate: 125,
        pmAfterAmEquivalentRate: 55,

        // Keep existing direct unload rate
        unloadRate: 132
    };
}
function getPhotonFeed() {
    if (currentJob && activeSeqId) {
        const directFeed = buildCalculatorFeedForSequence(activeSeqId);

        if (directFeed) {
            const seq = getActiveSequenceRecord();
            const schedule = seq ? ensureSequenceScheduleShape(seq) : createEmptySequenceSchedule();

           return {
    sequenceLabel: directFeed.sequenceLabel || "—",
    packOption: directFeed.packOption || "none",
    furnitureVol: Number(directFeed.furnitureVol || 0),
    qty: {
        ap: Number(directFeed.qty?.ap || 0),
        cg: Number(directFeed.qty?.cg || 0),
        books: Number(directFeed.qty?.books || 0),
        linen: Number(directFeed.qty?.linen || 0),
        wr: Number(directFeed.qty?.wr || 0)
    },
    disconnectApplianceCount: Number(directFeed.disconnectApplianceCount || 0),
    dismantleCount: Number(directFeed.dismantleCount || 0),
 special: {
    frameBeds: Number(directFeed.special?.frameBeds || 0),
    ottomanBeds: Number(directFeed.special?.ottomanBeds || 0),
    divanBeds: Number(directFeed.special?.divanBeds || 0),
    electricBeds: Number(directFeed.special?.electricBeds || 0),
    bunkBeds: Number(directFeed.special?.bunkBeds || 0),
    cots: Number(directFeed.special?.cots || 0),
    diningTables: Number(directFeed.special?.diningTables || 0),

    wardrobes: Number(directFeed.special?.wardrobes || 0),
    wardrobeItems: Array.isArray(directFeed.special?.wardrobeItems)
        ? directFeed.special.wardrobeItems
        : [],

    uprightPianos: Number(directFeed.special?.uprightPianos || 0),
    grandPianos: Number(directFeed.special?.grandPianos || 0),
    grandfatherClocks: Number(directFeed.special?.grandfatherClocks || 0),

    cratingItems: Number(directFeed.special?.cratingItems || 0),
    exportWrapVol: Number(directFeed.special?.exportWrapVol || 0)
}
};
        }
    }

    const raw = localStorage.getItem("photon_calculator_feed");

    if (!raw) {
        return {
            sequenceLabel: "—",
            packOption: "none",
            furnitureVol: 0,
            qty: {
                ap: 0,
                cg: 0,
                books: 0,
                linen: 0,
                wr: 0
            },
        disconnectApplianceCount: 0,
dismantleCount: 0,
special: {
    frameBeds: 0,
    ottomanBeds: 0,
    divanBeds: 0,
    electricBeds: 0,
    bunkBeds: 0,
    cots: 0,
    diningTables: 0,

    wardrobes: 0,
    wardrobeItems: [],

    uprightPianos: 0,
    grandPianos: 0,
    grandfatherClocks: 0,

    cratingItems: 0,
    exportWrapVol: 0
}
        };
    }

    try {
        const parsed = JSON.parse(raw);

       return {
    sequenceLabel: parsed.sequenceLabel || "—",
    packOption: parsed.packOption || "none",
    furnitureVol: Number(parsed.furnitureVol || 0),
    qty: {
        ap: Number(parsed.qty?.ap || 0),
        cg: Number(parsed.qty?.cg || 0),
        books: Number(parsed.qty?.books || 0),
        linen: Number(parsed.qty?.linen || 0),
        wr: Number(parsed.qty?.wr || 0)
    },
    disconnectApplianceCount: Number(parsed.disconnectApplianceCount || 0),
    dismantleCount: Number(parsed.dismantleCount || 0),
    special: {
    frameBeds: Number(parsed.special?.frameBeds || 0),
    ottomanBeds: Number(parsed.special?.ottomanBeds || 0),
    divanBeds: Number(parsed.special?.divanBeds || 0),
    electricBeds: Number(parsed.special?.electricBeds || 0),
    bunkBeds: Number(parsed.special?.bunkBeds || 0),
    cots: Number(parsed.special?.cots || 0),
    diningTables: Number(parsed.special?.diningTables || 0),

    wardrobes: Number(parsed.special?.wardrobes || 0),
    wardrobeItems: Array.isArray(parsed.special?.wardrobeItems)
        ? parsed.special.wardrobeItems
        : [],

    uprightPianos: Number(parsed.special?.uprightPianos || 0),
    grandPianos: Number(parsed.special?.grandPianos || 0),
    grandfatherClocks: Number(parsed.special?.grandfatherClocks || 0),

    cratingItems: Number(parsed.special?.cratingItems || 0),
    exportWrapVol: Number(parsed.special?.exportWrapVol || 0)
}
};
    } catch (err) {
        return {
            sequenceLabel: "—",
            packOption: "none",
            furnitureVol: 0,
            qty: {
                ap: 0,
                cg: 0,
                books: 0,
                linen: 0,
                wr: 0
            },
            disconnectApplianceCount: 0,
dismantleCount: 0,
special: {
    frameBeds: 0,
    ottomanBeds: 0,
    divanBeds: 0,
    electricBeds: 0,
    bunkBeds: 0,
    cots: 0,
    diningTables: 0,

    wardrobes: 0,
    wardrobeItems: [],

    uprightPianos: 0,
    grandPianos: 0,
    grandfatherClocks: 0,

    cratingItems: 0,
    exportWrapVol: 0
}
        };
    }
}

function num(id){
    const el = document.getElementById(id);
    if (!el) return 0;
    const value = parseFloat(el.value);
    return Number.isFinite(value) && value > 0 ? value : 0;
}

function round2(value){
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function round1(value){
    return Math.round((Number(value || 0) + Number.EPSILON) * 10) / 10;
}
let appModalResolve = null;

function closeAppModal(result) {
    const overlay = document.getElementById("app-modal-overlay");
    const input = document.getElementById("app-modal-input");

    if (overlay) {
        overlay.classList.remove("show");
    }

    if (input) {
        input.style.display = "none";
        input.value = "";
    }

    if (typeof appModalResolve === "function") {
        appModalResolve(result);
    }

    appModalResolve = null;
}
let listedInventoryShareBusy = false;
let listedInventoryShareLastTapAt = 0;
let listedInventoryDownloadObjectUrl = "";

function closeAllListedPdfShareOverlays() {
    var overlayIds = ["pdf-ready-overlay"];
    var i;
    var overlay;

    for (i = 0; i < overlayIds.length; i += 1) {
        overlay = document.getElementById(overlayIds[i]);
        if (overlay) {
            overlay.style.display = "none";
        }
    }
}

function cleanupListedInventoryDownloadUrl() {
    if (!listedInventoryDownloadObjectUrl) {
        return;
    }

    try {
        URL.revokeObjectURL(listedInventoryDownloadObjectUrl);
    } catch (err) {
        console.warn("Could not revoke listed inventory download URL:", err);
    }

    listedInventoryDownloadObjectUrl = "";
}

function setListedInventoryDownloadLink(pdfFile, downloadLink) {
    if (!pdfFile) {
        return "";
    }

    cleanupListedInventoryDownloadUrl();
    listedInventoryDownloadObjectUrl = URL.createObjectURL(pdfFile);

    if (downloadLink) {
        downloadLink.href = listedInventoryDownloadObjectUrl;
        downloadLink.download = pdfFile.name || "ListedInventory.pdf";
        downloadLink.style.display = "inline-block";
    }

    return listedInventoryDownloadObjectUrl;
}

function triggerListedInventoryDownload(pdfFile, downloadLink) {
    var objectUrl = setListedInventoryDownloadLink(pdfFile, downloadLink);
    var fallbackLink;

    if (!objectUrl) {
        return;
    }

    fallbackLink = document.createElement("a");
    fallbackLink.href = objectUrl;
    fallbackLink.download = pdfFile.name || "ListedInventory.pdf";
    fallbackLink.style.display = "none";
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    fallbackLink.remove();
}

function getListedInventorySharePageUrl() {
    var href;

    try {
        href = String(window.location.href || "");
    } catch (err) {
        href = "";
    }

    if (/^https?:\/\//i.test(href)) {
        return href;
    }

    return "";
}

function canNativeShareListedInventoryFile(pdfFile) {
    if (!pdfFile) {
        return false;
    }

    if (typeof navigator === "undefined") {
        return false;
    }

    if (typeof navigator.share !== "function") {
        return false;
    }

    if (typeof navigator.canShare !== "function") {
        return false;
    }

    try {
        return navigator.canShare({ files: [pdfFile] });
    } catch (err) {
        return false;
    }
}

function showListedInventoryShareToast(message) {
    var toast = document.getElementById("listed-share-toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "listed-share-toast";
        toast.className = "listed-share-toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    if (showListedInventoryShareToast._timer) {
        clearTimeout(showListedInventoryShareToast._timer);
    }

    showListedInventoryShareToast._timer = setTimeout(function() {
        toast.classList.remove("show");
    }, 2600);
}

async function copyTextToClipboardCompat(text) {
    var temp;
    var copied = false;

    if (!text) {
        return false;
    }

    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
        }
    }

    temp = document.createElement("textarea");
    temp.value = text;
    temp.setAttribute("readonly", "readonly");
    temp.style.position = "fixed";
    temp.style.left = "-9999px";
    temp.style.top = "0";

    document.body.appendChild(temp);
    temp.focus();
    temp.select();

    try {
        copied = document.execCommand("copy");
    } catch (err) {
        copied = false;
    }

    temp.remove();
    return copied;
}

async function tryShareListedInventoryPdfFromGesture(pdfFile, downloadLink, event) {
    var now = Date.now();
    var pageUrl = getListedInventorySharePageUrl();
    var copied;

    if (!pdfFile) {
        showListedInventoryShareToast("No PDF file was prepared.");
        return;
    }

    if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
    }

    if (event && typeof event.stopPropagation === "function") {
        event.stopPropagation();
    }

    if (listedInventoryShareBusy) {
        return;
    }

    if (now - listedInventoryShareLastTapAt < 700) {
        return;
    }

    listedInventoryShareLastTapAt = now;
    listedInventoryShareBusy = true;

    try {
        if (canNativeShareListedInventoryFile(pdfFile)) {
            await navigator.share({
                files: [pdfFile],
                title: pdfFile.name || "Listed inventory PDF",
                text: "MovePilot listed inventory PDF"
            });

            closeAllListedPdfShareOverlays();
            showListedInventoryShareToast("PDF shared.");
            return;
        }

        if (pageUrl && typeof navigator.share === "function") {
            await navigator.share({
                title: "MovePilot Listed Inventory",
                text: "Open the listed inventory page.",
                url: pageUrl
            });

            showListedInventoryShareToast("Link shared. This device cannot attach the PDF directly.");
            return;
        }

        triggerListedInventoryDownload(pdfFile, downloadLink);

        if (pageUrl) {
            copied = await copyTextToClipboardCompat(pageUrl);
            if (copied) {
                showListedInventoryShareToast("Sharing not supported here. Link copied and PDF downloaded.");
                return;
            }
        }

        showListedInventoryShareToast("Sharing not supported here. PDF downloaded.");
    } catch (err) {
        if (err && err.name === "AbortError") {
            showListedInventoryShareToast("Share cancelled.");
            return;
        }

        console.warn("Listed inventory share failed:", err);
        triggerListedInventoryDownload(pdfFile, downloadLink);

        if (pageUrl) {
            copied = await copyTextToClipboardCompat(pageUrl);
            if (copied) {
                showListedInventoryShareToast("Share failed. Link copied and PDF downloaded.");
                return;
            }
        }

        showListedInventoryShareToast("Share failed. PDF downloaded instead.");
    } finally {
        listedInventoryShareBusy = false;
    }
}

function preparePdfDownloadLink(downloadLink, pdfFile) {
    if (!downloadLink || !pdfFile) {
        return;
    }

    if (downloadLink.dataset.objectUrl) {
        try {
            URL.revokeObjectURL(downloadLink.dataset.objectUrl);
        } catch (err) {
        }
    }

    var objectUrl = URL.createObjectURL(pdfFile);
    downloadLink.dataset.objectUrl = objectUrl;
    downloadLink.href = objectUrl;
    downloadLink.download = pdfFile.name || "ListedInventory.pdf";
    downloadLink.style.display = "inline-block";
}

function bindPdfShareButton(pdfFile) {
    var shareBtn = document.getElementById("pdf-share-now-btn");
    var downloadLink = document.getElementById("pdf-download-link");
    var canSharePdf = false;

    if (!shareBtn || !downloadLink || !pdfFile) {
        return;
    }

    preparePdfDownloadLink(downloadLink, pdfFile);

    if (navigator.share && navigator.canShare) {
        try {
            canSharePdf = navigator.canShare({ files: [pdfFile] });
        } catch (err) {
            console.warn("navigator.canShare failed:", err);
            canSharePdf = false;
        }
    }

    shareBtn.onclick = async function() {
        if (!canSharePdf) {
            alert("This device cannot open the native PDF share sheet. Please use Download PDF.");
            return;
        }

        try {
            await navigator.share({ files: [pdfFile] });
            closeListedPdfReadyModal();
        } catch (err) {
            console.warn("PDF share failed:", err);

            if (err && err.name === "AbortError") {
                return;
            }

            alert("Sharing failed on this device. Please use Download PDF instead.");
        }
    };
}



function showAppModal(options) {
    options = options || {};

    const overlay = document.getElementById("app-modal-overlay");
    const titleEl = document.getElementById("app-modal-title");
    const messageEl = document.getElementById("app-modal-message");
    const actionsEl = document.getElementById("app-modal-actions");
    const inputEl = document.getElementById("app-modal-input");

    if (!overlay || !titleEl || !messageEl || !actionsEl || !inputEl) {
        // Emergency fallback only if modal HTML is missing.
        return Promise.resolve(null);
    }

    titleEl.textContent = options.title || "Message";
    messageEl.textContent = options.message || "";

    actionsEl.innerHTML = "";

    if (options.showInput) {
        inputEl.style.display = "block";
        inputEl.value = options.defaultValue || "";
        inputEl.placeholder = options.placeholder || "";
    } else {
        inputEl.style.display = "none";
        inputEl.value = "";
    }

    const buttons = Array.isArray(options.buttons) && options.buttons.length
        ? options.buttons
        : [
            {
                label: "OK",
                value: true,
                className: "primary"
            }
        ];

    buttons.forEach(function(button) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "app-modal-btn " + (button.className || "");
        btn.textContent = button.label || "OK";

        btn.onclick = function() {
            if (options.showInput && button.value === "input") {
                closeAppModal(inputEl.value);
                return;
            }

            closeAppModal(button.value);
        };

        actionsEl.appendChild(btn);
    });

    overlay.classList.add("show");

    if (options.showInput) {
        setTimeout(function() {
            inputEl.focus();
            inputEl.select();
        }, 0);
    }

    return new Promise(function(resolve) {
        appModalResolve = resolve;
    });
}

function appAlert(message, title) {
    return showAppModal({
        title: title || "Message",
        message: message || "",
        buttons: [
            {
                label: "OK",
                value: true,
                className: "primary"
            }
        ]
    });
}

function appConfirm(message, title) {
    return showAppModal({
        title: title || "Confirm",
        message: message || "",
        buttons: [
            {
                label: "Cancel",
                value: false,
                className: ""
            },
            {
                label: "OK",
                value: true,
                className: "primary"
            }
        ]
    });
}

function formatHoursAndMinutes(hours) {
    const totalMinutes = Math.round(Number(hours || 0) * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hrs > 0 && mins > 0) {
        return hrs + " hr" + (hrs === 1 ? "" : "s") + " " + mins + " mins";
    }

    if (hrs > 0) {
        return hrs + " hr" + (hrs === 1 ? "" : "s");
    }

    if (mins > 0) {
        return mins + " mins";
    }

    return "0 mins";
}

function getPackModeLabel(packOption){
    if (packOption === "none") return "No";
    if (packOption === "cg") return "CG";
    return "Full";
}

function getIncludedKeys(packOption){
    if (packOption === "none") return [];
    if (packOption === "cg") return ["cg"];
    return ["ap", "cg", "books", "linen", "wr"];
}

function getState() {
    const photonFeed = getPhotonFeed();
    const seq = getActiveSequenceRecord();
    const loadingScenario = getLoadingScenarioFromMoveType(seq ? seq.moveType : "");
    const loadingVariantEl = document.getElementById("loadingVariant");

    const loadingVariant = loadingVariantEl
        ? loadingVariantEl.value
        : "Standard";

    const loadingProfile = getLoadingProfile(loadingVariant, loadingScenario);

    const disconnectApplianceCount = Number(photonFeed.disconnectApplianceCount || 0);
    const totalApplianceCount = disconnectApplianceCount;

    return {
    packOption: photonFeed.packOption || "none",
    furnitureVol: photonFeed.furnitureVol || 0,
    loftVol: num("loftVol"),

    // These are now driven by the loading profile rather than loose manual values
    loadRate: loadingProfile.morningEquivalentRate,
    unloadRate: loadingProfile.unloadRate,

    // Keep the detailed loading profile available for planner logic
    loadingProfile: loadingProfile,

    loadingVariant: loadingVariant,
    loadingScenario: loadingScenario,
    depotToCollectionMinutes: num("depotToCollectionMinutes"),
collectionToDeliveryMinutes: num("collectionToDeliveryMinutes"),
deliveryToDepotMinutes: num("deliveryToDepotMinutes"),

        qty: {
            ap: photonFeed.qty.ap || 0,
            cg: photonFeed.qty.cg || 0,
            books: photonFeed.qty.books || 0,
            linen: photonFeed.qty.linen || 0,
            wr: photonFeed.qty.wr || 0
        },

        boxVolumes: BOX_VOLUMES,

        special: {
    frameBeds: Number(photonFeed.special?.frameBeds || 0),
    ottomanBeds: Number(photonFeed.special?.ottomanBeds || 0),
    divanBeds: Number(photonFeed.special?.divanBeds || 0),
    electricBeds: Number(photonFeed.special?.electricBeds || 0),
    bunkBeds: Number(photonFeed.special?.bunkBeds || 0),
    cots: Number(photonFeed.special?.cots || 0),
    diningTables: Number(photonFeed.special?.diningTables || 0),

    wardrobes: Number(photonFeed.special?.wardrobes || 0),
    wardrobeItems: Array.isArray(photonFeed.special?.wardrobeItems)
        ? photonFeed.special.wardrobeItems
        : [],

    customMinutes: num("svc_custom_minutes"),
    customNote: document.getElementById("svc_custom_note")
        ? document.getElementById("svc_custom_note").value.trim()
        : "",

    upright: Number(photonFeed.special?.uprightPianos || 0),
    grand: Number(photonFeed.special?.grandPianos || 0),
    clock: Number(photonFeed.special?.grandfatherClocks || 0),

    appliance: totalApplianceCount,
    manualApplianceCount: 0,
    disconnectApplianceCount: disconnectApplianceCount,
    crate: Number(photonFeed.special?.cratingItems || 0)
},

        exportWrapVol: num("exportWrapVol")
    };
}
function calcPacking(state){
    const includedKeys = getIncludedKeys(state.packOption);
    const packHours = Object.keys(BOX_RATES).reduce((sum, key) => {
        const qty = state.qty[key] || 0;
        if (!includedKeys.includes(key)) return sum;
        return sum + (qty / BOX_RATES[key]);
    }, 0);
    return {
        packHours: round2(packHours),
        packDays: round1(packHours / 8)
    };
}

function calcBoxVolume(state){
    return Object.keys(state.qty).reduce((sum, key) => {
        return sum + ((state.qty[key] || 0) * (state.boxVolumes[key] || 0));
    }, 0);
}

function calcSpecialLabour(state) {
    const includedExportWrapVol = 30;
    const includedBedDismantleCount = 1;

    const exportWrapVol = Number(state.exportWrapVol || 0);
    const loftVol = Number(state.loftVol || 0);

    const extraExportWrapVol = Math.max(0, exportWrapVol - includedExportWrapVol);

    const depotToCollectionMinutes = Number(state.depotToCollectionMinutes || 0);
    const collectionToDeliveryMinutes = Number(state.collectionToDeliveryMinutes || 0);
    const deliveryToDepotMinutes = Number(state.deliveryToDepotMinutes || 0);

    let includedBedsRemaining = includedBedDismantleCount;

    const frameBedCount = Math.max(0, Number(state.special.frameBeds || 0));
    const ottomanBedCount = Math.max(0, Number(state.special.ottomanBeds || 0));
    const bunkBedCount = Math.max(0, Number(state.special.bunkBeds || 0));
    const cotCount = Math.max(0, Number(state.special.cots || 0));

    const billableFrameBeds = Math.max(0, frameBedCount - includedBedsRemaining);
    includedBedsRemaining = Math.max(0, includedBedsRemaining - frameBedCount);

    const billableOttomanBeds = Math.max(0, ottomanBedCount - includedBedsRemaining);
    includedBedsRemaining = Math.max(0, includedBedsRemaining - ottomanBedCount);

    const billableBunkBeds = Math.max(0, bunkBedCount - includedBedsRemaining);
    includedBedsRemaining = Math.max(0, includedBedsRemaining - bunkBedCount);

    const billableCots = Math.max(0, cotCount - includedBedsRemaining);

    const frameBedMinutes = billableFrameBeds * 15;
    const ottomanBedMinutes = billableOttomanBeds * 30;
    const bunkBedMinutes = billableBunkBeds * 30;
    const cotMinutes = billableCots * 10;
    const diningTableMinutes = Number(state.special.diningTables || 0) * 15;
    const wardrobeMinutes = Number(state.special.wardrobes || 0) * 20;
    const uprightPianoMinutes = Number(state.special.upright || 0) * 10;
    const grandPianoMinutes = Number(state.special.grand || 0) * 30;
    const grandfatherClockMinutes = Number(state.special.clock || 0) * 15;
    const applianceMinutes = Number(state.special.appliance || 0) * 10;
    const crateMinutes = Number(state.special.crate || 0) * 15;
    const customMinutes = state.special.customMinutes > 0 ? Number(state.special.customMinutes || 0) : 0;

    const loftMinutes = loftVol > 0 ? (loftVol / 200) * 60 : 0;
    const exportWrapMinutes = extraExportWrapVol > 0 ? (extraExportWrapVol / 30) * 60 : 0;

    /*
        Collection-side special labour:
        Things that happen at collection / loading side.
    */
    const collectionMinutes =
        frameBedMinutes +
        ottomanBedMinutes +
        bunkBedMinutes +
        cotMinutes +
        diningTableMinutes +
        wardrobeMinutes +
        customMinutes +
        uprightPianoMinutes +
        grandPianoMinutes +
        grandfatherClockMinutes +
        applianceMinutes +
        crateMinutes +
        loftMinutes +
        exportWrapMinutes;

    /*
        Delivery-side special labour:
        Things that happen at delivery / unloading side.
        Appliance disconnect, loft effects and export wrap are collection-side only for now.
    */
    const deliveryMinutes =
        frameBedMinutes +
        ottomanBedMinutes +
        bunkBedMinutes +
        cotMinutes +
        diningTableMinutes +
        wardrobeMinutes +
        customMinutes +
        uprightPianoMinutes +
        grandPianoMinutes +
        grandfatherClockMinutes +
        crateMinutes;

    const totalHours = (collectionMinutes + deliveryMinutes) / 60;

    return {
        specialHours: round2(totalHours),

        // Existing names retained so calcLoading/calcUnloading keep working.
        loadSideHours: round2(collectionMinutes / 60),
        unloadSideHours: round2(deliveryMinutes / 60),

        // New clearer names for display and future logic.
        collectionSideHours: round2(collectionMinutes / 60),
        deliverySideHours: round2(deliveryMinutes / 60),

        depotToCollectionHours: round2(depotToCollectionMinutes / 60),
        collectionToDeliveryHours: round2(collectionToDeliveryMinutes / 60),
        deliveryToDepotHours: round2(deliveryToDepotMinutes / 60),

        breakdown: {
            frameBeds: round2((frameBedMinutes * 2) / 60),
            ottomanBeds: round2((ottomanBedMinutes * 2) / 60),
            divanBeds: 0,
            electricBeds: 0,
            bunkBeds: round2((bunkBedMinutes * 2) / 60),
            cots: round2((cotMinutes * 2) / 60),
            diningTables: round2((diningTableMinutes * 2) / 60),
            wardrobes: round2((wardrobeMinutes * 2) / 60),
            custom: round2((customMinutes * 2) / 60),
            upright: round2((uprightPianoMinutes * 2) / 60),
            grand: round2((grandPianoMinutes * 2) / 60),
            clock: round2((grandfatherClockMinutes * 2) / 60),

            // Appliance is collection-side only.
            appliance: round2(applianceMinutes / 60),

            // Crating is currently treated as both sides.
            crate: round2((crateMinutes * 2) / 60),

            // Loft and export wrap are collection-side only.
            loft: round2(loftMinutes / 60),
            exportWrap: round2(exportWrapMinutes / 60),

            collectionSide: round2(collectionMinutes / 60),
            deliverySide: round2(deliveryMinutes / 60),

            transit: 0,
            includedExportWrapVol: includedExportWrapVol
        }
    };
}
function calcLoading(totalVolume, loadRate, loadSideSpecialHours, loadingScenario, loadingProfile){
    if (loadingScenario === "exStore") {
        return {
            hours: 0,
            days: 0,
            completionCrew: 0,
            volumeHours: 0,
            morningVolumeHours: 0,
            pmAfterAmVolumeHours: 0
        };
    }

    const profile = loadingProfile || {};
    const morningRate = Number(profile.morningEquivalentRate || loadRate || 0);
    const pmAfterAmRate = Number(profile.pmAfterAmEquivalentRate || morningRate || 0);

    if (!morningRate || morningRate <= 0) {
        return {
            hours: 0,
            days: 0,
            completionCrew: 0,
            volumeHours: 0,
            morningVolumeHours: 0,
            pmAfterAmVolumeHours: 0
        };
    }

    const volume = Number(totalVolume || 0);

const morningVolumeHours = morningRate > 0 ? volume / morningRate : 0;
const pmAfterAmVolumeHours = pmAfterAmRate > 0 ? volume / pmAfterAmRate : morningVolumeHours;

// Base required loading hours use the main loading rate.
// Planner validation handles whether those hours are available before/after completion windows.
const volumeHours = morningVolumeHours;

const totalHours = volumeHours + Number(loadSideSpecialHours || 0);
    return {
        hours: round2(totalHours),
        days: round1(totalHours / 8),
        completionCrew: round1(totalHours / 4),
        volumeHours: round2(volumeHours),
        morningVolumeHours: round2(morningVolumeHours),
        pmAfterAmVolumeHours: round2(pmAfterAmVolumeHours)
    };
}

function calcUnloading(totalVolume, unloadRate, unloadSideSpecialHours, loadingScenario){
    if (loadingScenario === "intoStore") {
        return {
            hours: 0,
            days: 0,
            completionCrew: 0,
            volumeHours: 0
        };
    }

    if (!unloadRate || unloadRate <= 0) {
        return {
            hours: 0,
            days: 0,
            completionCrew: 0,
            volumeHours: 0
        };
    }

    const volumeHours = totalVolume / unloadRate;
    const totalHours = volumeHours + unloadSideSpecialHours;

    return {
        hours: round2(totalHours),
        days: round1(totalHours / 8),
        completionCrew: round1(totalHours / 4),
        volumeHours: round2(volumeHours)
    };
}
function optionHtml(options, selected){
    return options.map(opt => `<option value="${opt}" ${String(opt) === String(selected) ? "selected" : ""}>${opt}</option>`).join("");
}

function taskOptionHtml(selectedTask) {
    const currentTask = String(selectedTask || "").trim();
    const taskOptions = TASK_OPTIONS.slice();

    if (currentTask && !taskOptions.includes(currentTask)) {
        taskOptions.unshift(currentTask);
    }

    return optionHtml(taskOptions, currentTask);
}

function getPlannerTaskMode(day) {
    const task = String(day && day.task ? day.task : "").trim();

    if (
        task === "Pack" ||
        task === "Pack & Prepare" ||
        task === "Pack fragiles & breakables"
    ) {
        return "pack";
    }

    if (
        task === "Commence loading" ||
        task === "Continue loading" ||
        task === "Complete loading" ||
        task === "Load" ||
        task === "Load & Travel"
    ) {
        return "load";
    }

    if (
        task === "Deliver" ||
        task === "Continue Delivery" ||
        task === "Complete delivery" ||
        task === "Deliver and Crew Return" ||
        task === "Unpack"
    ) {
        return "unload";
    }

    if (
        task === "Pack + Load" ||
        task === "Pack and part Load"
    ) {
        return "pack_load";
    }

    if (
        task === "Pack, Load & Deliver" ||
        task === "Load and Deliver"
    ) {
        return "load_unload";
    }

    if (task === "Travel") {
        return "travel";
    }

    return "none";
}

function getCompletionWindowHours(dayPart) {
    return getNormalWindowHours(dayPart);
}

function getNormalWindowHours(dayPart) {
    if (dayPart === "AM") return 5;
    if (dayPart === "PM") return 4.5;
    if (dayPart === "Full Day") return 9.5;
    return 0;
}

function getWindowHoursForRow(day) {
    const completionWindow = String(day.completionWindow || "None");
    const baseHours = completionWindow === "Completion Day"
        ? getCompletionWindowHours(day.dayPart)
        : getNormalWindowHours(day.dayPart);

    const overtimeHours = Math.max(0, Number(day.overtimeHours || 0));

    return baseHours + overtimeHours;
}
function getPlannerLoadEquivalentHours(day, taskHours, state) {
    const usableTaskHours = Math.max(0, Number(taskHours || 0));

    const loadingProfile = state && state.loadingProfile ? state.loadingProfile : {};
    const morningRate = Number(loadingProfile.morningEquivalentRate || state.loadRate || 0);
    const pmRate = Number(loadingProfile.pmAfterAmEquivalentRate || morningRate || 0);

    if (!morningRate || morningRate <= 0) {
        return usableTaskHours;
    }

    const pmMultiplier = pmRate > 0 ? pmRate / morningRate : 1;

    const completionWindow = String(day.completionWindow || "None");
    const dayPart = String(day.dayPart || "Full Day");

    /*
        Completion day rule:
        Loading must finish by 1pm.
        Depot-to-collection travel reduces the available loading window.
        No PM loading capacity counts.
    */
    if (completionWindow === "Completion Day") {
        return getCompletionAdjustedCapacity(day, "load", usableTaskHours, state);
    }

    /*
        Normal direct loading rule:
        Anything before 1pm counts at the main loading rate.
        Anything after 1pm counts at the reduced after-AM rate.
    */

    if (dayPart === "AM") {
        return usableTaskHours;
    }

    if (dayPart === "PM") {
        return usableTaskHours * pmMultiplier;
    }

    if (dayPart === "Full Day") {
        const preLoadTravelHours = getFirstRowLegHours(day);
        const amWindowHours = Math.max(0, 5 - preLoadTravelHours);

        const amHours = Math.min(usableTaskHours, amWindowHours);
        const pmHours = Math.max(0, usableTaskHours - amHours);

        return amHours + (pmHours * pmMultiplier);
    }

    return usableTaskHours;
}

function getPlannerUnloadEquivalentHours(day, taskHours, state) {
    const usableTaskHours = Math.max(0, Number(taskHours || 0));

    const loadingScenario = String(state && state.loadingScenario ? state.loadingScenario : "");
    const loadingProfile = state && state.loadingProfile ? state.loadingProfile : {};

    const mainUnloadRate = Number(state && state.unloadRate ? state.unloadRate : 0);
    const pmUnloadRate = Number(loadingProfile.pmAfterAmUnloadRate || mainUnloadRate || 0);

    /*
        Only apply split unloading rate to ex-store for now.
        Other move types keep existing unloading behaviour.
    */
    if (loadingScenario !== "exStore") {
        return getCompletionAdjustedCapacity(day, "unload", usableTaskHours, state);
    }

    if (!mainUnloadRate || mainUnloadRate <= 0) {
        return usableTaskHours;
    }

    const pmMultiplier = pmUnloadRate > 0 ? pmUnloadRate / mainUnloadRate : 1;
    const dayPart = String(day.dayPart || "Full Day");

    if (dayPart === "AM") {
        return usableTaskHours;
    }

    if (dayPart === "PM") {
        return usableTaskHours * pmMultiplier;
    }

    if (dayPart === "Full Day") {
        const amWindowHours = 5;
        const amHours = Math.min(usableTaskHours, amWindowHours);
        const pmHours = Math.max(0, usableTaskHours - amHours);

        return amHours + (pmHours * pmMultiplier);
    }

    return usableTaskHours;
}
function getCompletionAdjustedCapacity(day, mode, taskHours) {
    const completionWindow = String(day.completionWindow || "None");
    const usableTaskHours = Math.max(0, Number(taskHours || 0));

    if (completionWindow !== "Completion Day") {
        return usableTaskHours;
    }

    if (mode === "load") {
    if (day.dayPart === "PM") return 0;

    const preLoadTravelHours = getFirstRowLegHours(day);
    const loadWindowBeforeCompletion = Math.max(0, 5 - preLoadTravelHours);

    if (day.dayPart === "AM") {
        return Math.min(usableTaskHours, loadWindowBeforeCompletion);
    }

    if (day.dayPart === "Full Day") {
        return Math.min(usableTaskHours, loadWindowBeforeCompletion);
    }
}

    if (mode === "unload") {
        if (day.dayPart === "AM") return 0;
        if (day.dayPart === "PM") return Math.min(usableTaskHours, 4.5);
        if (day.dayPart === "Full Day") return Math.min(usableTaskHours, 4.5);
    }

    return usableTaskHours;
}

function getNetTaskHoursForPlannerRow(day, state){
    const rowHours = getWindowHoursForRow(day);
    const travelHours = getRowLegHours(day);
    return Math.max(0, round2(rowHours - travelHours));
}

function getScheduleAutoBuildStatusSequence() {
    return getActiveSequenceRecord ? getActiveSequenceRecord() : null;
}

function setScheduleAutoBuildUpdateNeeded(isNeeded, reason, shouldSave) {
    const seq = getScheduleAutoBuildStatusSequence();
    if (!seq) return;

    seq.scheduleAutoBuildUpdateNeeded = !!isNeeded;
    seq.scheduleAutoBuildUpdateReason = isNeeded
        ? reason || "Inventory or sequence details changed."
        : "";
    seq.scheduleAutoBuildUpdateAt = isNeeded
        ? new Date().toISOString()
        : "";

    if (shouldSave !== false) {
        saveToDevice();
    }
}

function markScheduleAutoBuildUpdateNeeded(reason, shouldSave) {
    setScheduleAutoBuildUpdateNeeded(true, reason, shouldSave);
}

function clearScheduleAutoBuildUpdateNeeded(shouldSave) {
    setScheduleAutoBuildUpdateNeeded(false, "", shouldSave);
}

function shouldShowScheduleAutoBuildUpdateNeeded() {
    const seq = getScheduleAutoBuildStatusSequence();
    return !!(seq && seq.scheduleAutoBuildUpdateNeeded);
}

function getScheduleAutoBuildUpdateCardHtml() {
    if (!shouldShowScheduleAutoBuildUpdateNeeded()) {
        return "";
    }

    const seq = getScheduleAutoBuildStatusSequence();
    const reason = seq && seq.scheduleAutoBuildUpdateReason
        ? seq.scheduleAutoBuildUpdateReason
        : "Inventory or sequence details changed.";

    return `
        <div class="schedule-autobuild-update-card">
            <div>
                <div class="schedule-autobuild-update-title">Auto Build Update Needed</div>
                <div class="schedule-autobuild-update-text">
                    ${escapeHtml(reason)} Run Auto Build again to refresh packing, loading, unloading and travel allowances.
                </div>
            </div>

            <button
                type="button"
                class="schedule-autobuild-update-btn"
                onclick="autoBuildScheduleDays(this)"
            >
                Run Auto Build
            </button>
        </div>
    `;
}
function pulseScheduleButton(buttonEl) {
    if (!buttonEl) return;

    buttonEl.classList.remove("schedule-btn-pulse-hit");
    void buttonEl.offsetWidth;
    buttonEl.classList.add("schedule-btn-pulse-hit");

    triggerHaptic("light");

    setTimeout(function() {
        buttonEl.classList.remove("schedule-btn-pulse-hit");
    }, 220);
}

function autoBuildScheduleDays(buttonEl) {
    pulseScheduleButton(buttonEl);

    const seq = getActiveSequenceRecord();
    if (!seq) return;

    const photonFeed = getPhotonFeed();
    const moveMode = getAutoBuildMoveMode(seq.moveType || "");
    const packMode = photonFeed.packOption || "none";

    const newRows = [];

    const collectionId = seq && Array.isArray(seq.collections) && seq.collections.length
        ? String(seq.collections[0])
        : "";

    const deliveryId = seq && Array.isArray(seq.deliveries) && seq.deliveries.length
        ? String(seq.deliveries[0])
        : "";

    const selectedOperatingBranch = getOperatingBranchFromManualScheduleRows() || "";

    const hasPacking =
        packMode === "cg" ||
        packMode === "full";

    if (hasPacking) {
        const packGroupId = createId();

        newRows.push({
            id: createId(),
            groupId: packGroupId,
            dayPart: "AM",
            task: "Pack",
            completionWindow: "None",
            date: "",
            men: 2,
            vans: 1,
            hours: 8,
            nightsOut: false,
            overtimeHours: 0,
            operatingBranch: selectedOperatingBranch,
            legs: [
                createEmptyScheduleLeg("Depot", collectionId, 30)
            ]
        });

        newRows.push({
            id: createId(),
            groupId: packGroupId,
            dayPart: "PM",
            task: "Pack",
            completionWindow: "None",
            date: "",
            men: 2,
            vans: 1,
            hours: 8,
            nightsOut: false,
            overtimeHours: 0,
            operatingBranch: selectedOperatingBranch,
            legs: [
                createEmptyScheduleLeg(collectionId, "Depot", 30)
            ]
        });
    }

    const moveGroupId = createId();

    if (moveMode === "intoStore") {
        newRows.push({
            id: createId(),
            groupId: moveGroupId,
            dayPart: "AM",
            task: "Load",
            completionWindow: "None",
            date: "",
            men: 2,
            vans: 1,
            hours: 8,
            nightsOut: false,
            overtimeHours: 0,
            operatingBranch: selectedOperatingBranch,
            legs: [
                createEmptyScheduleLeg("Depot", collectionId, 30)
            ]
        });

        newRows.push({
            id: createId(),
            groupId: moveGroupId,
            dayPart: "PM",
            task: "Load",
            completionWindow: "None",
            date: "",
            men: 2,
            vans: 1,
            hours: 8,
            nightsOut: false,
            overtimeHours: 0,
            operatingBranch: selectedOperatingBranch,
            legs: [
                createEmptyScheduleLeg(collectionId, deliveryId, 30)
            ]
        });
    } else if (moveMode === "exStore") {
        newRows.push({
            id: createId(),
            groupId: moveGroupId,
            dayPart: "AM",
            task: "Deliver",
            completionWindow: "None",
            date: "",
            men: 2,
            vans: 1,
            hours: 8,
            nightsOut: false,
            overtimeHours: 0,
            operatingBranch: selectedOperatingBranch,
            legs: [
                createEmptyScheduleLeg("Depot", collectionId, 30)
            ]
        });

        newRows.push({
            id: createId(),
            groupId: moveGroupId,
            dayPart: "PM",
            task: "Deliver",
            completionWindow: "None",
            date: "",
            men: 2,
            vans: 1,
            hours: 8,
            nightsOut: false,
            overtimeHours: 0,
            operatingBranch: selectedOperatingBranch,
            legs: [
                createEmptyScheduleLeg(collectionId, deliveryId, 30),
                createEmptyScheduleLeg(deliveryId, "Depot", 30)
            ]
        });
    } else {
        newRows.push({
            id: createId(),
            groupId: moveGroupId,
            dayPart: "AM",
            task: "Load",
            completionWindow: "None",
            date: "",
            men: 2,
            vans: 1,
            hours: 8,
            nightsOut: false,
            overtimeHours: 0,
            operatingBranch: selectedOperatingBranch,
           legs: [
    createEmptyScheduleLeg("Depot", collectionId, 30),
    createEmptyScheduleLeg(collectionId, deliveryId, 30)
]
        });

        newRows.push({
            id: createId(),
            groupId: moveGroupId,
            dayPart: "PM",
            task: "Deliver",
            completionWindow: "None",
            date: "",
            men: 2,
            vans: 1,
            hours: 8,
            nightsOut: false,
            overtimeHours: 0,
            operatingBranch: selectedOperatingBranch,
            legs: [
    createEmptyScheduleLeg(deliveryId, "Depot", 30)
]
        });
    }

    manualSchedule = newRows;
    clearScheduleAutoBuildUpdateNeeded(false);
    commitManualScheduleEdit();
}

function handleLoadingVariantToolbarChange(value) {
    const seq = getActiveSequenceRecord();
    if (!seq) return;

    const schedule = ensureSequenceScheduleShape(seq);
    schedule.loadingVariant = String(value || "Standard");

    saveToDevice();
    renderScheduleCalculator();
}
function renderScheduleToolbarOperatingBranch() {
    const select = document.getElementById("scheduleToolbarOperatingBranch");
    if (!select) return;

    const selectedBranch = getOperatingBranchFromManualScheduleRows() || "";

    select.innerHTML = `
        <option value="">Select Branch</option>
        ${OPERATING_BRANCHES.map(function(branch) {
            const selected = String(selectedBranch) === String(branch) ? "selected" : "";
            return `<option value="${escapeHtml(branch)}" ${selected}>${escapeHtml(branch)}</option>`;
        }).join("")}
    `;
}
function renderScheduleToolbarLoadingVariant() {
    const select = document.getElementById("loadingVariant");
    if (!select) return;

    const seq = getActiveSequenceRecord();
    if (!seq) return;

    const schedule = ensureSequenceScheduleShape(seq);
    select.value = schedule.loadingVariant || "Standard";
}

function updateScheduleOperatingBranchForAllRows(branchValue) {
    const cleanBranch = String(branchValue || "").trim();

    if (!Array.isArray(manualSchedule)) {
        manualSchedule = [];
    }

    manualSchedule.forEach(function(day) {
        ensureScheduleRowShape(day);
        day.operatingBranch = cleanBranch;
    });

    commitManualScheduleEdit();
}

function addScheduleDay(buttonEl) {
    pulseScheduleButton(buttonEl);

    const newGroupId = createId();

    const seq = getActiveSequenceRecord();

    const collectionId = seq && Array.isArray(seq.collections) && seq.collections.length
        ? String(seq.collections[0])
        : "";

    const deliveryId = seq && Array.isArray(seq.deliveries) && seq.deliveries.length
        ? String(seq.deliveries[0])
        : "";

    const selectedOperatingBranch = getOperatingBranchFromManualScheduleRows() || "";

    manualSchedule.push(createManualScheduleRow({
        groupId: newGroupId,
        dayPart: "AM",
        task: "Load",
        operatingBranch: selectedOperatingBranch,
        legs: [
            createEmptyScheduleLeg("Depot", collectionId, 30),
            createEmptyScheduleLeg(collectionId, deliveryId, 30)
        ]
    }));

    manualSchedule.push(createManualScheduleRow({
        groupId: newGroupId,
        dayPart: "PM",
        task: "Deliver",
        operatingBranch: selectedOperatingBranch,
        legs: [
            createEmptyScheduleLeg(deliveryId, "Depot", 30)
        ]
    }));

    commitManualScheduleEdit();
}

function removeScheduleDay(dayId) {
    const rowToRemove = manualSchedule.find(function(day) {
        return day.id === dayId;
    });

    if (!rowToRemove) return;

    manualSchedule = manualSchedule.filter(function(day) {
        return day.groupId !== rowToRemove.groupId;
    });

    if (!manualSchedule.length) {
        manualSchedule = getDefaultManualScheduleRows();
    }

    commitManualScheduleEdit();
}

function ensurePmPair(row) {
    const pairExists = manualSchedule.some(function(day) {
        return day.groupId === row.groupId && day.dayPart === "PM";
    });

    if (!pairExists) {
        manualSchedule.push({
            id: createId(),
            groupId: row.groupId,
            dayPart: "PM",
            task: "Deliver",
            completionWindow: "None",
            date: row.date || "",
            men: row.men,
            vans: row.vans,
            hours: 4,
            nightsOut: false,
            overtimeHours: 0,
            operatingBranch: row.operatingBranch || "",
            legs: [
                createEmptyScheduleLeg("Delivery Address", "Depot", 0)
            ]
        });
    }
}

function normalizeGroup(groupId) {
    const rows = manualSchedule.filter(function(day) {
        return day.groupId === groupId;
    });
    const hasAm = rows.some(function(day) {
        return day.dayPart === "AM";
    });
    const hasPm = rows.some(function(day) {
        return day.dayPart === "PM";
    });
    const hasFull = rows.some(function(day) {
        return day.dayPart === "Full Day";
    });

    if (hasAm && !hasPm) {
        const amRow = rows.find(function(day) {
            return day.dayPart === "AM";
        });
        ensurePmPair(amRow);
    }

    if (hasFull && rows.length > 1) {
        manualSchedule = manualSchedule.filter(function(day) {
            return !(day.groupId === groupId && day.dayPart !== "Full Day");
        });
    }
}

function shouldAutoSplitCompletionRow(day) {
    if (!day) return false;

    const completionOn = String(day.completionWindow || "None") === "Completion Day";
    if (!completionOn) return false;

    const seq = getActiveSequenceRecord();
    const moveMode = getAutoBuildMoveMode(seq ? seq.moveType || "" : "");

    // Only direct moves auto-split.
    if (moveMode !== "direct") return false;

    const task = String(day.task || "");

    return (
        task === "Load and Deliver" ||
        task === "Pack, Load & Deliver"
    );
}

function splitCompletionRowIntoAmPm(row) {
    if (!row) return;

    const existingRows = manualSchedule.filter(function(day) {
        return day.groupId === row.groupId;
    });

    const alreadySplit = existingRows.some(function(day) {
        return day.dayPart === "AM" || day.dayPart === "PM";
    });

    if (alreadySplit) return;

    const legs = Array.isArray(row.legs) ? row.legs.slice() : [];

    const amLegs = [];
    const pmLegs = [];

    if (legs[0]) amLegs.push({ ...legs[0] });
    if (legs[1]) amLegs.push({ ...legs[1] });
    if (legs[2]) pmLegs.push({ ...legs[2] });

    const amTask =
        row.task === "Pack, Load & Deliver"
            ? "Pack and part Load"
            : "Commence loading";

    const amRow = {
        id: createId(),
        groupId: row.groupId,
        dayPart: "AM",
        task: amTask,
        completionWindow: "Completion Day",
        date: row.date || "",
        men: row.men,
        vans: row.vans,
        hours: 4,
        nightsOut: false,
        overtimeHours: 0,
        operatingBranch: row.operatingBranch || "",
        legs: amLegs
    };

    const pmRow = {
        id: createId(),
        groupId: row.groupId,
        dayPart: "PM",
        task: "Deliver",
        completionWindow: "Completion Day",
        date: row.date || "",
        men: row.men,
        vans: row.vans,
        hours: 4,
        nightsOut: false,
        overtimeHours: 0,
        operatingBranch: row.operatingBranch || "",
        legs: pmLegs
    };

    manualSchedule = manualSchedule.filter(function(day) {
        return day.id !== row.id;
    });

    manualSchedule.push(amRow, pmRow);
}

function updateScheduleDay(id, field, value) {
    manualSchedule = manualSchedule.map(function(day) {
        if (day.id !== id) return day;

        let updatedDay;

        if (field === "men" || field === "vans") {
            updatedDay = { ...day, [field]: Math.max(0, Number(value) || 0) };
        } else if (field === "nightsOut") {
            updatedDay = { ...day, nightsOut: !!value };
        } else if (field === "dayPart") {
            const nextHours = value === "Full Day" ? 8 : 4;
            updatedDay = { ...day, dayPart: value, hours: nextHours };
        } else {
            updatedDay = { ...day, [field]: value };
        }

        return updatedDay;
    });

    const row = manualSchedule.find(function(day) {
        return day.id === id;
    });

    if (row && field === "completionWindow") {
        const updatedRow = manualSchedule.find(function(day) {
            return day.id === id;
        });

        if (shouldAutoSplitCompletionRow(updatedRow)) {
            splitCompletionRowIntoAmPm(updatedRow);
        }
    }

    if (row && field === "dayPart") {
        if (value === "AM") {
            const updated = manualSchedule.find(function(day) {
                return day.id === id;
            });
            const existingTaskMode = getPlannerTaskMode(updated);

            updated.hours = 4;
            updated.task = existingTaskMode === "pack"
                ? updated.task
                : "Commence loading";
            updated.legs = updated.legs || [];
            ensurePmPair(updated);
        }

        if (value === "PM") {
            const updated = manualSchedule.find(function(day) {
                return day.id === id;
            });
            updated.hours = 4;
            updated.task = "Deliver";
            updated.legs = updated.legs || [];

            const hasAm = manualSchedule.some(function(day) {
                return day.groupId === updated.groupId && day.dayPart === "AM";
            });

            if (!hasAm) {
                manualSchedule.push({
                    id: createId(),
                    groupId: updated.groupId,
                    dayPart: "AM",
                    task: "Commence loading",
                    completionWindow: "None",
                    date: updated.date || "",
                    men: updated.men,
                    vans: updated.vans,
                    hours: 4,
                    nightsOut: false,
                    overtimeHours: 0,
                    operatingBranch: updated.operatingBranch || "",
                    legs: [
                        createEmptyScheduleLeg("Depot", "Collection Address", 0),
                        createEmptyScheduleLeg("Collection Address", "Delivery Address", 0)
                    ]
                });
            }
        }

        if (value === "Full Day") {
            manualSchedule = manualSchedule.filter(function(day) {
                return day.groupId !== row.groupId || day.id === row.id;
            });

            manualSchedule = manualSchedule.map(function(day) {
                if (day.id !== row.id) return day;

                const existingTask = String(day.task || "").trim();
                const existingTaskMode = getPlannerTaskMode(day);

                const fullDayTask = existingTaskMode === "pack"
                    ? existingTask || "Pack"
                    : "Load and Deliver";

                return {
                    ...day,
                    dayPart: "Full Day",
                    hours: 8,
                    task: fullDayTask,
                    legs: Array.isArray(day.legs) && day.legs.length
                        ? day.legs
                        : [
                            createEmptyScheduleLeg("Depot", "Collection Address", 0),
                            createEmptyScheduleLeg("Collection Address", "Delivery Address", 0),
                            createEmptyScheduleLeg("Delivery Address", "Depot", 0)
                        ]
                };
            });
        }

        normalizeGroup(row.groupId);
    }

    commitManualScheduleEdit();
}

function minutesToClock(totalMinutes) {
    const mins = Math.max(0, Math.round(Number(totalMinutes || 0)));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

function getRowWindowBounds(dayPart, overtimeHours = 0) {
    const extraMinutes = Math.max(0, Number(overtimeHours || 0)) * 60;

    if (dayPart === "AM") {
        return { start: (8 * 60) - extraMinutes, end: 13 * 60 };
    }

    if (dayPart === "PM") {
        return { start: 13 * 60, end: (17 * 60 + 30) + extraMinutes };
    }

    return { start: 8 * 60, end: (17 * 60 + 30) + extraMinutes };
}

function getScheduleLocationLabel(value) {
    const raw = String(value || "").trim();

    if (!raw) return "—";
    if (raw === "Depot") return "Depot";

    // current row legs usually store property ids
    if (currentJob && Array.isArray(currentJob.properties)) {
        const prop = currentJob.properties.find(function(p) {
            return String(p.id) === raw;
        });

        if (prop) {
            const text = getPropertyDisplayText(prop.id);
            const label = String(prop.label || "").toLowerCase();

            if (label.includes("collection")) return "Collection";
            if (label.includes("delivery")) return "Delivery";
            if (label.includes("store")) return "Store";

            return text || raw;
        }
    }

    // fallback for older saved text values
    if (raw.toLowerCase().includes("collection")) return "Collection";
    if (raw.toLowerCase().includes("delivery")) return "Delivery";
    if (raw.toLowerCase().includes("store")) return "Store";

    return raw;
}

function getPlannerTaskBlocks(day, state, totals) {
    const mode = getPlannerTaskMode(day);
    const totalTaskHours = getNetTaskHoursForPlannerRow(day, state);
    let totalTaskMinutes = Math.max(0, Math.round(totalTaskHours * 60));

    if (totalTaskMinutes <= 0) return [];

    if (mode === "pack") {
        return [{ label: "Task: Pack", minutes: totalTaskMinutes }];
    }

    if (mode === "load") {
        return [{ label: "Task: Load", minutes: totalTaskMinutes }];
    }

    if (mode === "unload") {
        return [{ label: "Task: Unload", minutes: totalTaskMinutes }];
    }

    if (mode === "travel") {
        return [];
    }

    if (mode === "pack_load") {
        const packWeight = Math.max(0, Number(totals.packingHours || 0));
        const loadWeight = Math.max(0, Number(totals.loadingHours || 0));
        const weightTotal = packWeight + loadWeight || 1;

        const packMinutes = Math.round(totalTaskMinutes * (packWeight / weightTotal));
        const loadMinutes = totalTaskMinutes - packMinutes;

        const blocks = [];
        if (packMinutes > 0) blocks.push({ label: "Task: Pack", minutes: packMinutes });
        if (loadMinutes > 0) blocks.push({ label: "Task: Load", minutes: loadMinutes });
        return blocks;
    }

    if (mode === "load_unload") {
        const loadWeight = Math.max(0, Number(totals.loadingHours || 0));
        const unloadWeight = Math.max(0, Number(totals.unloadingHours || 0));
        const weightTotal = loadWeight + unloadWeight || 1;

        const loadMinutes = Math.round(totalTaskMinutes * (loadWeight / weightTotal));
        const unloadMinutes = totalTaskMinutes - loadMinutes;

        const blocks = [];
        if (loadMinutes > 0) blocks.push({ label: "Task: Load", minutes: loadMinutes });
        if (unloadMinutes > 0) blocks.push({ label: "Task: Unload", minutes: unloadMinutes });
        return blocks;
    }

    return [{ label: "Task", minutes: totalTaskMinutes }];
}

function buildScheduleRowCompactTimeSummary(day, state, totals) {
    ensureScheduleRowShape(day);

    const bounds = getRowWindowBounds(day.dayPart, day.overtimeHours || 0);
    const windowStart = bounds.start;
    const windowEnd = bounds.end;
    const completionCutoff = 13 * 60;
    const isCompletionDay = String(day.completionWindow || "None") === "Completion Day";

    const legs = Array.isArray(day.legs) ? day.legs : [];
    const taskBlocks = getPlannerTaskBlocks(day, state, totals);

    let cursor = windowStart;
    const parts = [];

    function addTravelLeg(leg) {
        if (!leg) return;

        const legStart = cursor;
        const legEnd = cursor + Math.max(0, Number(leg.minutes || 0));

        parts.push(
            minutesToClock(legStart) + "–" +
            minutesToClock(legEnd) +
            " Travel: " +
            getScheduleLocationLabel(leg.from) +
            " → " +
            getScheduleLocationLabel(leg.to) + "."
        );

        cursor = legEnd;
    }

    function addTaskBlock(taskBlock) {
        if (!taskBlock || taskBlock.minutes <= 0) return;

        const isUnloadBlock = String(taskBlock.label || "").toLowerCase().includes("unload");

        if (isCompletionDay && isUnloadBlock && cursor < completionCutoff) {
            parts.push(
                minutesToClock(cursor) + "–" +
                minutesToClock(completionCutoff) +
                " Wait: completion window starts at 13:00."
            );

            cursor = completionCutoff;
        }

        const taskStart = cursor;
        const taskEnd = cursor + Math.max(0, Number(taskBlock.minutes || 0));

        parts.push(
            minutesToClock(taskStart) + "–" +
            minutesToClock(taskEnd) +
            " Work: " +
            String(taskBlock.label || "").replace("Task: ", "") + "."
        );

        cursor = taskEnd;
    }

    parts.push(
        "Travel applied: " + getRowLegHours(day).toFixed(2) + " hrs."
    );

    parts.push(
        "Net task time: " + getNetTaskHoursForPlannerRow(day, state).toFixed(2) + " hrs."
    );

    parts.push(
        "Net man-hours: " +
        (Number(day.men || 0) * getNetTaskHoursForPlannerRow(day, state)).toFixed(2) +
        "."
    );

    parts.push(
        "Window " + minutesToClock(windowStart) + "–" + minutesToClock(windowEnd) + "."
    );

    const firstLeg = legs[0] || null;
    const firstLegFrom = firstLeg ? String(getScheduleLocationLabel(firstLeg.from) || "").toLowerCase() : "";
    const firstLegTo = firstLeg ? String(getScheduleLocationLabel(firstLeg.to) || "").toLowerCase() : "";
    const firstTaskLabel = taskBlocks[0] ? String(taskBlocks[0].label || "").toLowerCase() : "";

    const looksLikeReturnToDepot =
        firstLeg &&
        firstLegFrom.includes("delivery") &&
        firstLegTo.includes("depot");

    const looksLikeDeliveryWork =
        firstTaskLabel.includes("unload") ||
        firstTaskLabel.includes("deliver");

    if (looksLikeReturnToDepot && looksLikeDeliveryWork) {
        taskBlocks.forEach(function(taskBlock) {
            addTaskBlock(taskBlock);
        });

        legs.forEach(function(leg) {
            addTravelLeg(leg);
        });
    } else {
        const maxSteps = Math.max(legs.length, taskBlocks.length);

        for (let i = 0; i < maxSteps; i++) {
            addTravelLeg(legs[i]);
            addTaskBlock(taskBlocks[i]);
        }
    }

    parts.push("Finish " + minutesToClock(cursor) + ".");

    const overrun = cursor - windowEnd;

    if (overrun > 0) {
        parts.push("Overruns by " + overrun + " mins.");
    } else {
        parts.push("Fits within row window.");
    }

    return `
        <div class="schedule-time-breakdown">
            <div class="schedule-time-line ${overrun > 0 ? "status-bad" : "status-ok"}">
                ${escapeHtml(parts.join(" "))}
            </div>
        </div>
    `;
}
function addOneHourOvertimeToScheduleDay(dayId) {
    manualSchedule = manualSchedule.map(function(day) {
        if (String(day.id) !== String(dayId)) return day;

        return {
            ...day,
            overtimeHours: Math.max(0, Number(day.overtimeHours || 0)) + 1
        };
    });

    commitManualScheduleEdit();
}

function clearOvertimeFromScheduleDay(dayId) {
    manualSchedule = manualSchedule.map(function(day) {
        if (String(day.id) !== String(dayId)) return day;

        return {
            ...day,
            overtimeHours: 0
        };
    });

    commitManualScheduleEdit();
}
function renderSchedulePlanner(){
    const list = document.getElementById("scheduleList");
    if (!list) return;
    renderScheduleToolbarOperatingBranch();
    renderScheduleToolbarLoadingVariant();

    const state = getState();
    const packing = calcPacking(state);
    const boxVolume = round2(calcBoxVolume(state));
    const totalVolume = round2(state.furnitureVol + boxVolume);
    const special = calcSpecialLabour(state);
    const loading = calcLoading(totalVolume, state.loadRate, special.loadSideHours, state.loadingScenario, state.loadingProfile);
    const unloading = calcUnloading(totalVolume, state.unloadRate, special.unloadSideHours, state.loadingScenario);

    const plannerTotals = {
        packingHours: packing.packHours,
        loadingHours: loading.hours,
        unloadingHours: unloading.hours
    };
   
    const groups = [];
    const seen = new Set();
    manualSchedule.forEach(day => {
        if (!seen.has(day.groupId)){
            seen.add(day.groupId);
            groups.push(day.groupId);
        }
    });

        list.innerHTML = groups.map((groupId, groupIndex) => {
        const rows = manualSchedule.filter(day => day.groupId === groupId).sort((a,b) => {
            const order = { "Full Day": 0, "AM": 1, "PM": 2 };
            return order[a.dayPart] - order[b.dayPart];
        });

                return rows.map((day, rowIndex) => {
            const isSplitDayRow = rows.length > 1 || String(day.dayPart || "") === "AM" || String(day.dayPart || "") === "PM";
            const rowAccentClass = isSplitDayRow ? " schedule-row-accent" : "";

            return `
            <div class="schedule-row${rowAccentClass}">
                <div class="schedule-row-head">
                    <div class="schedule-row-title-pill">
    <span>Day ${groupIndex + 1}</span>
    ${rows.length > 1 ? `<span class="schedule-row-part-pill">${day.dayPart}</span>` : ""}
</div>

                    <div class="schedule-row-actions">
                        <button
    type="button"
    class="schedule-overtime-btn"
    onclick="addOneHourOvertimeToScheduleDay('${day.id}')"
>
    Overtime + 1HR${Number(day.overtimeHours || 0) > 0 ? ' · ' + Number(day.overtimeHours || 0) + ' HR' : ''}
</button>

                        ${
                            Number(day.overtimeHours || 0) > 0
                                ? `<button
                                    type="button"
                                    class="schedule-overtime-clear-btn"
                                    onclick="clearOvertimeFromScheduleDay('${day.id}')"
                                >
                                    Clear OT
                                </button>`
                                : ""
                        }

                        ${rowIndex === 0 && manualSchedule.length > 1 ? `<button class="schedule-remove" onclick="removeScheduleDay('${day.id}')">Delete Day</button>` : ""}
                    </div>
                </div>

                <div class="schedule-grid">
                    <div>
                        <label class="mini-label">Task</label>
                        <select class="field" onchange="updateScheduleDay('${day.id}','task',this.value)">
                            ${taskOptionHtml(day.task)}
                        </select>
                    </div>

                    <div>
                        <label class="mini-label">Day Part</label>
                        <select class="field" onchange="updateScheduleDay('${day.id}','dayPart',this.value)">
                            ${optionHtml(DAY_PARTS, day.dayPart)}
                        </select>
                    </div>

                    <div>
                        <label class="mini-label">Completion Day</label>
                        <select class="field" onchange="updateScheduleDay('${day.id}','completionWindow',this.value)">
                            ${optionHtml(COMPLETION_WINDOWS, day.completionWindow || "None")}
                        </select>
                    </div>

                    <div>
                        <label class="mini-label">Vans</label>
                        <button
                            type="button"
                            class="schedule-value-btn"
                            onclick="openScheduleNumberModal('${day.id}','vans',${Number(day.vans || 0)})"
                        >
                            ${Number(day.vans || 0)}
                        </button>
                    </div>

                    <div>
                        <label class="mini-label">Men</label>
                        <button
                            type="button"
                            class="schedule-value-btn"
                            onclick="openScheduleNumberModal('${day.id}','men',${Number(day.men || 0)})"
                        >
                            ${Number(day.men || 0)}
                        </button>
                    </div>

                    <div>
                        <label class="mini-label">Night Out</label>
                        <div class="schedule-toggle-wrap">
                            <label class="schedule-toggle-switch">
                                <input
                                    type="checkbox"
                                    ${day.nightsOut ? 'checked' : ''}
                                    onchange="updateScheduleDay('${day.id}','nightsOut', this.checked)"
                                />
                                <span class="schedule-toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    
                    <div>
    <label class="mini-label">Date</label>
    <input
        type="date"
        class="field"
        value="${escapeHtml(day.date || "")}"
        onchange="updateScheduleDay('${day.id}','date',this.value)"
    >
</div>
                </div>

                                ${renderScheduleLegs(day, state, plannerTotals)}

            
            </div>
                `;
        }).join("");
    }).join("");
}

function buildPlannerCoverageMeta(kind, rowCapacityHours, remainingBeforeHours, rate) {
    const cleanKind = String(kind || "").trim();
    const cleanRowHours = Math.max(0, Number(rowCapacityHours || 0));
    const cleanRemainingBefore = Math.max(0, Number(remainingBeforeHours || 0));
    const cleanRate = Math.max(0, Number(rate || 0));

    const capacityCuft = cleanRate > 0
        ? Math.round(cleanRowHours * cleanRate)
        : 0;

    const coveredHours = Math.min(cleanRowHours, cleanRemainingBefore);

    const coveredCuft = cleanRate > 0
        ? Math.round(coveredHours * cleanRate)
        : 0;

    const remainingAfterHours = Math.max(0, cleanRemainingBefore - cleanRowHours);

    const remainingAfterCuft = cleanRate > 0
        ? Math.round(remainingAfterHours * cleanRate)
        : 0;

    return {
        kind: cleanKind,
        capacityCuft: capacityCuft,
        coveredCuft: coveredCuft,
        remainingAfterCuft: remainingAfterCuft
    };
}
function buildPlannerNoteTimelineLines(day, taskMode, taskHours, state) {
    ensureScheduleRowShape(day);

    const bounds = getRowWindowBounds(day.dayPart, day.overtimeHours || 0);
    const windowStart = bounds.start;
    const completionCutoff = 13 * 60;
    const isCompletionDay = String(day.completionWindow || "None") === "Completion Day";

    const legs = Array.isArray(day.legs) ? day.legs : [];
    const taskMinutes = Math.max(0, Math.round(Number(taskHours || 0) * 60));
    const cleanMode = String(taskMode || "").trim();

    const lines = [];
    let cursor = windowStart;

    function getWorkLabel() {
        if (cleanMode === "pack") return "Pack";
        if (cleanMode === "load") return "Load";
        if (cleanMode === "unload") return "Unload";
        if (cleanMode === "pack_load") return "Pack / Load";
        if (cleanMode === "load_unload") return "Load / Unload";
        return "Work";
    }

    function addWork() {
        if (taskMinutes <= 0) return;

        const isUnloadWork = cleanMode === "unload" || cleanMode === "load_unload";

        if (isCompletionDay && isUnloadWork && cursor < completionCutoff) {
            lines.push(
                minutesToClock(cursor) + "–" +
                minutesToClock(completionCutoff) +
                " Wait: completion window starts at 13:00"
            );

            cursor = completionCutoff;
        }

        const taskStart = cursor;
        const taskEnd = cursor + taskMinutes;

        lines.push(
            minutesToClock(taskStart) + "–" +
            minutesToClock(taskEnd) +
            " Work: " +
            getWorkLabel()
        );

        cursor = taskEnd;
    }

    function addTravel(leg) {
        if (!leg) return;

        const legStart = cursor;
        const legEnd = cursor + Math.max(0, Number(leg.minutes || 0));

        lines.push(
            minutesToClock(legStart) + "–" +
            minutesToClock(legEnd) +
            " Travel: " +
            getScheduleLocationLabel(leg.from) +
            " → " +
            getScheduleLocationLabel(leg.to)
        );

        cursor = legEnd;
    }

    const firstLeg = legs[0] || null;
    const firstLegFrom = firstLeg ? String(getScheduleLocationLabel(firstLeg.from) || "").toLowerCase() : "";
    const firstLegTo = firstLeg ? String(getScheduleLocationLabel(firstLeg.to) || "").toLowerCase() : "";

    const looksLikeReturnToDepot =
        firstLeg &&
        firstLegFrom.includes("delivery") &&
        firstLegTo.includes("depot");

    if (cleanMode === "unload" || looksLikeReturnToDepot) {
        addWork();

        legs.forEach(function(leg) {
            addTravel(leg);
        });
    } else {
        if (legs[0]) addTravel(legs[0]);
        addWork();

        for (let i = 1; i < legs.length; i++) {
            addTravel(legs[i]);
        }
    }

    lines.push("Finish: " + minutesToClock(cursor));

    return lines;
}
function buildLoadDebugLine(day, taskMode, men, taskHours, equivalentLoadHours, state, plannerDayLabel, coverageMeta) {
    const loadingProfile = state && state.loadingProfile ? state.loadingProfile : {};

    const cleanTaskMode = String(taskMode || "").trim();
    const loadingRate = Number(loadingProfile.morningEquivalentRate || state.loadRate || 0);
    const unloadingRate = Number(state && state.unloadRate ? state.unloadRate : 0);

    const isUnloadMode = cleanTaskMode === "unload";
    const isLoadMode =
        cleanTaskMode === "load" ||
        cleanTaskMode === "pack_load" ||
        cleanTaskMode === "load_unload";

    const capacityRate = isUnloadMode ? unloadingRate : loadingRate;

    const capacityCuft = capacityRate > 0 && Number(equivalentLoadHours || 0) > 0
        ? Math.round(Number(equivalentLoadHours || 0) * capacityRate)
        : 0;

    const dayPart = String(day.dayPart || "").trim();
    const taskLabel = String(day.task || taskMode || "Schedule row").trim();
    const completionWindow = String(day.completionWindow || "").trim();

    const travelHours = typeof getRowLegHours === "function"
        ? getRowLegHours(day)
        : 0;

    const travelText = travelHours > 0
        ? formatHoursAndMinutes(travelHours)
        : "No travel time added";

    const titleParts = [];

    if (plannerDayLabel) {
        titleParts.push(plannerDayLabel);
    }

    if (dayPart) {
        titleParts.push(dayPart);
    }

    titleParts.push(taskLabel);

    const title = titleParts.join(" — ");

    const crewText = Number(men || 0) === 1
        ? "1 crew member"
        : Number(men || 0) + " crew members";

    const vehicleCount = Number(day.vans || day.vehicles || 0);
    const vehicleText = vehicleCount === 1
        ? "1 vehicle planned"
        : vehicleCount > 1
            ? vehicleCount + " vehicles planned"
            : "";

    let capacityLabel = "";
    let coverageCheck = "";

    if (coverageMeta && coverageMeta.kind === "loading") {
        if (coverageMeta.remainingAfterCuft > 0) {
            capacityLabel =
                "This row can cover around " +
                coverageMeta.capacityCuft.toLocaleString("en-GB") +
                " cuft of loading";

            coverageCheck =
                coverageMeta.remainingAfterCuft.toLocaleString("en-GB") +
                " cuft may still need loading on another row";
        } else if (coverageMeta.coveredCuft > 0) {
            capacityLabel =
                "This row covers the remaining loading volume";

            coverageCheck = "No remaining loading volume is expected after this row";
        }
    }

    if (coverageMeta && coverageMeta.kind === "unloading") {
        if (coverageMeta.remainingAfterCuft > 0) {
            capacityLabel =
                "This row can cover around " +
                coverageMeta.capacityCuft.toLocaleString("en-GB") +
                " cuft of delivery";

            coverageCheck =
                coverageMeta.remainingAfterCuft.toLocaleString("en-GB") +
                " cuft may still need delivering on another row";
        } else if (coverageMeta.coveredCuft > 0) {
            capacityLabel =
                "This row covers the remaining delivery volume";

            coverageCheck = "No remaining delivery volume is expected after this row";
        }
    }

    if (!capacityLabel && capacityCuft > 0) {
        if (isUnloadMode) {
            capacityLabel =
                "Delivery allowance has been calculated from the available working time";
        } else if (isLoadMode) {
            capacityLabel =
                "Loading allowance has been calculated from the available working time";
        }
    }

    function getFriendlyTaskModeLabel(mode) {
        const cleanMode = String(mode || "").trim();

        if (cleanMode === "pack") return "Packing";
        if (cleanMode === "load") return "Loading";
        if (cleanMode === "unload") return "Delivery / unloading";
        if (cleanMode === "pack_load") return "Packing and loading";
        if (cleanMode === "load_unload") return "Loading and delivery";
        if (cleanMode === "travel") return "Travel";
        return "Schedule row";
    }

    const allowed = [
        "Crew planned: " + crewText,
        vehicleText,
        "Travel allowance: " + travelText,
        "Working time available: " + formatHoursAndMinutes(taskHours),
        capacityLabel
    ].filter(Boolean);

    const basedOn = [
        "Task type: " + getFriendlyTaskModeLabel(taskMode),
        completionWindow && completionWindow.toLowerCase() !== "none"
            ? "Completion rule: " + completionWindow
            : "",
        "Planner setting: " + String(state.loadingVariant || "Standard")
    ].filter(Boolean);

    const checks = [
        coverageCheck || "Check the schedule warning cards above before confirming"
    ];

    return {
    title: title,
    timeline: buildPlannerNoteTimelineLines(day, taskMode, taskHours, state),
    allowed: allowed,
    basedOn: basedOn,
    checks: checks
};
}
function calcScheduleValidation(packing, loading, unloading, special, state){
    const loadingProfile = getLoadingProfile(state.loadingVariant, state.loadingScenario);
const seq = getActiveSequenceRecord();
const moveMode = getAutoBuildMoveMode(seq ? seq.moveType : "");

/*
    Planner validation:
    Special labour is deducted from the available loading/unloading allocation,
    rather than being treated as extra volume work.
*/
const collectionSpecialHours = Number(
    special.collectionSideHours !== undefined
        ? special.collectionSideHours
        : special.loadSideHours || 0
);

const deliverySpecialHours = Number(
    special.deliverySideHours !== undefined
        ? special.deliverySideHours
        : special.unloadSideHours || 0
);

const required = {
    Pack: packing.packHours,
    Load: moveMode === "exStore" ? 0 : Number(loading.volumeHours || 0),
    Unload: moveMode === "intoStore" ? 0 : Number(unloading.volumeHours || 0)
};

    const allocated = {
    Pack: 0,
    Load: 0,
    Unload: 0
};

let remainingCollectionSpecialHours = collectionSpecialHours;
let remainingDeliverySpecialHours = deliverySpecialHours;

function deductSpecialFromRow(rowHours, side) {
    const hours = Number(rowHours || 0);

    if (hours <= 0) return 0;

    if (side === "collection") {
        const deduction = Math.min(hours, remainingCollectionSpecialHours);
        remainingCollectionSpecialHours = Math.max(0, remainingCollectionSpecialHours - deduction);
        return Math.max(0, hours - deduction);
    }

    if (side === "delivery") {
        const deduction = Math.min(hours, remainingDeliverySpecialHours);
        remainingDeliverySpecialHours = Math.max(0, remainingDeliverySpecialHours - deduction);
        return Math.max(0, hours - deduction);
    }

    return hours;
}

const loadDebugLines = [];
const plannerLoadingRate = Number(
    loadingProfile.morningEquivalentRate || state.loadRate || 0
);

const plannerUnloadingRate = Number(
    state.unloadRate || loadingProfile.unloadRate || 0
);

    const groups = {};

    manualSchedule.forEach(day => {
        if (!groups[day.groupId]) groups[day.groupId] = [];
        groups[day.groupId].push(day);
    });

    Object.values(groups).forEach(function(rows, groupIndex) {
    const plannerDayLabel = "Day " + (groupIndex + 1);
        rows.forEach(day => {
            const taskMode = getPlannerTaskMode(day);
            const taskHours = getNetTaskHoursForPlannerRow(day, state);
            const men = Number(day.men) || 0;

            if (taskMode === "pack") {
    allocated.Pack += men * taskHours;

    loadDebugLines.push(
        buildLoadDebugLine(day, taskMode, men, taskHours, 0, state, plannerDayLabel)
    );

    return;
}

            if (taskMode === "load") {
    const equivalentLoadHours = getPlannerLoadEquivalentHours(day, taskHours, state);
    const rawRowLoadAllocation = men * equivalentLoadHours;
    const rowLoadAllocation = deductSpecialFromRow(rawRowLoadAllocation, "collection");

    const loadRemainingBefore = Math.max(0, required.Load - allocated.Load);

allocated.Load += rowLoadAllocation;

loadDebugLines.push(
    buildLoadDebugLine(
        day,
        taskMode,
        men,
        taskHours,
        rowLoadAllocation,
        state,
        plannerDayLabel,
        buildPlannerCoverageMeta(
            "loading",
            rowLoadAllocation,
            loadRemainingBefore,
            plannerLoadingRate
        )
    )
);

return;
}

            if (taskMode === "unload") {
    const equivalentUnloadHours = getPlannerUnloadEquivalentHours(day, taskHours, state);
    const rawRowUnloadAllocation = men * equivalentUnloadHours;
    const rowUnloadAllocation = deductSpecialFromRow(rawRowUnloadAllocation, "delivery");

    const unloadRemainingBefore = Math.max(0, required.Unload - allocated.Unload);

allocated.Unload += rowUnloadAllocation;

loadDebugLines.push(
    buildLoadDebugLine(
        day,
        taskMode,
        men,
        taskHours,
        rowUnloadAllocation,
        state,
        plannerDayLabel,
        buildPlannerCoverageMeta(
            "unloading",
            rowUnloadAllocation,
            unloadRemainingBefore,
            plannerUnloadingRate
        )
    )
);

return;
}

            if (taskMode === "pack_load") {
    const rowManHours = men * taskHours;

    const packShortfall = Math.max(0, required.Pack - allocated.Pack);
    const toPack = Math.min(rowManHours, packShortfall);

    const remainingRawManHours = Math.max(0, rowManHours - toPack);

    const equivalentLoadHoursForWholeRow =
        men * getPlannerLoadEquivalentHours(day, taskHours, state);

    const loadEquivalentRatio = rowManHours > 0
        ? equivalentLoadHoursForWholeRow / rowManHours
        : 1;

    const rawRowLoadAllocation = remainingRawManHours * loadEquivalentRatio;
const rowLoadAllocation = deductSpecialFromRow(rawRowLoadAllocation, "collection");

const packLoadRemainingBefore = Math.max(0, required.Load - allocated.Load);

allocated.Pack += toPack;
allocated.Load += rowLoadAllocation;

loadDebugLines.push(
    buildLoadDebugLine(
        day,
        taskMode,
        men,
        taskHours,
        rowLoadAllocation,
        state,
        plannerDayLabel,
        buildPlannerCoverageMeta(
            "loading",
            rowLoadAllocation,
            packLoadRemainingBefore,
            plannerLoadingRate
        )
    )
);

return;
}

            if (taskMode === "load_unload") {
    const totalRowManHours = men * taskHours;

    const maxLoadEquivalentHours =
        men * getPlannerLoadEquivalentHours(day, taskHours, state);

    const maxUnloadManHours =
        men * getCompletionAdjustedCapacity(day, "unload", taskHours, state);

    const loadShortfall = Math.max(0, required.Load - allocated.Load);
   const rawToLoad = Math.min(loadShortfall, maxLoadEquivalentHours);
const toLoad = deductSpecialFromRow(rawToLoad, "collection");

    const rawLoadHoursUsed = maxLoadEquivalentHours > 0
        ? Math.min(totalRowManHours, totalRowManHours * (toLoad / maxLoadEquivalentHours))
        : 0;

    const remainingAfterLoad = Math.max(0, totalRowManHours - rawLoadHoursUsed);
    const rawToUnload = Math.min(maxUnloadManHours, remainingAfterLoad);
const toUnload = deductSpecialFromRow(rawToUnload, "delivery");

    const loadUnloadLoadRemainingBefore = Math.max(0, required.Load - allocated.Load);
const loadUnloadUnloadRemainingBefore = Math.max(0, required.Unload - allocated.Unload);

allocated.Load += toLoad;
allocated.Unload += toUnload;

if (toLoad > 0) {
    loadDebugLines.push(
        buildLoadDebugLine(
            day,
            "load",
            men,
            taskHours,
            toLoad,
            state,
            plannerDayLabel,
            buildPlannerCoverageMeta(
                "loading",
                toLoad,
                loadUnloadLoadRemainingBefore,
                plannerLoadingRate
            )
        )
    );
}

if (toUnload > 0) {
    loadDebugLines.push(
        buildLoadDebugLine(
            day,
            "unload",
            men,
            taskHours,
            toUnload,
            state,
            plannerDayLabel,
            buildPlannerCoverageMeta(
                "unloading",
                toUnload,
                loadUnloadUnloadRemainingBefore,
                plannerUnloadingRate
            )
        )
    );
}

return;
}
        });
    });

const effectiveAllocated = {
    Pack: allocated.Pack,
    Load: allocated.Load,
    Unload: allocated.Unload
};

const loadingMorningRate = Number(
    loadingProfile.morningEquivalentRate || state.loadRate || 0
);

const loadingVolumeCapacity = loadingMorningRate > 0
    ? round2(effectiveAllocated.Load * loadingMorningRate)
    : 0;

const requiredLoadingVolume = loadingMorningRate > 0
    ? round2(required.Load * loadingMorningRate)
    : 0;

const unloadingRate = Number(state.unloadRate || 0);

const unloadingVolumeCapacity = unloadingRate > 0
    ? round2(effectiveAllocated.Unload * unloadingRate)
    : 0;

const requiredUnloadingVolume = unloadingRate > 0
    ? round2(required.Unload * unloadingRate)
    : 0;
    const passIcon = "✓";
const failIcon = "✕";

const taskLabels = {
    Pack: "Packing",
    Load: "Loading",
    Unload: "Unloading"
};

const results = Object.keys(required).map(task => {
    const req = required[task] || 0;
    const cap = effectiveAllocated[task] || 0;
    const diff = round2(cap - req);
    const label = taskLabels[task] || task;

    if (req === 0 && cap === 0) {
        return { type: "ok", text: `${passIcon} ${label}: Not required` };
    }

    if (cap + 0.01 < req) {
    return {
        type: "error",
        text: `${failIcon} ${label}: Short by ${formatHoursAndMinutes(Math.abs(diff))}`
    };
}

if (diff > 0.5) {
    return {
        type: "ok",
        text: `${passIcon} ${label}: Covered — ${formatHoursAndMinutes(diff)} spare`
    };
}

    return { type: "ok", text: `${passIcon} ${label}: Covered` };
});

       results.push({
    type: loadingVolumeCapacity + 0.01 >= requiredLoadingVolume ? "ok" : "error",
    text: "Loading Capacity: " +
        Math.round(loadingVolumeCapacity).toLocaleString("en-GB") +
        " / " +
        Math.round(requiredLoadingVolume).toLocaleString("en-GB") +
        " cuft"
});

results.push({
    type: unloadingVolumeCapacity + 0.01 >= requiredUnloadingVolume ? "ok" : "error",
    text: "Unloading Capacity: " +
        Math.round(unloadingVolumeCapacity).toLocaleString("en-GB") +
        " / " +
        Math.round(requiredUnloadingVolume).toLocaleString("en-GB") +
        " cuft"
});
if (collectionSpecialHours || deliverySpecialHours) {
    results.push({
        type: "warn",
        text:
            "Special labour deducted from capacity — Collection: " +
            formatHoursAndMinutes(collectionSpecialHours) +
            ", Delivery: " +
            formatHoursAndMinutes(deliverySpecialHours)
    });
}

if (loadDebugLines.length) {
    results.push({
        type: "note",
        text: "Planner Notes available",
        lines: loadDebugLines
    });
}

return results;
}

function togglePlannerNotesCard() {
    plannerNotesExpanded = !plannerNotesExpanded;

    if (typeof handleScheduleInputChange === "function") {
        handleScheduleInputChange();
    }
}

function buildPlannerNotesCardHtml(noteItems) {
    if (!Array.isArray(noteItems) || !noteItems.length) {
        return "";
    }

    const allNotes = [];

    noteItems.forEach(function(item) {
        if (Array.isArray(item.lines)) {
            item.lines.forEach(function(note) {
                if (note && typeof note === "object") {
                    allNotes.push(note);
                } else if (String(note || "").trim()) {
                    allNotes.push({
                        title: "Schedule Note",
                        allowed: [String(note).trim()],
                        basedOn: [],
                        checks: []
                    });
                }
            });
        }
    });

    const hasNotes = allNotes.length > 0;

    return `
        <div class="planner-notes-card ${plannerNotesExpanded ? "open" : ""}">
            <div class="planner-notes-head">
                <div>
                    <div class="planner-notes-title">Schedule Notes</div>
                    <div class="planner-notes-subtitle">
                        ${hasNotes ? "Helpful checks and assumptions for this schedule" : "No schedule notes available"}
                    </div>
                </div>

                <button
                    type="button"
                    class="planner-notes-toggle"
                    onclick="togglePlannerNotesCard()"
                >
                    ${plannerNotesExpanded ? "Hide" : "View"}
                </button>
            </div>

            ${
                plannerNotesExpanded
                    ? `
                        <div class="planner-notes-body">
                            ${
                                hasNotes
                                    ? allNotes.map(function(note) {
                                        return `
                                            <div class="planner-note-block">
                                                <div class="planner-note-title">${escapeHtml(note.title || "Schedule Note")}</div>
                                                ${
    Array.isArray(note.timeline) && note.timeline.length
        ? `
            <div class="planner-note-group">
                <div class="planner-note-group-title">Day Timeline</div>
                ${note.timeline.map(function(line) {
                    return `<div class="planner-note-line">• ${escapeHtml(line)}</div>`;
                }).join("")}
            </div>
        `
        : ""
}

                                                <div class="planner-note-group">
                                                    <div class="planner-note-group-title">Planner Assumption</div>
                                                    ${(note.allowed || []).map(function(line) {
                                                        return `<div class="planner-note-line">• ${escapeHtml(line)}</div>`;
                                                    }).join("")}
                                                </div>

                                                <div class="planner-note-group">
                                                    <div class="planner-note-group-title">Based On</div>
                                                    ${
                                                        (note.basedOn || []).length
                                                            ? (note.basedOn || []).map(function(line) {
                                                                return `<div class="planner-note-line">• ${escapeHtml(line)}</div>`;
                                                            }).join("")
                                                            : `<div class="planner-note-line">• Standard schedule settings</div>`
                                                    }
                                                </div>

                                                <div class="planner-note-group">
                                                    <div class="planner-note-group-title">Check Before Confirming</div>
                                                    ${
                                                        (note.checks || []).length
                                                            ? (note.checks || []).map(function(line) {
                                                                return `<div class="planner-note-line">• ${escapeHtml(line)}</div>`;
                                                            }).join("")
                                                            : `<div class="planner-note-line">• No extra checks raised</div>`
                                                    }
                                                </div>
                                            </div>
                                        `;
                                    }).join("")
                                    : `<div class="planner-notes-empty">No detailed schedule notes generated yet.</div>`
                            }
                        </div>
                    `
                    : ""
            }
        </div>
    `;
}
function renderValidation(packing, loading, unloading, special, state){
    const el = document.getElementById("validationList");
    if (!el) return;

    const items = calcScheduleValidation(packing, loading, unloading, special, state);
    const validationItems = items.filter(function(item) {
        return item.type !== "note";
    });

    const plannerNoteItems = items.filter(function(item) {
        return item.type === "note";
    });

    const validationHtml = validationItems.map(function(item) {
        return `<div class="validation-item validation-${item.type}">${item.text}</div>`;
    }).join("");

    const plannerNotesHtml = buildPlannerNotesCardHtml(plannerNoteItems);

    el.innerHTML = validationHtml + plannerNotesHtml;
}

function isWardrobeInventoryItem(itemName) {
    const name = String(itemName || "").trim().toUpperCase();

    return (
        name === "WARDROBE (2-DOOR)" ||
        name === "WARDROBE (3-DOOR)" ||
        name === "WARDROBE (4-DOOR)"
    );
}

function formatWardrobeTypes(entry) {
    if (!entry) return "";

    if (Array.isArray(entry.wardrobeTypes) && entry.wardrobeTypes.length) {
        return entry.wardrobeTypes.join(", ");
    }

    if (entry.wardrobeType) {
        return String(entry.wardrobeType);
    }

    return "Type not set";
}
function isBunkBedItem(itemName) {
    const clean = String(itemName || "").trim().toUpperCase();
    return clean === "BUNK BED";
}

function isCotBedItem(itemName) {
    const clean = String(itemName || "").trim().toUpperCase();

    return (
        clean === "COT / CHILDS BED" ||
        clean === "COT / CHILD'S BED" ||
        clean === "COT"
    );
}

function isScheduleBedGroupItem(itemName) {
    return (
        isBedInventoryItem(itemName) ||
        isBunkBedItem(itemName) ||
        isCotBedItem(itemName)
    );
}

function getActiveSequenceRawInventoryItems() {
    if (!currentJob || !activeSeqId) return [];

    return getRawInventoryItemsForSequence(activeSeqId).filter(function(entry) {
        return !entry.excluded;
    });
}

function buildScheduleSpecialRhsHtml(state, special) {
    const rawItems = getActiveSequenceRawInventoryItems();

    const bedRows = [];
const wardrobeRows = [];
const otherDismantleRows = [];
const serviceRows = [];
const specialRows = [];


rawItems.forEach(function(entry) {
        const qty = Number(entry.qty || 0);
        const itemName = String(entry.itemName || "").trim();
        const itemUpper = itemName.toUpperCase();

        if (!qty || !itemName) return;

       if (entry.dismantle && isScheduleBedGroupItem(itemName)) {
    const bedType = entry.bedType ? String(entry.bedType) : "";

    bedRows.push(
        qty + " x " + itemName + (bedType ? " — " + bedType : "")
    );
}

if (entry.dismantle && isWardrobeInventoryItem(itemName)) {
    wardrobeRows.push(
        qty + " x " + itemName + " — " + formatWardrobeTypes(entry)
    );
}

if (
    entry.dismantle &&
    !isScheduleBedGroupItem(itemName) &&
    !isWardrobeInventoryItem(itemName)
) {
    otherDismantleRows.push(
        qty + " x " + itemName
    );
}

        if (entry.expWrap) {
            serviceRows.push(qty + " x " + itemName + " — Export wrap");
        }

        if (entry.disconnect) {
            serviceRows.push(qty + " x " + itemName + " — Disconnect");
        }

        if (entry.handyman) {
            serviceRows.push(qty + " x " + itemName + " — Handyman");
        }

        if (entry.crated) {
            serviceRows.push(qty + " x " + itemName + " — Crating");
        }

        if (
            itemUpper === "PIANO (UPRIGHT)" ||
            itemUpper === "PIANO (ELECTRIC)" ||
            itemUpper === "PIANO (BABY GRAND)" ||
            itemUpper === "PIANO (GRAND)" ||
            itemUpper === "CLOCK (GRANDFATHER)"
        ) {
            specialRows.push(qty + " x " + itemName);
        }
    });

    const hasDismantle =
        bedRows.length ||
        wardrobeRows.length ||
        otherDismantleRows.length;

    const hasSpecial =
    specialRows.length ||
    state.special.diningTables;

    const hasServices =
        serviceRows.length ||
        state.exportWrapVol ||
        state.loftVol ||
        state.special.appliance ||
        state.special.crate;

   
    const renderList = function(items, emptyText) {
        if (!items.length) {
            return '<div class="special-rhs-empty">' + emptyText + '</div>';
        }

        return items.map(function(item) {
            return '<div class="special-rhs-line">• ' + escapeHtml(item) + '</div>';
        }).join("");
    };

    return `
        <div class="special-rhs-grid">
            <div class="special-rhs-card">
                <div class="special-rhs-title">Dismantle & Reassemble</div>
                <div class="special-rhs-subtitle">${formatHoursAndMinutes(special.breakdown.wardrobes)} wardrobe time included in this section</div>

                <div class="special-rhs-group-title">Beds</div>
                ${renderList(bedRows, "No bed items recorded")}

                <div class="special-rhs-group-title">Wardrobes</div>
                ${renderList(wardrobeRows, "No wardrobe types recorded")}

                <div class="special-rhs-group-title">Other dismantle items</div>
                ${renderList(otherDismantleRows, "No other dismantle items recorded")}
            </div>

            <div class="special-rhs-card">
                <div class="special-rhs-title">Special Items</div>
                <div class="special-rhs-subtitle">Items needing extra handling time</div>

                ${renderList(specialRows, "No piano / grandfather clock items recorded")}

                <div class="special-rhs-line">Dining tables: ${state.special.diningTables}</div>
            </div>

            <div class="special-rhs-card">
                <div class="special-rhs-title">Services</div>
                <div class="special-rhs-subtitle">Wrap, disconnect, crating and specialist help</div>

                ${renderList(serviceRows, "No item-level services recorded")}

                <div class="special-rhs-line">Export wrap volume: ${state.exportWrapVol} cuft</div>
                <div class="special-rhs-line">Loft effects volume: ${state.loftVol} cuft</div>
                <div class="special-rhs-line">Disconnect appliances: ${state.special.appliance}</div>
                <div class="special-rhs-line">Crating items: ${state.special.crate}</div>
            </div>

            <div class="special-rhs-card">
                <div class="special-rhs-title">Time Breakdown</div>
                <div class="special-rhs-subtitle">Split between collection-side and delivery-side labour</div>

               <div class="special-rhs-line special-rhs-line-accent">Collection-side labour: ${formatHoursAndMinutes(special.collectionSideHours || special.loadSideHours)}</div>
<div class="special-rhs-line special-rhs-line-accent special-rhs-line-accent-last">Delivery-side labour: ${formatHoursAndMinutes(special.deliverySideHours || special.unloadSideHours)}</div>

<div class="special-rhs-line">Beds: ${formatHoursAndMinutes(special.breakdown.frameBeds + special.breakdown.ottomanBeds + special.breakdown.divanBeds + special.breakdown.bunkBeds + special.breakdown.cots)}</div>
<div class="special-rhs-line">Wardrobes: ${formatHoursAndMinutes(special.breakdown.wardrobes)}</div>
<div class="special-rhs-line">Pianos: ${formatHoursAndMinutes(special.breakdown.upright + special.breakdown.grand)}</div>
<div class="special-rhs-line">Grandfather clocks: ${formatHoursAndMinutes(special.breakdown.clock)}</div>
<div class="special-rhs-line">Appliances: ${formatHoursAndMinutes(special.breakdown.appliance)}</div>
<div class="special-rhs-line">Crating: ${formatHoursAndMinutes(special.breakdown.crate)}</div>
<div class="special-rhs-line">Loft effects: ${formatHoursAndMinutes(special.breakdown.loft)}</div>
<div class="special-rhs-line">Export wrap: ${formatHoursAndMinutes(special.breakdown.exportWrap)}</div>
<div class="special-rhs-line">Custom: ${formatHoursAndMinutes(special.breakdown.custom)}</div>

<div class="special-rhs-total">
    Total special labour: ${formatHoursAndMinutes(special.specialHours)}
</div>
            </div>
        </div>
    `;
}
const FRINGE_LONG_CARRY_METRES = 30;

function addUniqueFringeReason(reasons, text) {
    if (!text) return;

    const alreadyExists = reasons.some(function(reason) {
        return String(reason) === String(text);
    });

    if (!alreadyExists) {
        reasons.push(text);
    }
}
function isGroundFloorAddress(prop) {
    const floor = String(prop && prop.floor ? prop.floor : "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    return (
        floor === "ground" ||
        floor === "ground floor" ||
        floor === "ground-floor" ||
        floor === "ground level" ||
        floor === "g" ||
        floor === "g/f" ||
        floor === "gf" ||
        floor === "0" ||
        floor === "0th"
    );
}

function getScheduleFringeReasonsFromAddresses() {
    const reasons = [];

    if (!currentJob || !Array.isArray(currentJob.properties)) {
        return reasons;
    }

    currentJob.properties.forEach(function(prop) {
        if (!prop) return;

        const label = toTitleCase(prop.label || "Address");
        const access = String(prop.access || "").toLowerCase();
        const propertyType = String(prop.type || "").toLowerCase();
        const distance = Number(prop.distance || 0);

        if (access.includes("shuttle")) {
            addUniqueFringeReason(reasons, label + ": shuttle van access");
        }

        if (access.includes("transit")) {
            addUniqueFringeReason(reasons, label + ": transit van access");
        }

        if (
            access.includes("low loader") ||
            access.includes("low-loader") ||
            access.includes("luton")
        ) {
            addUniqueFringeReason(reasons, label + ": low loader / luton access");
        }

        if (distance >= FRINGE_LONG_CARRY_METRES) {
            addUniqueFringeReason(
                reasons,
                label + ": long carry " + distance + "m"
            );
        }

       if (
    (
        propertyType.includes("apartment") ||
        propertyType.includes("flat")
    ) &&
    !isGroundFloorAddress(prop)
) {
    addUniqueFringeReason(reasons, label + ": apartment access");
}
    });

    return reasons;
}

function renderScheduleFringeWarning() {
    const warning = document.getElementById("schedule-fringe-warning");
    const planner = document.querySelector(".schedule-shell");

    if (!warning) return;

    const reasons = getScheduleFringeReasonsFromAddresses();

    if (!reasons.length) {
        warning.innerHTML = "";
        warning.classList.remove("show");

        if (planner) {
            planner.classList.remove("schedule-fringe-alert");
        }

        return;
    }

    warning.innerHTML = `
        <div class="schedule-fringe-card">
            <div class="schedule-fringe-title">
                Manual Review for Schedule and Costings Required — Fringe Case Detected
            </div>
            <div class="schedule-fringe-subtitle">
    Review triggered by:
</div>
            <div class="schedule-fringe-list">
                ${reasons.map(function(reason) {
                    return `<div class="schedule-fringe-reason">• ${escapeHtml(reason)}</div>`;
                }).join("")}
            </div>
        </div>
    `;

    warning.classList.add("show");

    if (planner) {
        planner.classList.add("schedule-fringe-alert");
    }
}
function renderQuoteFringeWarning() {
    const warning = document.getElementById("quote-fringe-warning");
    const quoteShell = document.querySelector(".quote-shell");

    if (!warning) return;

    const reasons = getScheduleFringeReasonsFromAddresses();

    if (!reasons.length) {
        warning.innerHTML = "";
        warning.classList.remove("show");

        if (quoteShell) {
            quoteShell.classList.remove("schedule-fringe-alert");
        }

        return;
    }

    warning.innerHTML = `
        <div class="schedule-fringe-card">
            <div class="schedule-fringe-title">
    Manual Review for Schedule and Costings Required — Fringe Case Detected
</div>
<div class="schedule-fringe-subtitle">
    Manual review required before sending quote.
</div>
<div class="schedule-fringe-subtitle">
    Review triggered by:
</div>
<div class="schedule-fringe-list">
                ${reasons.map(function(reason) {
                    return `<div class="schedule-fringe-reason">• ${escapeHtml(reason)}</div>`;
                }).join("")}
            </div>
        </div>
    `;

    warning.classList.add("show");

    if (quoteShell) {
        quoteShell.classList.add("schedule-fringe-alert");
    }
}
function renderScheduleCalculator(){
    const state = getState();

renderScheduleSequenceDropdown();

const scheduleAutoBuildUpdateCard = document.getElementById("schedule-auto-build-update-card");
if (scheduleAutoBuildUpdateCard) {
    scheduleAutoBuildUpdateCard.innerHTML = getScheduleAutoBuildUpdateCardHtml();
}

    const packing = calcPacking(state);
    const loadingProfile = getLoadingProfile(state.loadingVariant, state.loadingScenario);
    const boxVolume = round2(calcBoxVolume(state));
    const totalVolume = round2(state.furnitureVol + boxVolume);

    const furnitureDisplay = document.getElementById("furnitureVolDisplay");
if (furnitureDisplay) furnitureDisplay.textContent = state.furnitureVol;

const scheduleVolumeBadge = document.getElementById("scheduleVolumeBadge");
if (scheduleVolumeBadge) {
    scheduleVolumeBadge.textContent = "Volume: " + totalVolume + " cuft";
}

    const apDisplay = document.getElementById("qty_ap_display");
    if (apDisplay) apDisplay.textContent = state.qty.ap;

    const cgDisplay = document.getElementById("qty_cg_display");
    if (cgDisplay) cgDisplay.textContent = state.qty.cg;

    const booksDisplay = document.getElementById("qty_books_display");
    if (booksDisplay) booksDisplay.textContent = state.qty.books;

    const linenDisplay = document.getElementById("qty_linen_display");
    if (linenDisplay) linenDisplay.textContent = state.qty.linen;

    const wrDisplay = document.getElementById("qty_wr_display");
    if (wrDisplay) wrDisplay.textContent = state.qty.wr;

    const exportWrapVolEl = document.getElementById("exportWrapVol");
setInventoryFedField(exportWrapVolEl, state.exportWrapVol);

    const special = calcSpecialLabour(state);
    const loading = calcLoading(totalVolume, state.loadRate, special.loadSideHours, state.loadingScenario, state.loadingProfile);
    const unloading = calcUnloading(totalVolume, state.unloadRate, special.unloadSideHours, state.loadingScenario);
    const summaryModeEl = document.getElementById("summaryMode");
if (summaryModeEl) {
    summaryModeEl.textContent = getPackModeLabel(state.packOption);
}
    document.getElementById("summaryTotalVolume").textContent = totalVolume;
document.getElementById("summaryPackHours").textContent = formatHoursAndMinutes(packing.packHours);
document.getElementById("summaryPackDays").textContent = packing.packDays.toFixed(1);
document.getElementById("summarySpecialHours").textContent = formatHoursAndMinutes(special.specialHours);
document.getElementById("summaryLoadHours").textContent = formatHoursAndMinutes(loading.hours);
document.getElementById("summaryLoadDays").textContent = loading.days.toFixed(1);
document.getElementById("summaryLoadCompletion").textContent = loading.completionCrew.toFixed(1);
    document.getElementById("summaryLoadRate").textContent =
    state.loadingProfile && state.loadingProfile.pmAfterAmEquivalentRate !== state.loadingProfile.morningEquivalentRate
        ? state.loadingProfile.morningEquivalentRate + " / " + state.loadingProfile.pmAfterAmEquivalentRate
        : state.loadRate;

    document.getElementById("summaryUnloadHours").textContent = formatHoursAndMinutes(unloading.hours);
document.getElementById("summaryUnloadDays").textContent = unloading.days.toFixed(1);
document.getElementById("summaryUnloadCompletion").textContent = unloading.completionCrew.toFixed(1);
    document.getElementById("summaryUnloadRate").textContent = state.unloadRate;

    const packingRule = state.packOption === "none"
        ? "No packing selected, so packing labour is held at zero."
        : state.packOption === "cg"
            ? "CG packing selected, so only CG cartons contribute to packing labour."
            : "Full packing selected, so all carton types contribute to packing labour.";

        document.getElementById("logicText").textContent =
        `${packingRule} Loading profile is ${loadingProfile.label}. ` +
        `Total volume is furniture volume plus calculated box volume. ` +
        `Loft effects volume is used for extra loft labour only and does not change total move volume. ` +
        `${state.loadingScenario === "exStore"
            ? "This move type is treated as delivery only, so loading hours are not applied. Ex-store unloading uses the main unload rate in AM and the reduced PM unload rate where applicable. "
            : state.loadingScenario === "intoStore"
                ? "This move type is treated as loading into store only, using the selected loading profile. "
                : "Direct loading uses the selected loading profile. AM loading uses the main loading rate, and PM loading is validated using the reduced after-AM rate where applicable. "}` +
        `${state.loadingScenario === "exStore"
            ? "Unloading capacity is validated against the ex-store AM/PM unloading profile. "
            : "Unloading uses total volume ÷ " + state.unloadRate + " cuft per man-hour, then adds unload-side specials. "}` +
        `Travel is taken from the travel legs added to each planner row, and is deducted before net working time is validated. ` +
        `On completion-day direct moves, loading must be completed by 1pm after depot-to-collection travel is deducted. ` +
        `One standard bed and 30 cuft of export wrap are treated as already included before extra special time is added.`;

    const specialTextEl = document.getElementById("specialText");
if (specialTextEl) {
    specialTextEl.innerHTML = buildScheduleSpecialRhsHtml(state, special);
}

    renderScheduleFringeWarning();
renderSchedulePlanner();
renderValidation(packing, loading, unloading, special, state);
}
function normalizeJobsShape() {
    jobs = (Array.isArray(jobs) ? jobs : []).map(function(job) {
        const safeJob = createEmptyJob(job || {});

        safeJob.sequences = Array.isArray(job && job.sequences) ? job.sequences : [];

        safeJob.properties = Array.isArray(job && job.properties)
            ? job.properties
            : (Array.isArray(job && job.addresses) ? job.addresses : createDefaultProperties());

        safeJob.addresses = safeJob.properties;

        safeJob.inventory = {
            activeSequenceId: null,
            activeDeliveryId: null,
            activeFloor: "Ground",
            activeRoomName: "Hallway",
            customRooms: [],
            customFloors: [],
            activeCategory: "Full List",
            items: [],
            exclusions: [],
            voiceNotes: [],
            totals: {
                currentItemVolume: 0,
                totalVolume: 0
            },
            ...(job && job.inventory ? job.inventory : {})
        };

        safeJob.customer = {
            displayName: safeJob.name || "",
            firstName: "",
            surname: "",
            salutation: "",
            homePhone: "",
            mobilePhone: safeJob.tel || "",
            email: safeJob.email || "",
            ...(job && job.customer ? job.customer : {})
        };

        safeJob.survey = {
            status: safeJob.status || "pending",
            isNew: !!safeJob.isNew,
            isManual: !!safeJob.isManual,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: safeJob.notes || "",
            ...(job && job.survey ? job.survey : {})
        };

        safeJob.signature = {
            image: "",
            signedAt: "",
            ...(job && job.signature ? job.signature : {})
        };

        return safeJob;
    });
}


// -----------------------------------------------------------------------------
// Activation flow
// -----------------------------------------------------------------------------
const MOVEPILOT_DEV_SKIP_ACTIVATION = true;
const MOVEPILOT_ACTIVATION_STORAGE_KEY = "movepilot_activation_v1";

const MOVEPILOT_ACTIVATION_CODES = {
    "MOVE-TEST-7": {
        days: 7,
        label: "7 day test"
    },
    "MOVE-TEST-14": {
        days: 14,
        label: "14 day test"
    },
    "MOVE-TEST-30": {
        days: 30,
        label: "30 day test"
    },
    "MOVE-FULL-2026": {
        days: 365,
        label: "Full access"
    }
};

function normaliseMovePilotActivationCode(code) {
    return String(code || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
}

function getMovePilotActivationState() {
    let activation = null;

    activation = readJsonFromLocalStorage(MOVEPILOT_ACTIVATION_STORAGE_KEY, null);

    if (!activation || !activation.expiresAt) {
        return null;
    }

    const expiresAtMs = new Date(activation.expiresAt).getTime();

    if (!expiresAtMs || Date.now() > expiresAtMs) {
        try {
            localStorage.removeItem(MOVEPILOT_ACTIVATION_STORAGE_KEY);
        } catch (error) {
            rememberStorageError("Could not clear expired activation", error);
        }
        return null;
    }

    return activation;
}

function setActivationMessage(message, isGood) {
    const messageEl = document.getElementById("activation-message");
    if (!messageEl) return;

    messageEl.innerText = message || "";
    messageEl.classList.remove("hidden");
    messageEl.classList.toggle("text-red-600", !isGood);
    messageEl.classList.toggle("text-blue-600", !!isGood);
}

function bootMovePilotApp() {
    normalizeJobsShape();
    ensureScheduleDataShape();
    saveToDevice();
    renderDashboard();
}

function showMovePilotApp() {
    const activationScreen = document.getElementById("activation-screen");
    const dashboard = document.getElementById("view-dashboard");

    if (activationScreen) activationScreen.classList.add("hidden");
    if (dashboard) dashboard.classList.remove("hidden");

    bootMovePilotApp();
}

function showMovePilotActivationScreen() {
    const activationScreen = document.getElementById("activation-screen");
    const dashboard = document.getElementById("view-dashboard");

    if (activationScreen) activationScreen.classList.remove("hidden");
    if (dashboard) dashboard.classList.add("hidden");
}

function submitMovePilotActivation() {
    const input = document.getElementById("activation-code-input");
    const code = normaliseMovePilotActivationCode(input ? input.value : "");
    const activationCode = MOVEPILOT_ACTIVATION_CODES[code];

    if (!activationCode) {
        setActivationMessage("Activation code not recognised.", false);
        return;
    }

    const activatedAt = new Date();
    const expiresAt = new Date(activatedAt.getTime() + (activationCode.days * 24 * 60 * 60 * 1000));

    const activation = {
        code: code,
        label: activationCode.label,
        activatedAt: activatedAt.toISOString(),
        expiresAt: expiresAt.toISOString()
    };

    if (!writeJsonToLocalStorage(MOVEPILOT_ACTIVATION_STORAGE_KEY, activation)) {
        setActivationMessage("Activation could not be saved on this device.", false);
        return;
    }

    setActivationMessage("Activation successful.", true);
    showMovePilotApp();
}

function clearMovePilotActivationForTesting() {
    try {
        localStorage.removeItem(MOVEPILOT_ACTIVATION_STORAGE_KEY);
    } catch (error) {
        rememberStorageError("Could not clear activation", error);
    }
    location.reload();
}
window.addEventListener("focus", function() {
    runPostPrintCleanup();
});


// -----------------------------------------------------------------------------
// Startup
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
    if (MOVEPILOT_DEV_SKIP_ACTIVATION) {
        showMovePilotApp();
        return;
    }

    const activation = getMovePilotActivationState();

    if (activation) {
        showMovePilotApp();
    } else {
        showMovePilotActivationScreen();
    }
});
