/**
 * Generates lib/inventory/data/inventory-categories.json (2000+ entries).
 * Run: node scripts/generate-inventory-categories.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../lib/inventory/data/inventory-categories.json");

const INDUSTRY_TYPES = [
  "KIRANA_GENERAL_STORE",
  "GROCERY_SUPERMARKET",
  "MOBILE_ACCESSORIES",
  "ELECTRONICS_APPLIANCES",
  "COMPUTER_IT",
  "GARMENTS_TEXTILES",
  "FOOTWEAR",
  "JEWELLERY",
  "WATCHES_CLOCKS",
  "OPTICAL_EYEWEAR",
  "PHARMACY_MEDICAL",
  "AYURVEDIC_HOMEO",
  "COSMETICS_BEAUTY",
  "STATIONERY_BOOKS",
  "HARDWARE_TOOLS",
  "PAINT_BUILDING_MATERIAL",
  "PLYWOOD_TIMBER",
  "SANITARY_PLUMBING",
  "ELECTRICAL_SUPPLIES",
  "AUTOMOBILE_PARTS",
  "TWO_WHEELER_DEALER",
  "TYRES_TUBES",
  "LUBRICANTS_OIL",
  "RESTAURANT_CAFE",
  "BAKERY_CONFECTIONERY",
  "SWEETS_NAMKEEN",
  "DAIRY_MILK",
  "MEAT_FISH",
  "FRUITS_VEGETABLES",
  "GRAIN_PULSES",
  "SPICES_MASALA",
  "TEA_COFFEE",
  "BEVERAGES_COLD_DRINKS",
  "TOYS_GAMES",
  "GIFTS_FANCY",
  "HOME_DECOR",
  "FURNITURE",
  "KITCHENWARE_UTENSILS",
  "PLASTICS_HOUSEHOLD",
  "AGRO_INPUTS_SEEDS",
  "FERTILIZER_PESTICIDE",
  "DAIRY_EQUIPMENT",
  "PRINTING_XEROX",
  "LAUNDRY_DRY_CLEAN",
  "SALON_SPA",
  "GYM_FITNESS",
  "PET_SUPPLIES",
  "SPORTS_FITNESS_GOODS",
  "MUSICAL_INSTRUMENTS",
  "WHOLESALE_DISTRIBUTION",
  "IT_SERVICES",
  "SOFTWARE_DEVELOPMENT",
  "SOFTWARE_CONSULTANCY",
  "CONSULTANCY_SERVICES",
  "PROFESSIONAL_SERVICES",
  "ACCOUNTING_CA_SERVICES",
  "LEGAL_SERVICES",
  "ARCHITECTURE_ENGINEERING",
  "MARKETING_ADVERTISING",
  "DIGITAL_MARKETING",
  "WEB_DESIGN_DEVELOPMENT",
  "CLOUD_SAAS_SERVICES",
  "TELECOM_SERVICES",
  "COURIER_LOGISTICS",
  "TRANSPORT_TRAVEL",
  "EDUCATION_COACHING",
  "HEALTHCARE_SERVICES",
  "REPAIR_MAINTENANCE",
  "SECURITY_SERVICES",
  "EVENT_MANAGEMENT",
  "OTHER",
];

/** industryType -> category name templates */
const CATALOG = {
  KIRANA_GENERAL_STORE: [
    "Atta & Flour", "Basmati Rice", "Regular Rice", "Toor Dal", "Moong Dal", "Chana Dal", "Urad Dal", "Masoor Dal",
    "Rajma", "Chole", "Sugar", "Jaggery", "Salt", "Tea", "Coffee", "Biscuits", "Namkeen", "Papad", "Pickles",
    "Sauces & Ketchup", "Noodles & Pasta", "Breakfast Cereals", "Honey", "Jam", "Dry Fruits", "Nuts", "Oil",
    "Ghee", "Soap", "Detergent", "Shampoo Sachet", "Toothpaste", "Matches", "Candles", "Batteries", "Bulbs",
    "Mosquito Coil", "Incense Sticks", "Pooja Items", "General Merchandise", "Plastic Buckets", "Brooms",
    "Mops", "Phenyl", "Floor Cleaner", "Dish Wash", "Tissue Paper", "Sanitary Pads", "Condoms", "Baby Diapers",
    "Milk Packets", "Bread", "Eggs", "Butter", "Curd", "Paneer", "Soft Drinks", "Juices", "Mineral Water",
    "Ice Cream Cups", "Chocolates", "Candies", "Chewing Gum", "Ready to Eat", "Frozen Paratha", "Spices Pack",
    "Rice Flour", "Besan", "Maida", "Poha", "Sabudana", "Millets", "Health Drinks", "ORS", "Pain Balm",
    "Band Aid", "Cotton", "Dettol", "Savlon", "Hair Oil", "Face Cream", "Razor", "Shaving Cream", "Combs",
    "Clips & Pins", "Stationery Basic", "Notebooks Small", "Pens", "Eraser", "Snacks Mix", "Puffed Rice",
    "Flattened Rice", "Custard Powder", "Cocoa", "Baking Soda", "Yeast", "Vinegar", "Soya Chunks", "Oats",
    "Corn Flakes", "Muesli", "Protein Bar Retail", "Energy Drink", "Coconut Water", "Sharbat", "Squash",
    "Tamarind", "Jaggery Powder", "Rock Salt", "Black Salt", "Ajwain", "Jeera Whole", "Dhania Whole",
    "Mustard Seeds", "Fenugreek", "Bay Leaf", "Cloves", "Cardamom", "Cinnamon", "Black Pepper", "Red Chilli Whole",
    "Turmeric Powder", "Red Chilli Powder", "Coriander Powder", "Garam Masala", "Kitchen King", "Chaat Masala",
    "Sambar Powder", "Rasam Powder", "Meat Masala", "Chicken Masala", "Biryani Masala", "Pav Bhaji Masala",
    "Pulses Mix", "Gift Packs", "Festival Hampers", "Return Gifts", "Miscellaneous", "Adjustments", "Services",
  ],
  GROCERY_SUPERMARKET: [
    "Organic Grocery", "Premium Rice", "Imported Snacks", "Health Food", "Gluten Free", "Sugar Free", "Diet Food",
    "Frozen Vegetables", "Frozen Snacks", "Frozen Meals", "Canned Food", "Baby Food", "Pet Food Retail",
    "Household Cleaners", "Laundry Care", "Air Fresheners", "Kitchen Rolls", "Aluminium Foil", "Cling Film",
    "Food Wrap", "Zip Lock Bags", "Trash Bags", "Disposable Plates", "Disposable Cups", "Paper Napkins",
    "Party Supplies", "BBQ Supplies", "Salad Dressing", "Mayonnaise", "Mustard Sauce", "Salsa", "Dips",
    "Spreads", "Peanut Butter", "Almond Butter", "Nut Butter", "Protein Powder Retail", "Sports Nutrition",
    "Meal Replacement", "Keto Products", "Vegan Products", "Plant Based Milk", "Tofu", "Tempeh", "Hummus",
    "Cheese Blocks", "Processed Cheese", "Cream Cheese", "Yogurt Cups", "Flavoured Yogurt", "Greek Yogurt",
    "Buttermilk Pack", "Lassi Pack", "Flavoured Milk", "UHT Milk", "Soy Milk", "Oat Milk", "Almond Milk",
    "Cold Brew Coffee", "Ground Coffee", "Coffee Beans", "Tea Bags", "Loose Tea", "Green Tea", "Herbal Tea",
    "Kombucha", "Kefir", "Probiotic Drinks", "Sparkling Water", "Tonic Water", "Gourmet Chocolate",
    "Artisan Bread", "Sourdough", "Bagels", "Croissants", "Muffins", "Donuts", "Swiss Roll", "Pastries",
    "International Sauces", "Olive Oil", "Balsamic Vinegar", "Pasta Sauce", "Pizza Sauce", "Curry Paste",
    "Coconut Milk Can", "Tomato Puree", "Baked Beans", "Sweet Corn Can", "Mushroom Can", "Tuna Can",
    "Salmon Can", "Soup Pack", "Broth Cubes", "Stock Cubes", "Gravy Mix", "Soup Mix", "Instant Oats",
    "Granola", "Muesli Premium", "Trail Mix", "Roasted Seeds", "Chia Seeds", "Flax Seeds", "Quinoa",
    "Amaranth", "Buckwheat", "Barley", "Rye Flour", "Spelt Flour", "Rice Noodles", "Udon", "Ramen Pack",
    "Sushi Ingredients", "Wasabi", "Soy Sauce", "Teriyaki Sauce", "Fish Sauce", "Oyster Sauce", "Hot Sauce",
    "BBQ Sauce", "Worcestershire", "Apple Cider Vinegar", "Rice Vinegar", "Cooking Wine", "Rose Water",
    "Kewra Water", "Food Colour", "Essence Flavour", "Cake Mix", "Brownie Mix", "Pancake Mix", "Waffle Mix",
    "Frosting", "Icing Sugar", "Sprinkles", "Cake Decor", "Baking Chocolate", "Cocoa Powder", "Gelatin",
    "Agar Agar", "Pectin", "Corn Starch", "Arrowroot", "Xanthan Gum", "Supermarket General", "Bulk Grocery",
    "Wholesale Grocery Pack", "Combo Grocery Pack", "Monthly Grocery Pack", "Weekly Essentials Pack",
  ],
  MOBILE_ACCESSORIES: [
    "Mobile Phone", "Smartphone", "Feature Phone", "Refurbished Mobile", "Mobile Phone Box Pack",
    "Mobile Display", "Mobile Battery", "Mobile Charging Port", "Mobile Back Cover", "Mobile Tempered Glass",
    "Mobile Phone Case", "Silicone Case", "Leather Case", "Flip Cover", "Ring Holder", "Pop Socket",
    "Mobile Charger", "Fast Charger", "Wireless Charger", "Car Charger", "Type C Cable", "Lightning Cable",
    "Micro USB Cable", "OTG Cable", "Adapter", "Power Bank", "10000mAh Power Bank", "20000mAh Power Bank",
    "Bluetooth Earbuds", "TWS Earbuds", "Neckband", "Wired Earphones", "Headphones", "Bluetooth Speaker Mini",
    "Selfie Stick", "Tripod Mobile", "Gimbal", "Mobile Lens Kit", "Mobile Phone Holder", "Car Mount",
    "Mobile Stylus", "Screen Guard", "Camera Lens Guard", "SIM Card", "Memory Card", "Micro SD Card",
    "Mobile Tool Kit", "Opening Tools", "Screwdriver Set Mobile", "Adhesive Sticker Mobile", "Brand Logo Sticker",
    "Mobile Skin", "Designer Back Cover", "Printed Case", "Transparent Case", "Rugged Case", "Waterproof Pouch",
    "Anti Dust Plug", "SIM Tray", "Volume Button", "Power Button", "Fingerprint Flex", "Charging Flex",
    "Motherboard", "IC Chip", "Speaker Module", "Mic Module", "Vibration Motor", "Antenna Flex", "Frame Housing",
    "Middle Frame", "Back Glass", "Front Glass", "LCD Combo", "OLED Display", "Touch Panel", "Display Frame",
    "Battery Connector", "Test Cable", "DC Power Supply Mobile", "UV Lamp", "Laminating Machine", "Separator Machine",
    "Soldering Station", "Hot Air Gun", "Multimeter", "Magnifying Lamp", "Repair Mat", "Tweezers Set",
    "Spudger Set", "Alcohol Wipes", "Dust Cleaner", "Thermal Paste", "BGA Paste", "Flux", "Solder Wire",
    "Mobile Repair Service", "Software Unlock", "FRP Service", "IMEI Repair", "Mobile Accessories Wholesale",
    "Combo Mobile Pack", "Gift Pack Mobile", "Demo Mobile", "Second Hand Mobile", "Mobile Insurance",
    "Extended Warranty", "Screen Replacement Service", "Battery Replacement Service", "Water Damage Repair",
  ],
  ELECTRONICS_APPLIANCES: [
    "AC", "Split AC", "Window AC", "Inverter AC", "Portable AC", "Cassette AC", "Tower AC", "AC Remote",
    "AC Spare Parts", "AC Stabilizer", "AC Cover", "AC Installation Kit", "AC Gas Refill Service",
    "Air Cooler", "Desert Cooler", "Tower Cooler", "Personal Cooler", "Industrial Cooler", "Cooler Pump",
    "Cooler Pad", "Fridge", "Single Door Fridge", "Double Door Fridge", "Side by Side Fridge", "Mini Fridge",
    "Deep Freezer", "Beverage Cooler", "Refrigerator Spare Parts", "Fan", "Ceiling Fan", "Table Fan",
    "Pedestal Fan", "Wall Fan", "Exhaust Fan", "BLDC Ceiling Fan", "Fan Regulator", "Fan Remote",
    "TV", "LED TV", "Smart TV", "4K UHD TV", "OLED TV", "TV Remote", "TV Wall Mount", "Set Top Box",
    "Android TV Box", "Soundbar", "Home Theatre", "Bluetooth Speaker", "Party Speaker", "Washing Machine",
    "Front Load Washing Machine", "Top Load Washing Machine", "Semi Automatic Washing Machine", "Microwave Oven",
    "OTG Oven", "Induction Cooktop", "Gas Stove", "Electric Stove", "Kitchen Chimney", "Cooktop", "Dishwasher",
    "Mixer Grinder", "Juicer Mixer Grinder", "Food Processor", "Electric Kettle", "Toaster", "Sandwich Maker",
    "Coffee Maker", "Hand Blender", "Rice Cooker", "Water Purifier", "RO Water Purifier", "UV Water Purifier",
    "Purifier Filter", "Air Purifier", "Humidifier", "Dehumidifier", "Iron", "Steam Iron", "Garment Steamer",
    "Vacuum Cleaner", "Robot Vacuum", "Geyser", "Instant Geyser", "Storage Geyser", "Room Heater",
    "Oil Filled Heater", "Hair Dryer", "Hair Trimmer", "Electric Shaver", "Sewing Machine", "Inverter",
    "Inverter Battery", "UPS", "Voltage Stabilizer", "Extension Board", "CCTV Camera", "WiFi Camera",
    "Video Doorbell", "Smart Plug", "Smart Bulb", "Smart Switch", "WiFi Router", "Smart Watch", "Fitness Band",
    "Tablet", "iPad & Tablets", "Drone", "Action Camera", "Digital Camera", "HDMI Cable", "Batteries",
    "Torch", "Emergency Light", "Electronic Repair Parts", "Appliance AMC", "Installation Service",
    "Demo Appliance", "Refurbished Appliance", "Appliance Combo Pack", "Seasonal Appliance", "Misc Appliance",
  ],
  COMPUTER_IT: [
    "Laptop", "Gaming Laptop", "Business Laptop", "Student Laptop", "Refurbished Laptop", "Desktop Computer",
    "Gaming PC", "All in One PC", "Mini PC", "Computer Monitor", "Gaming Monitor", "Curved Monitor",
    "Keyboard", "Mechanical Keyboard", "Gaming Keyboard", "Mouse", "Gaming Mouse", "Mouse Pad", "Webcam",
    "Headset", "Gaming Headset", "Microphone", "Speakers Computer", "Printer", "Inkjet Printer", "Laser Printer",
    "Printer Ink", "Toner Cartridge", "Scanner", "Barcode Scanner", "Projector", "Presentation Remote",
    "Laptop Bag", "Laptop Sleeve", "Laptop Stand", "Cooling Pad", "USB Hub", "Docking Station", "External HDD",
    "External SSD", "Internal HDD", "Internal SSD", "NVMe SSD", "Pen Drive", "Memory Card Reader", "RAM DDR4",
    "RAM DDR5", "Graphics Card", "Motherboard", "Processor", "CPU Cooler", "SMPS", "Computer Cabinet",
    "Cabinet Fan", "Thermal Paste PC", "SATA Cable", "NVMe Heatsink", "WiFi Adapter", "Bluetooth Adapter",
    "LAN Card", "Capture Card", "UPS Computer", "Surge Protector", "KVM Switch", "NAS Storage", "Hard Drive Enclosure",
    "Rack Mount", "Server Chassis", "RAID Card", "HBA Card", "Cable Management", "Patch Panel", "Network Switch",
    "Managed Switch", "PoE Switch", "Router Enterprise", "Access Point", "Range Extender", "Firewall Appliance",
    "Software License", "Windows License", "Office License", "Antivirus", "Backup Software", "Design Software",
    "Development Tools", "Cloud Subscription", "Domain Service", "Hosting Service", "IT Support Service",
    "Data Recovery Service", "PC Assembly Service", "Laptop Repair", "Desktop Repair", "Networking Service",
    "CCTV Installation IT", "Smart Office Setup", "Conference Room AV", "Interactive Board", "Document Camera",
    "Label Printer", "Receipt Printer", "POS Terminal", "Cash Drawer", "Biometric Device", "Attendance Device",
    "EPABX System", "IP Phone", "Video Conferencing", "Drawing Tablet", "3D Printer", "3D Filament",
    "Raspberry Pi", "Arduino Kit", "IoT Kit", "STEM Computer Kit", "Refurbished Monitor", "Demo Laptop",
    "Bulk Computer Supply", "Computer Accessories Combo", "Gaming Accessories Combo", "Office IT Combo",
  ],
};

// Fill remaining industries with generated + shared templates
function expandIndustry(industry, baseNames, extraPrefixes = []) {
  const names = [...baseNames];
  const prefixes = extraPrefixes.length ? extraPrefixes : [industry.replace(/_/g, " ").toLowerCase()];
  let i = 1;
  while (names.length < 32) {
    for (const p of prefixes) {
      names.push(`${p} item ${i}`);
      if (names.length >= 32) break;
    }
    i++;
  }
  return names.slice(0, 40);
}

const SHARED_RETAIL = ["General", "Miscellaneous", "Combo Pack", "Bulk Pack", "Promotional Item", "Display Item", "Demo Unit", "Seasonal Item", "Imported Item", "Local Item", "Premium Range", "Economy Range", "Wholesale Pack", "Retail Pack", "Gift Pack", "Festival Special", "Clearance Item", "New Arrival", "Best Seller", "Custom Order"];

const INDUSTRY_BASE = {
  GARMENTS_TEXTILES: ["Men Shirts", "Men T-Shirts", "Men Jeans", "Men Trousers", "Men Kurtas", "Men Suits", "Women Sarees", "Women Kurtis", "Women Salwar Suits", "Women Lehengas", "Women Dresses", "Women Tops", "Women Jeans", "Women Leggings", "Kids Wear", "Infant Wear", "School Uniform", "Ethnic Wear", "Western Wear", "Sportswear", "Nightwear", "Innerwear", "Socks", "Dupatta", "Shawl", "Fabric Cotton", "Fabric Silk", "Fabric Polyester", "Dress Material", "Suiting", "Shirting", "Laces", "Buttons", "Zippers", "Threads", "Embroidery Material", "Tailoring Service", ...SHARED_RETAIL],
  FOOTWEAR: ["Men Formal Shoes", "Men Casual Shoes", "Men Sports Shoes", "Men Sandals", "Men Slippers", "Women Heels", "Women Flats", "Women Sports Shoes", "Women Sandals", "Kids School Shoes", "Kids Sports Shoes", "Safety Shoes", "Kolhapuri", "Boots", "Sneakers", "Loafers", "Flip Flops", "Monsoon Footwear", "Orthopedic Footwear", "Shoe Polish", "Shoe Brush", "Insoles", "Shoe Laces", "Footwear Accessories", ...SHARED_RETAIL],
  JEWELLERY: ["Gold Jewellery", "Silver Jewellery", "Diamond Jewellery", "Fashion Jewellery", "Imitation Jewellery", "Bangles", "Earrings", "Necklaces", "Rings", "Bracelets", "Anklets", "Nose Pins", "Mangalsutra", "Temple Jewellery", "Kundan", "Pearl Jewellery", "Coin Jewellery", "Jewellery Box", "Jewellery Cleaning", "Custom Jewellery", ...SHARED_RETAIL],
  WATCHES_CLOCKS: ["Men Watches", "Women Watches", "Kids Watches", "Smart Watch", "Luxury Watch", "Sports Watch", "Wall Clock", "Table Clock", "Alarm Clock", "Watch Strap", "Watch Battery", "Watch Repair", ...SHARED_RETAIL],
  OPTICAL_EYEWEAR: ["Eyeglass Frames", "Sunglasses", "Contact Lenses", "Lens Solutions", "Reading Glasses", "Progressive Lenses", "Blue Cut Lenses", "Kids Frames", "Sports Goggles", "Lens Cleaning Kit", "Optical Service", ...SHARED_RETAIL],
  PHARMACY_MEDICAL: ["OTC Medicines", "Prescription Medicines", "Tablets", "Capsules", "Syrups", "Injectables", "Ointments", "Drops", "Inhalers", "BP Monitor", "Glucometer", "Thermometer", "Nebulizer", "First Aid", "Bandages", "Surgical Tape", "Cotton Roll", "Gloves", "Masks", "Wheelchair", "Walker", "Adult Diapers", "Baby Diapers", "Sanitary Pads", "Condoms", "Pregnancy Kit", "ORS", "Antiseptic", "Vitamins", "Protein Supplement", "Baby Care Pharma", "Medical Device", ...SHARED_RETAIL],
  AYURVEDIC_HOMEO: ["Ayurvedic Medicine", "Homeopathy Medicine", "Herbal Tablets", "Chyawanprash", "Ayurvedic Oil", "Herbal Tea", "Ayurvedic Soap", "Pain Relief Ayurvedic", "Digestive Care", "Immunity Booster", "Wellness Kit", "Herbal Juice", "Baidyanath Range", "Patanjali Range", "Himalaya Range", "Dabur Range", ...SHARED_RETAIL],
  COSMETICS_BEAUTY: ["Face Wash", "Moisturizer", "Sunscreen", "Serum", "Face Mask", "Toner", "Lip Care", "Hair Oil", "Shampoo", "Conditioner", "Hair Color", "Body Wash", "Soap", "Body Lotion", "Deodorant", "Perfume", "Makeup", "Lipstick", "Foundation", "Kajal", "Nail Polish", "Men Grooming", "Beauty Tools", "Salon Product", ...SHARED_RETAIL],
  STATIONERY_BOOKS: ["Notebook", "Register", "Diary", "Pen", "Pencil", "Marker", "Highlighter", "Eraser", "Sharpener", "Geometry Box", "Art Supplies", "Paint Set", "Craft Paper", "Glue", "Tape", "Stapler", "Punch Machine", "File Folder", "Envelope", "School Book", "Competitive Exam Book", "Novel", "Children Book", "Magazine", "Whiteboard", "Notice Board", ...SHARED_RETAIL],
  HARDWARE_TOOLS: ["Hand Tools", "Power Tools", "Drill", "Grinder", "Hammer", "Screwdriver", "Wrench", "Pliers", "Tool Kit", "Ladder", "Screws", "Nails", "Bolts", "Nuts", "Hinges", "Locks", "Chains", "Ropes", "Adhesives", "Sealants", "Measuring Tape", "Spirit Level", "Safety Gloves", "Welding Tools", ...SHARED_RETAIL],
  PAINT_BUILDING_MATERIAL: ["Interior Paint", "Exterior Paint", "Enamel Paint", "Primer", "Putty", "Thinner", "Waterproofing", "Tile Adhesive", "Grout", "Cement", "Bricks", "Sand", "Steel Bars", "TMT Bars", "Aggregates", "Plywood", "Laminates", "Tiles", "Marble", "Granite", "Gypsum Board", "Roofing Sheet", ...SHARED_RETAIL],
  PLYWOOD_TIMBER: ["Commercial Plywood", "Marine Plywood", "Block Board", "Flush Door", "Veneer", "Laminate Sheet", "MDF Board", "Particle Board", "Timber Log", "Teak Wood", "Sal Wood", "Pine Wood", "Wood Adhesive", "Edge Band", "Laminate Cutter", ...SHARED_RETAIL],
  SANITARY_PLUMBING: ["Taps", "Showers", "Basins", "Water Closet", "Flush Tank", "PVC Pipes", "CPVC Pipes", "Pipe Fittings", "Valves", "Water Tank", "Submersible Pump", "Bathroom Accessories", "Kitchen Sink", "Floor Drain", "Plumbing Tools", ...SHARED_RETAIL],
  ELECTRICAL_SUPPLIES: ["LED Bulb", "Tube Light", "Panel Light", "Switch", "Socket", "MCB", "RCCB", "Wire", "Cable", "Conduit", "Fan Electrical", "Motor", "Contactor", "Relay", "Inverter Electrical", "Solar Light", "Extension Board", "Adapter", "Battery Electrical", ...SHARED_RETAIL],
  AUTOMOBILE_PARTS: ["Engine Oil", "Brake Pad", "Brake Shoe", "Clutch Plate", "Air Filter", "Oil Filter", "Fuel Filter", "Spark Plug", "Wiper Blade", "Horn", "Headlight", "Tail Light", "Mirror", "Bumper", "Seat Cover", "Car Mat", "Car Perfume", "Car Charger", "Dash Cam", "Tyre", "Alloy Wheel", "Battery Auto", "Coolant", "Grease", "Car Care", ...SHARED_RETAIL],
  TWO_WHEELER_DEALER: ["Motorcycle", "Scooter", "Electric Scooter", "Bike Accessories", "Helmet", "Bike Cover", "Bike Seat Cover", "Bike Mirror", "Bike Light", "Bike Tyre", "Bike Battery", "Bike Service", "Spare Parts Bike", "Riding Gear", ...SHARED_RETAIL],
  TYRES_TUBES: ["Car Tyre", "Bike Tyre", "Truck Tyre", "Tube", "Flap", "Tyre Valve", "Wheel Rim", "Tyre Repair", "Tyre Fitting Service", "Retread Tyre", ...SHARED_RETAIL],
  LUBRICANTS_OIL: ["Engine Oil", "Gear Oil", "Brake Fluid", "Coolant", "Grease", "Hydraulic Oil", "2T Oil", "Chain Lube", "Silicone Spray", "Penetrating Oil", ...SHARED_RETAIL],
  RESTAURANT_CAFE: ["Raw Vegetables Kitchen", "Raw Meat Kitchen", "Seafood Kitchen", "Dairy Kitchen", "Bakery Ingredient", "Cooking Oil Commercial", "Rice Commercial", "Flour Commercial", "Spices Commercial", "Sauce Commercial", "Disposable Plate", "Disposable Cup", "Tissue Roll", "Garbage Bag", "Cleaning Chemical", "Chef Uniform", "Kitchen Equipment", "Gas Stove Commercial", "Deep Freezer Commercial", "Display Counter", "Food Warmer", "Bain Marie", "SS Utensils Commercial", "Takeaway Container", "Menu Card", "Billing Roll", "Cafe Coffee Beans", "Tea Premix", "Syrup Cafe", "Topping", "Napkin Holder", ...SHARED_RETAIL],
  BAKERY_CONFECTIONERY: ["Bread", "Bun", "Cake", "Pastry", "Cookie", "Rusk", "Khari", "Puff", "Brownie", "Muffin", "Donut", "Croissant", "Birthday Cake", "Wedding Cake", "Bakery Cream", "Bakery Raw Material", "Flour Bakery", "Sugar Bakery", "Yeast", "Baking Powder", "Chocolate Bakery", "Essence", "Food Colour Bakery", "Cake Topper", "Bakery Box", ...SHARED_RETAIL],
  SWEETS_NAMKEEN: ["Mithai", "Ladoo", "Barfi", "Gulab Jamun", "Rasgulla", "Kaju Katli", "Soan Papdi", "Namkeen", "Bhujia", "Mixture", "Chakli", "Sev", "Mathri", "Shakkar Para", "Dry Fruit Sweet", "Sugar Free Sweet", "Festival Sweet Box", ...SHARED_RETAIL],
  DAIRY_MILK: ["Fresh Milk", "Toned Milk", "Full Cream Milk", "Curd", "Paneer", "Butter", "Ghee", "Cheese", "Cream", "Flavoured Milk", "Lassi", "Buttermilk", "Ice Cream Bulk", "Milk Can", "Dairy Supply", ...SHARED_RETAIL],
  MEAT_FISH: ["Chicken", "Mutton", "Fish", "Prawns", "Seafood", "Eggs", "Sausage", "Cold Cut", "Marinated Meat", "Frozen Chicken", "Frozen Fish", "Processed Meat", ...SHARED_RETAIL],
  FRUITS_VEGETABLES: ["Fresh Fruits", "Fresh Vegetables", "Leafy Greens", "Exotic Fruits", "Organic Produce", "Cut Fruits", "Onion", "Potato", "Tomato", "Seasonal Fruits", "Herbs", "Mushroom", "Sprouts", ...SHARED_RETAIL],
  GRAIN_PULSES: ["Wheat", "Rice Bulk", "Pulses Bulk", "Dal Bulk", "Millets Bulk", "Flour Bulk", "Grain Wholesale", ...SHARED_RETAIL],
  SPICES_MASALA: ["Whole Spices", "Powdered Spices", "Blended Masala", "Garam Masala", "Chicken Masala", "Biryani Masala", "Chilli Powder", "Turmeric", "Coriander Powder", "Cumin", "Cardamom", "Bulk Spices", ...SHARED_RETAIL],
  TEA_COFFEE: ["Tea Loose", "Tea Bags", "Green Tea", "Herbal Tea", "Coffee Beans", "Ground Coffee", "Instant Coffee", "Coffee Premix", "Tea Premix", "Chai Masala", ...SHARED_RETAIL],
  BEVERAGES_COLD_DRINKS: ["Soft Drink", "Juice", "Energy Drink", "Mineral Water", "Soda", "Sports Drink", "Syrup", "Squash", "Cold Coffee", "Mocktail Mix", ...SHARED_RETAIL],
  TOYS_GAMES: ["Soft Toy", "Action Figure", "Doll", "Educational Toy", "Board Game", "Puzzle", "RC Toy", "Outdoor Toy", "Baby Toy", "STEM Toy", "Ride On", "Kids Bicycle", ...SHARED_RETAIL],
  GIFTS_FANCY: ["Gift Item", "Fancy Store", "Greeting Card", "Gift Wrap", "Showpiece", "Keychain", "Novelty Item", "Corporate Gift", "Trophy", "Return Gift", ...SHARED_RETAIL],
  HOME_DECOR: ["Wall Art", "Clock", "Mirror", "Vase", "Artificial Plant", "Curtain", "Cushion", "Rug", "Carpet", "Photo Frame", "Lighting Decor", "Festival Decor", ...SHARED_RETAIL],
  FURNITURE: ["Sofa", "Bed", "Mattress", "Wardrobe", "Dining Table", "Chair", "Office Chair", "Study Table", "TV Unit", "Shoe Rack", "Bookshelf", "Modular Kitchen", ...SHARED_RETAIL],
  KITCHENWARE_UTENSILS: ["Cookware", "Pressure Cooker", "Tawa", "Kadai", "Steel Utensils", "Cutlery", "Knife", "Storage Container", "Lunch Box", "Water Bottle", "Dinner Set", "Gas Lighter", ...SHARED_RETAIL],
  PLASTICS_HOUSEHOLD: ["Plastic Bucket", "Plastic Mug", "Plastic Stool", "Plastic Container", "Plastic Basket", "Hanger", "Laundry Basket", "Dustbin", "Plastic Furniture", "Household Plastic", ...SHARED_RETAIL],
  AGRO_INPUTS_SEEDS: ["Vegetable Seeds", "Flower Seeds", "Hybrid Seeds", "Seed Treatment", "Seedling Tray", "Grow Bag", "Mulch Sheet", "Farm Tool", "Sprayer", "Drip Kit", ...SHARED_RETAIL],
  FERTILIZER_PESTICIDE: ["Urea", "DAP", "NPK", "Organic Fertilizer", "Pesticide", "Herbicide", "Fungicide", "Bio Pesticide", "Growth Promoter", "Soil Conditioner", ...SHARED_RETAIL],
  DAIRY_EQUIPMENT: ["Milk Can", "Cream Separator", "Chaff Cutter", "Milking Machine", "Bulk Milk Cooler", "Dairy Processing", ...SHARED_RETAIL],
  PRINTING_XEROX: ["A4 Paper", "Copier Paper", "Ink Cartridge", "Toner", "Lamination", "Binding", "Stamp", "Visiting Card", "Flex Printing", "Xerox Service", ...SHARED_RETAIL],
  LAUNDRY_DRY_CLEAN: ["Detergent Bulk", "Fabric Softener", "Stain Remover", "Steam Iron Pro", "Pressing Service", "Dry Clean Service", "Laundry Chemical", ...SHARED_RETAIL],
  SALON_SPA: ["Shampoo Professional", "Hair Color Pro", "Wax", "Facial Kit", "Massage Oil", "Nail Art", "Salon Equipment", "Hair Dryer Pro", "Trimmer Pro", "Spa Product", ...SHARED_RETAIL],
  GYM_FITNESS: ["Dumbbell", "Treadmill", "Exercise Bike", "Yoga Mat", "Resistance Band", "Protein Supplement Gym", "Gym Accessories", "Sports Bottle", "Fitness Apparel", ...SHARED_RETAIL],
  PET_SUPPLIES: ["Dog Food", "Cat Food", "Bird Food", "Fish Food", "Pet Treat", "Pet Shampoo", "Pet Toy", "Pet Collar", "Aquarium Supply", "Litter", ...SHARED_RETAIL],
  SPORTS_FITNESS_GOODS: ["Cricket Bat", "Cricket Ball", "Football", "Badminton Racket", "Shuttlecock", "Tennis Ball", "Table Tennis", "Swimming Gear", "Cycling Gear", "Camping Gear", ...SHARED_RETAIL],
  MUSICAL_INSTRUMENTS: ["Guitar", "Keyboard", "Drum", "Harmonium", "Tabla", "Flute", "Violin", "Ukulele", "Music Accessories", "Amplifier Music", ...SHARED_RETAIL],
  WHOLESALE_DISTRIBUTION: ["Bulk Grocery", "Bulk FMCG", "Bulk Beverage", "Bulk Personal Care", "Bulk Cleaning", "Bulk Stationery", "Bulk Hardware", "Distribution Pack", "Case Lot", "Pallet Goods", "Trade Scheme Item", "Secondary Sales Pack", ...SHARED_RETAIL],
};

const SERVICE_INDUSTRIES = {
  IT_SERVICES: ["Hardware Support", "Network Support", "Cloud Setup", "Server Maintenance", "Backup Service", "Cybersecurity Service", "Helpdesk Service", "Annual Maintenance", "Remote Support", "Onsite Support", "IT Consulting", "Infrastructure Audit", "Migration Service", "Deployment Service", "Monitoring Service", "Managed WiFi", "Email Setup", "VPN Setup", "Firewall Setup", "Endpoint Security", "Patch Management", "Asset Management", "Software Installation", "License Management", "Disaster Recovery", "Virtualization Service", "Storage Service", "Database Support", "DevOps Support", "API Integration", ...SHARED_RETAIL],
  SOFTWARE_DEVELOPMENT: ["Custom Software", "Web Application", "Mobile App", "ERP Development", "CRM Development", "API Development", "UI UX Design", "QA Testing", "Maintenance Contract", "Source Code License", "SaaS Product", "Plugin Development", "Module Development", "Prototype Service", "MVP Development", "Legacy Modernization", "Microservices", "DevOps Setup", "CI CD Setup", "Technical Documentation", ...SHARED_RETAIL],
  SOFTWARE_CONSULTANCY: ["IT Strategy", "Architecture Review", "Technology Consulting", "Vendor Selection", "RFP Support", "Project Audit", "Agile Coaching", "Product Consulting", "Digital Transformation", "Process Automation", ...SHARED_RETAIL],
  CONSULTANCY_SERVICES: ["Business Consulting", "Management Consulting", "Operations Consulting", "HR Consulting", "Finance Consulting", "Startup Consulting", "Feasibility Study", "Market Research", "Process Improvement", "Training Program", ...SHARED_RETAIL],
  PROFESSIONAL_SERVICES: ["Advisory Service", "Retainer Service", "Project Service", "Audit Support", "Compliance Support", "Documentation Service", "Certification Support", "Due Diligence", "Valuation Service", "Outsourcing Service", ...SHARED_RETAIL],
  ACCOUNTING_CA_SERVICES: ["Bookkeeping", "GST Filing", "ITR Filing", "TDS Return", "Payroll Service", "Audit Service", "ROC Filing", "Financial Statement", "Tax Planning", "Accounting Software Setup", ...SHARED_RETAIL],
  LEGAL_SERVICES: ["Legal Consultation", "Agreement Drafting", "Trademark Filing", "Company Registration", "Compliance Advisory", "Litigation Support", "Notary Service", "Legal Documentation", "Contract Review", "IP Advisory", ...SHARED_RETAIL],
  ARCHITECTURE_ENGINEERING: ["Architectural Design", "Structural Design", "MEP Design", "Interior Design", "3D Visualization", "Site Survey", "BOQ Preparation", "Project Supervision", "Renovation Design", "Landscape Design", ...SHARED_RETAIL],
  MARKETING_ADVERTISING: ["Branding Service", "Ad Campaign", "Print Advertising", "Outdoor Advertising", "Media Buying", "Creative Design", "Market Collateral", "PR Service", "Event Promotion", "Sponsorship Package", ...SHARED_RETAIL],
  DIGITAL_MARKETING: ["SEO Service", "SEM Campaign", "Social Media Marketing", "Content Marketing", "Email Marketing", "Influencer Campaign", "Analytics Setup", "Landing Page", "Lead Generation", "Reputation Management", ...SHARED_RETAIL],
  WEB_DESIGN_DEVELOPMENT: ["Website Design", "Website Development", "Ecommerce Website", "Landing Page Design", "Website Maintenance", "Hosting Setup", "Domain Setup", "Website Redesign", "Speed Optimization", "Security Hardening", ...SHARED_RETAIL],
  CLOUD_SAAS_SERVICES: ["SaaS Subscription", "Cloud Hosting", "Cloud Storage", "Cloud Backup", "Cloud Migration", "Managed Cloud", "SaaS Implementation", "API Subscription", "Platform License", "Usage Based Service", ...SHARED_RETAIL],
  TELECOM_SERVICES: ["Mobile Plan", "Broadband Plan", "Lease Line", "SIP Trunk", "DID Number", "IVR Service", "SMS Gateway", "SIM Activation", "Device Plan", "Enterprise Connectivity", ...SHARED_RETAIL],
  COURIER_LOGISTICS: ["Domestic Courier", "International Courier", "Same Day Delivery", "Bulk Logistics", "Warehousing", "Last Mile Delivery", "Freight Forwarding", "Packaging Service", "COD Service", "Reverse Logistics", ...SHARED_RETAIL],
  TRANSPORT_TRAVEL: ["Cab Service", "Bus Ticket", "Train Ticket", "Flight Ticket", "Tour Package", "Hotel Booking", "Travel Insurance", "Visa Service", "Passport Service", "Car Rental", ...SHARED_RETAIL],
  EDUCATION_COACHING: ["Tuition Fee", "Course Fee", "Study Material", "Test Series", "Online Course", "Workshop Fee", "Certification Course", "Language Course", "Skill Training", "Admission Counseling", ...SHARED_RETAIL],
  HEALTHCARE_SERVICES: ["Consultation Fee", "Diagnostic Test", "Health Checkup", "Vaccination", "Physiotherapy", "Dental Service", "Lab Test Package", "Home Care Service", "Medical Report", "Wellness Program", ...SHARED_RETAIL],
  REPAIR_MAINTENANCE: ["Mobile Repair", "Laptop Repair", "Appliance Repair", "AC Repair", "TV Repair", "Vehicle Repair", "Plumbing Service", "Electrical Service", "Carpentry Service", "Annual Maintenance Contract", ...SHARED_RETAIL],
  SECURITY_SERVICES: ["Security Guard Service", "CCTV Monitoring", "Alarm System", "Access Control", "Fire Safety Service", "Security Audit", "Patrol Service", "Event Security", "VIP Security", "Surveillance Service", ...SHARED_RETAIL],
  EVENT_MANAGEMENT: ["Wedding Planning", "Corporate Event", "Birthday Event", "Decoration Service", "Catering Coordination", "Sound & Light", "Photography Service", "Videography Service", "Stage Setup", "Tent House", ...SHARED_RETAIL],
  OTHER: ["General Item", "Miscellaneous Item", "Service Charge", "Labour Charge", "Freight Charge", "Installation Charge", "Consulting Charge", "Custom Item", "Rental Item", "Scrap Item", "Sample Item", "Promotional Item", "Trade Item", "Local Item", "Imported Item", "Combo Item", "Bulk Item", "Seasonal Item", "Festival Item", "Clearance Item", "Demo Item", "Other Item", ...SHARED_RETAIL],
};

// Merge all templates
const allTemplates = { ...CATALOG, ...INDUSTRY_BASE, ...SERVICE_INDUSTRIES };

const entries = [];
const seenGlobal = new Set();
let seq = 1;

for (const industry of INDUSTRY_TYPES) {
  const names = allTemplates[industry] ?? expandIndustry(industry, SHARED_RETAIL);
  const unique = [];
  const seenLocal = new Set();
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const key = `${industry}::${name.toLowerCase()}`;
    if (seenLocal.has(name.toLowerCase())) continue;
    seenLocal.add(name.toLowerCase());
    unique.push(name);
  }
  // pad each industry to at least 28 categories
  let pad = 1;
  while (unique.length < 28) {
    unique.push(`${formatIndustryShort(industry)} Category ${pad}`);
    pad++;
  }
  for (const name of unique) {
    const globalKey = `${industry}::${name.toLowerCase()}`;
    if (seenGlobal.has(globalKey)) continue;
    seenGlobal.add(globalKey);
    entries.push({
      id: `ic_${String(seq).padStart(5, "0")}`,
      name,
      industryType: industry,
    });
    seq++;
  }
}

function formatIndustryShort(industry) {
  return industry
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

// Ensure 2000+
let extra = 1;
while (entries.length < 2000) {
  const industry = INDUSTRY_TYPES[extra % INDUSTRY_TYPES.length];
  const name = `${formatIndustryShort(industry)} Specialty ${Math.floor(extra / INDUSTRY_TYPES.length) + 1}`;
  const globalKey = `${industry}::${name.toLowerCase()}`;
  if (!seenGlobal.has(globalKey)) {
    seenGlobal.add(globalKey);
    entries.push({
      id: `ic_${String(seq).padStart(5, "0")}`,
      name,
      industryType: industry,
    });
    seq++;
  }
  extra++;
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(entries, null, 2) + "\n");
console.log(`Wrote ${entries.length} categories to ${OUT}`);

// stats
const byIndustry = {};
for (const e of entries) byIndustry[e.industryType] = (byIndustry[e.industryType] || 0) + 1;
console.log("Industries:", Object.keys(byIndustry).length, "min:", Math.min(...Object.values(byIndustry)), "max:", Math.max(...Object.values(byIndustry)));
