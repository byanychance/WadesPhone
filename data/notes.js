/* Notes — folders and notes (read-only on the phone).
   note: { id, folder, modified ('YYYY-MM-DD HH:MM'), title: [en, ko], lines: [[en, ko, opt?], ...],
           opt: { roster: true } compact roster row; { strike: [en, ko] } strikes that text only
           after?: [[en, ko], ...]  (Wade's own add-on, shown under a divider),
           draft?: true             (kept here, never shown on the phone),
           pinned?: true            (always first in its folder) }
   Each English sentence is shown with its Korean paraphrase right below it.
   Only memo sentences go here — no authoring notes, reasons or rules.
   `modified` = last edit date (phone "now" is 2049-12-01). Briefing notes keep their early-April dates;
   later-organized notes show 2049-11-30 (last edit, not discovery/encounter date).
   Dev metadata (not shown): the INFECTED classification notes were supplied through BLACKIRON,
   based on LUVIOGEN material — they are briefing information, not Wade's own sightings. */
window.WP_DATA = window.WP_DATA || {};
const ROSTER = { roster: true }; // pair option: compact roster row
WP_DATA.notes = {
  folders: [
    { id: 'infected', name: 'INFECTED' },
    { id: 'threat', name: 'THREAT ASSESSMENT' },
    { id: 'briefing', name: 'BRIEFING NOTES' },
  ],
  notes: [
    /* ---- INFECTED (source: BLACKIRON briefing, LUVIOGEN material) ---- */
    { id: 'inf-common', folder: 'infected', modified: '2049-04-03 23:40', pinned: true,
      title: ['ALL TYPES', '공통 사항'],
      lines: [
        ["They track by sight, sound, and smell. Losing sight of you doesn't mean they've stopped looking.", '눈, 귀, 코로 쫓는다. 시야에서 벗어났다고 추적이 끝난 건 아니다.'],
        ['They search the last place they detected you.', '놓치면 그 주변부터 뒤진다.'],
        ['No speech. No tool use.', '말 못 하고, 도구도 못 쓴다.'],
        ['Destroy the brainstem to stop them.', '멈추려면 뇌간을 부숴야 한다.'],
      ] },
    { id: 'inf-runner', folder: 'infected', modified: '2049-04-03 23:31',
      title: ['RUNNER', '러너'],
      lines: [
        ['Fast. Charges at movement and noise.', '빠르다. 뭐가 움직이거나 소리 나면 달려든다.'],
        ['If something blocks it, it keeps hitting the same spot.', '막히면 같은 데만 계속 들이받는다.'],
        ["A blocked route buys time. It doesn't end the pursuit.", '길을 막아 봤자 시간만 번다. 추격은 안 끝난다.'],
      ] },
    // Brute, Stalker, Eunha, Carnival: 2049-11-30 is the last edit date — not when they were found or first met.
    { id: 'inf-brute', folder: 'infected', modified: '2049-11-30 23:22',
      title: ['BRUTE', '브루트'],
      lines: [
        ['Slower than a runner. Much stronger.', '러너보다 느리다. 힘은 훨씬 세다.'],
        ['Can break through doors and thin walls.', '문이나 얇은 벽은 부수고 들어온다.'],
        ["Don't count a closed door as cover.", '문 닫았다고 안전한 거 아니다.'],
      ] },
    { id: 'inf-stalker', folder: 'infected', modified: '2049-11-30 23:14',
      title: ['STALKER', '스토커'],
      lines: [
        ['Ambush type. Tracks quietly and uses cover.', '매복형. 조용히 따라붙고 엄폐물 뒤에 숨는다.'],
        ["Can climb. Doesn't have to come through the door.", '기어오른다. 문으로만 들어오는 게 아니다.'],
        ['Check above you before calling a room clear.', '방이 비었다고 하기 전에 위부터 볼 것.'],
      ] },
    { id: 'inf-queen', folder: 'infected', modified: '2049-04-03 23:05',
      title: ['QUEEN', '퀸'],
      lines: [
        ['Draws nearby infected with calls and scent.', '울음소리랑 냄새로 주변 감염체를 끌어모은다.'],
        ['The group can attack together and pull back together.', '무리가 같이 덮치고, 같이 빠진다.'],
        ['Watch the rest of them, not just the one making noise.', '소리 내는 놈만 보지 말고 나머지를 볼 것.'],
      ] },
    { id: 'inf-spitter', folder: 'infected', modified: '2049-04-03 22:57',
      title: ['SPITTER', '스피터'],
      lines: [
        ['Ranged type. Swelling throat and a wet cough before it spits acid.', '원거리형. 산성액을 뱉기 전에 목이 부풀고 가래 끓는 기침을 한다.'],
        ['That cough is the warning.', '그 기침이 신호다.'],
        ["Distance alone won't keep you safe.", '거리 벌렸다고 안심하지 말 것.'],
      ] },
    { id: 'inf-burrower', folder: 'infected', modified: '2049-04-03 22:48',
      title: ['BURROWER', '버로워'],
      lines: [
        ['Burrows. Tracks scent and vibration.', '땅을 판다. 냄새랑 진동으로 쫓는다.'],
        ['Can get under fences or come through drainage routes.', '울타리 밑으로도, 배수로로도 들어온다.'],
        ['Fresh soil and scratching under the floor. Check both.', '새로 파헤쳐진 흙, 바닥 밑 긁는 소리. 둘 다 확인.'],
      ] },

    /* ---- THREAT ASSESSMENT ---- */
    { id: 'thr-eunha', folder: 'threat', modified: '2049-11-30 21:30',
      title: ['EUNHA ELEMENTARY', '은하초등학교'],
      lines: [
        ['Forty to sixty people in an old elementary school. Civilians.', '폐교된 초등학교에 마흔에서 예순 명쯤. 민간인.'],
        ['Classrooms for sleeping, a shared kitchen, vegetable beds outside.', '교실에서 자고, 부엌은 같이 쓴다. 밖에 텃밭.'],
        ['Two fences. Six to ten on security. Mostly bows and whatever they can swing.', '울타리 두 겹. 경비는 여섯에서 열 명. 무기는 거의 활, 아니면 휘두를 수 있는 아무거나.'],
        ['They have food. Not much firepower.', '먹을 건 있다. 화력은 약하다.'],
      ],
      after: [['Possible place to trade. Check what they actually have before offering anything.', '거래해 볼 만한 곳. 뭘 내놓기 전에 실제로 뭐가 있는지부터 볼 것.']] },
    { id: 'thr-carnival', folder: 'threat', modified: '2049-11-30 21:20',
      title: ['CARNIVAL', '카니발'],
      lines: [
        ['Seven in the inner circle. A few dozen followers. Maybe more. IDK.', '핵심은 일곱. 따르는 놈은 수십. 더 있을지도. 정확히는 모른다.'],
        ['Part cartel, part cult. They worship mutation.', '반은 카르텔, 반은 사이비. 변이를 숭배한다.'],
        ['They collect bodies, sell them, and experiment on people who are still alive.', '시체를 모아서 팔고, 산 사람으로 실험한다.'],
        ["They call it evolution. Doesn't make them any less dangerous.", '진화란다. 그래 봤자 위험한 건 그대로다.'],
        ['Hostile. Any deal with them needs a way out.', '적대 세력. 거래하더라도 빠질 길부터 확보.'],
      ] },
    { id: 'thr-luviogen', folder: 'threat', modified: '2049-04-02 22:10',
      title: ['LUVIOGEN', '루비오젠'],
      lines: [
        ['Biotech company. Headquarters outside Brussels, Belgium.', '생명공학 회사. 본사는 벨기에 브뤼셀 외곽.'],
        ['U.S., Chinese, and EU funding.', '미국·중국·EU에서 투자받았다.'],
        ['Medical research is the cover. They develop bioweapons.', '간판은 의료 연구. 실제로는 생화학무기를 만든다.'],
        ['Project Renaissance. Soldiers resistant to radiation and chemical exposure.', '르네상스 프로젝트. 방사능과 화학물질에도 버티는 병사를 만드는 연구.'],
        ['The Korean division works on mutation, regeneration, and infected control.', '한국지사는 변이·재생·감염체 통제를 연구한다.'],
      ] },
    // The roster is the April six-man lineup; Wade struck his own name after leaving (last edit 2049-11-30).
    { id: 'thr-blackiron', folder: 'threat', modified: '2049-11-30 21:55',
      title: ['BLACKIRON / BLACKPACK', '블랙아이언 / 블랙팩'],
      lines: [
        ['BLACKIRON. Multinational PMC. Started under a U.S. defense contractor.', '블랙아이언. 다국적 민간군사기업. 미국 방산업체 밑에서 시작했다.'],
        ['BLACKPACK is the six-man team sent to Korea. Not the whole company.', '블랙팩은 한국에 들어온 여섯 명짜리 팀. 회사 전체 얘기가 아니다.'],
        // Saved roster (six, Wade included). Only Wade's name is struck through.
        ['Kai — lead', '카이 — 지휘', ROSTER],
        ['Wade Harker — point', '웨이드 하커 — 선두', { roster: true, strike: ['Wade Harker', '웨이드 하커'] }],
        ['Matías — explosives, heavy weapons', '마티아스 — 폭약, 중화기', ROSTER],
        ['Reiji — scouts ahead', '레이지 — 앞쪽 정찰', ROSTER],
        ['Noah — comms, drones, electronics', '노아 — 통신, 드론, 전자장비', ROSTER],
        ['Erik — rear on entry', '에릭 — 진입 시 후방', ROSTER],
        ["Once we're inside, everybody searches. Everybody fights.", '들어가면 다 같이 뒤지고, 다 같이 싸운다.'],
      ] },

    /* ---- BRIEFING NOTES ---- */
    { id: 'brf-korea', folder: 'briefing', modified: '2049-04-02 21:40',
      title: ['KOREA — RECOVERY', '한국 — 회수 임무'],
      lines: [
        ['Client: LUVIOGEN headquarters. Contract through BLACKIRON. BLACKPACK assigned.', '의뢰는 루비오젠 본사. 블랙아이언이 수주했고, 투입은 블랙팩.'],
        ['Target: an encrypted external SSD held by the Korean division.', '회수 대상은 암호화된 외장 SSD. 한국지사가 보관 중.'],
        ['The division refused to hand it over.', '지사에서 넘기길 거부했다.'],
        ['Contents not fully disclosed.', '안에 뭐가 들었는지는 자세히 안 알려줬다.'],
        ['Facility beneath an old hospital in the mountains.', '시설은 산속 폐병원 지하.'],
        ['Infected reported inside.', '내부에 감염체가 있다는 보고.'],
      ] },
  ],
};
