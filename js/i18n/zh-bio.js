(function (LAB) {
'use strict';

const ZH_BIO = {

  // ───────── biology.js — FIBERS: names & appearances ─────────
  'Cotton': '棉',
  'Off-white, irregular flat ribbon with twisted edges': '灰白色，不规则扁平带状，边缘扭曲',
  'Wool': '羊毛',
  'Cream, scaly surface, slight crimp': '乳白色，表面有鳞片，略有卷曲',
  'Silk': '蚕丝',
  'Lustrous, smooth, uniform round thread': '有光泽，光滑，粗细均匀的圆形细丝',
  'Nylon': '尼龙',
  'Clear to off-white, perfectly smooth and uniform': '透明至灰白色，极为光滑均匀',
  'Polyester': '涤纶',
  'Bright white, smooth, often pilled': '亮白色，光滑，常起球',
  'Acrylic': '腈纶',
  'White, soft, slightly fuzzy': '白色，柔软，略蓬松',
  'Rayon (Acetate)': '人造丝（醋酸纤维）',
  'Bright, smooth, looks like silk': '光亮光滑，外观似蚕丝',

  // ───────── biology.js — HAIR: names & appearances ─────────
  'Human Hair': '人发',
  'Uniform shaft with fine scales': '毛干粗细均匀，具细小鳞片',
  'Cat Hair': '猫毛',
  'Shaft with a wide broken medulla': '毛干具宽而断裂的髓质',
  'Dog Hair': '狗毛',
  'Thick shaft, often two medullae': '毛干粗厚，常可见两条髓质',
  'Rabbit Hair': '兔毛',
  'Very wide shaft with a broad ladder-like medulla': '毛干很宽，具宽大的梯状髓质',

  // ───────── biology.js — results (Cotton) ─────────
  'irregular twisted ribbon': '不规则扭曲带状',
  'Off-white irregular ribbon, twisted lengthwise, no scales': '灰白色不规则带状，纵向扭曲，无鳞片',
  'burns fast paper smell': '燃烧快，烧纸味',
  'Ignites quickly, burns with a yellow flame, smells like burning paper, leaves fine grey ash': '迅速点燃，以黄色火焰燃烧，有烧纸味，留下细腻的灰色灰烬',
  'plant ribbon': '植物带状纤维',
  'Irregular flattened ribbon with twisted edges; no scales, no uniform diameter': '不规则扁平带状，边缘扭曲；无鳞片，直径不均匀',

  // ───────── biology.js — results (Wool) ─────────
  'scaly crimped animal fiber': '具鳞片、卷曲的动物纤维',
  'Cream fibre with a scaly surface and natural crimp': '乳白色纤维，表面有鳞片，天然卷曲',
  'burns hair smell self-extinguishing': '燃烧有烧焦毛发味，自熄',
  'Burns slowly and self-extinguishes, smells like burnt hair or feathers, leaves a brittle black bead': '缓慢燃烧并自熄，有烧焦毛发或羽毛味，留下脆性黑色珠状残留',
  'scaly animal fiber': '具鳞片的动物纤维',
  'Round fibre covered in overlapping scales with a distinct cortex and medulla': '圆形纤维，表面覆叠鳞片，皮质与髓质清晰',

  // ───────── biology.js — results (Silk) ─────────
  'smooth lustrous uniform thread': '光滑有光泽的均匀细丝',
  'Lustrous, smooth, very uniform round thread': '有光泽，光滑，非常均匀的圆形细丝',
  'burns hair smell hard bead': '燃烧有烧焦毛发味，硬珠状残留',
  'Burns slowly, smells like burnt hair, leaves a hard dark bead that does not crush': '缓慢燃烧，有烧焦毛发味，留下压不碎的坚硬深色珠状残留',
  'smooth uniform thread': '光滑均匀细丝',
  'Smooth fibre with no scales and a thin shadowy outline; perfectly uniform width': '光滑纤维，无鳞片，轮廓呈细窄暗影；宽度完全均匀',

  // ───────── biology.js — results (Nylon) ─────────
  'smooth uniform synthetic thread': '光滑均匀合成细丝',
  'Perfectly smooth, uniform, translucent thread': '完全光滑、均匀、半透明的细丝',
  'melts drips celery smell': '熔化滴落，芹菜味',
  'Melts and shrinks from the flame, drips, smells faintly like celery, leaves a hard tan bead': '遇焰熔化收缩并滴落，略有芹菜味，留下坚硬的黄褐色珠状残留',
  'smooth uniform synthetic': '光滑均匀合成纤维',
  'Perfectly smooth fibre of constant diameter with no surface markings': '完全光滑，直径恒定，表面无纹路',

  // ───────── biology.js — results (Polyester) ─────────
  'smooth bright synthetic': '光滑亮白合成纤维',
  'Bright white smooth fibre, constant diameter': '亮白色光滑纤维，直径恒定',
  'melts black smoke sweet smell': '熔化，冒黑烟，带甜味',
  'Melts with sputtering and black smoke, smells sweetish, leaves a hard black bead': '熔化并溅出火星、冒黑烟，气味微甜，留下坚硬黑色珠状残留',
  'Smooth fibre of constant diameter; may show circular cross-section': '直径恒定的光滑纤维，横截面可呈圆形',

  // ───────── biology.js — results (Acrylic) ─────────
  'soft fuzzy synthetic': '柔软蓬松合成纤维',
  'Soft, slightly fuzzy white fibre': '柔软、略蓬松的白色纤维',
  'melts fast acrid smell': '迅速熔化，刺激性气味',
  'Melts very fast, smells acrid and fishy, leaves a hard brittle black bead': '熔化极快，有刺激性和鱼腥味，留下坚硬而脆的黑色珠状残留',
  'Smooth fibre of constant diameter, sometimes with speckles': '直径恒定的光滑纤维，有时带斑点',

  // ───────── biology.js — results (Rayon / Acetate) ─────────
  'smooth silk-like synthetic': '光滑似蚕丝的合成纤维',
  'Bright smooth thread, silk-like, serrated edges': '光亮光滑细丝，似蚕丝，边缘呈锯齿状',
  'burns fast paper smell melts edge': '燃烧快，烧纸味，边缘熔化',
  'Burns quickly like paper but the edges melt, smells like burning paper, leaves a dark brittle residue': '像纸一样迅速燃烧，但边缘熔化，有烧纸味，留下深色脆性残留',
  'serrated synthetic': '锯齿边缘合成纤维',
  'Smooth fibre with fine serrations along the edges': '光滑纤维，边缘有细锯齿',

  // ───────── biology.js — results (shared acetone rows) ─────────
  'insoluble': '不溶',
  'Unchanged after 2 minutes in acetone': '在丙酮中 2 分钟无变化',
  'dissolves': '溶解',
  'Softens and dissolves in acetone within a minute': '一分钟内软化并溶于丙酮',
  'Dissolves in acetone': '溶于丙酮',

  // ───────── biology.js — results (Human Hair) ─────────
  'uniform shaft fine scales': '毛干均匀，鳞片细小',
  'Uniform shaft, diameter consistent along its length': '毛干均匀，沿长度方向直径一致',
  'human hair': '人发',
  'Thin continuous medulla, even pigment distribution, fine close-fitting cuticle scales': '髓质细而连续，色素分布均匀，毛小皮鳞片细小紧贴',

  // ───────── biology.js — results (Cat Hair) ─────────
  'shaft with wide medulla': '毛干具宽髓质',
  'Shaft with a very wide central medulla, diameter varies along the length': '毛干中央髓质很宽，沿长度方向直径变化',
  'cat hair': '猫毛',
  'Wide fragmented medulla taking up much of the shaft, uneven clumped pigment, petal-shaped scales': '髓质宽而断裂，占据毛干大部分，色素不均而成团，鳞片呈花瓣状',

  // ───────── biology.js — results (Dog Hair) ─────────
  'thick shaft dense medulla': '毛干粗厚，髓质浓密',
  'Thick shaft with a dense, often segmented medulla': '毛干粗厚，髓质浓密且常分段',
  'dog hair': '狗毛',
  'Very dense continuous medulla, sometimes split into two; chain-like scales': '髓质极浓密且连续，有时分为两条；鳞片呈链状',

  // ───────── biology.js — results (Rabbit Hair) ─────────
  'wide shaft ladder medulla': '毛干宽，髓质呈梯状',
  'Wide shaft with a broad ladder-like medulla and sparse pigment': '毛干宽，具宽大梯状髓质，色素稀疏',
  'rabbit hair': '兔毛',
  'Broad continuous ladder-like medulla, pigment sparse and concentrated in patches': '髓质宽大连续呈梯状，色素稀疏并成块聚集',

  // ───────── biology.js — results (shared hair burn rows) ─────────
  'burns hair smell': '燃烧有烧焦毛发味',
  'Burns slowly, smells like burnt hair, self-extinguishes, leaves a brittle black bead': '缓慢燃烧，有烧焦毛发味，自熄，留下脆性黑色珠状残留',
  'Burns slowly, smells like burnt hair, self-extinguishes': '缓慢燃烧，有烧焦毛发味，自熄',

  // ───────── biology.js — burnData speed / odor / residue ─────────
  'fast': '快',
  'slow': '慢',
  'melts': '熔化',
  'melts fast': '迅速熔化',
  'burning paper': '烧纸味',
  'burnt hair': '烧焦毛发味',
  'burnt hair / feathers': '烧焦毛发 / 羽毛味',
  'celery-like': '芹菜味',
  'sweetish, black smoke': '微甜，冒黑烟',
  'acrid / fishy': '刺激性 / 鱼腥味',
  'burning paper with melted edges': '烧纸味，边缘熔化',
  'fine grey ash, no bead': '细腻灰色灰烬，无珠状残留',
  'brittle black bead, crushes easily': '脆性黑色珠状残留，易压碎',
  'hard shiny dark bead, will not crush': '坚硬发亮的深色珠状残留，压不碎',
  'hard tan glossy bead': '坚硬有光泽的黄褐色珠状残留',
  'hard black bead': '坚硬黑色珠状残留',
  'hard brittle black bead': '坚硬而脆的黑色珠状残留',
  'dark brittle residue': '深色脆性残留',

  // ───────── materials.js — GLASS: names & appearances ─────────
  'Bottle Glass (soda-lime)': '瓶玻璃（钠钙玻璃）',
  'Pale green tint, curved shard edges': '淡绿色调，玻璃碎片边缘弯曲',
  'Window Glass (float)': '窗玻璃（浮法玻璃）',
  'Colourless, one surface perfectly flat': '无色，一个表面完全平整',
  'Borosilicate Glass (Pyrex)': '硼硅酸盐玻璃（派热克斯玻璃）',
  'Colourless, slightly bluish, thicker walls': '无色，略呈蓝色，器壁较厚',

  // ───────── materials.js — SOILS: names & appearances ─────────
  'Sandy Loam': '砂壤土',
  'Light brown, gritty, grains visible to the hand lens': '浅棕色，有砂质感，放大镜下可见颗粒',
  'Clay': '黏土',
  'Reddish-brown, smooth, plastic when wet': '红棕色，光滑，湿润时具可塑性',
  'Potting Mix': '营养土',
  'Dark, contains visible fibres and white perlite flecks': '深色，可见纤维和白色珍珠岩碎屑',

  // ───────── materials.js — PLASTICS: names & appearances ─────────
  'Polyethylene (PE)': '聚乙烯（PE）',
  'Waxy translucent white, flexible': '蜡状半透明白色，柔韧',
  'Polypropylene (PP)': '聚丙烯（PP）',
  'Translucent, stiff but hingeable': '半透明，较硬但可反复折弯',
  'PET': 'PET（涤纶）',
  'Clear, rigid, snaps rather than bends': '透明，刚性，折断而不弯曲',
  'PVC': '聚氯乙烯（PVC）',
  'Grey or white, rigid': '灰色或白色，刚性',

  // ───────── materials.js — TABLETS: names & appearances ─────────
  'Aspirin Tablet': '阿司匹林药片',
  'White round tablet, chalky': '白色圆形药片，白垩状',
  'Acetaminophen Tablet': '对乙酰氨基酚药片',
  'White oval tablet, smooth': '白色椭圆形药片，光滑',
  'Antacid Tablet': '抗酸药片',
  'Chalky white tablet, soft': '白垩状白色药片，质软',

  // ───────── materials.js — results (glass) ─────────
  'pale green shard': '淡绿色碎片',
  'Pale green tint; curved edges matching a bottle wall': '淡绿色调；弯曲边缘与瓶壁相符',
  'ρ 2.49': 'ρ 2.49',
  'Density 2.49 g/cm³ — sinks in water': '密度 2.49 g/cm³——在水中下沉',
  'no burn': '不燃烧',
  'Does not burn; softens only at very high temperature': '不燃烧；仅在极高温度下才软化',
  'curved shard': '弯曲碎片',
  'Shard with a curved surface; conchoidal fracture lines': '碎片表面弯曲；具贝壳状断口纹',
  'colourless flat shard': '无色平整碎片',
  'Colourless; one face perfectly flat from the float process': '无色；因浮法工艺而一个面完全平整',
  'ρ 2.50': 'ρ 2.50',
  'Density 2.50 g/cm³ — sinks in water': '密度 2.50 g/cm³——在水中下沉',
  'Does not burn': '不燃烧',
  'flat shard': '平整碎片',
  'Flat faces of equal thickness; conchoidal fracture': '两个平整面厚度相同；贝壳状断口',
  'bluish thick shard': '微蓝色较厚碎片',
  'Colourless with a faint blue cast; noticeably thicker walls': '无色略带蓝色；器壁明显较厚',
  'ρ 2.23': 'ρ 2.23',
  'Density 2.23 g/cm³ — sinks in water but clearly lighter than the others': '密度 2.23 g/cm³——在水中下沉，但明显比其余样品轻',
  'Does not burn; resists heat far longer than the others': '不燃烧；耐热时间远长于其余样品',
  'thick shard': '较厚碎片',
  'Thick shard, edges less sharply conchoidal': '较厚碎片，贝壳状断口的边缘不那么尖锐',

  // ───────── materials.js — results (soils) ─────────
  'light brown gritty': '浅棕色砂质',
  'Light brown; gritty, individual grains visible under the hand lens': '浅棕色；有砂质感，放大镜下可见单个颗粒',
  'partial': '部分溶解',
  'Sand settles immediately; a fine cloud of silt stays suspended': '砂立即沉降；一片细粉砂云雾悬浮在水中',
  'pH 6.5': 'pH 6.5',
  'pH ≈ 6.5 (slightly acidic)': 'pH ≈ 6.5（微酸性）',
  'weak positive': '弱阳性',
  'A few dark grains are pulled out — magnetic iron present': '少量深色颗粒被吸出——含磁性铁',
  'reddish smooth': '红色调，光滑',
  'Reddish-brown; smooth and plastic, no visible grains': '红棕色；光滑且具可塑性，无可见颗粒',
  'Clouds the water and stays suspended for a long time; very little settles': '使水变浑浊并长时间悬浮；沉降极少',
  'pH 7.5': 'pH 7.5',
  'pH ≈ 7.5 (slightly basic)': 'pH ≈ 7.5（微碱性）',
  'negative': '阴性',
  'Nothing is pulled out by the magnet': '磁铁没有吸出任何物质',
  'dark with fibres and white flecks': '深色，带纤维和白色碎屑',
  'Dark; visible plant fibres and white perlite flecks': '深色；可见植物纤维和白色珍珠岩碎屑',
  'Organic matter floats on top while mineral grains sink': '有机物浮在水面，矿物颗粒下沉',
  'pH 6.0': 'pH 6.0',
  'pH ≈ 6.0 (acidic)': 'pH ≈ 6.0（酸性）',

  // ───────── materials.js — results (plastics) ─────────
  'waxy translucent flexible plastic': '蜡状半透明柔韧塑料',
  'Waxy translucent white, flexible, bends without snapping': '蜡状半透明白色，柔韧，弯曲而不断裂',
  'ρ 0.94': 'ρ 0.94',
  'Density 0.94 g/cm³ — floats in water': '密度 0.94 g/cm³——在水中漂浮',
  'burns waxy candle smell': '燃烧，蜡状蜡烛味',
  'Burns with a blue flame and drips, smells like a wax candle': '以蓝色火焰燃烧并滴落，有蜡烛味',
  'translucent stiff plastic': '半透明硬质塑料',
  'Translucent, stiff; bends then snaps back': '半透明，较硬；弯曲后回弹',
  'ρ 0.91': 'ρ 0.91',
  'Density 0.91 g/cm³ — floats in water': '密度 0.91 g/cm³——在水中漂浮',
  'clear rigid plastic': '透明刚性塑料',
  'Clear and rigid; snaps instead of bending': '透明且刚性；折断而不弯曲',
  'ρ 1.38': 'ρ 1.38',
  'Density 1.38 g/cm³ — sinks in water': '密度 1.38 g/cm³——在水中下沉',
  'burns sweet black smoke': '燃烧，微甜，冒黑烟',
  'Burns with a yellow smoky flame, smells sweetish, drips black': '以黄色冒烟的火焰燃烧，气味微甜，滴落黑色',
  'grey rigid plastic': '灰色刚性塑料',
  'Grey or white and rigid': '灰色或白色，刚性',
  'burns green flame acrid': '燃烧，火焰带绿色，刺激性气味',
  'Hard to ignite; burns with a green-tinged flame and a sharp acrid smell': '难点燃；以略带绿色的火焰燃烧，气味尖锐刺鼻',

  // ───────── materials.js — results (tablets) ─────────
  'white round tablet': '白色圆形药片',
  'White round tablet with a score line, chalky': '白色圆形药片，带划痕线，白垩状',
  'No change — iodine stays amber': '无变化——碘液保持琥珀色',
  'No reaction': '无反应',
  'effervesce': '冒泡',
  'Fizzing — the acid reacts with bicarbonate': '冒泡——酸与碳酸氢盐反应',
  'pH 3.0': 'pH 3.0',
  'pH ≈ 3.0 (acidic)': 'pH ≈ 3.0（酸性）',
  'white oval tablet': '白色椭圆形药片',
  'White oval tablet, smooth, no score line': '白色椭圆形药片，光滑，无划痕线',
  'Faint purple-brown colour develops': '出现淡紫褐色',
  'Slow colour change to brown': '颜色缓慢变为棕色',
  'pH ≈ 6.0 (near neutral)': 'pH ≈ 6.0（近中性）',
  'chalky soft tablet': '白垩状软药片',
  'Chalky white tablet, soft enough to scratch easily': '白垩状白色药片，软到容易被刮出划痕',
  'Steady fizzing as CO₂ is released': '持续冒泡，放出 CO₂',
  'pH 9.0': 'pH 9.0',
  'pH ≈ 9.0 (basic)': 'pH ≈ 9.0（碱性）',

  // ───────── materials.js — PRINT_PATTERNS ─────────
  'Loop': '环形',
  'Ridges enter one side, curve back on themselves, and exit the same side. One core, one delta.': '脊线从一侧进入，折回自身，再从同一侧退出。一个核心，一个三角区。',
  'Whorl': '斗形',
  'Ridges form circles or spirals around a core, with two deltas.': '脊线围绕核心形成环形或螺旋，具有两个三角区。',
  'Arch': '弧形',
  'Ridges enter one side, rise to a peak in the middle, and exit the opposite side. No delta.': '脊线从一侧进入，在中间隆起成峰，从另一侧退出。无三角区。',

  // ───────── inks.js — ink labels ─────────
  'Black marker A': '黑色记号笔 A',
  'Black marker B': '黑色记号笔 B',
  'Black marker C': '黑色记号笔 C',
  'Blue ballpoint': '蓝色圆珠笔',
  'Black ballpoint': '黑色圆珠笔',
  'Green marker': '绿色记号笔',
  'Purple marker': '紫色记号笔',
  'Red marker': '红色记号笔',

  // ───────── inks.js — SOLVENTS ─────────
  'Water': '水',
  'Rubbing Alcohol': '医用酒精',
  'Acetone': '丙酮',

  // ───────── inks.js — dye names ─────────
  'yellow': '黄色',
  'red': '红色',
  'blue': '蓝色',
  'green': '绿色',
  'violet': '紫色',
  'orange': '橙色',
  'cyan': '青色',
  'magenta': '品红',
};

Object.assign(LAB, { ZH_BIO: ZH_BIO });
})(window.LAB);
