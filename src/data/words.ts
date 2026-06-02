export interface Word {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  sentence: string;
  translation: string;
}

export interface GrammarPoint {
  title: string;
  desc: string;
}

export interface Unit {
  id: number | string;
  title: string;
  words: Word[];
  story?: string;
  storyTranslation?: string;
  grammarPoints?: GrammarPoint[];
}

export const wordData: Unit[] = [
  {
    id: 1,
    title: "Unit 1",
    words: [
      { id: "1-1", word: "dress", ipa: "/dres/", meaning: "穿衣；连衣裙", sentence: "I have a beautiful pink dress.", translation: "我有一件漂亮的粉色连衣裙。" },
      { id: "1-2", word: "brush", ipa: "/brʌʃ/", meaning: "刷", sentence: "Remember to brush your teeth every morning.", translation: "记得每天早上刷牙。" },
      { id: "1-3", word: "tooth", ipa: "/tuːθ/", meaning: "牙齿", sentence: "I lost my first baby tooth today!", translation: "我今天掉了第一颗乳牙！" },
      { id: "1-4", word: "wash", ipa: "/wɒʃ/", meaning: "洗", sentence: "Wash your hands before dinner.", translation: "饭前要洗手。" },
      { id: "1-5", word: "breakfast", ipa: "/ˈbrekfəst/", meaning: "早餐", sentence: "I like to eat eggs for breakfast.", translation: "我喜欢早餐吃鸡蛋。" },
      { id: "1-6", word: "after", ipa: "/ˈɑːftə(r)/", meaning: "在……之后", sentence: "We can play games after school.", translation: "放学后我们可以玩游戏。" },
      { id: "1-7", word: "forget", ipa: "/fəˈɡet/", meaning: "忘记", sentence: "Don't forget to bring your umbrella.", translation: "别忘了带伞。" },
      { id: "1-8", word: "table", ipa: "/ˈteɪbl/", meaning: "桌子", sentence: "Put your books on the table.", translation: "把你的书放在桌子上。" },
      { id: "1-9", word: "late", ipa: "/leɪt/", meaning: "迟到", sentence: "Hurry up! Don't be late for school.", translation: "快点！上学别迟到了。" },
      { id: "1-10", word: "quick", ipa: "/kwɪk/", meaning: "快的", sentence: "He is a very quick runner.", translation: "他跑得很快。" },
      { id: "1-11", word: "go", ipa: "/ɡəʊ/", meaning: "去", sentence: "Let's go to the park together.", translation: "我们一起去公园吧。" },
      { id: "1-12", word: "Saturday", ipa: "/ˈsætədeɪ/", meaning: "星期六", sentence: "I go to the library every Saturday.", translation: "我每个星期六都去图书馆。" },
      { id: "1-13", word: "today", ipa: "/təˈdeɪ/", meaning: "今天", sentence: "Today is a sunny day.", translation: "今天是个晴天。" },
    ],
    story: "Today is Saturday! Lily wears a cute pink dress. She runs to the table for breakfast. Oh! Don't forget to wash hands and brush every tooth! \"Hurry up, a quick dog is waiting! Let's go to the park, we won't be late! After that, we can play!\"",
    storyTranslation: "今天是星期六！莉莉穿着一件可爱的粉色连衣裙。她跑到桌子旁吃早餐。噢！别忘了洗手，刷干净每一颗牙齿！“快点，一只跑得很快的小狗正等着呢！我们去公园吧，不会迟到的！在那之后我们还可以玩耍！”"
  },
  {
    id: 2,
    title: "Unit 2",
    words: [
      { id: "2-1", word: "o'clock", ipa: "/əˈklɒk/", meaning: "……点钟", sentence: "It's seven o'clock, time to get up.", translation: "七点钟了，该起床了。" },
      { id: "2-2", word: "half", ipa: "/hɑːf/", meaning: "一半", translation: "我能吃你一半的苹果吗？", sentence: "Can I have half of your apple?" },
      { id: "2-3", word: "past", ipa: "/pɑːst/", meaning: "过了（时间）", sentence: "It's half past eight.", translation: "现在是八点半。" },
      { id: "2-4", word: "thirty", ipa: "/ˈθɜːti/", meaning: "三十", sentence: "There are thirty students in my class.", translation: "我们班有三十个学生。" },
      { id: "2-5", word: "home", ipa: "/həʊm/", meaning: "家", sentence: "I'm going home now.", translation: "我现在要回家了。" },
      { id: "2-6", word: "school", ipa: "/skuːl/", meaning: "学校", sentence: "I love my school and my teachers.", translation: "我爱我的学校和老师。" },
      { id: "2-7", word: "bed", ipa: "/bed/", meaning: "床", sentence: "It's time to go to bed.", translation: "该睡觉了。" },
      { id: "2-8", word: "time", ipa: "/taɪm/", meaning: "时间", sentence: "What time is it now?", translation: "现在几点了？" },
      { id: "2-9", word: "activity", ipa: "/ækˈtɪvəti/", meaning: "活动", sentence: "We have many fun activities at school.", translation: "我们在学校有很多有趣的活动。" },
      { id: "2-10", word: "no", ipa: "/nəʊ/", meaning: "不；没有", sentence: "No, I don't like spicy food.", translation: "不，我不喜欢辣的食物。" },
      { id: "2-11", word: "next", ipa: "/nekst/", meaning: "紧接着", sentence: "Who is next in line?", translation: "下一个是谁？" },
      { id: "2-12", word: "eight", ipa: "/eɪt/", meaning: "八", sentence: "I have eight colorful pencils.", translation: "我有八支彩色铅笔。" },
      { id: "2-13", word: "hurry", ipa: "/ˈhʌri/", meaning: "赶快", sentence: "Hurry up, the bus is coming!", translation: "快点，公共汽车来了！" },
      { id: "2-14", word: "dream", ipa: "/driːm/", meaning: "梦", sentence: "I had a sweet dream last night.", translation: "我昨晚做了一个甜美的梦。" },
      { id: "2-15", word: "eleven", ipa: "/ɪˈlevn/", meaning: "十一", sentence: "My brother is eleven years old.", translation: "我哥哥十一岁了。" },
      { id: "2-16", word: "twelve", ipa: "/twelv/", meaning: "十二", sentence: "There are twelve months in a year.", translation: "一年有十二个月。" },
    ],
    story: "Look, the clock says seven o'clock! It's time to hurry to school! At half past eight, eleven boys and twelve girls play a fun activity. They have thirty minutes. \"Who is next?\" \"No, next is eight o'clock, time for bed!\" Ben goes home, lies in bed, and has a sweet dream.",
    storyTranslation: "看，时钟指着七点钟！是该赶紧去学校的时间了！在八点半，十一个男孩和十二个女孩进行了一次有趣的活动。他们有三十分钟时间。“下一个是谁？”“不，下一项是八点钟，该上床睡觉了！”本回到了家，躺在床上，做了一个甜美的梦。"
  },
  {
    id: 3,
    title: "Unit 3",
    words: [
      { id: "3-1", word: "plan", ipa: "/plæn/", meaning: "计划", sentence: "What's your plan for the weekend?", translation: "你周末有什么计划？" },
      { id: "3-2", word: "twenty", ipa: "/ˈtwenti/", meaning: "二十", sentence: "I can count from one to twenty.", translation: "我可以从一数到二十。" },
      { id: "3-3", word: "forty", ipa: "/ˈfɔːti/", meaning: "四十", sentence: "My father is forty years old.", translation: "我爸爸四十岁了。" },
      { id: "3-4", word: "fifty", ipa: "/ˈfɪfti/", meaning: "五十", sentence: "There are fifty stars on the flag.", translation: "国旗上有五十颗星。" },
      { id: "3-5", word: "dinner", ipa: "/ˈdɪnə(r)/", meaning: "晚餐", sentence: "We usually have dinner at six.", translation: "我们通常六点吃晚饭。" },
      { id: "3-6", word: "book", ipa: "/bʊk/", meaning: "书", sentence: "I like reading story books.", translation: "我喜欢读故事书。" },
      { id: "3-7", word: "sport", ipa: "/spɔːt/", meaning: "运动", sentence: "Basketball is my favorite sport.", translation: "篮球是我最喜欢的运动。" },
      { id: "3-8", word: "TV", ipa: "/ˌtiː ˈviː/", meaning: "电视", sentence: "Don't watch too much TV.", translation: "不要看太多电视。" },
      { id: "3-9", word: "club", ipa: "/klʌb/", meaning: "社团", sentence: "I want to join the art club.", translation: "我想加入美术社团。" },
      { id: "3-10", word: "at", ipa: "/æt/", meaning: "在……", sentence: "I'll meet you at the gate.", translation: "我在门口等你。" },
      { id: "3-11", word: "maybe", ipa: "/ˈmeɪbi/", meaning: "也许", sentence: "Maybe we can go swimming tomorrow.", translation: "也许我们明天可以去游泳。" },
      { id: "3-12", word: "think", ipa: "/θɪŋk/", meaning: "想，认为", sentence: "I think this is a good idea.", translation: "我觉得这是个好主意。" },
      { id: "3-13", word: "about", ipa: "/əˈbaʊt/", meaning: "关于", sentence: "Tell me about your new friend.", translation: "跟我说说你的新朋友吧。" },
      { id: "3-14", word: "pack", ipa: "/pæk/", meaning: "收拾", sentence: "Please pack your schoolbag.", translation: "请收拾好你的书包。" },
      { id: "3-15", word: "schoolbag", ipa: "/ˈskuːlbæɡ/", meaning: "书包", sentence: "My schoolbag is very heavy.", translation: "我的书包很重。" },
      { id: "3-16", word: "hour", ipa: "/ˈaʊə(r)/", meaning: "小时", sentence: "We have one hour for lunch.", translation: "我们有一个小时的午餐时间。" },
      { id: "3-17", word: "every", ipa: "/ˈevri/", meaning: "每个", sentence: "I drink milk every day.", translation: "我每天都喝牛奶。" },
      { id: "3-18", word: "day", ipa: "/deɪ/", meaning: "一天", sentence: "Have a nice day!", translation: "祝你今天愉快！" },
      { id: "3-19", word: "sleep", ipa: "/sliːp/", meaning: "睡觉", sentence: "The baby is fast asleep.", translation: "宝宝睡得很香。" },
      { id: "3-20", word: "find", ipa: "/faɪnd/", meaning: "找到", sentence: "I can't find my keys.", translation: "我找不到我的钥匙了。" },
      { id: "3-21", word: "Sunday", ipa: "/ˈsʌndeɪ/", meaning: "星期日", sentence: "We go to the park on Sunday.", translation: "我们星期天去公园。" },
      { id: "3-22", word: "child", ipa: "/tʃaɪld/", meaning: "孩子", sentence: "She is a very clever child.", translation: "她是一个非常聪明的孩子。" },
      { id: "3-23", word: "mother", ipa: "/ˈmʌðə(r)/", meaning: "母亲", sentence: "My mother is a doctor.", translation: "我妈妈是一名医生。" },
      { id: "3-24", word: "father", ipa: "/ˈfɑːðə(r)/", meaning: "父亲", sentence: "My father likes playing football.", translation: "我爸爸喜欢踢足球。" },
      { id: "3-25", word: "new", ipa: "/njuː/", meaning: "新的", sentence: "I have a new pair of shoes.", translation: "我有一双新鞋。" },
      { id: "3-26", word: "year", ipa: "/jɪə(r)/", meaning: "年", sentence: "Happy New Year!", translation: "新年快乐！" },
    ],
    story: "On Sunday, a clever child named Jack has a new plan. \"Maybe I can join a sport club at school,\" he says. His father is forty years old, and his mother is fifty. \"Think about your schoolbag,\" mother says. Every day, Jack spends one hour to pack his books inside. After a family dinner, they watch TV. When it's time to sleep, Jack is happy that this year he can find twenty friends under the stars!",
    storyTranslation: "在星期日，一个名叫杰克的聪明孩子有了一个新计划。“也许我可以在学校加入一个体育社团，”他说。他的父亲四十岁，他的母亲五十岁。“想一想你的书包，”妈妈说。每天，杰克花一个小时把他的书收拾进去。在温馨的家庭晚饭后，他们一起看电视。到睡觉的时间了，杰克很高兴，因为今年他在星空下能找到二十个好朋友！"
  },
  {
    id: 4,
    title: "Unit 4",
    words: [
      { id: "4-1", word: "join", ipa: "/dʒɔɪn/", meaning: "加入", sentence: "Would you like to join us?", translation: "你想加入我们吗？" },
      { id: "4-2", word: "sure", ipa: "/ʃʊə(r)/", meaning: "当然", sentence: "Sure, I'd love to help.", translation: "当然，我很乐意帮忙。" },
      { id: "4-3", word: "love", ipa: "/lʌv/", meaning: "愿意，喜爱", sentence: "I love eating ice cream.", translation: "我喜欢吃冰淇淋。" },
      { id: "4-4", word: "football", ipa: "/ˈfʊtbɔːl/", meaning: "足球", sentence: "Let's play football after school.", translation: "放学后我们去踢足球吧。" },
      { id: "4-5", word: "just", ipa: "/dʒʌst/", meaning: "只是；正好", sentence: "I'm just a student.", translation: "我只是个学生。" },
      { id: "4-6", word: "thing", ipa: "/θɪŋ/", meaning: "东西，事物", sentence: "What's that thing on the desk?", translation: "桌子上的那个东西是什么？" },
      { id: "4-7", word: "fun", ipa: "/fʌn/", meaning: "乐趣；有趣的", sentence: "Learning English is fun.", translation: "学英语很有趣。" },
      { id: "4-8", word: "ask", ipa: "/ɑːsk/", meaning: "邀请；询问", sentence: "Can I ask you a question?", translation: "我可以问你一个问题吗？" },
      { id: "4-9", word: "her", ipa: "/hɜː(r)/", meaning: "她；她的", sentence: "This is her book.", translation: "这是她的书。" },
      { id: "4-10", word: "idea", ipa: "/aɪˈdɪə/", meaning: "主意", sentence: "That's a great idea!", translation: "那是个好主意！" },
      { id: "4-11", word: "eat", ipa: "/iːt/", meaning: "吃", sentence: "I like to eat apples.", translation: "我喜欢吃苹果。" },
    ],
    story: "Little Sally has a great idea! She loves to eat yummy things, but today she wants to run. \"Can I join your game?\" she asks Lucy. \"Sure! Playing football is just the most fun thing!\" Lucy tells her.",
    storyTranslation: "小萨莉有一个绝妙的主意！她喜欢吃美味的东西，但今天她想跑跑步。“我能加入你们的游戏吗？”她问露西。“当然可以！踢足球就是最有趣的事情！”露西告诉她。"
  },
  {
    id: 5,
    title: "Unit 5",
    words: [
      { id: "5-1", word: "run", ipa: "/rʌn/", meaning: "跑", sentence: "Don't run in the hallway.", translation: "不要在走廊里跑。" },
      { id: "5-2", word: "best", ipa: "/best/", meaning: "最好；最好的", sentence: "You are my best friend.", translation: "你是我最好的朋友。" },
      { id: "5-3", word: "rule", ipa: "/ruːl/", meaning: "规则", sentence: "We must follow the school rules.", translation: "我们必须遵守学校规则。" },
      { id: "5-4", word: "take", ipa: "/teɪk/", meaning: "携带；拿走", sentence: "Take your umbrella with you.", translation: "带上你的伞。" },
      { id: "5-5", word: "turn", ipa: "/tɜːn/", meaning: "机会；转动", sentence: "It's your turn to play.", translation: "轮到你玩了。" },
      { id: "5-6", word: "speak", ipa: "/spiːk/", meaning: "说话", sentence: "Can you speak English?", translation: "你会说英语吗？" },
      { id: "5-7", word: "give", ipa: "/ɡɪv/", meaning: "给", sentence: "Give me a hand, please.", translation: "请帮我一下。" },
      { id: "5-8", word: "away", ipa: "/əˈweɪ/", meaning: "离开", sentence: "Go away, I'm busy.", translation: "走开，我很忙。" },
      { id: "5-9", word: "must", ipa: "/mʌst/", meaning: "必须", sentence: "You must do your homework.", translation: "你必须做作业。" },
      { id: "5-10", word: "need", ipa: "/niːd/", meaning: "需要", sentence: "I need some help.", translation: "我需要一些帮助。" },
      { id: "5-11", word: "top", ipa: "/tɒp/", meaning: "最高", sentence: "He is at the top of the class.", translation: "他是班里最棒的。" },
      { id: "5-12", word: "talk", ipa: "/tɔːk/", meaning: "说话", sentence: "Let's talk about the movie.", translation: "我们谈谈那部电影吧。" },
      { id: "5-13", word: "exercise", ipa: "/ˈeksəsaɪz/", meaning: "锻炼，练习", sentence: "I do exercise every morning.", translation: "我每天早上锻炼。" },
      { id: "5-14", word: "clean", ipa: "/kliːn/", meaning: "干净的；打扫", sentence: "Keep your room clean.", translation: "保持房间整洁。" },
      { id: "5-15", word: "arrive", ipa: "/əˈraɪv/", meaning: "到达", sentence: "What time did you arrive?", translation: "你什么时候到的？" },
    ],
    story: "When we arrive at the gym, we do warm-up exercise. We must follow a rules: we need to clean the room first. Tim is our best runner, but he must not run away. \"Let's take a turn to speak and talk,\" says the teacher. She will give a shiny star to the kid at the top!",
    storyTranslation: "当我们到达体育馆时，我们做热身锻炼。我们必须遵守规则：我们需要先打扫干净房间。蒂姆是我们最棒的跑手，但他绝对不可以跑开。“让我们轮流来发言和谈话，”老师说。她会把一颗闪亮的星星送给最顶尖的孩子！"
  },
  {
    id: 6,
    title: "Unit 6",
    words: [
      { id: "6-1", word: "stand", ipa: "/stænd/", meaning: "站立", sentence: "Please stand up.", translation: "请起立。" },
      { id: "6-2", word: "line", ipa: "/laɪn/", meaning: "排，行", sentence: "Wait in line, please.", translation: "请排队等候。" },
      { id: "6-3", word: "lead", ipa: "/liːd/", meaning: "带领", sentence: "Follow me, I'll lead the way.", translation: "跟我来，我带路。" },
      { id: "6-4", word: "way", ipa: "/weɪ/", meaning: "路线；方法", sentence: "Which way is the library?", translation: "图书馆走哪条路？" },
      { id: "6-5", word: "carry", ipa: "/ˈkæri/", meaning: "搬运", sentence: "Can you help me carry this box?", translation: "你能帮我搬这个盒子吗？" },
      { id: "6-6", word: "food", ipa: "/fuːd/", meaning: "食物", sentence: "What's your favorite food?", translation: "你最喜欢的食物是什么？" },
      { id: "6-7", word: "out", ipa: "/aʊt/", meaning: "（拿）出", sentence: "Take your books out.", translation: "把书拿出来。" },
      { id: "6-8", word: "paper", ipa: "/ˈpeɪpə(r)/", meaning: "试卷；纸", sentence: "I need a piece of paper.", translation: "我需要一张纸。" },
      { id: "6-9", word: "lunch", ipa: "/lʌntʃ/", meaning: "午餐", sentence: "What's for lunch today?", translation: "今天午饭吃什么？" },
      { id: "6-10", word: "light", ipa: "/laɪt/", meaning: "灯；轻的", sentence: "Turn off the light when you leave.", translation: "离开时请关灯。" },
      { id: "6-11", word: "blackboard", ipa: "/ˈblækbɔːd/", meaning: "黑板", sentence: "Look at the blackboard, please.", translation: "请看黑板。" },
      { id: "6-12", word: "door", ipa: "/dɔː(r)/", meaning: "门", sentence: "Please close the door.", translation: "请关门。" },
      { id: "6-13", word: "plant", ipa: "/plɑːnt/", meaning: "植物", sentence: "I have many plants in my garden.", translation: "我的花园里有很多植物。" },
      { id: "6-14", word: "Monday", ipa: "/ˈmʌndeɪ/", meaning: "星期一", sentence: "Monday is the first day of school.", translation: "星期一是一周上学的第一天。" },
      { id: "6-15", word: "April", ipa: "/ˈeɪprəl/", meaning: "四月", sentence: "April is a spring month.", translation: "四月是春天的月份。" },
      { id: "6-16", word: "he", ipa: "/hi/", meaning: "他", sentence: "He is my best friend.", translation: "他是我的好朋友。" },
      { id: "6-17", word: "such", ipa: "/sʌtʃ/", meaning: "非常；这样的", sentence: "It's such a beautiful day!", translation: "真是美好的一天！" },
      { id: "6-18", word: "should", ipa: "/ʃʊd/", meaning: "应该", sentence: "You should go to bed early.", translation: "你应该早点睡觉。" },
      { id: "6-19", word: "some", ipa: "/sʌm/", meaning: "一些", sentence: "Would you like some water?", translation: "你想喝点水吗？" },
    ],
    story: "On a Monday in April, he went to school under such a soft warm light! Under a plant near the school door, he ate some lunch food. Then, the teacher said: \"Stand in a line, please. Let me lead the way. You should carry out your paper, look at the blackboard, and prepare to draw!\"",
    storyTranslation: "在四月的一个星期一，他走在上学的路上，头顶洒下如此柔和温暖的光芒！在学校大门旁的一株植物下，他吃了一些午餐饭菜。接下来，老师说：“请排好队。让我来带路。大家应该拿出纸，看着黑板，准备开始画画了！”"
  },
  {
    id: 7,
    title: "Unit 7",
    words: [
      { id: "7-1", word: "hold", ipa: "/həʊld/", meaning: "使保持；拿着", sentence: "Hold my hand, please.", translation: "请牵着我的手。" },
      { id: "7-2", word: "excuse", ipa: "/ɪkˈskjuːs/", meaning: "原谅", sentence: "Excuse me, can you help me?", translation: "打扰一下，你能帮我吗？" },
      { id: "7-3", word: "voice", ipa: "/vɔɪs/", meaning: "声音", sentence: "She has a very sweet voice.", translation: "她的声音很甜美。" },
      { id: "7-4", word: "down", ipa: "/daʊn/", meaning: "减弱；向下", sentence: "Sit down, please.", translation: "请坐。" },
      { id: "7-5", word: "or", ipa: "/ɔː(r)/", meaning: "或者", sentence: "Do you like apples or oranges?", translation: "你喜欢苹果还是橘子？" },
      { id: "7-6", word: "drink", ipa: "/drɪŋk/", meaning: "喝", sentence: "I want to drink some milk.", translation: "我想喝点牛奶。" },
      { id: "7-7", word: "we", ipa: "/wi/", meaning: "我们", sentence: "We are good friends.", translation: "我们是好朋友。" },
      { id: "7-8", word: "polite", ipa: "/pəˈlaɪt/", meaning: "礼貌的", sentence: "We should be polite to others.", translation: "我们应该对他人有礼貌。" },
      { id: "7-9", word: "there", ipa: "/ðeə(r)/", meaning: "那里", sentence: "Look! There is a bird.", translation: "看！那里有一只鸟。" },
      { id: "7-10", word: "sorry", ipa: "/ˈsɒri/", meaning: "对不起", sentence: "I'm sorry I'm late.", translation: "对不起，我迟到了。" },
      { id: "7-11", word: "toilet", ipa: "/ˈtɔɪlət/", meaning: "厕所", sentence: "Where is the toilet?", translation: "厕所在哪里？" },
      { id: "7-12", word: "knock", ipa: "/nɒk/", meaning: "敲", sentence: "Knock on the door before entering.", translation: "进门前要敲门。" },
      { id: "7-13", word: "off", ipa: "/ɒf/", meaning: "关闭", sentence: "Turn off the TV, please.", translation: "请关掉电视。" },
      { id: "7-14", word: "water", ipa: "/ˈwɔːtə(r)/", meaning: "水", sentence: "I need some water.", translation: "我需要一些水。" },
      { id: "7-15", word: "block", ipa: "/blɒk/", meaning: "挡住", sentence: "Don't block the way.", translation: "不要挡路。" },
    ],
    story: "\"Excuse me, we should be polite,\" says Tim. In a soft voice, he asks, \"Can we go down to the toilet or drink some water?\" \"Sure, Tim! But walk there, knock on the door, and turn off the tap when done,\" says the teacher. \"Sorry, don't block the way! Hold the cup safely and sit down to drink.\"",
    storyTranslation: "“打扰一下，我们应该有礼貌，”蒂姆说道。他用轻柔的声音问道：“我们可以下去洗手间或者喝点水吗？”“当然可以，蒂姆！但是走着去那里，进门要敲门，用完水后关掉水龙头，”老师说。“抱歉，不要挡路！端稳杯子，坐下来喝水。”"
  },
  {
    id: 8,
    title: "Unit 8 & Review",
    words: [
      { id: "8-1", word: "window", ipa: "/ˈwɪndəʊ/", meaning: "窗户", sentence: "Open the window, please.", translation: "请打开窗户。" },
      { id: "8-2", word: "fan", ipa: "/fæn/", meaning: "风扇；爱好者", sentence: "Turn on the fan, it's hot.", translation: "打开风扇，太热了。" },
      { id: "8-3", word: "close", ipa: "/kləʊz/", meaning: "关闭", sentence: "Close your eyes and make a wish.", translation: "闭上眼睛许个愿。" },
      { id: "8-4", word: "piano", ipa: "/piˈænəʊ/", meaning: "钢琴", sentence: "I practice the piano every day.", translation: "我每天练习钢琴。" },
      { id: "8-5", word: "desk", ipa: "/desk/", meaning: "书桌", sentence: "My desk is very tidy.", translation: "我的书桌很整洁。" },
      { id: "8-6", word: "computer", ipa: "/kəmˈpjuːtə(r)/", meaning: "电脑", sentence: "I use the computer for my homework.", translation: "我用电脑做作业。" },
      { id: "8-7", word: "use", ipa: "/juːz/", meaning: "使用", sentence: "Can I use your pen?", translation: "我可以用你的笔吗？" },
      { id: "8-8", word: "care", ipa: "/keə(r)/", meaning: "小心；照料", sentence: "Take care of yourself.", translation: "照顾好你自己。" },
      { id: "8-9", word: "chair", ipa: "/tʃeə(r)/", meaning: "椅子", sentence: "Sit on the chair, please.", translation: "请坐在椅子上。" },
      { id: "8-10", word: "classroom", ipa: "/ˈklɑːsruːm/", meaning: "教室", sentence: "Our classroom is big and bright.", translation: "我们的教室又大又亮。" },
      { id: "8-11", word: "library", ipa: "/ˈlaɪbrəri/", meaning: "图书馆", sentence: "I like reading in the library.", translation: "我喜欢在图书馆看书。" },
      { id: "8-12", word: "anyone", ipa: "/ˈeniwʌn/", meaning: "任何人", sentence: "Is there anyone in the room?", translation: "房间里有人吗？" },
      { id: "8-13", word: "before", ipa: "/bɪˈfɔː(r)/", meaning: "在……之前", sentence: "Wash your hands before eating.", translation: "饭前洗手。" },
      { id: "8-14", word: "place", ipa: "/pleɪs/", meaning: "地点", sentence: "This is a beautiful place.", translation: "这是一个漂亮的地方。" },
      { id: "r-1", word: "litter", ipa: "/ˈlɪtə(r)/", meaning: "乱扔；垃圾", sentence: "Don't litter in the park.", translation: "不要在公园里乱扔垃圾。" },
      { id: "r-2", word: "road", ipa: "/rəʊd/", meaning: "道路", sentence: "Look both ways before crossing the road.", translation: "过马路前要看两边。" },
      { id: "r-3", word: "sign", ipa: "/saɪn/", meaning: "标志", sentence: "Follow the traffic signs.", translation: "遵守交通标志。" },
    ],
    story: "In our bright classroom, each desk and chair is tidy. Before we use the computer or play the piano, we should close the window and turn off the fan. In the school library, a quiet place, anyone can read books with care. When you go outside on the road, look at the safety sign, and never litter!",
    storyTranslation: "在我们明亮的教室里，每张书桌和椅子都很整洁。在我们使用电脑或者弹钢琴之前，我们应该关上窗户，关掉电风扇。在学校的图书馆这个安静的地方，任何人都可以认真仔细地看书。当你走到外面马路上时，要看安全标志，千万不要乱扔垃圾！"
  }
];
