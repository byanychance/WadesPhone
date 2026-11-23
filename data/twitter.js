/* Twitter — timeline 2049-04-01 ~ 04-07 (phone viewed 2049-04-08).
   Provided content: text, profanity, typos and spacing must be kept exactly as written.

   users[handle]: { name, avatar? }   — no avatar images provided → default profile picture
   posts: { id, user, date, text, images[], stats{replies, rts, likes, views}, note?, replies[] }
     - every post is by a different account; reply accounts never reappear in another post
       (the author's own follow-up replies appear only inside that post).
     - stats are the values last loaded on the phone; they are fixed (shown as written).
     - stats.replies is the TOTAL reply count; `replies` holds only the ones shown.
     - `note` is a production note (the '상황' memo) and is never displayed.
   reply: { id, inReplyTo, user, date, text, likes }
     - inReplyTo is the explicit parent: the post id (direct reply) or another reply id in the same post.
       Never inferred from account names or order.
   Order here is oldest → newest; the app shows newest first.
   Wade (the phone's owner) does not post or reply in this timeline. */
window.WP_DATA = window.WP_DATA || {};
WP_DATA.twitter = {
  me: null, // the owner's own account isn't shown in this timeline

  // "팔로우 중" tab shows posts from these accounts only
  following: ['hanbit_news', 'safety_notice_kr'],
  // Search tab trends (each one matches text in the timeline)
  trends: ['#응급실', '#부평역', '#연락두절', '#수도권'],

  users: {
    min_0312: { name: '민' }, js_archive: { name: '지수' }, just_eyes_: { name: 'ㅇㅅㅇ' }, green_406: { name: '녹차' },
    off_0730: { name: '퇴근좀' }, yuja_tea_: { name: '유자' }, suuuu_09: { name: '수' },
    mandu_6: { name: '만두' }, summerfolder: { name: '여름' },
    hanbit_news: { name: '한빛뉴스' }, sy_park_88: { name: '박소연' }, radish_000: { name: '무' }, two_one_21: { name: '21' },
    hye_daily_: { name: '혜' }, peach_can_: { name: '복숭아통조림' }, jh_0816: { name: '정훈' },
    notyourcase_: { name: 'ㅇㅇ' }, seojin_m_: { name: '서진' }, keep_0403: { name: '기록' },
    daeun_52: { name: '다은' }, hyun_j_17: { name: '현' }, eunbi_room: { name: '은비' },
    nurung_ji: { name: '누룽지' }, jin_capture: { name: '진' }, smallwindow_: { name: ':)' },
    nana_051: { name: '나나' }, acorn_73: { name: '도토리' }, moon_082: { name: '달' },
    shkim_721: { name: '김성호' }, jae_h_42: { name: '재현' }, sora_note_: { name: '소라' },
    udon_lunch: { name: '우동' }, jeon_04: { name: '전' }, blanket_in: { name: '이불밖' },
    yk_112: { name: '유경' }, yoon_615: { name: '윤' }, bori_0202: { name: '보리' },
    room_904_: { name: 'ㅠ' }, mj_zz_: { name: '민정' }, jinsu_log: { name: '진수' },
    safety_notice_kr: { name: '재난안전안내' }, mykim_61: { name: '김미영' }, space____09: { name: '공백' }, jae_430: { name: '재' },
    onmyown_77: { name: '알아서함' }, hayoung_2: { name: '하영' }, dot_380: { name: '쩜' }, js_6021: { name: '준식' },
    haejin_find: { name: '해진' }, sunwoo_18: { name: '선우' }, jan_0004: { name: '잔' },
    last_nightshift: { name: '이직준비중' }, je_1030: { name: '정은' }, han_field: { name: '한' },
    store_0206: { name: '야간' }, yuri_331: { name: '유리' }, why_though_8: { name: '아니왜' }, ms_0824: { name: '민서' },
    subin_404: { name: '수빈' }, j_0319_: { name: '주원' }, dhkim_202: { name: '김도현' }, empty_602: { name: '빈칸' },
    pepper_house: { name: '후추집사' }, tuna_works: { name: '참치' }, yeon_215: { name: '연' },
    nah_551: { name: 'ㄴㄴ' }, kyung_019: { name: '경' }, joo_260: { name: '주' },
    sayit_908: { name: '할말함' }, sun_113: { name: '선' }, duck_8e: { name: '덕팔이' },
    arin_47: { name: '아린' }, yerim_052: { name: '예림' }, mh_790: { name: '민호' },
    jun_9205: { name: '준' }, jian_604: { name: '지안' }, young_081: { name: '영' },
  },

  posts: [
    { id: 'p01', user: 'min_0312', date: '2049-04-01 08:42',
      text: '다음주 벨기에 출장 취소됨\n호텔 취소하려고 전화했는데 아무도 안 받네 어제까진 메일 답장 왔는데',
      stats: { replies: '18', rts: '127', likes: '364', views: '2.8만' },
      replies: [
        { id: 'p01-r1', inReplyTo: 'p01', user: 'js_archive', date: '2049-04-01 08:48', text: '시차 때문에 그런 거 아님? 거기 아직 새벽일걸', likes: '86' },
        { id: 'p01-r2', inReplyTo: 'p01-r1', user: 'min_0312', date: '2049-04-01 08:53', text: '어제 낮부터 계속 했는데 안받음 프런트도 예약실도', likes: '31' },
        { id: 'p01-r3', inReplyTo: 'p01', user: 'just_eyes_', date: '2049-04-01 09:02', text: '저도 브뤼셀 숙소 연락 안 돼요 예약사이트에 문의 넣었는데 거기도 숙소 답변 기다리라고만 함', likes: '42' },
        { id: 'p01-r4', inReplyTo: 'p01', user: 'green_406', date: '2049-04-01 09:17', text: '거기 지금 뉴스 보니까 취소된 게 다행인듯', likes: '113' },
      ] },

    { id: 'p02', user: 'off_0730', date: '2049-04-01 23:16',
      text: '환자가 동료 팔 물어서 응급실 내려감\n보호자는 옆에서 아픈 사람한테 왜 소리 지르냐고 하고\n나 진짜 그만둘까',
      stats: { replies: '36', rts: '284', likes: '716', views: '5.9만' },
      replies: [
        { id: 'p02-r1', inReplyTo: 'p02', user: 'yuja_tea_', date: '2049-04-01 23:24', text: '치료비 병원에서 해줘요? 저희는 그것도 한번 말 나왔었음', likes: '93' },
        { id: 'p02-r2', inReplyTo: 'p02', user: 'suuuu_09', date: '2049-04-02 00:06', text: '저희 병동도 오늘 환자분이 간병인 무셨어요 요즘 왜 이래요 진짜', likes: '117' },
      ] },

    { id: 'p03', user: 'mandu_6', date: '2049-04-02 12:07',
      text: '점심 김치찌개 14000원\n고기는 세개 들어있음\n하나 먹을때마다 사천육백원이라고 생각하면서 먹는중',
      stats: { replies: '9', rts: '83', likes: '292', views: '1.7만' },
      replies: [
        { id: 'p03-r1', inReplyTo: 'p03', user: 'summerfolder', date: '2049-04-02 12:16', text: '밥은 따로임?', likes: '11' },
      ] },

    { id: 'p04', user: 'hanbit_news', date: '2049-04-02 17:30',
      text: '[속보] 수도권 일부 응급실 고열·경련 환자 증가…보건당국 역학조사 착수  \n\n해외 발생 사례와의 연관성은 아직 확인되지 않았습니다.',
      stats: { replies: '642', rts: '4,218', likes: '1,037', views: '98만' },
      replies: [
        { id: 'p04-r1', inReplyTo: 'p04', user: 'sy_park_88', date: '2049-04-02 17:35', text: '어느 병원인지 알려주시면 안 되나요 아이 입원해 있어요', likes: '806' },
        { id: 'p04-r2', inReplyTo: 'p04', user: 'radish_000', date: '2049-04-02 17:42', text: '어제는 국내 유입 없다더니', likes: '1,274' },
        { id: 'p04-r3', inReplyTo: 'p04', user: 'two_one_21', date: '2049-04-02 17:56', text: '기사 들어가도 똑같은 말밖에 없음', likes: '432' },
      ] },

    { id: 'p05', user: 'hye_daily_', date: '2049-04-03 10:18',
      text: '라면 사러 왔는데 라면만 없음\n직원분한테 물어보니까 언제 들어올지 모른대\n물이랑 과자는 아직 많아요',
      images: ['assets/images/twitter/store-shelves.webp'],
      stats: { replies: '34', rts: '193', likes: '681', views: '7.2만' },
      replies: [
        { id: 'p05-r1', inReplyTo: 'p05', user: 'peach_can_', date: '2049-04-03 10:26', text: '저희동네도 즉석밥이랑 라면 다 나갔어요', likes: '47' },
        { id: 'p05-r2', inReplyTo: 'p05', user: 'jh_0816', date: '2049-04-03 10:39', text: '물도 사두세요 저 어제 갔다가 그냥 왔는데 오늘은 없더라고요', likes: '126' },
      ] },

    { id: 'p06', user: 'notyourcase_', date: '2049-04-03 13:46',
      text: '좀비 믿는 새끼들은 평소에 무슨 생각 하고 사냐ㅋㅋㅋㅋ\n영상 몇개 보고 생수부터 사러가는거 존나 웃기네',
      stats: { replies: '218', rts: '76', likes: '492', views: '18만' },
      replies: [
        { id: 'p06-r1', inReplyTo: 'p06', user: 'seojin_m_', date: '2049-04-03 13:52', text: '병원에서 사람이 죽었다는데 그게 웃김?', likes: '381' },
        { id: 'p06-r2', inReplyTo: 'p06-r1', user: 'notyourcase_', date: '2049-04-03 13:55', text: '병원에서 원래 사람 죽어요 병신아', likes: '227' },
        { id: 'p06-r3', inReplyTo: 'p06-r2', user: 'keep_0403', date: '2049-04-03 14:02', text: '병신은 너고 병신아', likes: '619' },
      ] },

    { id: 'p07', user: 'daeun_52', date: '2049-04-03 16:21',
      text: '병원 오지 마세요 접수 안 받아요\n안에 있던 사람들도 다 나오라고 해서 밖에 있는데 직원분들도 어디로 가야 되는지 모른대요\n저희 할머니는 아직 안에 계세요',
      images: ['assets/images/twitter/hospital-crowd.webp'],
      stats: { replies: '286', rts: '2,731', likes: '1,984', views: '54만' },
      replies: [
        { id: 'p07-r1', inReplyTo: 'p07', user: 'hyun_j_17', date: '2049-04-03 16:27', text: '입원환자는 안 나오는 건가요? 저희 엄마도 안에 계신데 연락이 안 돼요', likes: '141' },
        { id: 'p07-r2', inReplyTo: 'p07', user: 'eunbi_room', date: '2049-04-03 16:34', text: '저 지금 오른쪽 주차장 쪽인데 여기로 환자분들 나오고 계세요', likes: '318' },
        { id: 'p07-r3', inReplyTo: 'p07-r2', user: 'daeun_52', date: '2049-04-03 16:38', text: '감사합니다 가볼게요', likes: '206' },
      ] },

    { id: 'p08', user: 'nurung_ji', date: '2049-04-03 19:08',
      text: '병원에서 시체 일어났다는 영상\n원본 어디서 봄? 지금 도는거 말고 처음 올라온거\n앞뒤 다 잘려있어서 뭘 보고 있는건지 모르겠음',
      stats: { replies: '91', rts: '146', likes: '327', views: '11만' },
      replies: [
        { id: 'p08-r1', inReplyTo: 'p08', user: 'jin_capture', date: '2049-04-03 19:15', text: '원본 올린 계정 잠겼음 팔로워만 볼 수 있음', likes: '122' },
        { id: 'p08-r2', inReplyTo: 'p08', user: 'smallwindow_', date: '2049-04-03 19:24', text: '지금 같은 영상에 병원 이름만 세개 붙어서 돌고있음', likes: '264' },
      ] },

    { id: 'p09', user: 'nana_051', date: '2049-04-03 21:52',
      text: '엄마한테 서울 나가자고 했더니 뉴스 그만 보고 자래\n아빠는 내일 출근해야 된다고 하고\n나 혼자 짐 싸놓음',
      stats: { replies: '7', rts: '218', likes: '963', views: '4.1만' },
      replies: [
        { id: 'p09-r1', inReplyTo: 'p09', user: 'acorn_73', date: '2049-04-03 22:04', text: '우리집도 나만 유난임 학교는 휴교했는데 엄마는 학원 가래', likes: '136' },
        { id: 'p09-r2', inReplyTo: 'p09', user: 'moon_082', date: '2049-04-03 22:17', text: '나도 아까 싸움 그럼 어디로 갈거냐는데 할말이 없더라', likes: '52' },
      ] },

    { id: 'p10', user: 'shkim_721', date: '2049-04-04 08:37',
      text: '여기 세시간째 서 있습니다. 앞에서 차 돌리라는데 차를 어디로 돌리라는 건지. 정확히 말을 안 해주네요.',
      images: ['assets/images/twitter/traffic-jam.webp'],
      stats: { replies: '117', rts: '1,482', likes: '1,206', views: '36만' },
      replies: [
        { id: 'p10-r1', inReplyTo: 'p10', user: 'jae_h_42', date: '2049-04-04 08:45', text: '저 앞쪽인데 사고차 치우는 정체 아닙니다 진입 막고 있어요', likes: '327' },
        { id: 'p10-r2', inReplyTo: 'p10', user: 'sora_note_', date: '2049-04-04 08:59', text: '저희 아빠도 거기 계신데 전화가 안 돼요 혹시 신호 괜찮으세요?', likes: '28' },
        { id: 'p10-r3', inReplyTo: 'p10-r2', user: 'shkim_721', date: '2049-04-04 09:12', text: '전화 걸면 끊깁니다. 문자도 늦게 오네요.', likes: '104' },
      ] },

    { id: 'p11', user: 'udon_lunch', date: '2049-04-04 09:06',
      text: '출근하지말라는 말이 그렇게 어렵냐\n상황 보고 본인 판단으로 출근하래놓고 안오면 연차차감이래',
      stats: { replies: '43', rts: '1,706', likes: '3,614', views: '32만' },
      replies: [
        { id: 'p11-r1', inReplyTo: 'p11', user: 'jeon_04', date: '2049-04-04 09:13', text: '우리도ㅋㅋ 대표는 안나옴', likes: '817' },
        { id: 'p11-r2', inReplyTo: 'p11', user: 'blanket_in', date: '2049-04-04 09:28', text: '난 그냥 안 간다고 보냄 나중에 잘리든가 말든가', likes: '239' },
      ] },

    { id: 'p12', user: 'yk_112', date: '2049-04-04 18:44',
      text: '아파트 앞인데 저 사람 옷에 피 묻은거 같아서 신고했어요\n아까부터 고개 숙이고 서있는데 누가 말 걸어도 안 쳐다봄\n경비실에서는 확인하러 간다고 했어요',
      images: ['assets/images/twitter/street-infected.webp'],
      stats: { replies: '389', rts: '3,612', likes: '2,240', views: '83만' },
      replies: [
        { id: 'p12-r1', inReplyTo: 'p12', user: 'yoon_615', date: '2049-04-04 18:49', text: '신고했으면 들어가세요 계속 찍고있지 마시고', likes: '704' },
        { id: 'p12-r2', inReplyTo: 'p12-r1', user: 'yk_112', date: '2049-04-04 18:52', text: '저 집이에요 아까 찍은 영상 캡처임', likes: '286' },
        { id: 'p12-r3', inReplyTo: 'p12', user: 'bori_0202', date: '2049-04-04 19:01', text: '경비분 혼자 가시면 안될것같은데', likes: '912' },
      ] },

    { id: 'p13', user: 'room_904_', date: '2049-04-04 20:13',
      text: '아ㅏ씨발 진짜 지금 우리 아파트에 미친 사람들이 사람들 물고 있더ㅏ고요 경비아저씨 넘어졌는데 위에 올라타서 물어요 내려가지마세요',
      stats: { replies: '207', rts: '4,783', likes: '1,418', views: '69만' },
      replies: [
        { id: 'p13-r1', inReplyTo: 'p13', user: 'mj_zz_', date: '2049-04-04 20:16', text: '어느 아파트예요????', likes: '53' },
        { id: 'p13-r2', inReplyTo: 'p13-r1', user: 'room_904_', date: '2049-04-04 20:18', text: '부천이요 아파트이름 쓰기 무서운데 일단 내려가지마세요 지금 경찰도 왔어요', likes: '271' },
        { id: 'p13-r3', inReplyTo: 'p13', user: 'jinsu_log', date: '2049-04-04 20:23', text: '우리동네도 방송나옴 지하주차장 가지말래', likes: '409' },
      ] },

    { id: 'p14', user: 'safety_notice_kr', date: '2049-04-04 21:00',
      text: '[긴급 안내]\n수도권 일부 지역에서 다수의 인명 피해가 발생하고 있습니다. 불필요한 외출을 자제하고 현장 통제에 협조해 주십시오.  \n\n공격적인 행동을 보이는 사람에게 접근하거나 직접 제압을 시도하지 마십시오.',
      stats: { replies: '3,482', rts: '2.8만', likes: '6,214', views: '420만' },
      replies: [
        { id: 'p14-r1', inReplyTo: 'p14', user: 'mykim_61', date: '2049-04-04 21:03', text: '밖에 있는 사람은 어디로 가나요 버스도 안 옵니다', likes: '6,182' },
        { id: 'p14-r2', inReplyTo: 'p14', user: 'space____09', date: '2049-04-04 21:07', text: '일부지역이 어딘데요 동 이름이라도 알려줘야 될거아니에요', likes: '8,407' },
        { id: 'p14-r3', inReplyTo: 'p14', user: 'jae_430', date: '2049-04-04 21:11', text: '접근 안하고 싶은데 걔들이 오잖아요', likes: '4,966' },
      ] },

    { id: 'p15', user: 'onmyown_77', date: '2049-04-04 22:36',
      text: '서울에서 내려오지좀 마세요 씨발\n차 존나 끌고와서 도로 다 막아놓고 주유소에서 기름 없다고 싸우고있네\n니들 동네에서 해결해 여기까지 끌고오지말고',
      stats: { replies: '472', rts: '163', likes: '681', views: '24만' },
      replies: [
        { id: 'p15-r1', inReplyTo: 'p15', user: 'hayoung_2', date: '2049-04-04 22:42', text: '사람이 죽으니까 내려오지 여행왔겠냐 병신아', likes: '1,527' },
        { id: 'p15-r2', inReplyTo: 'p15-r1', user: 'onmyown_77', date: '2049-04-04 22:45', text: '그래서 여기 사람들도 같이 죽으라고?', likes: '318' },
        { id: 'p15-r3', inReplyTo: 'p15', user: 'dot_380', date: '2049-04-04 22:53', text: '니가 땅 샀냐 뭔데 오라마라야', likes: '2,106' },
        { id: 'p15-r4', inReplyTo: 'p15', user: 'js_6021', date: '2049-04-04 23:01', text: '나도 여기 사는데 도로 막힌거 맞고 주유소 줄 세시간째임... 말 좆같이 해도 이해는 간다', likes: '492' },
      ] },

    { id: 'p16', user: 'haejin_find', date: '2049-04-05 00:28',
      text: '아버지 연락두절이라 찾고 있습니다. 어제 오후 6시쯤 부천역 근처에서 마지막으로 통화했어요. 회색 작업복에 검은 등산가방, 왼쪽 다리가 불편하셔서 조금 절뚝이세요.\n보신 분 있으면 연락 부탁드립니다.',
      stats: { replies: '72', rts: '3,106', likes: '884', views: '28만' },
      replies: [
        { id: 'p16-r1', inReplyTo: 'p16', user: 'sunwoo_18', date: '2049-04-05 00:36', text: '연세랑 안경 쓰시는지도 적어주세요', likes: '63' },
        { id: 'p16-r2', inReplyTo: 'p16-r1', user: 'haejin_find', date: '2049-04-05 00:41', text: '67세시고 안경 안 쓰세요. 키 170 정도세요.', likes: '98' },
        { id: 'p16-r3', inReplyTo: 'p16', user: 'jan_0004', date: '2049-04-05 01:03', text: '부천역이면 북부광장 쪽 확인해보세요 저녁에 거기 사람들 모여있었어요 지금은 모르겠어요', likes: '124' },
      ] },

    { id: 'p17', user: 'last_nightshift', date: '2049-04-05 03:41',
      text: '영안실에서 시신 꺼내다가 직원 물렸어요 사망진단까지 끝난 환자였는데\n도와주러 간 사람도 물렸고 저는 계단으로 뛰어나왔어요\n동료들이  전화를  안 받아요',
      stats: { replies: '431', rts: '1.9만', likes: '7,362', views: '170만' },
      replies: [
        { id: 'p17-r1', inReplyTo: 'p17', user: 'je_1030', date: '2049-04-05 03:46', text: '어느 병원이에요 저희 아빠 장례식장에 계세요 제발 답해주세요', likes: '482' },
        { id: 'p17-r2', inReplyTo: 'p17', user: 'han_field', date: '2049-04-05 04:07', text: '직원이시면 명찰 빼세요 밖에서 병원사람 붙잡고 안놔줘요 저도 겨우 나왔어요', likes: '139' },
      ] },

    { id: 'p18', user: 'store_0206', date: '2049-04-05 05:52',
      text: '살려주세요 편의점 문 부서질거같아요 밖에 사람들 다 물렸어요 씨발 자동문 껐는데 계속 밀어요 어디로 나가야돼요 뒷문없어요',
      images: ['assets/images/twitter/store-door-infected.webp'],
      stats: { replies: '618', rts: '1.3만', likes: '3,107', views: '140만' },
      replies: [
        { id: 'p18-r1', inReplyTo: 'p18', user: 'yuri_331', date: '2049-04-05 05:55', text: '어느 편의점이에요 위치 써주세요', likes: '261' },
        { id: 'p18-r2', inReplyTo: 'p18-r1', user: 'store_0206', date: '2049-04-05 05:58', text: '부평역 남쪽 큰길 건너서 편의점이요 간판 초록색 제발', likes: '604' },
        { id: 'p18-r3', inReplyTo: 'p18-r2', user: 'why_though_8', date: '2049-04-05 06:04', text: '위치까지 써주네 좀비들도 이거 보고 찾아가면 되겠다ㅋㅋ', likes: '73' },
        { id: 'p18-r4', inReplyTo: 'p18-r3', user: 'ms_0824', date: '2049-04-05 06:06', text: '진짜 사람새끼냐', likes: '1,362' },
        { id: 'p18-r5', inReplyTo: 'p18-r4', user: 'why_though_8', date: '2049-04-05 06:09', text: '난 아직 사람이지 글쓴놈은 모르겠고ㅋㅋ', likes: '106' },
      ] },

    { id: 'p19', user: 'subin_404', date: '2049-04-05 09:23',
      text: '체육관 대피 된다고 올린 글 지웠어요 못 들어간다고 합니다\n단톡에서 확인된 정보라고 해서 퍼온 건데 죄송합니다 제가 올린 거 더 퍼가지 말아주세요',
      stats: { replies: '386', rts: '2,604', likes: '619', views: '38만' },
      replies: [
        { id: 'p19-r1', inReplyTo: 'p19', user: 'j_0319_', date: '2049-04-05 09:29', text: '여기 왔는데 문 잠겨있어요 정문 말고 다른 데로 가야돼요?', likes: '164' },
        { id: 'p19-r2', inReplyTo: 'p19-r1', user: 'subin_404', date: '2049-04-05 09:33', text: '저도 직접 가본 건 아니라서 모르겠어요 죄송해요', likes: '47' },
        { id: 'p19-r3', inReplyTo: 'p19-r2', user: 'j_0319_', date: '2049-04-05 09:36', text: '안 가봤다고? 아까 확실하냐고 물어봤을때 가도 된다며 엄마 휠체어 밀고 두시간 걸려서 왔는데', likes: '827' },
        { id: 'p19-r4', inReplyTo: 'p19-r1', user: 'dhkim_202', date: '2049-04-05 09:42', text: '다른 입구도 잠겼습니다. 저희도 밖에서 기다리다가 돌아왔어요. 거기 있어도 아무도 안 나옵니다.', likes: '1,206' },
        { id: 'p19-r5', inReplyTo: 'p19-r3', user: 'subin_404', date: '2049-04-05 09:48', text: '단톡에 계신 분이 직접 확인했다고 해서 저도 믿었어요 그분한테 계속 연락하고 있는데 답이 없어요', likes: '26' },
        { id: 'p19-r6', inReplyTo: 'p19-r5', user: 'j_0319_', date: '2049-04-05 09:51', text: '니가 누굴 믿었는지 안물었어 씨발 여기까지 왔는데 ', likes: '619' },
        { id: 'p19-r7', inReplyTo: 'p19-r6', user: 'empty_602', date: '2049-04-05 10:02', text: '얘도 속은건데 여기서 욕한다고 뭐가 달라짐', likes: '82' },
        { id: 'p19-r8', inReplyTo: 'p19-r7', user: 'j_0319_', date: '2049-04-05 10:05', text: '니가 와서 도와줄거 아니면 닥쳐', likes: '491' },
      ] },

    { id: 'p20', user: 'pepper_house', date: '2049-04-05 12:14',
      text: '하루종일 아무것도 못먹고 폰만 보고 있었는데 고양이가 밥그릇 엎어서 정신차림\n밥 줬고 나도 뭐 먹으려고',
      stats: { replies: '38', rts: '1,762', likes: '5,903', views: '33만' },
      replies: [
        { id: 'p20-r1', inReplyTo: 'p20', user: 'tuna_works', date: '2049-04-05 12:21', text: '나도 이거 보고 밥먹음', likes: '469' },
        { id: 'p20-r2', inReplyTo: 'p20', user: 'yeon_215', date: '2049-04-05 12:35', text: '밥그릇 엎은거면 한참 기다렸네...', likes: '618' },
      ] },

    { id: 'p21', user: 'nah_551', date: '2049-04-05 18:17',
      note: '다른 곳에서 본 공격 영상을 언급하는 글. 별도 이미지 연결 없음.',
      text: '문 닫으라고 뒤에서 소리 지르는데 끝까지 잡고있다가 물리네\n저걸 못피해서 죽는것도 재주다 진짜',
      stats: { replies: '193', rts: '42', likes: '284', views: '16만' },
      replies: [
        { id: 'p21-r1', inReplyTo: 'p21', user: 'kyung_019', date: '2049-04-05 18:23', text: '문밖에 가족 있어서 못닫은거잖아 영상 소리 켜서 봐', likes: '1,087' },
        { id: 'p21-r2', inReplyTo: 'p21-r1', user: 'nah_551', date: '2049-04-05 18:26', text: '그럼 가족끼리 좋은데 갔겠네', likes: '91' },
        { id: 'p21-r3', inReplyTo: 'p21-r2', user: 'joo_260', date: '2049-04-05 18:39', text: '미친놈이냐?', likes: '1,416' },
      ] },

    { id: 'p22', user: 'sayit_908', date: '2049-04-06 00:54',
      text: '물린 가족 숨겨놓고 괜찮아질거야 이지랄하는 집 분명 있음\n느그집 신파 찍다가 옆집까지 다 뒤지게 하지말고 신고해라',
      stats: { replies: '267', rts: '1,208', likes: '2,176', views: '38만' },
      replies: [
        { id: 'p22-r1', inReplyTo: 'p22', user: 'sun_113', date: '2049-04-06 01:01', text: '말을 꼭 그렇게 해야 함?', likes: '183' },
        { id: 'p22-r2', inReplyTo: 'p22-r1', user: 'sayit_908', date: '2049-04-06 01:05', text: '물린 가족 숨기는건 괜찮고 비판하는 건 나쁜놈임? 우선순위 씨발ㅋㅋ', likes: '608' },
        { id: 'p22-r3', inReplyTo: 'p22-r1', user: 'duck_8e', date: '2049-04-06 01:05', text: '말하는 거 좆같긴한데 숨기지말라는 건 맞음 우리동네도 그것때문에 난리남', likes: '1,247' },
      ] },

    { id: 'p23', user: 'arin_47', date: '2049-04-06 11:07',
      text: '아빠 문자 방금 왔는데 어제 저녁에 보낸거였음\n답장 없어도 계속 보내놓으세요 늦게라도 오긴 와요\n전화는 아직 안됨',
      stats: { replies: '62', rts: '2,417', likes: '1,826', views: '27만' },
      replies: [
        { id: 'p23-r1', inReplyTo: 'p23', user: 'yerim_052', date: '2049-04-06 11:16', text: '저도 새벽에 보낸거 이제 전송됐어요', likes: '131' },
        { id: 'p23-r2', inReplyTo: 'p23', user: 'mh_790', date: '2049-04-06 11:28', text: '혹시 통신사 어디세요? 저희집은 아예 안터져요', likes: '24' },
        { id: 'p23-r3', inReplyTo: 'p23-r2', user: 'arin_47', date: '2049-04-06 11:41', text: '통신사보다 위치 차이같아요 저도 집에선 안되고 지금 밖에 나와서 받았어요', likes: '92' },
      ] },

    { id: 'p24', user: 'jun_9205', date: '2049-04-07 04:18',
      text: '부평역 남쪽 약국 건물 2층에 세 명 있어요 한 명 다쳐서 못 움직여요 계단까지 들어왔어요 문 잠갔는데 밖에서 계속 들이받아요 이거 보이면 신고 좀 해주세요',
      stats: { replies: '12', rts: '183', likes: '96', views: '1.4만' },
      replies: [
        { id: 'p24-r1', inReplyTo: 'p24', user: 'jian_604', date: '2049-04-07 04:26', text: '신고 넣었어요 전화는 안되고 문자 보냈어요', likes: '19' },
        { id: 'p24-r2', inReplyTo: 'p24-r1', user: 'jun_9205', date: '2049-04-07 04:39', text: '감사합니다 아직 안왔어요', likes: '37' },
        { id: 'p24-r3', inReplyTo: 'p24-r2', user: 'young_081', date: '2049-04-07 05:12', text: '지금은요?', likes: '8' },
      ] },
  ],
};
