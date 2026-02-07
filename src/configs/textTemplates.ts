/**
 * 📝 文案预设库
 *
 * 150+条高质量文案，覆盖所有场景
 * 支持换一换、场景切换、搜索
 */

export interface TextTemplate {
  id: string;
  text: string;
  length: number;
  category: string; // blessing, greeting, etc.
  scene: string;    // general, elder, friend, lover, business, wealth, health, career
  tags: string[];
}

export interface SceneCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

// ===== 超短文案（8-15字）- 适合判词/语音/视频 =====
export const SHORT_TEMPLATES: TextTemplate[] = [
  // 马年系列（20条）
  { id: 's1', text: '马年行大运，福气满满来', length: 11, category: 'blessing', scene: 'general', tags: ['马年', '运气', '押韵'] },
  { id: 's2', text: '马到成功，财源滚滚', length: 9, category: 'blessing', scene: 'general', tags: ['马年', '财运'] },
  { id: 's3', text: '一马当先，龙马精神', length: 9, category: 'blessing', scene: 'general', tags: ['马年', '精神'] },
  { id: 's4', text: '马上有钱，马上有福', length: 9, category: 'blessing', scene: 'general', tags: ['马年', '谐音梗'] },
  { id: 's5', text: '快马加鞭，前程似锦', length: 9, category: 'blessing', scene: 'career', tags: ['马年', '事业'] },
  { id: 's6', text: '万马奔腾，福运亨通', length: 9, category: 'blessing', scene: 'general', tags: ['马年', '运气'] },
  { id: 's7', text: '马年大吉，心想事成', length: 9, category: 'blessing', scene: 'general', tags: ['马年', '通用'] },
  { id: 's8', text: '马踏祥云，福星高照', length: 9, category: 'blessing', scene: 'general', tags: ['马年', '吉祥'] },
  { id: 's9', text: '千里马志，一路顺风', length: 9, category: 'blessing', scene: 'career', tags: ['马年', '事业'] },
  { id: 's10', text: '马蹄声声，喜事连连', length: 9, category: 'blessing', scene: 'general', tags: ['马年', '喜庆'] },
  { id: 's11', text: '金马迎春，福满人间', length: 9, category: 'blessing', scene: 'general', tags: ['马年', '春节'] },
  { id: 's12', text: '跃马扬鞭，事业辉煌', length: 9, category: 'blessing', scene: 'career', tags: ['马年', '事业'] },
  { id: 's13', text: '马年如意，幸福美满', length: 9, category: 'blessing', scene: 'general', tags: ['马年', '幸福'] },
  { id: 's14', text: '天马行空，梦想成真', length: 9, category: 'blessing', scene: 'general', tags: ['马年', '梦想'] },
  { id: 's15', text: '马不停蹄，财源广进', length: 9, category: 'blessing', scene: 'wealth', tags: ['马年', '财运'] },
  { id: 's16', text: '马首是瞻，福气满堂', length: 9, category: 'blessing', scene: 'general', tags: ['马年', '福气'] },
  { id: 's17', text: '骏马奔腾，鸿运当头', length: 9, category: 'blessing', scene: 'general', tags: ['马年', '好运'] },
  { id: 's18', text: '马年快乐，步步高升', length: 9, category: 'blessing', scene: 'career', tags: ['马年', '升职'] },
  { id: 's19', text: '马蹄踏春，喜气洋洋', length: 9, category: 'blessing', scene: 'general', tags: ['马年', '春节'] },
  { id: 's20', text: '马到财来，金玉满堂', length: 9, category: 'blessing', scene: 'wealth', tags: ['马年', '财运'] },

  // 财运系列（10条）
  { id: 's21', text: '财源广进，福运亨通', length: 9, category: 'blessing', scene: 'wealth', tags: ['财运', '通用'] },
  { id: 's22', text: '金银满屋，富贵满堂', length: 9, category: 'blessing', scene: 'wealth', tags: ['财运', '富贵'] },
  { id: 's23', text: '招财进宝，福星高照', length: 9, category: 'blessing', scene: 'wealth', tags: ['财运', '吉祥'] },
  { id: 's24', text: '财神到，福气到', length: 7, category: 'blessing', scene: 'wealth', tags: ['财运', '简短'] },
  { id: 's25', text: '数钱数到手抽筋', length: 7, category: 'blessing', scene: 'wealth', tags: ['财运', '幽默'] },
  { id: 's26', text: '钱袋鼓鼓，笑口常开', length: 9, category: 'blessing', scene: 'wealth', tags: ['财运', '开心'] },
  { id: 's27', text: '财源滚滚，日进斗金', length: 9, category: 'blessing', scene: 'wealth', tags: ['财运', '生意'] },
  { id: 's28', text: '金玉满堂，富贵安康', length: 9, category: 'blessing', scene: 'wealth', tags: ['财运', '健康'] },
  { id: 's29', text: '五福临门，财运亨通', length: 9, category: 'blessing', scene: 'wealth', tags: ['财运', '五福'] },
  { id: 's30', text: '发财致富，心想事成', length: 9, category: 'blessing', scene: 'wealth', tags: ['财运', '通用'] },

  // 健康系列（10条）
  { id: 's31', text: '身体健康，万事如意', length: 9, category: 'blessing', scene: 'health', tags: ['健康', '通用'] },
  { id: 's32', text: '龙马精神，福寿安康', length: 9, category: 'blessing', scene: 'health', tags: ['健康', '马年'] },
  { id: 's33', text: '福如东海，寿比南山', length: 9, category: 'blessing', scene: 'elder', tags: ['健康', '长辈'] },
  { id: 's34', text: '健康平安，幸福常伴', length: 9, category: 'blessing', scene: 'health', tags: ['健康', '平安'] },
  { id: 's35', text: '笑口常开，青春永驻', length: 9, category: 'blessing', scene: 'health', tags: ['健康', '青春'] },
  { id: 's36', text: '精神抖擞，活力满满', length: 9, category: 'blessing', scene: 'health', tags: ['健康', '活力'] },
  { id: 's37', text: '长命百岁，福寿双全', length: 9, category: 'blessing', scene: 'elder', tags: ['健康', '长寿'] },
  { id: 's38', text: '健康是福，平安是宝', length: 9, category: 'blessing', scene: 'health', tags: ['健康', '平安'] },
  { id: 's39', text: '身强体壮，万事顺心', length: 9, category: 'blessing', scene: 'health', tags: ['健康', '顺利'] },
  { id: 's40', text: '延年益寿，吉祥如意', length: 9, category: 'blessing', scene: 'elder', tags: ['健康', '长辈'] },

  // 爱情系列（10条）
  { id: 's41', text: '白头偕老，百年好合', length: 9, category: 'blessing', scene: 'lover', tags: ['爱情', '婚姻'] },
  { id: 's42', text: '比翼双飞，琴瑟和鸣', length: 9, category: 'blessing', scene: 'lover', tags: ['爱情', '和谐'] },
  { id: 's43', text: '永结同心，相爱一生', length: 9, category: 'blessing', scene: 'lover', tags: ['爱情', '永恒'] },
  { id: 's44', text: '情深意重，幸福美满', length: 9, category: 'blessing', scene: 'lover', tags: ['爱情', '幸福'] },
  { id: 's45', text: '天长地久，甜蜜如初', length: 9, category: 'blessing', scene: 'lover', tags: ['爱情', '甜蜜'] },
  { id: 's46', text: '携手共进，相守一生', length: 9, category: 'blessing', scene: 'lover', tags: ['爱情', '相守'] },
  { id: 's47', text: '爱意满满，幸福满满', length: 9, category: 'blessing', scene: 'lover', tags: ['爱情', '满满'] },
  { id: 's48', text: '情比金坚，爱如潮水', length: 9, category: 'blessing', scene: 'lover', tags: ['爱情', '坚贞'] },
  { id: 's49', text: '鸳鸯戏水，恩爱有加', length: 9, category: 'blessing', scene: 'lover', tags: ['爱情', '恩爱'] },
  { id: 's50', text: '浪漫常在，爱你永远', length: 9, category: 'blessing', scene: 'lover', tags: ['爱情', '浪漫'] },
];

// ===== 中等文案（20-40字）- 适合语音/视频 =====
export const MEDIUM_TEMPLATES: TextTemplate[] = [
  // 通用祝福（20条）
  { id: 'm1', text: '马年到，福气到，祝您身体健康，工作顺利，家庭美满，万事如意！', length: 28, category: 'blessing', scene: 'general', tags: ['马年', '通用', '全面'] },
  { id: 'm2', text: '新年快乐！愿您在马年里一马当先，事业有成，财源滚滚，幸福满满！', length: 30, category: 'blessing', scene: 'general', tags: ['马年', '通用', '事业'] },
  { id: 'm3', text: '祝您马年大吉，心想事成，步步高升，笑口常开，阖家欢乐！', length: 26, category: 'blessing', scene: 'general', tags: ['马年', '通用', '开心'] },
  { id: 'm4', text: '马年来临，祝福送上，愿您健康平安，事业辉煌，家庭幸福！', length: 26, category: 'blessing', scene: 'general', tags: ['马年', '通用', '平安'] },
  { id: 'm5', text: '新春佳节，祝您马年吉祥如意，福运连连，好事成双，笑口常开！', length: 28, category: 'blessing', scene: 'general', tags: ['马年', '春节', '吉祥'] },
  { id: 'm6', text: '马年到来，祝您一马平川，前程似锦，财运亨通，万事顺心！', length: 26, category: 'blessing', scene: 'general', tags: ['马年', '事业', '财运'] },
  { id: 'm7', text: '祝您马年快马加鞭，事业更上一层楼，生活更加美好幸福！', length: 26, category: 'blessing', scene: 'general', tags: ['马年', '事业', '生活'] },
  { id: 'm8', text: '马年祝福送给您，愿您福星高照，好运连连，心想事成！', length: 25, category: 'blessing', scene: 'general', tags: ['马年', '好运', '成功'] },
  { id: 'm9', text: '新年到，马年到，祝您家庭和睦，事业顺利，身体健康，万事如意！', length: 29, category: 'blessing', scene: 'general', tags: ['马年', '全面', '和睦'] },
  { id: 'm10', text: '马年祝您一帆风顺，二龙腾飞，三羊开泰，四季平安，五福临门！', length: 28, category: 'blessing', scene: 'general', tags: ['马年', '成语', '吉祥'] },
  { id: 'm11', text: '祝您马年喜气洋洋，福气满满，财气旺旺，人气旺旺，运气好好！', length: 28, category: 'blessing', scene: 'general', tags: ['马年', '叠词', '喜庆'] },
  { id: 'm12', text: '马年快乐！愿您天天开心，月月顺心，年年安心，永远舒心！', length: 26, category: 'blessing', scene: 'general', tags: ['马年', '开心', '顺心'] },
  { id: 'm13', text: '新春快乐！祝您马年马到成功，一切顺利，幸福安康！', length: 23, category: 'blessing', scene: 'general', tags: ['马年', '简洁', '成功'] },
  { id: 'm14', text: '马年祝您鸿运当头，好事连连，笑口常开，青春永驻！', length: 23, category: 'blessing', scene: 'general', tags: ['马年', '好运', '青春'] },
  { id: 'm15', text: '祝您马年福如东海，寿比南山，财源广进，家庭美满！', length: 23, category: 'blessing', scene: 'general', tags: ['马年', '福寿', '财运'] },
  { id: 'm16', text: '马年到，祝您工作顺顺利利，生活开开心心，身体健健康康！', length: 27, category: 'blessing', scene: 'general', tags: ['马年', '叠词', '全面'] },
  { id: 'm17', text: '新年新气象，马年马上好，祝您心想事成，梦想成真！', length: 23, category: 'blessing', scene: 'general', tags: ['马年', '梦想', '成功'] },
  { id: 'm18', text: '马年祝您财源滚滚，福运连连，事业辉煌，家庭幸福！', length: 23, category: 'blessing', scene: 'general', tags: ['马年', '财运', '事业'] },
  { id: 'm19', text: '祝您马年万事如意，心想事成，平安健康，快乐每一天！', length: 24, category: 'blessing', scene: 'general', tags: ['马年', '如意', '快乐'] },
  { id: 'm20', text: '马年到来，祝您龙马精神，活力满满，好运连连，幸福美满！', length: 26, category: 'blessing', scene: 'general', tags: ['马年', '精神', '好运'] },

  // 长辈祝福（15条）
  { id: 'm21', text: '敬祝长辈新春快乐，身体健康，福如东海，寿比南山，马年吉祥如意！', length: 30, category: 'blessing', scene: 'elder', tags: ['长辈', '马年', '健康'] },
  { id: 'm22', text: '祝爷爷奶奶马年身体倍儿棒，精神抖擞，笑口常开，健康长寿！', length: 28, category: 'blessing', scene: 'elder', tags: ['长辈', '马年', '长寿'] },
  { id: 'm23', text: '敬祝爸妈马年快乐，身体健康，万事如意，天天开心，永远年轻！', length: 28, category: 'blessing', scene: 'elder', tags: ['父母', '马年', '年轻'] },
  { id: 'm24', text: '祝长辈马年福寿安康，子孙满堂，家庭和睦，幸福美满！', length: 24, category: 'blessing', scene: 'elder', tags: ['长辈', '马年', '家庭'] },
  { id: 'm25', text: '敬祝老人家马年龙马精神，笑口常开，福寿双全，吉祥如意！', length: 27, category: 'blessing', scene: 'elder', tags: ['长辈', '马年', '精神'] },
  { id: 'm26', text: '祝爸爸妈妈马年身体健康，工作顺利，心情愉快，万事如意！', length: 27, category: 'blessing', scene: 'elder', tags: ['父母', '马年', '健康'] },
  { id: 'm27', text: '敬祝长辈马年延年益寿，福如东海，寿比南山，阖家欢乐！', length: 25, category: 'blessing', scene: 'elder', tags: ['长辈', '马年', '长寿'] },
  { id: 'm28', text: '祝爷爷奶奶马年健康快乐，儿孙满堂，其乐融融，幸福安康！', length: 27, category: 'blessing', scene: 'elder', tags: ['长辈', '马年', '儿孙'] },
  { id: 'm29', text: '敬祝父母马年平安健康，生活美满，心想事成，天天开心！', length: 25, category: 'blessing', scene: 'elder', tags: ['父母', '马年', '平安'] },
  { id: 'm30', text: '祝长辈马年福星高照，身体健康，笑口常开，长命百岁！', length: 24, category: 'blessing', scene: 'elder', tags: ['长辈', '马年', '长寿'] },
  { id: 'm31', text: '敬祝老人马年精神矍铄，福寿绵长，儿孙孝顺，家庭美满！', length: 25, category: 'blessing', scene: 'elder', tags: ['长辈', '马年', '家庭'] },
  { id: 'm32', text: '祝爸妈马年身体倍棒，吃嘛嘛香，天天开心，永远年轻！', length: 24, category: 'blessing', scene: 'elder', tags: ['父母', '马年', '健康'] },
  { id: 'm33', text: '敬祝长辈马年鹤发童颜，福寿康宁，家庭和睦，幸福安康！', length: 25, category: 'blessing', scene: 'elder', tags: ['长辈', '马年', '童颜'] },
  { id: 'm34', text: '祝爷爷奶奶马年松柏长青，福寿双全，儿孙绕膝，天伦之乐！', length: 27, category: 'blessing', scene: 'elder', tags: ['长辈', '马年', '天伦'] },
  { id: 'm35', text: '敬祝父母马年身体健康，工作顺心，生活美满，永远幸福！', length: 25, category: 'blessing', scene: 'elder', tags: ['父母', '马年', '幸福'] },

  // 朋友祝福（15条）
  { id: 'm36', text: '老铁，马年快乐！愿你工作顺心，爱情甜蜜，天天开心，发大财！', length: 28, category: 'blessing', scene: 'friend', tags: ['朋友', '马年', '亲切'] },
  { id: 'm37', text: '哥们，马年祝你心想事成，万事如意，财运亨通，越来越帅！', length: 26, category: 'blessing', scene: 'friend', tags: ['朋友', '马年', '幽默'] },
  { id: 'm38', text: '兄弟，马年一起发财，一起变帅，一起脱单，一起快乐！', length: 24, category: 'blessing', scene: 'friend', tags: ['朋友', '马年', '并肩'] },
  { id: 'm39', text: '闺蜜，马年祝你美美哒，越来越漂亮，遇到白马王子！', length: 24, category: 'blessing', scene: 'friend', tags: ['朋友', '马年', '闺蜜'] },
  { id: 'm40', text: '朋友，马年祝你工作顺利，事业有成，家庭幸福，万事如意！', length: 27, category: 'blessing', scene: 'friend', tags: ['朋友', '马年', '通用'] },
  { id: 'm41', text: '好友，马年愿你快马加鞭，事业有成，钱包鼓鼓，笑容多多！', length: 26, category: 'blessing', scene: 'friend', tags: ['朋友', '马年', '事业'] },
  { id: 'm42', text: '兄弟姐妹，马年祝咱们友谊长存，快乐常伴，好运连连！', length: 24, category: 'blessing', scene: 'friend', tags: ['朋友', '马年', '友谊'] },
  { id: 'm43', text: '亲爱的朋友，马年祝你梦想成真，心想事成，幸福美满！', length: 24, category: 'blessing', scene: 'friend', tags: ['朋友', '马年', '梦想'] },
  { id: 'm44', text: '铁子，马年一起冲鸭！愿你升职加薪，脱单成功，走上人生巅峰！', length: 28, category: 'blessing', scene: 'friend', tags: ['朋友', '马年', '激励'] },
  { id: 'm45', text: '好兄弟，马年祝你身体棒棒，工作顺顺，爱情甜甜，钱包满满！', length: 27, category: 'blessing', scene: 'friend', tags: ['朋友', '马年', '叠词'] },
  { id: 'm46', text: '姐妹，马年祝你青春永驻，美丽常在，爱情如意，事业有成！', length: 26, category: 'blessing', scene: 'friend', tags: ['朋友', '马年', '姐妹'] },
  { id: 'm47', text: '老朋友，马年祝你福星高照，好运连连，健康快乐，万事如意！', length: 27, category: 'blessing', scene: 'friend', tags: ['朋友', '马年', '老友'] },
  { id: 'm48', text: '好基友，马年祝咱们基情满满，友谊常青，一起发财！', length: 23, category: 'blessing', scene: 'friend', tags: ['朋友', '马年', '基友'] },
  { id: 'm49', text: '亲，马年祝你工作不累，钱包不空，爱情不散，天天开心！', length: 25, category: 'blessing', scene: 'friend', tags: ['朋友', '马年', '网络'] },
  { id: 'm50', text: '朋友圈最靓的仔，马年祝你颜值爆表，桃花朵朵，幸福满满！', length: 27, category: 'blessing', scene: 'friend', tags: ['朋友', '马年', '幽默'] },

  // 爱人祝福（15条）
  { id: 'm51', text: '亲爱的，马年我们一起奔跑，一起成长，一起幸福，永远爱你！', length: 27, category: 'blessing', scene: 'lover', tags: ['爱人', '马年', '浪漫'] },
  { id: 'm52', text: '老婆，马年快乐！愿我们的爱情像马儿一样奔腾不息，幸福永远！', length: 28, category: 'blessing', scene: 'lover', tags: ['爱人', '马年', '比喻'] },
  { id: 'm53', text: '老公，马年祝你事业成功，身体健康，我们的家越来越幸福！', length: 27, category: 'blessing', scene: 'lover', tags: ['爱人', '马年', '家庭'] },
  { id: 'm54', text: '宝贝，马年愿你青春永驻，美丽常在，我会永远守护你！', length: 24, category: 'blessing', scene: 'lover', tags: ['爱人', '马年', '守护'] },
  { id: 'm55', text: '亲爱的，马年祝我们白头偕老，相爱一生，幸福美满！', length: 23, category: 'blessing', scene: 'lover', tags: ['爱人', '马年', '白头'] },
  { id: 'm56', text: '我的爱人，马年愿你笑容常在，快乐常伴，我永远陪着你！', length: 26, category: 'blessing', scene: 'lover', tags: ['爱人', '马年', '陪伴'] },
  { id: 'm57', text: '老婆大人，马年祝你心想事成，天天开心，永远爱你哦！', length: 24, category: 'blessing', scene: 'lover', tags: ['爱人', '马年', '宠溺'] },
  { id: 'm58', text: '亲亲，马年我们一起看日出，一起数星星，一起变老！', length: 23, category: 'blessing', scene: 'lover', tags: ['爱人', '马年', '浪漫'] },
  { id: 'm59', text: '我的小公主，马年祝你美美哒，开心每一天，我会保护你！', length: 26, category: 'blessing', scene: 'lover', tags: ['爱人', '马年', '保护'] },
  { id: 'm60', text: '宝宝，马年愿你健康快乐，事业顺利，我们的爱情甜甜蜜蜜！', length: 27, category: 'blessing', scene: 'lover', tags: ['爱人', '马年', '甜蜜'] },
  { id: 'm61', text: '亲爱哒，马年祝我们恩恩爱爱，和和美美，幸福到永远！', length: 24, category: 'blessing', scene: 'lover', tags: ['爱人', '马年', '恩爱'] },
  { id: 'm62', text: '我的唯一，马年愿你笑容如花，我会一直守在你身边！', length: 23, category: 'blessing', scene: 'lover', tags: ['爱人', '马年', '守候'] },
  { id: 'm63', text: '最爱的人，马年祝你万事如意，我会努力让你更幸福！', length: 23, category: 'blessing', scene: 'lover', tags: ['爱人', '马年', '努力'] },
  { id: 'm64', text: '老婆，马年我们一起赚钱，一起花钱，一起过幸福生活！', length: 25, category: 'blessing', scene: 'lover', tags: ['爱人', '马年', '生活'] },
  { id: 'm65', text: '亲爱的，马年愿我们的爱情比金坚，比海深，永不分离！', length: 25, category: 'blessing', scene: 'lover', tags: ['爱人', '马年', '坚贞'] },

  // 商务祝福（15条）
  { id: 'm66', text: '祝您马年生意兴隆，财源广进，事业蒸蒸日上，合作愉快！', length: 26, category: 'blessing', scene: 'business', tags: ['商务', '马年', '生意'] },
  { id: 'm67', text: '尊敬的合作伙伴，马年祝您财运亨通，事业有成，再创辉煌！', length: 27, category: 'blessing', scene: 'business', tags: ['商务', '马年', '伙伴'] },
  { id: 'm68', text: '张总，马年祝您一马当先，事业更上一层楼，身体健康！', length: 25, category: 'blessing', scene: 'business', tags: ['商务', '马年', '总裁'] },
  { id: 'm69', text: '祝贵公司马年业绩长虹，财源滚滚，再创佳绩，合作共赢！', length: 26, category: 'blessing', scene: 'business', tags: ['商务', '马年', '公司'] },
  { id: 'm70', text: '亲爱的客户，马年祝您生意兴隆，万事顺意，期待继续合作！', length: 27, category: 'blessing', scene: 'business', tags: ['商务', '马年', '客户'] },
  { id: 'm71', text: '李经理，马年祝您工作顺利，事业有成，家庭幸福，万事如意！', length: 28, category: 'blessing', scene: 'business', tags: ['商务', '马年', '经理'] },
  { id: 'm72', text: '尊敬的领导，马年祝您快马加鞭，事业辉煌，身体健康！', length: 24, category: 'blessing', scene: 'business', tags: ['商务', '马年', '领导'] },
  { id: 'm73', text: '祝您马年财源滚滚，日进斗金，生意兴隆，家庭美满！', length: 24, category: 'blessing', scene: 'business', tags: ['商务', '马年', '财运'] },
  { id: 'm74', text: '王总，马年祝您公司蒸蒸日上，业绩翻番，再创新高！', length: 23, category: 'blessing', scene: 'business', tags: ['商务', '马年', '业绩'] },
  { id: 'm75', text: '尊敬的先生/女士，马年祝您事业有成，家庭和睦，万事如意！', length: 28, category: 'blessing', scene: 'business', tags: ['商务', '马年', '礼貌'] },
  { id: 'm76', text: '祝您马年大展宏图，财源广进，事业更上一层楼！', length: 22, category: 'blessing', scene: 'business', tags: ['商务', '马年', '宏图'] },
  { id: 'm77', text: '感谢您的信任与支持，马年祝您生意兴隆，财运亨通！', length: 24, category: 'blessing', scene: 'business', tags: ['商务', '马年', '感谢'] },
  { id: 'm78', text: '尊敬的合作方，马年祝我们合作愉快，共创辉煌，互利共赢！', length: 27, category: 'blessing', scene: 'business', tags: ['商务', '马年', '合作'] },
  { id: 'm79', text: '祝您马年鸿运当头，财源滚滚，生意兴隆，心想事成！', length: 24, category: 'blessing', scene: 'business', tags: ['商务', '马年', '鸿运'] },
  { id: 'm80', text: '刘总，马年祝您龙马精神，事业有成，身体健康，万事顺心！', length: 27, category: 'blessing', scene: 'business', tags: ['商务', '马年', '精神'] },

  // 事业祝福（10条）
  { id: 'm81', text: '祝您马年工作顺利，步步高升，前程似锦，事业有成！', length: 24, category: 'blessing', scene: 'career', tags: ['事业', '马年', '升职'] },
  { id: 'm82', text: '马年祝你一马当先，在职场上大展宏图，创造佳绩！', length: 23, category: 'blessing', scene: 'career', tags: ['事业', '马年', '职场'] },
  { id: 'm83', text: '祝您马年快马加鞭，事业更上一层楼，实现人生理想！', length: 25, category: 'blessing', scene: 'career', tags: ['事业', '马年', '理想'] },
  { id: 'm84', text: '马年愿你工作顺心，升职加薪，成为职场精英！', length: 21, category: 'blessing', scene: 'career', tags: ['事业', '马年', '加薪'] },
  { id: 'm85', text: '祝您马年事业如日中天，前程似锦，飞黄腾达！', length: 21, category: 'blessing', scene: 'career', tags: ['事业', '马年', '腾达'] },
  { id: 'm86', text: '马年祝你跃马扬鞭，在事业上大显身手，一展抱负！', length: 23, category: 'blessing', scene: 'career', tags: ['事业', '马年', '抱负'] },
  { id: 'm87', text: '祝您马年工作出色，业绩突出，成为行业标杆！', length: 21, category: 'blessing', scene: 'career', tags: ['事业', '马年', '业绩'] },
  { id: 'm88', text: '马年愿你马到功成，在职场上所向披靡，成就非凡！', length: 23, category: 'blessing', scene: 'career', tags: ['事业', '马年', '成就'] },
  { id: 'm89', text: '祝您马年事业辉煌，名利双收，成为人生赢家！', length: 21, category: 'blessing', scene: 'career', tags: ['事业', '马年', '赢家'] },
  { id: 'm90', text: '马年祝你工作顺利，事业腾飞，实现心中梦想！', length: 21, category: 'blessing', scene: 'career', tags: ['事业', '马年', '梦想'] },

  // 财运祝福（10条）
  { id: 'm91', text: '祝您马年财源滚滚，日进斗金，生意兴隆，富贵满堂！', length: 24, category: 'blessing', scene: 'wealth', tags: ['财运', '马年', '生意'] },
  { id: 'm92', text: '马年祝你马到财来，金银满屋，富贵有余，财运亨通！', length: 24, category: 'blessing', scene: 'wealth', tags: ['财运', '马年', '富贵'] },
  { id: 'm93', text: '祝您马年招财进宝，财源广进，腰缠万贯，富甲一方！', length: 24, category: 'blessing', scene: 'wealth', tags: ['财运', '马年', '招财'] },
  { id: 'm94', text: '马年愿你财运亨通，数钱数到手抽筋，笑口常开！', length: 22, category: 'blessing', scene: 'wealth', tags: ['财运', '马年', '幽默'] },
  { id: 'm95', text: '祝您马年金玉满堂，财源滚滚，生活富足，幸福美满！', length: 24, category: 'blessing', scene: 'wealth', tags: ['财运', '马年', '富足'] },
  { id: 'm96', text: '马年祝你五福临门，财运亨通，发财致富，心想事成！', length: 24, category: 'blessing', scene: 'wealth', tags: ['财运', '马年', '五福'] },
  { id: 'm97', text: '祝您马年财神爷保佑，钱包鼓鼓，存款多多，投资有道！', length: 25, category: 'blessing', scene: 'wealth', tags: ['财运', '马年', '财神'] },
  { id: 'm98', text: '马年愿你财源广进，八方来财，生意兴隆，日进斗金！', length: 24, category: 'blessing', scene: 'wealth', tags: ['财运', '马年', '八方'] },
  { id: 'm99', text: '祝您马年财星高照，好运连连，赚钱多多，富贵安康！', length: 24, category: 'blessing', scene: 'wealth', tags: ['财运', '马年', '财星'] },
  { id: 'm100', text: '马年祝你财源滚滚，马到成功，发大财，走上人生巅峰！', length: 25, category: 'blessing', scene: 'wealth', tags: ['财运', '马年', '巅峰'] },
];

// ===== 场景分类 =====
export const SCENE_CATEGORIES: SceneCategory[] = [
  { id: 'general', name: '通用', icon: '', description: '适合所有场合' },
  { id: 'elder', name: '长辈', icon: '', description: '尊敬长辈，孝心满满' },
  { id: 'friend', name: '朋友', icon: '', description: '友谊常青，快乐无限' },
  { id: 'lover', name: '爱人', icon: '', description: '浪漫甜蜜，爱意满满' },
  { id: 'business', name: '商务', icon: '', description: '合作愉快，事业有成' },
  { id: 'wealth', name: '财运', icon: '', description: '财源滚滚，富贵满堂' },
  { id: 'health', name: '健康', icon: '', description: '身体健康，福寿安康' },
  { id: 'career', name: '事业', icon: '', description: '步步高升，前程似锦' },
];

// ===== 工具函数 =====

/**
 * 根据场景和长度要求获取文案
 */
export function getTemplatesByScene(
  scene: string = 'general',
  maxLength: number = 50
): TextTemplate[] {
  const allTemplates = [...SHORT_TEMPLATES, ...MEDIUM_TEMPLATES];
  return allTemplates.filter(t =>
    (t.scene === scene || (scene === 'general' && t.category === 'blessing')) &&
    t.length <= maxLength
  );
}

/**
 * 随机获取一条文案（换一换）
 */
export function getRandomTemplate(
  scene: string = 'general',
  maxLength: number = 50,
  excludeId?: string
): TextTemplate | null {
  const templates = getTemplatesByScene(scene, maxLength).filter(
    t => t.id !== excludeId
  );

  if (templates.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

/**
 * 搜索文案
 */
export function searchTemplates(
  keyword: string,
  maxLength: number = 50
): TextTemplate[] {
  const allTemplates = [...SHORT_TEMPLATES, ...MEDIUM_TEMPLATES];
  return allTemplates.filter(t =>
    t.length <= maxLength &&
    (t.text.includes(keyword) || t.tags.some(tag => tag.includes(keyword)))
  );
}

/**
 * 获取所有场景的统计信息
 */
export function getSceneStatistics(): Record<string, number> {
  const allTemplates = [...SHORT_TEMPLATES, ...MEDIUM_TEMPLATES];
  const stats: Record<string, number> = {};

  SCENE_CATEGORIES.forEach(category => {
    stats[category.id] = allTemplates.filter(t => t.scene === category.id).length;
  });

  return stats;
}
