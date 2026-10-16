(function (LAB) {
'use strict';

// Case frames, suspects, and the question prompts the generator assembles.
// {victim} / {location} / {label} placeholders must survive translation.

const ZH_CASE = {
  // Crime frames
  'The Unlabelled Packet': '无标签的粉末袋',
  'A sealed packet of white powder was found wedged under {victim}’s workstation at {location}. Three people had access to the bench. The packet must be identified, and whoever left it must be placed at the bench by the tests you run.': '在{location}，{victim}的工位下方发现一袋密封的白色粉末。有三个人能够接触到该实验台。你必须鉴定这袋粉末，并用你亲手做的实验把留下它的人锁定在实验台前。',
  'Identify the powder and the liquid found with it, then name who left the packet.': '鉴定粉末以及与它同处的液体，然后指出是谁留下了这袋粉末。',

  'The Spoiled Samples': '被毁的样品',
  'Every prepared sample in {location} was ruined overnight by something poured into the stock bottles. {victim} found the trays in the morning. Work out what was poured, and who did it.': '{location}中所有已制备的样品在一夜之间被倒入储备瓶的某种物质毁掉。{victim}清晨发现了这些托盘。判断倒进去的是什么，以及是谁倒的。',
  'Identify the liquid in the spill tray, then name who poured it.': '鉴定溢出托盘中的液体，然后指出是谁倒进去的。',

  'The Forged Note': '伪造的字条',
  'A threatening note written with a black marker was left on {victim}’s door at {location}. Each suspect owns a different marker. Separate the ink from the note and from each suspect’s pen, and match them by Rf value.': '一张用黑色记号笔写成的威胁字条被留在{location}的{victim}的门上。每名嫌疑人用的记号笔各不相同。分离字条上的墨水与各嫌疑人笔中的墨水，再用 Rf 值进行比对。',
  'Run chromatography on the note ink and on each suspect’s ink, then name who wrote the note.': '对字条墨水与各嫌疑人的墨水分别做色谱，然后指出是谁写了这张字条。',

  'The Broken Case': '被砸的展柜',
  'A display case at {location} was smashed and {victim}’s contents were taken. Glass fragments and a metal sliver were left on the floor. Identify both, then name who broke in.': '{location}的一个展柜被砸开，{victim}的物品被拿走。地上留下了玻璃碎片和一小片金属。鉴定两者，然后指出是谁闯入的。',
  'Identify the glass fragment and the metal sliver, then name who broke in.': '鉴定玻璃碎片与金属片，然后指出是谁闯入的。',

  'The Fibre on the Handle': '门把手上的纤维',
  'A single fibre and a single hair were caught on the handle of the locked door at {location}, where {victim} was locked out overnight. Identify both, then name who left them there.': '在{location}那扇被锁上的门的把手上卡着一根纤维和一根毛发，{victim}当晚被锁在门外。鉴定两者，然后指出是谁留下的。',
  'Identify the fibre by burn test and the hair by microscopy, then name who left them.': '用燃烧测试鉴定纤维，用显微镜鉴定毛发，然后指出是谁留下的。',

  'The Mud on the Floor': '地板上的泥',
  'Wet soil was tracked across {location} the night {victim}’s supplies went missing. A soil sample was lifted from the floor and a fibre from the torn bag. Identify both, then name who tracked it in.': '{victim}的用品失踪当晚，湿泥被踩进了{location}。从地板上提取了一份土样，从被撕破的袋子上提取了一根纤维。鉴定两者，然后指出是谁踩进来的。',
  'Identify the soil and the fibre, then name who tracked it in.': '鉴定土壤与纤维，然后指出是谁踩进来的。',

  'The Swapped Tablets': '被调换的药片',
  '{victim}’s medication tablets were swapped in the {location} cabinet. Two tablets from the cabinet and one liquid used to coat them must be identified before the substitution can be pinned on someone.': '{victim}的药片在{location}的柜子里被调换。必须先鉴定柜中的两片药片以及用于包衣的一种液体，才能把调包行为落到某个人身上。',
  'Identify both tablets and the coating liquid, then name who swapped them.': '鉴定两片药片与包衣液体，然后指出是谁调换了它们。',

  // Roles
  'the night janitor': '夜班清洁工',
  'the lab assistant': '实验室助理',
  'the head groundskeeper': '场地总管理员',
  'the delivery driver': '送货司机',
  'the club president': '社团社长',
  'the archivist': '档案管理员',
  'the equipment manager': '器材管理员',
  'the student body reporter': '学生会记者',
  'the cafeteria cook': '食堂厨师',
  'the art club treasurer': '美术社财务',

  // Victims
  'the chemistry teacher': '化学老师',
  'the room monitor': '教室值日员',
  'the event supervisor': '赛事监督员',
  'the team captain': '队伍队长',
  'the custodian': '校园管理员',
  'the club advisor': '社团指导老师',

  // Locations
  'Room 214': '214 室',
  'the science wing storage room': '科学楼储藏室',
  'the competition prep lab': '比赛准备实验室',
  'the equipment shed': '器材棚',
  'the second-floor hallway': '二楼走廊',
  'the locker bay by the gym': '体育馆旁的储物柜区',

  // Alibis
  'says they were in the library until the building closed': '说自己一直在图书馆直到楼里锁门',
  'has a timestamped bus pass for the time of the incident': '有一张带时间戳的公交票，时间正是事发时',
  'was signed into a practice that ended at the time of the incident': '当时在参加训练，而训练结束时间正是事发时',
  'was seen in the hallway by two other students': '有两名学生在走廊里见到过此人',
  'has no alibi and admits they were looking for a quiet place to study': '没有不在场证明，并承认自己在找安静的地方学习',
  'was off campus all afternoon with a documented appointment': '整个下午都不在校内，且有预约记录',
  'says they left before the incident but no one saw them go': '说自己在事发前就离开了，但没人看到其离开',
  'was in the front office signing out equipment at the time of the incident': '事发时正在前台登记借用器材',

  // Motives
  'was passed over for the role they wanted': '没有得到自己想要的职位',
  'had a public argument with the victim that week': '那一周与受害者当众争吵过',
  'owed money to the victim': '欠受害者的钱',
  'had been accused of cheating by the victim': '曾被受害者指控作弊',
  'had sole access to the storage key that week': '那一周只有其持有储藏室钥匙',
  'was in charge of the supplies that went missing': '正是失踪用品的负责人',

  // Question prompts
  'Identify {category} {label}.': '鉴定{category} {label}。',
  'What did you observe when {test} was applied to {label}?': '对 {label} 使用{test}时你观察到了什么？',
  'Run the questioned ink in {solvent}. Report the Rf of its highest-travelling dye (2 decimal places).': '在{solvent}中展开检材墨水，报告其中迁移最远的染料的 Rf（保留两位小数）。',
  'Which suspect’s marker produced the writing on the note?': '字条上的字迹出自哪位嫌疑人的记号笔？',
  'Determine the density of {label} in g/cm³ (2 decimal places).': '测定 {label} 的密度（单位 g/cm³，保留两位小数）。',
  'Measure the hair in {label} and report its medulla index (medulla width ÷ hair diameter, 2 decimal places).': '测量 {label} 中的毛发并报告其髓质指数（髓质宽度 ÷ 毛发直径，保留两位小数）。',
  'A burn test on {label} gave: {odor}; residue: {residue}. Identify the fibre.': '对 {label} 做燃烧测试的结果：气味为{odor}；残留物为{residue}。鉴定该纤维。',
  'Who committed the crime?': '谁实施了这次犯罪行为？',
  'Select every piece of evidence that points at your suspect. Choosing evidence that does not match costs points.': '选出所有指向你所指认的嫌疑人的证据。选错证据会扣分。',

  // Drills
  'Dress for the lab': '按规范着装',
  'Put on the correct PPE before touching anything.': '在接触任何东西之前穿戴好正确的个人防护装备。',
  'Light and heat safely': '安全地点火与加热',
  'Heat a test tube correctly: one third full, clamped near the top, pointed away.': '正确加热试管：装液不超过三分之一、夹在靠近上部的位置、管口朝向无人方向。',
  'Strip and sheet chromatography with Rf': '试纸条与滤纸色谱及 Rf',
  'Mark a pencil baseline, develop a strip, and calculate Rf for every dye.': '用铅笔划出基线、展开试纸，并计算每种染料的 Rf。',
  'Use the measuring instruments': '使用测量仪器',
  'Read a meniscus at eye level, measure pH without dipping, and test conductivity.': '平视读取弯月面、不把试纸浸入地测 pH、并测试导电性。',
  'Identify four unknown powders': '鉴定四种未知粉末',
  'Use spot-plate tests, pH, and conductivity to identify every powder.': '用点滴板实验、pH 和导电性鉴定每一种粉末。',
  'Identify three unknown fibres': '鉴定三种未知纤维',
  'Use burn tests, acetone solubility, and microscopy.': '用燃烧测试、丙酮溶解性和显微镜观察。',
  'expectation {n}': '核心要求 {n}',
};

Object.assign(LAB, { ZH_CASE: ZH_CASE });
})(window.LAB);
