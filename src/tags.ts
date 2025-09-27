// src/tags.ts

export type Category = "coffee" | "tea" | "refresher" | "energy" | "ale";
export type TagSlug = string;

export type Facet = {
  id: string;
  label: string;
  appliesTo: Category[];
  options: { value: TagSlug; label: string }[];
};

export const TAG_FACETS: Facet[] = [
  /* ---------- universal ---------- */
  {
    id: "temperature",
    label: "Temperature",
    appliesTo: ["coffee", "tea", "refresher", "energy"], // not ale
    options: [
      { value: "hot", label: "Hot" },
      { value: "iced", label: "Iced" },
      { value: "blended", label: "Blended/Frozen" },
    ],
  },
  {
    id: "sweetness",
    label: "Sweetness",
    appliesTo: ["coffee", "tea", "refresher", "energy", "ale"],
    options: [
      { value: "sweet", label: "Sweet" },
      { value: "more-sweet", label: "More Sweet" },
      { value: "less-sweet", label: "Less Sweet" },
      { value: "not-sweet", label: "Not Sweet" },
    ],
  },
  {
    id: "flavor",
    label: "Flavor Notes",
    appliesTo: ["coffee", "tea", "refresher", "energy", "ale"],
    options: [
      { value: "chocolate", label: "Chocolate" },
      { value: "caramel", label: "Caramel" },
      { value: "vanilla", label: "Vanilla" },
      { value: "nutty", label: "Nutty" },
      { value: "spicy", label: "Spicy" },
      { value: "cinnamon", label: "Cinnamon" },
      { value: "floral", label: "Floral" },
      { value: "herbal", label: "Herbal" },
      { value: "earthy", label: "Earthy" },
      { value: "malty", label: "Malty" },
      { value: "smoky", label: "Smoky" },
      { value: "fruity", label: "Fruity" },
      { value: "citrus", label: "Citrus" },
      { value: "berry", label: "Berry" },
      { value: "tropical", label: "Tropical" },
      { value: "stone-fruit", label: "Stone Fruit" },
    ],
  },
  {
    id: "caffeine",
    label: "Caffeine",
    appliesTo: ["coffee", "tea", "refresher", "energy"], // not ale
    options: [
      { value: "decaf", label: "Decaf" },
      { value: "caffeinated", label: "Caffeinated" },
    ],
  },
  {
    id: "dietary",
    label: "Dietary",
    appliesTo: ["coffee", "tea", "refresher", "energy", "ale"],
    options: [
      { value: "dairy-free", label: "Dairy-free" },
      { value: "vegan", label: "Vegan" },
      { value: "gluten-free", label: "Gluten-free" },
      { value: "low-calorie", label: "Low Calorie" },
      { value: "keto-friendly", label: "Keto-friendly" },
      { value: "sugar-free", label: "Sugar Free" },
    ],
  },
  {
    id: "toppings",
    label: "Add-ins & Toppings",
    appliesTo: ["coffee", "tea", "refresher", "energy"], // not ale
    options: [
      { value: "boba", label: "Boba/Tapioca" },
      { value: "mini-boba", label: "Mini Boba" },
      { value: "crystal-boba", label: "Crystal Boba" },
      { value: "popping-boba", label: "Popping Boba" },
      { value: "strawberry-popping-boba", label: "Strawberry Popping Boba" },
      { value: "blueberry-popping-boba", label: "Blueberry Popping Boba" },
      { value: "lychee-popping-boba", label: "Lychee Popping Boba" },
      { value: "peach-popping-boba", label: "Peach Popping Boba" },
      { value: "passionfruit-popping-boba", label: "Passionfruit Popping Boba" },
      { value: "watermelon-popping-boba", label: "Watermelon Popping Boba" },
      { value: "cherry-boba", label: "Cherry Popping Boba" },
      { value: "brown-sugar-pearls", label: "Brown Sugar Pearls" },
      { value: "rainbow-jelly", label: "Rainbow Jelly" },
      { value: "coffee-jelly", label: "Coffee Jelly" },
      { value: "grass-jelly", label: "Grass Jelly" },
      { value: "lychee-jelly", label: "Lychee Jelly" },
      { value: "coconut-jelly", label: "Coconut Jelly" },
      { value: "almond-jelly", label: "Almond Jelly" },
      { value: "egg-pudding", label: "Egg Pudding" },
      { value: "mango-pudding", label: "Mango Pudding" },
      { value: "red-bean", label: "Red Bean" },
      { value: "aloe", label: "Aloe" },
      { value: "fruit-chunks", label: "Fruit Chunks" },
      { value: "chia-seeds", label: "Chia Seeds" },
      { value: "basil-seeds", label: "Basil Seeds" },
      { value: "cold-foam", label: "Cold Foam" },
      { value: "vanilla-cold-foam", label: "Vanilla Cold Foam" },
      { value: "salted-caramel-cold-foam", label: "Salted Caramel Cold Foam" },
      { value: "whipped-cream", label: "Whipped Cream" },
      { value: "cheese-foam", label: "Cheese Foam" },
      { value: "cocoa-dust", label: "Cocoa Dust" },
      { value: "cinnamon-dust", label: "Cinnamon Dust" },
      { value: "sago", label: "Sago" },
    ],
  },

  /* ---------- coffee-only ---------- */
  {
    id: "coffee-brew",
    label: "Brew Method",
    appliesTo: ["coffee"],
    options: [
      { value: "espresso", label: "Espresso" },
      { value: "ristretto", label: "Ristretto" },
      { value: "lungo", label: "Lungo" },
      { value: "americano", label: "Americano" },
      { value: "drip", label: "Drip" },
      { value: "pour-over", label: "Pour-over" },
      { value: "chemex", label: "Chemex" },
      { value: "aeropress", label: "AeroPress" },
      { value: "french-press", label: "French Press" },
      { value: "moka-pot", label: "Moka Pot" },
      { value: "cold-brew", label: "Cold Brew" },
      { value: "nitro", label: "Nitro" },
    ],
  },
  {
    id: "coffee-style",
    label: "Coffee Style",
    appliesTo: ["coffee"],
    options: [
      { value: "latte", label: "Latte" },
      { value: "cappuccino", label: "Cappuccino" },
      { value: "flat-white", label: "Flat White" },
      { value: "cortado", label: "Cortado" },
      { value: "macchiato", label: "Macchiato" },
      { value: "mocha", label: "Mocha" },
      { value: "affogato", label: "Affogato" },
      { value: "espresso-tonic", label: "Espresso Tonic" },
      { value: "einspanner", label: "einspanner" },
    ],
  },
  {
    id: "roast",
    label: "Roast Level",
    appliesTo: ["coffee"],
    options: [
      { value: "light-roast", label: "Light" },
      { value: "medium-roast", label: "Medium" },
      { value: "medium-dark-roast", label: "Medium-Dark" },
      { value: "dark-roast", label: "Dark" },
    ],
  },
  {
    id: "milk",
    label: "Milk",
    appliesTo: ["coffee", "tea"],
    options: [
      { value: "whole-milk", label: "Whole" },
      { value: "two-percent-milk", label: "2%" },          // added earlier
      { value: "skim-milk", label: "Skim" },
      { value: "half-and-half", label: "Breve" },
      { value: "oat-milk", label: "Oat" },
      { value: "almond-milk", label: "Almond" },
      { value: "soy-milk", label: "Soy" },
      { value: "coconut-milk", label: "Coconut" },
      { value: "pistachio-milk", label: "Pistachio" },      // NEW
      { value: "lactose-free-milk", label: "Lactose-free" },
      { value: "condensed-milk", label: "Condensed Milk" },
    ],
  },

  /* ---------- syrups (all except ale) ---------- */
  {
    id: "syrups",
    label: "Syrups",
    appliesTo: ["coffee", "tea", "refresher", "energy"],
    options: [
      // classics
      { value: "vanilla-syrup", label: "Vanilla" },
      { value: "caramel-syrup", label: "Caramel" },
      { value: "hazelnut-syrup", label: "Hazelnut" },
      { value: "toffee-syrup", label: "Toffee" },
      { value: "mocha-syrup", label: "Mocha/Chocolate" },
      { value: "white-chocolate-syrup", label: "White Chocolate" },
      { value: "pumpkin-spice-syrup", label: "Pumpkin Spice" },
      { value: "peppermint-syrup", label: "Peppermint" },

      // sweeteners & bases
      { value: "simple-syrup", label: "Simple Syrup" },
      { value: "brown-sugar-syrup", label: "Brown Sugar" },
      { value: "maple-syrup", label: "Maple" },
      { value: "honey-syrup", label: "Honey" },
      { value: "agave-syrup", label: "Agave" },

      // nutty / dessert
      { value: "pistachio-syrup", label: "Pistachio" },
      { value: "almond-syrup", label: "Almond" },
      { value: "chestnut-praline-syrup", label: "Chestnut Praline" },
      { value: "hazelnut-praline-syrup", label: "Hazelnut Praline" },
      { value: "praline-syrup", label: "Praline" },
      { value: "cookie-butter-syrup", label: "Cookie Butter" },
      { value: "brown-butter-syrup", label: "Brown Butter" },

      // floral / herbal
      { value: "lavender-syrup", label: "Lavender" },
      { value: "rose-syrup", label: "Rose" },
      { value: "elderflower-syrup", label: "Elderflower" },
      { value: "chai-syrup", label: "Chai" },
      { value: "cardamom-syrup", label: "Cardamom" },
      { value: "ginger-syrup", label: "Ginger" },
      { value: "cinnamon-dolce-syrup", label: "Cinnamon Dolce" },
      { value: "gingerbread-syrup", label: "Gingerbread" },

      // vanilla family
      { value: "toasted-vanilla-syrup", label: "Toasted Vanilla" },
      { value: "vanilla-bean-syrup", label: "Vanilla Bean" },
      { value: "salted-vanilla-syrup", label: "Salted Vanilla" },

      // caramel family
      { value: "salted-caramel-syrup", label: "Salted Caramel" },
      { value: "caramel-brulee-syrup", label: "Caramel Brûlée" },

      // coconut / tropical
      { value: "coconut-syrup", label: "Coconut" },

      // fruit-forward
      { value: "raspberry-syrup", label: "Raspberry" },
      { value: "strawberry-syrup", label: "Strawberry" },
      { value: "blackberry-syrup", label: "Blackberry" },
      { value: "blueberry-syrup", label: "Blueberry" },
      { value: "mango-syrup", label: "Mango" },
      { value: "peach-syrup", label: "Peach" },
      { value: "passionfruit-syrup", label: "Passionfruit" },
      { value: "lychee-syrup", label: "Lychee" },
      { value: "pineapple-syrup", label: "Pineapple" },
      { value: "dragonfruit-syrup", label: "Dragonfruit" },
      { value: "watermelon-syrup", label: "Watermelon" },
      { value: "pomegranate-syrup", label: "Pomegranate" },
      { value: "orange-syrup", label: "Orange" },
      { value: "blood-orange-syrup", label: "Blood Orange" },
      { value: "grapefruit-syrup", label: "Grapefruit" },
      { value: "yuzu-syrup", label: "Yuzu" },
      { value: "ube-syrup", label: "Ube" },

      { value: "seasonal-syrup", label: "Seasonal" },
    ],
  },

  /* ---------- tea-only ---------- */
  {
    id: "tea-type",
    label: "Tea Type",
    appliesTo: ["tea"],
    options: [
      { value: "green-tea", label: "Green" },
      { value: "black-tea", label: "Black" },
      { value: "oolong-tea", label: "Oolong" },
      { value: "white-tea", label: "White" },
      { value: "pu-erh-tea", label: "Pu-erh" },
      { value: "herbal-tea", label: "Herbal" },
      { value: "rooibos-tea", label: "Rooibos" },
      { value: "yerba-mate", label: "Yerba Mate" },
      { value: "matcha", label: "Matcha" },
      { value: "hojicha", label: "Hojicha" },
      { value: "jasmine", label: "Jasmine" },
      { value: "earl-grey", label: "Earl Grey" },
      { value: "genmaicha", label: "Genmaicha" },
      { value: "chai", label: "Chai" },
      { value: "thai", label: "Thai" },
      { value: "peppermint", label: "Peppermint" },
      { value: "chamomile", label: "Chamomile" },
      { value: "hibiscus", label: "Hibiscus" },
      { value: "osmanthus", label: "Osmanthus" },
    ],
  },
  {
    id: "tea-style",
    label: "Tea Style",
    appliesTo: ["tea"],
    options: [
      { value: "loose-leaf-tea", label: "Loose Leaf" },   // NEW
      { value: "milk-tea", label: "Milk Tea" },
      { value: "fruit-tea", label: "Fruit Tea" },
      { value: "bubble-tea", label: "Bubble/Boba Tea" },
      { value: "cheese-tea", label: "Cheese Tea" },
      { value: "cold-brew-tea", label: "Cold Brew Tea" },
      { value: "nitro-tea", label: "Nitro Tea" },
      { value: "shaken-tea", label: "Shaken Tea" },
    ],
  },

  /* ---------- refresher-only ---------- */
  {
    id: "refresher-base",
    label: "Base",
    appliesTo: ["refresher"],
    options: [
      { value: "ades", label: "Ades (lemon/lime/etc.)" }, // replaced lemonade
      { value: "still-water", label: "Still Water" },
      { value: "sparkling-water", label: "Sparkling Water" },
      { value: "tonic", label: "Tonic" },
      { value: "coconut-water", label: "Coconut Water" },
      { value: "juice-base", label: "Juice Base" },
      { value: "tea-ade", label: "Tea + Ade" },
    ],
  },
  {
    id: "refresher-fruit",
    label: "Fruit",
    appliesTo: ["refresher"],
    options: [
      { value: "strawberry", label: "Strawberry" },
      { value: "raspberry", label: "Raspberry" },
      { value: "blueberry", label: "Blueberry" },
      { value: "blackberry", label: "Blackberry" },
      { value: "mango", label: "Mango" },
      { value: "peach", label: "Peach" },
      { value: "pineapple", label: "Pineapple" },
      { value: "passionfruit", label: "Passionfruit" },
      { value: "watermelon", label: "Watermelon" },
      { value: "kiwi", label: "Kiwi" },
      { value: "lychee", label: "Lychee" },
      { value: "dragonfruit", label: "Dragonfruit" },
      { value: "pomegranate", label: "Pomegranate" },
      { value: "lemon", label: "Lemon" },
      { value: "lime", label: "Lime" },
      { value: "orange", label: "Orange" },
      { value: "grapefruit", label: "Grapefruit" },
      { value: "yuzu", label: "Yuzu" },
    ],
  },

  /* ---------- herbs & spice (expanded) ---------- */
  {
    id: "herbs-spice",
    label: "Herbs & Spice",
    appliesTo: ["refresher", "tea", "coffee", "energy"],
    options: [
      { value: "mint", label: "Mint" },
      { value: "basil", label: "Basil" },
      { value: "rosemary", label: "Rosemary" },
      { value: "thyme", label: "Thyme" },
      { value: "sage", label: "Sage" },
      { value: "lemongrass", label: "Lemongrass" },
      { value: "ginger", label: "Ginger" },
      { value: "cinnamon-stick", label: "Cinnamon Stick" },
      { value: "cardamom", label: "Cardamom" },
      { value: "clove", label: "Clove" },
      { value: "star-anise", label: "Star Anise" },
      { value: "nutmeg", label: "Nutmeg" },
      { value: "turmeric", label: "Turmeric" },
      { value: "chili", label: "Chili" },
      { value: "jalapeno", label: "Jalapeño" },
      { value: "lavender-herb", label: "Lavender" },
      { value: "kaffir-lime-leaf", label: "Kaffir Lime Leaf" },
    ],
  },

  /* ---------- energy-only ---------- */
  {
    id: "energy-type",
    label: "Energy Type",
    appliesTo: ["energy"],
    options: [
      { value: "classic-energy", label: "Classic Energy" },
      { value: "natural-caffeine", label: "Natural Caffeine" },
      { value: "nootropic", label: "Nootropic Blend" },
      { value: "pre-workout", label: "Pre-Workout Style" },
      { value: "sugar-free-energy", label: "Sugar Free" },
    ],
  },
  {
    id: "energy-carbonation",
    label: "Carbonation",
    appliesTo: ["energy"],
    options: [
      { value: "still", label: "Still" },
      { value: "lightly-carbonated", label: "Lightly Carbonated" },
      { value: "carbonated", label: "Carbonated" },
    ],
  },

  /* ---------- ale-only ---------- */
  {
    id: "ale-style",
    label: "Ale Style",
    appliesTo: ["ale"],
    options: [
      { value: "pale-ale", label: "Pale Ale" },
      { value: "ipa", label: "IPA" },
      { value: "double-ipa", label: "Double IPA" },
      { value: "session-ipa", label: "Session IPA" },
      { value: "amber-ale", label: "Amber Ale" },
      { value: "brown-ale", label: "Brown Ale" },
      { value: "wheat-ale", label: "Wheat Ale" },
      { value: "belgian-ale", label: "Belgian Ale" },
      { value: "saison", label: "Saison" },
      { value: "sour-ale", label: "Sour Ale" },
      { value: "stout", label: "Stout" },
      { value: "porter", label: "Porter" },
      { value: "hefeweizen", label: "Hefeweizen" },
    ],
  },
] as const;

/* flat unique list of all tag slugs */
export const ALL_TAG_SLUGS: TagSlug[] = Array.from(
  new Set(TAG_FACETS.flatMap(f => f.options.map(o => o.value)))
);
