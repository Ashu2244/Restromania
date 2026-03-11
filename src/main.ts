import './style.css'
import Fuse from 'fuse.js'

type MenuItem = {
  id: string
  name: string
  price: number
  aliases: string[]
  unit?: 'plate' | 'pcs' | 'bottle' | 'glass'
}

type BillLine = {
  id: string
  name: string
  qty: number
  price: number
}

declare global {
  // Web Speech API typing (Chrome uses webkitSpeechRecognition)
  interface Window {
    webkitSpeechRecognition?: any
    SpeechRecognition?: any
  }
}

// Kitchen Garden (from provided menu images). Note: If you already edited menu in-app,
// localStorage will keep your custom menu.
const DEFAULT_MENU: MenuItem[] = [
  // DAL
  { id: 'dal_makhni', name: 'Dal Makhni', price: 209, unit: 'plate', aliases: ['dal makhni', 'dal makhani', 'dal makhani', 'मखनी दाल', 'दाल मखनी', 'डाल मखनी'] },
  { id: 'dal_punjabi_tadka', name: 'Dal Punjabi Tadka', price: 199, unit: 'plate', aliases: ['dal punjabi tadka', 'punjabi tadka dal', 'तड़का दाल', 'पंजाबी तड़का', 'दाल पंजाबी तड़का', 'डाल पंजाबी तड़का'] },
  { id: 'dal_handi', name: 'Dal Handi', price: 219, unit: 'plate', aliases: ['dal handi', 'handi dal', 'हांडी दाल', 'दाल हांडी', 'डाल हांडी'] },
  { id: 'dal_punchmail', name: 'Dal Punchmail', price: 199, unit: 'plate', aliases: ['dal punchmail', 'dal panchmel', 'panchmel dal', 'पंचमेल दाल', 'पंचमेल'] },
  { id: 'dal_bukhara', name: 'Dal Bukhara', price: 219, unit: 'plate', aliases: ['dal bukhara', 'bukhara dal', 'बुखारा दाल'] },
  { id: 'zeera_hing_dal', name: 'Zeera Hing Dal', price: 199, unit: 'plate', aliases: ['zeera hing dal', 'jeera hing dal', 'जिरा हिंग दाल', 'जीरा हिंग'] },
  { id: 'dal_peshawari', name: 'Dal Peshawari', price: 209, unit: 'plate', aliases: ['dal peshawari', 'peshawari dal', 'पेशावरी दाल'] },
  { id: 'rajma_rasila', name: 'Rajma Rasila', price: 199, unit: 'plate', aliases: ['rajma rasila', 'rajma', 'राजमा'] },
  { id: 'dhaba_dal', name: 'Dhaba Dal', price: 199, unit: 'plate', aliases: ['dhaba dal', 'dhaba wali dal', 'ढाबा दाल'] },

  // PANEER / MAIN COURSE
  { id: 'paneer_lababdar', name: 'Paneer Lababdar', price: 269, unit: 'plate', aliases: ['paneer lababdar', 'lababdar paneer', 'पनीर लबाबदार'] },
  { id: 'paneer_khurchan', name: 'Paneer Khurchan', price: 279, unit: 'plate', aliases: ['paneer khurchan', 'khurchan paneer', 'पनीर खुर्चन'] },
  { id: 'paneer_saag_wala', name: 'Paneer Saag Wala', price: 259, unit: 'plate', aliases: ['paneer saag wala', 'saag paneer', 'पनीर साग'] },
  { id: 'kadhai_paneer', name: 'Kadhai Paneer', price: 279, unit: 'plate', aliases: ['kadhai paneer', 'kadai paneer', 'कढ़ाई पनीर', 'कड़ाही पनीर'] },
  { id: 'paneer_tofani', name: 'Paneer Tofani', price: 285, unit: 'plate', aliases: ['paneer tofani', 'paneer tofaani', 'पनीर तूफानी'] },
  { id: 'paneer_butter_masala', name: 'Paneer Butter Masala', price: 259, unit: 'plate', aliases: ['paneer butter masala', 'pbm', 'पनीर बटर मसाला'] },
  { id: 'paneer_tikka_aachari_masala', name: 'Paneer Tikka Aachari Masala', price: 299, unit: 'plate', aliases: ['paneer tikka aachari masala', 'achari paneer tikka masala', 'अचारी पनीर'] },
  { id: 'sahi_paneer_red', name: 'Sahi Paneer (Red Gravy)', price: 249, unit: 'plate', aliases: ['sahi paneer red', 'sahi paneer', 'शाही पनीर', 'शाही पनीर रेड'] },
  { id: 'sahi_paneer_white', name: 'Sahi Paneer (White Gravy)', price: 259, unit: 'plate', aliases: ['sahi paneer white', 'white gravy sahi paneer', 'शाही पनीर व्हाइट'] },
  { id: 'paneer_psanda', name: 'Paneer Psanda', price: 269, unit: 'plate', aliases: ['paneer psanda', 'paneer pasanda', 'पनीर पसंदा'] },
  { id: 'paneer_tikka_tak', name: 'Paneer Tikka Tak', price: 269, unit: 'plate', aliases: ['paneer tikka tak', 'tikka tak', 'पनीर टिक्का'] },
  { id: 'cheese_tomato', name: 'Cheese Tomato', price: 249, unit: 'plate', aliases: ['cheese tomato', 'tomato cheese', 'चीज़ टमाटर'] },

  // CHINESE (VEG)
  { id: 'paneer_chilly_gravy', name: 'Paneer Chilly Gravy', price: 270, unit: 'plate', aliases: ['paneer chilli gravy', 'paneer chilly gravy', 'chilli paneer gravy'] },
  { id: 'paneer_chilly_dry', name: 'Paneer Chilly Dry', price: 250, unit: 'plate', aliases: ['paneer chilli dry', 'paneer chilly dry', 'chilli paneer dry'] },
  { id: 'chilly_potato', name: 'Chilly Potato', price: 195, unit: 'plate', aliases: ['chilli potato', 'chilly potato'] },
  { id: 'honey_chilly_cauliflower', name: 'Honey Chilly Cauliflower', price: 199, unit: 'plate', aliases: ['honey chilli cauliflower', 'honey chilly cauliflower', 'honey gobhi', 'honey chili cauliflower'] },
  { id: 'honey_chilly_potato', name: 'Honey Chilly Potato', price: 199, unit: 'plate', aliases: ['honey chilli potato', 'honey chilly potato'] },
  { id: 'mushroom_chilly_gravy', name: 'Mushroom Chilly Gravy', price: 250, unit: 'plate', aliases: ['mushroom chilli gravy', 'mushroom chilly gravy'] },
  { id: 'mushroom_chilly_dry', name: 'Mushroom Chilly Dry', price: 240, unit: 'plate', aliases: ['mushroom chilli dry', 'mushroom chilly dry'] },
  { id: 'veg_chops', name: 'Veg Chops', price: 185, unit: 'plate', aliases: ['veg chops', 'vegetable chops'] },
  { id: 'cheese_spring_roll', name: 'Cheese Spring Roll', price: 115, unit: 'plate', aliases: ['cheese spring roll', 'spring roll cheese'] },
  { id: 'veg_manchurian_gravy', name: 'Veg Manchurian Gravy', price: 220, unit: 'plate', aliases: ['veg manchurian gravy', 'manchurian gravy'] },
  { id: 'veg_manchurian_dry', name: 'Veg Manchurian Dry', price: 200, unit: 'plate', aliases: ['veg manchurian dry', 'manchurian dry'] },
  { id: 'cheese_manchurian_gravy', name: 'Cheese Manchurian Gravy', price: 260, unit: 'plate', aliases: ['cheese manchurian gravy'] },
  { id: 'cheese_manchurian_dry', name: 'Cheese Manchurian Dry', price: 250, unit: 'plate', aliases: ['cheese manchurian dry'] },
  { id: 'veg_fried_rice', name: 'Veg Fried Rice', price: 170, unit: 'plate', aliases: ['veg fried rice', 'fried rice veg'] },
  { id: 'cheese_finger', name: 'Cheese Finger', price: 190, unit: 'plate', aliases: ['cheese finger', 'cheese fingers'] },
  { id: 'cheese_kukura', name: 'Cheese Kukura', price: 200, unit: 'plate', aliases: ['cheese kukura'] },
  { id: 'mushroom_fried_rice', name: 'Mushroom Fried Rice', price: 190, unit: 'plate', aliases: ['mushroom fried rice'] },
  { id: 'cheese_fried_rice', name: 'Cheese Fried Rice', price: 199, unit: 'plate', aliases: ['cheese fried rice'] },
  { id: 'crispy_veg', name: 'Crispy Veg', price: 195, unit: 'plate', aliases: ['crispy veg', 'crispy vegetables'] },
  { id: 'corn_salt_n_pepper', name: "Corn Salt 'N' Pepper (Crispy Corn)", price: 175, unit: 'plate', aliases: ['crispy corn', 'corn salt n pepper', 'corn salt and pepper', 'salt and pepper corn'] },

  // CHINESE (NON-VEG)
  { id: 'chicken_fried_rice', name: 'Chicken Fried Rice', price: 210, unit: 'plate', aliases: ['chicken fried rice'] },
  { id: 'egg_fried_rice', name: 'Egg Fried Rice', price: 199, unit: 'plate', aliases: ['egg fried rice'] },
  { id: 'chilli_chicken_dry_half', name: 'Chilli Chicken Dry (Half)', price: 260, unit: 'plate', aliases: ['chilli chicken dry half', 'chili chicken dry half', 'chilli chicken dry'] },
  { id: 'chilli_chicken_dry_full', name: 'Chilli Chicken Dry (Full)', price: 480, unit: 'plate', aliases: ['chilli chicken dry full', 'chili chicken dry full'] },
  { id: 'chilli_chicken_gravy_half', name: 'Chilli Chicken Gravy (Half)', price: 270, unit: 'plate', aliases: ['chilli chicken gravy half', 'chili chicken gravy half', 'chilli chicken gravy'] },
  { id: 'chilli_chicken_gravy_full', name: 'Chilli Chicken Gravy (Full)', price: 490, unit: 'plate', aliases: ['chilli chicken gravy full', 'chili chicken gravy full'] },
  { id: 'garlic_chicken_half', name: 'Garlic Chicken (Half)', price: 260, unit: 'plate', aliases: ['garlic chicken half', 'garlic chicken'] },
  { id: 'garlic_chicken_full', name: 'Garlic Chicken (Full)', price: 480, unit: 'plate', aliases: ['garlic chicken full'] },
  { id: 'chicken_manchurian_dry_half', name: 'Chicken Manchurian Dry (Half)', price: 260, unit: 'plate', aliases: ['chicken manchurian dry half', 'manchurian chicken dry half', 'chicken manchurian dry'] },
  { id: 'chicken_manchurian_dry_full', name: 'Chicken Manchurian Dry (Full)', price: 470, unit: 'plate', aliases: ['chicken manchurian dry full'] },
  { id: 'chicken_manchurian_gravy_half', name: 'Chicken Manchurian Gravy (Half)', price: 270, unit: 'plate', aliases: ['chicken manchurian gravy half', 'chicken manchurian gravy'] },
  { id: 'chicken_manchurian_gravy_full', name: 'Chicken Manchurian Gravy (Full)', price: 480, unit: 'plate', aliases: ['chicken manchurian gravy full'] },
  { id: 'chicken_golden_fry_half', name: 'Chicken Golden Fry (Half)', price: 250, unit: 'plate', aliases: ['chicken golden fry half', 'golden fry half'] },
  { id: 'chicken_golden_fry_full', name: 'Chicken Golden Fry (Full)', price: 470, unit: 'plate', aliases: ['chicken golden fry full', 'golden fry full'] },
  { id: 'chicken_65', name: 'Chicken 65', price: 299, unit: 'plate', aliases: ['chicken 65', 'chicken sixty five', 'चिकन 65'] },
  { id: 'chicken_lollipop_half', name: 'Chicken Lollipop (Half)', price: 250, unit: 'plate', aliases: ['chicken lollipop half', 'lollipop chicken half', 'chicken lollipop'] },
  { id: 'chicken_lollipop_full', name: 'Chicken Lollipop (Full)', price: 460, unit: 'plate', aliases: ['chicken lollipop full', 'lollipop chicken full'] },
  { id: 'egg_chilli', name: 'Egg Chilli', price: 270, unit: 'plate', aliases: ['egg chilli', 'egg chilly'] },

  // FISH (CHINESE)
  { id: 'fish_pakoda', name: 'Fish Pakoda', price: 330, unit: 'plate', aliases: ['fish pakoda', 'fish pakora'] },
  { id: 'fish_chips', name: 'Fish Chips', price: 330, unit: 'plate', aliases: ['fish chips'] },
  { id: 'amritsari_fish', name: 'Amritsari Fish', price: 345, unit: 'plate', aliases: ['amritsari fish', 'amritsari'] },
  { id: 'fish_finger', name: 'Fish Finger', price: 320, unit: 'plate', aliases: ['fish finger', 'fish fingers'] },

  // SOUPS
  { id: 'veg_soup', name: 'Veg Soup', price: 75, unit: 'plate', aliases: ['veg soup', 'vegetable soup'] },
  { id: 'tomato_soup', name: 'Tomato Soup', price: 75, unit: 'plate', aliases: ['tomato soup'] },
  { id: 'hot_n_sour_veg', name: 'Hot N Sour (Veg)', price: 85, unit: 'plate', aliases: ['hot n sour veg', 'hot and sour veg', 'hot and sour soup'] },
  { id: 'cream_of_mushroom', name: 'Cream Of Mushroom', price: 95, unit: 'plate', aliases: ['cream of mushroom', 'mushroom cream soup'] },
  { id: 'veg_manchow_soup', name: 'Veg Manchow Soup', price: 99, unit: 'plate', aliases: ['veg manchow soup', 'manchow veg'] },
  { id: 'lemon_coriander_veg', name: 'Lemon Coriander Soup (Veg)', price: 99, unit: 'plate', aliases: ['lemon coriander veg', 'lemon coriander soup veg', 'lemon coriander soup'] },
  { id: 'veg_clear_soup', name: 'Veg Clear Soup', price: 79, unit: 'plate', aliases: ['veg clear soup', 'clear soup veg'] },
  { id: 'chicken_soup', name: 'Chicken Soup', price: 130, unit: 'plate', aliases: ['chicken soup'] },
  { id: 'cream_of_chicken', name: 'Cream of Chicken', price: 140, unit: 'plate', aliases: ['cream of chicken', 'chicken cream soup'] },
  { id: 'chicken_manchow_soup', name: 'Chicken Manchow Soup', price: 140, unit: 'plate', aliases: ['chicken manchow soup'] },
  { id: 'lemon_coriander_chicken', name: 'Chicken Lemon Coriander', price: 150, unit: 'plate', aliases: ['chicken lemon coriander', 'lemon coriander chicken'] },
  { id: 'hot_n_sour_chicken', name: 'Chicken Hot N Sour', price: 145, unit: 'plate', aliases: ['chicken hot n sour', 'hot n sour chicken'] },

  // STARTERS (VEG)
  { id: 'paneer_65', name: 'Paneer 65 (8pc)', price: 230, unit: 'plate', aliases: ['paneer 65', 'paneer sixty five'] },
  { id: 'paneer_papad_kabab', name: 'Paneer Papad Kabab', price: 230, unit: 'plate', aliases: ['paneer papad kabab', 'paneer papad kebab'] },
  { id: 'veg_spring_roll', name: 'Veg Spring Roll', price: 99, unit: 'plate', aliases: ['veg spring roll', 'spring roll veg'] },
  { id: 'finger_chips', name: 'Finger Chips', price: 99, unit: 'plate', aliases: ['finger chips', 'french fries', 'fries'] },
  { id: 'cheese_corn_ball', name: 'Cheese Corn Ball', price: 250, unit: 'plate', aliases: ['cheese corn ball', 'corn ball'] },
  { id: 'hong_kong_kabab', name: 'Hong Kong Kabab', price: 250, unit: 'plate', aliases: ['hong kong kabab', 'hong kong kebab'] },

  // STARTERS (NON-VEG) + EGGS
  { id: 'chicken_spring_roll', name: 'Chicken Spring Roll', price: 200, unit: 'plate', aliases: ['chicken spring roll'] },
  { id: 'egg_omlete', name: 'Egg Omlete', price: 70, unit: 'plate', aliases: ['egg omelete', 'egg omelette', 'omelet'] },
  { id: 'egg_bhurji', name: 'Egg Bhurji', price: 75, unit: 'plate', aliases: ['egg bhurji', 'anda bhurji', 'अंडा भुर्जी'] },
  { id: 'egg_half_fried', name: 'Egg Half Fried', price: 60, unit: 'plate', aliases: ['egg half fried', 'half fry', 'anda half fry'] },
  { id: 'boiled_egg', name: 'Boiled Egg', price: 50, unit: 'plate', aliases: ['boiled egg', 'anda boil', 'अंडा उबला'] },

  // SANDWICH & TOAST
  { id: 'veg_sandwich', name: 'Veg Sandwich', price: 85, unit: 'plate', aliases: ['veg sandwich', 'vegetable sandwich'] },
  { id: 'cheese_sandwich', name: 'Cheese Sandwich', price: 100, unit: 'plate', aliases: ['cheese sandwich'] },
  { id: 'grilled_sandwich', name: 'Grilled Sandwich', price: 130, unit: 'plate', aliases: ['grilled sandwich'] },
  { id: 'butter_toast', name: 'Butter Toast', price: 50, unit: 'plate', aliases: ['butter toast', 'toast butter'] },
  { id: 'jam_toast', name: 'Jam Toast', price: 40, unit: 'plate', aliases: ['jam toast'] },
  { id: 'jam_bread', name: 'Jam Bread', price: 40, unit: 'plate', aliases: ['jam bread'] },
  { id: 'bread_omlete', name: 'Bread Omlete', price: 95, unit: 'plate', aliases: ['bread omelete', 'bread omelette', 'bread omlete'] },

  // PAKODA
  { id: 'veg_pakoda', name: 'Veg Pakoda (12pc)', price: 150, unit: 'plate', aliases: ['veg pakoda', 'veg pakora', 'pakoda'] },
  { id: 'paneer_pakoda', name: 'Paneer Pakoda (12pc)', price: 240, unit: 'plate', aliases: ['paneer pakoda', 'paneer pakora'] },
  { id: 'kg_special_pakoda', name: 'Kitchen Garden Special Pakoda (12pc)', price: 170, unit: 'plate', aliases: ['kitchen garden special pakoda', 'kg special pakoda', 'special pakoda'] },
  { id: 'chicken_pakoda_half', name: 'Chicken Pakoda (Half)', price: 245, unit: 'plate', aliases: ['chicken pakoda half', 'chicken pakora half', 'chicken pakoda'] },
  { id: 'chicken_pakoda_full', name: 'Chicken Pakoda (Full)', price: 450, unit: 'plate', aliases: ['chicken pakoda full', 'chicken pakora full'] },
  { id: 'mushroom_pakoda', name: 'Mushroom Pakoda', price: 200, unit: 'plate', aliases: ['mushroom pakoda', 'mushroom pakora'] },

  // PEANUT & PAPPAD
  { id: 'fried_pappad', name: 'Fried Pappad', price: 35, unit: 'plate', aliases: ['fried pappad', 'papad fry', 'papad'] },
  { id: 'roasted_pappad', name: 'Roasted Pappad', price: 35, unit: 'plate', aliases: ['roasted pappad', 'roast papad'] },
  { id: 'masala_pappad', name: 'Masala Pappad', price: 110, unit: 'plate', aliases: ['masala pappad', 'masala papad'] },
  { id: 'peanut_masala', name: 'Peanut Masala', price: 120, unit: 'plate', aliases: ['peanut masala', 'mungfali masala', 'मूंगफली'] },

  // BEVERAGES (SHAKES)
  { id: 'oreo_bliss_thick_shake', name: 'Oreo Bliss Thick Shake', price: 130, unit: 'glass', aliases: ['oreo thick shake', 'oreo shake', 'oreo bliss'] },
  { id: 'skit_kitkat_thick_shake', name: 'Skit Kitkat Thick Shake', price: 120, unit: 'glass', aliases: ['kitkat thick shake', 'kitkat shake', 'skit kitkat'] },
  { id: 'butterscotch_thick_shake', name: 'Butterscotch Thick Shake', price: 100, unit: 'glass', aliases: ['butterscotch thick shake', 'butterscotch shake'] },
  { id: 'vanilla_milk_shake', name: 'Vanilla Milk Shake', price: 90, unit: 'glass', aliases: ['vanilla milk shake', 'vanilla shake'] },
  { id: 'banana_milk_shake', name: 'Banana Milk Shake', price: 110, unit: 'glass', aliases: ['banana milk shake', 'banana shake'] },
  { id: 'mango_milk_shake', name: 'Mango Milk Shake', price: 110, unit: 'glass', aliases: ['mango milk shake', 'mango shake'] },
  { id: 'dry_fruit_milk_shake', name: 'Dry Fruit Milk Shake', price: 140, unit: 'glass', aliases: ['dry fruit milk shake', 'dry fruit shake', 'dryfruit shake'] },

  // BEVERAGES (MOJITO)
  { id: 'sprite_min_mojito', name: 'Sprite Min Mojito', price: 100, unit: 'glass', aliases: ['sprite mojito', 'mint mojito', 'sprite min mojito'] },
  { id: 'virgin_mojito', name: 'Virgin Mojito', price: 90, unit: 'glass', aliases: ['virgin mojito'] },
  { id: 'watermelon_mojito', name: 'Watermelon Mojito', price: 90, unit: 'glass', aliases: ['watermelon mojito', 'water melon mojito'] },

  // FISH (TANDOOR seasonal)
  { id: 'fish_tikka', name: 'Fish Tikka', price: 349, unit: 'plate', aliases: ['fish tikka'] },
  { id: 'fish_afgan_tikka', name: 'Fish Afgan Tikka', price: 369, unit: 'plate', aliases: ['fish afgan tikka', 'fish afghan tikka'] },
  { id: 'fish_malai_tikka', name: 'Fish Malai Tikka', price: 359, unit: 'plate', aliases: ['fish malai tikka'] },
  { id: 'fish_achari_tikka', name: 'Fish Achari Tikka', price: 349, unit: 'plate', aliases: ['fish achari tikka'] },
  { id: 'fish_hara_masala', name: 'Fish Hara Masala', price: 369, unit: 'plate', aliases: ['fish hara masala', 'hara fish'] },
  { id: 'fish_angara_tikka', name: 'Fish Angara Tikka', price: 379, unit: 'plate', aliases: ['fish angara tikka', 'angara fish tikka'] },

  // FISH (Chinese seasonal)
  { id: 'fish_fried', name: 'Fish Fried', price: 340, unit: 'plate', aliases: ['fish fried'] },
  { id: 'amritsari_fish_seasonal', name: 'Amritsari Fish (Seasonal)', price: 350, unit: 'plate', aliases: ['amritsari fish seasonal', 'amritsari fish'] },
  { id: 'fish_n_chips', name: "Fish 'N' Chips", price: 340, unit: 'plate', aliases: ['fish n chips', 'fish and chips'] },
]

const MENU_VERSION = 2

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

app.innerHTML = `
  <div class="container">
    <header class="header">
      <div>
        <div class="title">Voice Billing (Waiter बोलके bill)</div>
        <div class="subtitle">Waiter phone → Counter PC. Example: “2 butter roti, 1 paneer butter masala”</div>
      </div>
      <div class="header-actions">
        <div class="seg">
          <button id="navLocal" class="segBtn" type="button">Local</button>
          <button id="navWaiter" class="segBtn" type="button">Waiter</button>
          <button id="navCounter" class="segBtn" type="button">Counter</button>
        </div>
        <label class="field">
          <span>Language</span>
          <select id="lang">
            <option value="hi-IN" selected>Hindi (hi-IN)</option>
            <option value="en-IN">English (en-IN)</option>
          </select>
        </label>
        <button id="newBill" class="btn secondary" type="button">New bill</button>
      </div>
    </header>

    <section class="panel">
      <div class="panel-title">Connection</div>
      <div class="row">
        <label class="field grow">
          <span>Server URL (manager PC)</span>
          <input id="serverUrl" class="textInput" placeholder="http://192.168.0.10:4000" />
        </label>
        <label class="field">
          <span>Table</span>
          <input id="tableId" class="textInput" style="min-width:120px;" placeholder="T-5" />
        </label>
        <button id="saveConn" class="btn secondary" type="button">Save</button>
        <button id="checkConn" class="btn ghost" type="button">Check</button>
        <div id="connStatus" class="status">Offline</div>
      </div>
      <div class="hint">Waiter phone aur counter PC same Wi‑Fi par hon. Counter PC ka IP: ipconfig se dekhein.</div>
    </section>

    <div id="viewLocalWaiter">
      <section class="panel">
        <div class="panel-title">Speak / Type order</div>
        <div class="row">
          <button id="micBtn" class="btn" type="button">Start mic</button>
          <button id="parseBtn" class="btn secondary" type="button">Add to bill</button>
          <button id="clearText" class="btn ghost" type="button">Clear</button>
          <div id="micStatus" class="status">Mic: idle</div>
        </div>
        <textarea id="orderText" class="textarea" placeholder="Type here or use mic..."></textarea>
        <div class="hint" id="hint"></div>
      </section>

      <section class="grid">
        <div class="panel">
          <div class="panel-title" id="billTitle">Bill</div>
          <div class="tableWrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="num">Qty</th>
                  <th class="num">Rate</th>
                  <th class="num">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="billBody"></tbody>
            </table>
          </div>
          <div class="totalRow">
            <div class="totalLabel">Total</div>
            <div class="totalValue" id="total">₹0</div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">Menu (edit prices)</div>
          <div class="menuActions">
            <button id="addMenuItem" class="btn ghost" type="button">+ Add item</button>
            <button id="importMenu" class="btn ghost" type="button">Import</button>
            <button id="exportMenu" class="btn ghost" type="button">Export</button>
          </div>
          <div class="tableWrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="num">Rate</th>
                  <th>Aliases (comma separated)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="menuBody"></tbody>
            </table>
          </div>
          <div class="hint">
            Tip: Waiter jo bolta hai, usi spelling/words ko aliases me add kar do. App fuzzy match bhi karta hai.
          </div>
        </div>
      </section>
    </div>

    <div id="viewCounter" class="hidden">
      <section class="gridCounter">
        <div class="panel">
          <div class="panel-title">Open tables</div>
          <div class="tableList" id="openOrders"></div>
        </div>
        <div class="panel">
          <div class="panel-title">Selected bill</div>
          <div id="counterBill" class="muted" style="padding:10px;">Select a table</div>
        </div>
      </section>
    </div>

    <div id="modalBackdrop" class="modalBackdrop hidden" role="dialog" aria-modal="true">
      <div class="modal">
        <div class="modalTitle">Import menu</div>
        <div class="modalText">
          Paste lines in any of these formats:
          <div class="mono">Butter Roti,20,butter roti|बटर रोटी</div>
          <div class="mono">Paneer Masala - 220 - paneer masala | pbm | पनीर मसाला</div>
          <div class="mono">Water Bottle ₹20</div>
        </div>
        <textarea id="importText" class="textarea" placeholder="Paste menu lines here..."></textarea>
        <div class="row" style="justify-content:flex-end; margin-top:10px;">
          <button id="closeModal" class="btn secondary" type="button">Cancel</button>
          <button id="applyImport" class="btn" type="button">Import</button>
        </div>
      </div>
    </div>
  </div>
`

const els = {
  navLocal: document.querySelector<HTMLButtonElement>('#navLocal')!,
  navWaiter: document.querySelector<HTMLButtonElement>('#navWaiter')!,
  navCounter: document.querySelector<HTMLButtonElement>('#navCounter')!,
  lang: document.querySelector<HTMLSelectElement>('#lang')!,
  micBtn: document.querySelector<HTMLButtonElement>('#micBtn')!,
  parseBtn: document.querySelector<HTMLButtonElement>('#parseBtn')!,
  clearText: document.querySelector<HTMLButtonElement>('#clearText')!,
  newBill: document.querySelector<HTMLButtonElement>('#newBill')!,
  micStatus: document.querySelector<HTMLDivElement>('#micStatus')!,
  orderText: document.querySelector<HTMLTextAreaElement>('#orderText')!,
  billBody: document.querySelector<HTMLTableSectionElement>('#billBody')!,
  total: document.querySelector<HTMLDivElement>('#total')!,
  hint: document.querySelector<HTMLDivElement>('#hint')!,
  menuBody: document.querySelector<HTMLTableSectionElement>('#menuBody')!,
  addMenuItem: document.querySelector<HTMLButtonElement>('#addMenuItem')!,
  importMenu: document.querySelector<HTMLButtonElement>('#importMenu')!,
  exportMenu: document.querySelector<HTMLButtonElement>('#exportMenu')!,
  modalBackdrop: document.querySelector<HTMLDivElement>('#modalBackdrop')!,
  importText: document.querySelector<HTMLTextAreaElement>('#importText')!,
  closeModal: document.querySelector<HTMLButtonElement>('#closeModal')!,
  applyImport: document.querySelector<HTMLButtonElement>('#applyImport')!,
  viewLocalWaiter: document.querySelector<HTMLDivElement>('#viewLocalWaiter')!,
  viewCounter: document.querySelector<HTMLDivElement>('#viewCounter')!,
  billTitle: document.querySelector<HTMLDivElement>('#billTitle')!,
  serverUrl: document.querySelector<HTMLInputElement>('#serverUrl')!,
  tableId: document.querySelector<HTMLInputElement>('#tableId')!,
  saveConn: document.querySelector<HTMLButtonElement>('#saveConn')!,
  checkConn: document.querySelector<HTMLButtonElement>('#checkConn')!,
  connStatus: document.querySelector<HTMLDivElement>('#connStatus')!,
  openOrders: document.querySelector<HTMLDivElement>('#openOrders')!,
  counterBill: document.querySelector<HTMLDivElement>('#counterBill')!,
}

let menu: MenuItem[] = loadMenu()
let bill: BillLine[] = []
let selectedMenuId: string | null = null
let counterSelectedTableId: string | null = null
let counterPollTimer: number | null = null

type Mode = 'local' | 'waiter' | 'counter'
let mode: Mode = 'local'

function getModeFromHash(): Mode {
  const h = (location.hash || '').replace('#', '').toLowerCase()
  if (h === 'waiter') return 'waiter'
  if (h === 'counter') return 'counter'
  return 'local'
}

function setMode(next: Mode) {
  mode = next
  location.hash = next === 'local' ? '' : `#${next}`

  els.navLocal.classList.toggle('active', mode === 'local')
  els.navWaiter.classList.toggle('active', mode === 'waiter')
  els.navCounter.classList.toggle('active', mode === 'counter')

  els.viewLocalWaiter.classList.toggle('hidden', mode === 'counter')
  els.viewCounter.classList.toggle('hidden', mode !== 'counter')

  els.billTitle.textContent = mode === 'waiter' ? 'Preview (will send to counter)' : 'Bill'
  els.parseBtn.textContent = mode === 'waiter' ? 'Send to counter' : 'Add to bill'

  if (mode === 'counter') startCounterPolling()
  else stopCounterPolling()

  els.hint.textContent = ''
  updateConnStatus()
}

function getConn() {
  const serverUrl = (els.serverUrl.value || '').trim()
  const tableId = (els.tableId.value || '').trim() || 'T-1'
  return { serverUrl, tableId }
}

function saveConn() {
  const { serverUrl, tableId } = getConn()
  localStorage.setItem('vb_server_url', serverUrl)
  localStorage.setItem('vb_table_id', tableId)
  updateConnStatus(true)
}

function loadConn() {
  const isLocal =
    typeof location !== 'undefined' &&
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  const defaultServer = isLocal ? 'http://localhost:4000' : window.location.origin
  els.serverUrl.value = localStorage.getItem('vb_server_url') || defaultServer
  els.tableId.value = localStorage.getItem('vb_table_id') || 'T-1'
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Render free tier cold start ~60s; use long timeout + retry
const CONN_CHECK_TIMEOUT_MS = 70000
const CONN_CHECK_RETRIES = 2

async function updateConnStatus(force = false) {
  const { serverUrl } = getConn()
  if (!serverUrl) {
    els.connStatus.textContent = 'Offline'
    return
  }
  if (!force && mode !== 'waiter' && mode !== 'counter') return

  const base = serverUrl.replace(/\/+$/, '')
  const url = `${base}/api/orders/open`

  els.connStatus.textContent = 'Checking…'
  for (let attempt = 1; attempt <= CONN_CHECK_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const t = setTimeout(() => controller.abort(), CONN_CHECK_TIMEOUT_MS)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(t)
      if (res.ok) {
        els.connStatus.textContent = 'Online'
        return
      }
      throw new Error(`HTTP ${res.status}`)
    } catch {
      if (attempt < CONN_CHECK_RETRIES) {
        els.connStatus.textContent = `Waking up… (${attempt}/${CONN_CHECK_RETRIES})`
        await new Promise((r) => setTimeout(r, 8000))
      } else {
        els.connStatus.textContent = 'Offline (retry Save)'
      }
    }
  }
}

function loadMenu(): MenuItem[] {
  const raw = localStorage.getItem('vb_menu')
  const v = Number(localStorage.getItem('vb_menu_version') || 0)
  if (!raw || v !== MENU_VERSION) {
    localStorage.setItem('vb_menu_version', String(MENU_VERSION))
    localStorage.setItem('vb_menu', JSON.stringify(DEFAULT_MENU))
    return DEFAULT_MENU
  }
  try {
    const parsed = JSON.parse(raw) as MenuItem[]
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_MENU
    return parsed
  } catch {
    return DEFAULT_MENU
  }
}

function saveMenu() {
  localStorage.setItem('vb_menu_version', String(MENU_VERSION))
  localStorage.setItem('vb_menu', JSON.stringify(menu))
}

function makeId(name: string) {
  const base = normalizeText(name).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return base ? base.slice(0, 40) : `item_${Date.now()}`
}

function formatINR(n: number) {
  return `₹${Math.round(n)}`
}

function buildFuse() {
  return new Fuse(menu, {
    includeScore: true,
    threshold: 0.35,
    keys: ['name', 'aliases'],
    ignoreLocation: true,
  })
}

function normalizeText(s: string) {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[.]/g, ' ')
    .replace(/[\u2013\u2014]/g, '-') // dashes
    // Common Hindi speech-to-text variants
    .replace(/ड़/g, 'ड़')
    .replace(/ढ़/g, 'ढ़')
    .replace(/पाँच/g, 'पांच')
    .replace(/डाल/g, 'दाल')
    .replace(/दल/g, 'दाल')
    .replace(/\s+/g, ' ')
    .trim()
}

const HINDI_DIGITS: Record<string, string> = {
  '०': '0',
  '१': '1',
  '२': '2',
  '३': '3',
  '४': '4',
  '५': '5',
  '६': '6',
  '७': '7',
  '८': '8',
  '९': '9',
}

function toAsciiDigits(s: string) {
  return s.replace(/[०-९]/g, (d) => HINDI_DIGITS[d] ?? d)
}

// NOTE: Avoid \b word-boundary because it is unreliable for Devanagari text.
const NUMBER_WORDS: Array<[RegExp, number]> = [
  [/(^|\s)(ek|एक|one)(\s|$)/g, 1],
  [/(^|\s)(do|दो|two)(\s|$)/g, 2],
  [/(^|\s)(teen|तीन|three)(\s|$)/g, 3],
  [/(^|\s)(cha?r|चार|four)(\s|$)/g, 4],
  [/(^|\s)(paanch|पांच|five)(\s|$)/g, 5],
  [/(^|\s)(chhe|छह|six)(\s|$)/g, 6],
  [/(^|\s)(saat|सात|seven)(\s|$)/g, 7],
  [/(^|\s)(aath|आठ|eight)(\s|$)/g, 8],
  [/(^|\s)(nau|नौ|nine)(\s|$)/g, 9],
  [/(^|\s)(das|दस|ten)(\s|$)/g, 10],
]

function extractQty(chunk: string): { qty: number; rest: string } {
  const sRaw = normalizeText(toAsciiDigits(chunk))
  let s = ` ${sRaw} `

  // 1) Digits anywhere
  const digitMatch = s.match(/(^|\s)(\d{1,3})(\s|$)/)
  if (digitMatch) {
    const qty = Math.max(1, Math.min(999, Number(digitMatch[2])))
    s = s.replace(digitMatch[2], ' ')
    return { qty, rest: normalizeText(s) }
  }

  // 2) Number words at start (more robust when glued)
  const startMatch = sRaw
    .trim()
    .match(/^(ek|एक|one|do|दो|two|teen|तीन|three|cha?r|चार|four|paanch|पांच|five|chhe|छह|six|saat|सात|seven|aath|आठ|eight|nau|नौ|nine|das|दस|ten)(\s|$)/)
  if (startMatch) {
    const word = startMatch[1]
    const mapped =
      word === 'ek' || word === 'एक' || word === 'one'
        ? 1
        : word === 'do' || word === 'दो' || word === 'two'
          ? 2
          : word === 'teen' || word === 'तीन' || word === 'three'
            ? 3
            : word.startsWith('cha') || word === 'चार' || word === 'four'
              ? 4
              : word.startsWith('paanch') || word === 'पांच' || word === 'five'
                ? 5
                : word.startsWith('chhe') || word === 'छह' || word === 'six'
                  ? 6
                  : word.startsWith('saat') || word === 'सात' || word === 'seven'
                    ? 7
                    : word.startsWith('aath') || word === 'आठ' || word === 'eight'
                      ? 8
                      : word.startsWith('nau') || word === 'नौ' || word === 'nine'
                        ? 9
                        : 10

    const rest = sRaw.replace(startMatch[0], ' ')
    return { qty: mapped, rest: normalizeText(rest) }
  }

  // 3) Fallback: any number word anywhere
  for (const [re, n] of NUMBER_WORDS) {
    if (re.test(s)) {
      s = s.replace(re, ' ')
      return { qty: n, rest: normalizeText(s) }
    }
  }

  return { qty: 1, rest: normalizeText(s) }
}

function splitIntoChunks(raw: string): string[] {
  // Handles:
  // - comma separated: "2 roti, 1 dal"
  // - continuous speech: "ek dal makhni ek dal punjabi tadka"
  const t = normalizeText(raw)
    .replace(/\b(aur|and)\b/g, ',')
    .replace(/[;]/g, ',')

  const commaChunks = t
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

  if (commaChunks.length > 1) return commaChunks

  // Quantity markers (Hindi + Hinglish + digits)
  const qtyMarker =
    /(^|\s)(\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|ek|do|teen|cha?r|paanch|chhe|saat|aath|nau|das|एक|दो|तीन|चार|पांच|छह|सात|आठ|नौ|दस)(\s|$)/g

  const s = ` ${t} `
  const matches = [...s.matchAll(qtyMarker)]
  if (matches.length <= 1) return commaChunks

  // Split on every qty marker, keeping marker with its following words
  const parts: string[] = []
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index ?? 0
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? s.length) : s.length
    const chunk = s.slice(start, end).trim()
    if (chunk) parts.push(chunk)
  }
  return parts.length ? parts : commaChunks
}

function cleanupItemText(s: string) {
  return normalizeText(s)
    .replace(/\b(plate|plates|pcs|pc|piece|pieces|bottle|bottles|glass|glasses)\b/g, ' ')
    .replace(/\b(ka|ki|ke)\b/g, ' ')
    .replace(/\b(please|plz|pls)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseOrder(raw: string): { matched: BillLine[]; notFound: string[] } {
  const chunks = splitIntoChunks(raw)
  if (chunks.length === 0) return { matched: [], notFound: [] }

  const fuse = buildFuse()
  const notFound: string[] = []
  const matched: BillLine[] = []

  for (const c of chunks) {
    const { qty, rest } = extractQty(c)
    const itemText = cleanupItemText(rest)
    if (!itemText) continue

    const results = fuse.search(itemText)
    const best = results[0]
    if (!best || (best.score ?? 1) > 0.35) {
      notFound.push(`${qty} ${itemText}`)
      continue
    }
    matched.push({ id: best.item.id, name: best.item.name, qty, price: best.item.price })
  }

  return { matched, notFound }
}

function parseAndAdd(raw: string) {
  const { matched, notFound } = parseOrder(raw)
  for (const m of matched) {
    const item = menu.find((x) => x.id === m.id)
    if (item) addToBill(item, m.qty)
  }

  renderBill()
  if (notFound.length > 0) {
    const tags = notFound
      .map((p) => `<button type="button" class="nmTag" data-phrase="${escapeAttr(p)}">${escapeHtml(p)}</button>`)
      .join(' ')
    els.hint.innerHTML =
      'Not matched (pehle right side se item select karein, fir phrase pe click karein): ' + tags
  } else {
    els.hint.textContent = ''
  }
}

function addToBill(item: MenuItem, qty: number) {
  const existing = bill.find((b) => b.id === item.id)
  if (existing) existing.qty += qty
  else bill.push({ id: item.id, name: item.name, qty, price: item.price })
}

function renderBill() {
  if (bill.length === 0) {
    els.billBody.innerHTML = `<tr><td colspan="5" class="muted">No items yet</td></tr>`
    els.total.textContent = formatINR(0)
    return
  }

  els.billBody.innerHTML = bill
    .map((line) => {
      const amount = line.qty * line.price
      return `
        <tr data-id="${line.id}">
          <td>${escapeHtml(line.name)}</td>
          <td class="num"><input class="qtyInput" type="number" min="1" step="1" value="${line.qty}" /></td>
          <td class="num">${formatINR(line.price)}</td>
          <td class="num">${formatINR(amount)}</td>
          <td class="num"><button class="iconBtn danger" type="button" title="Remove">✕</button></td>
        </tr>
      `
    })
    .join('')

  const total = bill.reduce((sum, l) => sum + l.qty * l.price, 0)
  els.total.textContent = formatINR(total)
}

function renderMenu() {
  els.menuBody.innerHTML = menu
    .map((m) => {
      const aliasText = m.aliases.join(', ')
      return `
        <tr data-id="${m.id}" class="menuRow${m.id === selectedMenuId ? ' menuRowSelected' : ''}">
          <td><input class="textInput" data-field="name" value="${escapeAttr(m.name)}" /></td>
          <td class="num"><input class="priceInput" data-field="price" type="number" min="0" step="1" value="${m.price}" /></td>
          <td><input class="textInput" data-field="aliases" value="${escapeAttr(aliasText)}" /></td>
          <td class="num"><button class="iconBtn danger" type="button" title="Delete">🗑</button></td>
        </tr>
      `
    })
    .join('')
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      case "'":
        return '&#39;'
      default:
        return ch
    }
  })
}

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/`/g, '&#96;')
}

function openModal() {
  els.modalBackdrop.classList.remove('hidden')
  els.importText.value = ''
  els.importText.focus()
}

function closeModal() {
  els.modalBackdrop.classList.add('hidden')
}

function parseMenuImport(text: string): MenuItem[] {
  const lines = text
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const items: MenuItem[] = []

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+₹\s*/g, ' ₹').replace(/\s+/g, ' ').trim()

    // Try CSV: name,price,aliases
    const csv = line.split(',').map((x) => x.trim()).filter(Boolean)
    if (csv.length >= 2 && /\d/.test(csv[1])) {
      const name = csv[0]
      const price = Number(toAsciiDigits(csv[1]).replace(/[^\d]/g, ''))
      const aliasRaw = csv.slice(2).join(',')
      const aliases = aliasRaw
        ? aliasRaw.split('|').map((x) => x.trim()).filter(Boolean)
        : [name]
      items.push({ id: makeId(name), name, price: isFinite(price) ? price : 0, aliases })
      continue
    }

    // Try "name - price - aliases"
    const parts = line.split(/\s-\s/g)
    if (parts.length >= 2) {
      const name = parts[0].trim()
      const price = Number(toAsciiDigits(parts[1]).replace(/[^\d]/g, ''))
      const aliasRaw = parts.slice(2).join(' - ')
      const aliases = aliasRaw
        ? aliasRaw.split('|').map((x) => x.trim()).filter(Boolean)
        : [name]
      items.push({ id: makeId(name), name, price: isFinite(price) ? price : 0, aliases })
      continue
    }

    // Fallback: find last number as price
    const m = toAsciiDigits(line).match(/(.*?)(\d{1,6})\s*$/)
    if (m) {
      const name = m[1].replace(/[₹]/g, '').trim()
      const price = Number(m[2])
      if (name.length > 0) items.push({ id: makeId(name), name, price, aliases: [name] })
      continue
    }
  }

  // Deduplicate by id
  const seen = new Set<string>()
  return items.filter((it) => {
    if (seen.has(it.id)) return false
    seen.add(it.id)
    return true
  })
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    els.hint.textContent = 'Menu exported to clipboard.'
  } catch {
    els.hint.textContent = 'Copy failed. (Browser permission issue)'
  }
}

// Speech recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
let recognition: any | null = null
let listening = false

function ensureRecognition() {
  if (!SpeechRecognition) return null
  if (recognition) return recognition

  recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1
  recognition.onresult = (event: any) => {
    let finalTranscript = ''
    let interimTranscript = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript
      if (event.results[i].isFinal) finalTranscript += t
      else interimTranscript += t
    }

    const current = els.orderText.value.trim()
    const base = current.length ? current + (current.endsWith(',') ? ' ' : ', ') : ''
    if (finalTranscript.trim()) {
      els.orderText.value = base + finalTranscript.trim()
    }
    els.micStatus.textContent = interimTranscript.trim()
      ? `Mic: listening… (${interimTranscript.trim()})`
      : 'Mic: listening…'
  }
  recognition.onerror = (e: any) => {
    els.micStatus.textContent = `Mic error: ${e?.error ?? 'unknown'}`
    listening = false
    updateMicUI()
  }
  recognition.onend = () => {
    if (listening) {
      // Chrome ends session sometimes; restart
      try {
        recognition.start()
      } catch {
        listening = false
        updateMicUI()
      }
    } else {
      updateMicUI()
    }
  }

  return recognition
}

function updateMicUI() {
  els.micBtn.textContent = listening ? 'Stop mic' : 'Start mic'
  if (!listening && !els.micStatus.textContent.startsWith('Mic error')) {
    els.micStatus.textContent = 'Mic: idle'
  }
}

function startMic() {
  const rec = ensureRecognition()
  if (!rec) {
    els.micStatus.textContent = 'Mic not supported. Please use Chrome.'
    return
  }
  rec.lang = els.lang.value
  listening = true
  updateMicUI()
  try {
    rec.start()
  } catch {
    // ignore if already started
  }
}

function stopMic() {
  listening = false
  updateMicUI()
  try {
    recognition?.stop()
  } catch {
    // ignore
  }
}

// Events
els.micBtn.addEventListener('click', () => {
  if (listening) stopMic()
  else startMic()
})

els.parseBtn.addEventListener('click', () => {
  if (mode === 'waiter') {
    void (async () => {
      const { serverUrl, tableId } = getConn()
      if (!serverUrl) {
        els.hint.textContent = 'Server URL set karein (Connection section).'
        return
      }

      const { matched, notFound } = parseOrder(els.orderText.value)
      if (notFound.length > 0) {
        const tags = notFound
          .map((p) => `<button type="button" class="nmTag" data-phrase="${escapeAttr(p)}">${escapeHtml(p)}</button>`)
          .join(' ')
        els.hint.innerHTML =
          'Not matched (pehle right side se item select karein, fir phrase pe click karein): ' + tags
        return
      }
      if (matched.length === 0) {
        els.hint.textContent = 'No items found.'
        return
      }

      // Preview locally
      bill = []
      for (const m of matched) {
        bill.push({ ...m })
      }
      renderBill()

      try {
        const base = serverUrl.replace(/\/+$/, '')
        await fetchJson(`${base}/api/order/${encodeURIComponent(tableId)}/add-items`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ items: matched }),
        })
        els.hint.textContent = `Sent to counter: ${tableId}`
        els.orderText.value = ''
        bill = []
        renderBill()
        void updateConnStatus(true)
      } catch {
        els.hint.textContent = 'Send failed. Server/Network check karein.'
      }
    })()
  } else {
    parseAndAdd(els.orderText.value)
  }
})

els.clearText.addEventListener('click', () => {
  els.orderText.value = ''
  els.hint.textContent = ''
})

els.newBill.addEventListener('click', () => {
  bill = []
  els.orderText.value = ''
  els.hint.textContent = ''
  renderBill()
})

els.lang.addEventListener('change', () => {
  if (listening) {
    stopMic()
    startMic()
  }
})

els.billBody.addEventListener('input', (e) => {
  const target = e.target as HTMLElement
  if (!(target instanceof HTMLInputElement) || !target.classList.contains('qtyInput')) return
  const tr = target.closest('tr')
  const id = tr?.getAttribute('data-id')
  if (!id) return
  const n = Math.max(1, Math.min(999, Number(target.value || 1)))
  const line = bill.find((b) => b.id === id)
  if (!line) return
  line.qty = n
  renderBill()
})

els.billBody.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  if (!(target instanceof HTMLButtonElement) || !target.classList.contains('iconBtn')) return
  const tr = target.closest('tr')
  const id = tr?.getAttribute('data-id')
  if (!id) return
  bill = bill.filter((b) => b.id !== id)
  renderBill()
})

els.addMenuItem.addEventListener('click', () => {
  const id = `item_${Date.now()}`
  menu.unshift({ id, name: 'New Item', price: 0, aliases: ['new item'] })
  saveMenu()
  renderMenu()
})

els.hint.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  if (!(target instanceof HTMLButtonElement) || !target.classList.contains('nmTag')) return
  const phrase = target.getAttribute('data-phrase')?.trim()
  if (!phrase) return
  if (!selectedMenuId) {
    els.hint.textContent = 'Pehle right side se koi menu row select karein (row pe click), fir phrase pe click karein.'
    return
  }
  const m = menu.find((x) => x.id === selectedMenuId)
  if (!m) return
  if (!m.aliases.includes(phrase)) {
    m.aliases.push(phrase)
    saveMenu()
    renderMenu()
  }
  els.hint.textContent = `Alias added to "${m.name}". Ab ye phrase bolne par match ho jayega.`
})

els.importMenu.addEventListener('click', () => openModal())
els.closeModal.addEventListener('click', () => closeModal())
els.modalBackdrop.addEventListener('click', (e) => {
  if (e.target === els.modalBackdrop) closeModal()
})
els.applyImport.addEventListener('click', () => {
  const imported = parseMenuImport(els.importText.value)
  if (imported.length === 0) {
    els.hint.textContent = 'Nothing imported. Format check karein.'
    closeModal()
    return
  }
  menu = imported
  saveMenu()
  renderMenu()
  els.hint.textContent = `Imported ${imported.length} menu items.`
  closeModal()
})

els.exportMenu.addEventListener('click', () => {
  const csv = menu
    .map((m) => `${m.name},${m.price},${m.aliases.join('|')}`)
    .join('\n')
  void copyToClipboard(csv)
})

function startCounterPolling() {
  if (counterPollTimer != null) return
  void updateConnStatus(true)
  const tick = async () => {
    if (mode !== 'counter') return
    const { serverUrl } = getConn()
    if (!serverUrl) {
      els.openOrders.innerHTML = `<div class="muted">Set Server URL</div>`
      return
    }
    try {
      const base = serverUrl.replace(/\/+$/, '')
      const open = (await fetchJson(`${base}/api/orders/open`)) as Array<{
        id: number
        table_id: string
        created_at: string
        total: number
      }>
      if (open.length === 0) {
        els.openOrders.innerHTML = `<div class="muted">No open tables</div>`
      } else {
        els.openOrders.innerHTML = open
          .map(
            (o) => `
              <div class="orderCard" data-table="${escapeAttr(o.table_id)}">
                <div class="orderCardTitle">${escapeHtml(o.table_id)}</div>
                <div class="orderCardSub">
                  <span>${escapeHtml(new Date(o.created_at).toLocaleString())}</span>
                  <span><b>${escapeHtml(formatINR(o.total))}</b></span>
                </div>
              </div>
            `,
          )
          .join('')
      }
      els.connStatus.textContent = 'Online'

      if (counterSelectedTableId) {
        // Keep refreshing selected
        await loadCounterBill(counterSelectedTableId)
      }
    } catch {
      els.connStatus.textContent = 'Offline'
      els.openOrders.innerHTML = `<div class="muted">Server offline</div>`
    }
  }
  void tick()
  counterPollTimer = window.setInterval(() => void tick(), 2000)
}

function stopCounterPolling() {
  if (counterPollTimer == null) return
  window.clearInterval(counterPollTimer)
  counterPollTimer = null
}

async function loadCounterBill(tableId: string) {
  const { serverUrl } = getConn()
  if (!serverUrl) return
  const base = serverUrl.replace(/\/+$/, '')
  const data = (await fetchJson(`${base}/api/order/${encodeURIComponent(tableId)}`)) as {
    tableId: string
    orderId?: number
    items: Array<{ id: number; name: string; qty: number; price: number; amount: number }>
    total: number
  }

  if (!data.items.length) {
    els.counterBill.innerHTML = `<div class="muted">No items</div>`
    return
  }

  els.counterBill.innerHTML = `
    <div class="row" style="justify-content:space-between;">
      <div><b>${escapeHtml(data.tableId)}</b></div>
      <div><b>${escapeHtml(formatINR(data.total))}</b></div>
    </div>
    <div class="tableWrap" style="margin-top:8px;">
      <table class="table" style="min-width:420px;">
        <thead>
          <tr><th>Item</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amt</th></tr>
        </thead>
        <tbody>
          ${data.items
            .map(
              (it) => `
                <tr>
                  <td>${escapeHtml(it.name)}</td>
                  <td class="num">${it.qty}</td>
                  <td class="num">${escapeHtml(formatINR(it.price))}</td>
                  <td class="num">${escapeHtml(formatINR(it.amount))}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <div class="row" style="justify-content:flex-end; margin-top:10px;">
      <button id="printBtn" class="btn" type="button">Print</button>
      <button id="closeBtn" class="btn secondary" type="button">Close</button>
    </div>
  `

  const printBtn = document.querySelector<HTMLButtonElement>('#printBtn')
  const closeBtn = document.querySelector<HTMLButtonElement>('#closeBtn')
  printBtn?.addEventListener('click', () => window.print())
  closeBtn?.addEventListener('click', () => {
    if (!data.orderId) return
    void (async () => {
      try {
        await fetchJson(`${base}/api/order/${data.orderId}/close`, { method: 'POST' })
        els.counterBill.innerHTML = `<div class="muted">Closed</div>`
        counterSelectedTableId = null
      } catch {
        // ignore
      }
    })()
  })
}

els.openOrders.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  const card = target.closest('.orderCard') as HTMLElement | null
  const tableId = card?.getAttribute('data-table')
  if (!tableId) return
  counterSelectedTableId = tableId
  void loadCounterBill(tableId)
})

els.navLocal.addEventListener('click', () => setMode('local'))
els.navWaiter.addEventListener('click', () => setMode('waiter'))
els.navCounter.addEventListener('click', () => setMode('counter'))

els.saveConn.addEventListener('click', () => saveConn())
els.checkConn.addEventListener('click', () => void updateConnStatus(true))

window.addEventListener('hashchange', () => setMode(getModeFromHash()))

els.menuBody.addEventListener('input', (e) => {
  const target = e.target as HTMLElement
  if (!(target instanceof HTMLInputElement)) return
  const field = target.getAttribute('data-field')
  const tr = target.closest('tr')
  const id = tr?.getAttribute('data-id')
  if (!field || !id) return
  const m = menu.find((x) => x.id === id)
  if (!m) return

  if (field === 'name') m.name = target.value
  if (field === 'price') m.price = Math.max(0, Math.min(1_000_000, Number(target.value || 0)))
  if (field === 'aliases') {
    m.aliases = target.value
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
  }
  saveMenu()
  // no immediate re-render to keep cursor position
})

els.menuBody.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  const tr = target.closest('tr')
  const id = tr?.getAttribute('data-id')
  if (!id) return

  // Delete button
  if (target instanceof HTMLButtonElement && target.classList.contains('iconBtn')) {
    menu = menu.filter((m) => m.id !== id)
    if (selectedMenuId === id) selectedMenuId = null
    saveMenu()
    renderMenu()
    return
  }

  // Row selection
  selectedMenuId = id
  renderMenu()
})

// Initial render
loadConn()
setMode(getModeFromHash())
renderBill()
renderMenu()
