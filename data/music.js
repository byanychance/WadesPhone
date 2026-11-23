/* Music library.
   Paths are relative URLs from index.html (never Windows absolute paths):
     audio  → assets/audio/<file>.mp3          (file names are case-sensitive on the web server)
     cover  → assets/images/music/<file>.jpg|png  (missing → default cover)
   Order here = library and play order (next/previous). Artists are in-world fictional people;
   only the name is shown. year '' = not decided (nothing shown).

   lyrics: an array of stanzas; each stanza is an array of [English, 한국어 번역] pairs.
           Stanzas get a wider gap between them. A string line like '[Verse]' or '[Refrain]'
           is treated as a structure tag and never shown.
   No timestamps yet, so lyrics are not auto-highlighted during playback. */
window.WP_DATA = window.WP_DATA || {};
WP_DATA.music = {
  tracks: [
    {
      id: 'lovely-world',
      title: 'What a Lovely World We Share',
      artist: 'Lionel Reed',
      album: 'What a Lovely World We Share',
      year: '',
      audio: 'assets/audio/what-a-lovely-world-we-share.mp3',
      cover: 'assets/images/music/what-a-lovely-world-we-share.jpg',
      lyrics: [
        [
          ['The bells ring out, the day is new', '종소리 따라 새날이 밝고'],
          ['The café doors are opening, too', '거리의 찻집도 문을 여네'],
          ['Good morning, darling, how you shine', '잘 잤나요, 눈부신 내 사랑'],
          ['Come rest your little hand in mine', '그 고운 손, 내 손에 포개 주오'],
        ],
        [
          ['The sunlight dances in the square', '광장엔 햇살이 춤을 추고'],
          ['The scent of roses fills the air', '바람엔 장미 향이 감도네'],
          ['With you beside me, sweetheart dear', '사랑하는 그대 곁에 있으니'],
          ["There's nothing I could hunger for", '무엇을 더 갈망하리오'],
        ],
        [
          ['Come closer, darling, let me feel', '조금만 가까이 와 주오'],
          ['The warmth that tells me you are real', '그 온기로 그대를 느끼도록'],
          ['One little kiss, then one kiss more', '입맞춤 한 번, 다시 또 한 번'],
          ['What were these empty arms made for?', '이 빈 두 팔은 그대를 위한 것'],
        ],
        [
          ["I've gone so long without your touch", '그대 손길을 오래도 기다렸네'],
          ['No wonder that I want so much', '이토록 애가 타는 것도 무리는 아니지'],
          ['Your lips are sweet as cherry wine', '그대 입술은 버찌술처럼 달고'],
          ['And every trembling beat is mine', '떨리는 그 심장도 오롯이 내 것'],
        ],
        [
          ['Oh, what a lovely world we share', '아, 그대와 사는 세상은 아름다워'],
          ['With roses blooming everywhere', '눈길 닿는 곳마다 장미가 피네'],
          ['The sky is blue, the day is fine', '하늘은 푸르고 날마저 좋은데'],
          ['And all your sweetness, darling, mine', '그대의 달콤함까지 모두 내 것이라니'],
        ],
        [
          ["You needn't leave a thing behind", '무엇 하나 남겨 두지 말고'],
          ['Bring every little part of you', '그대 온전히 내게 와 주오'],
          ["I'll lose myself, you'll lose yours too", '나도 나를 잊고, 그대도 그대를 잊어'],
          ['Till only love comes shining through', '사랑만이 환히 빛날 때까지'],
        ],
        [
          ['Come fill these empty arms again', '다시 이 빈 품을 채워 주오'],
          ['Let nothing come between us, then', '우리 사이 무엇도 끼어들지 못하게'],
          ['How beautiful this life can be', '사는 일이 이리도 아름다워'],
          ['When you are lost in loving me', '그대 나를 사랑하여 온 마음을 잊을 때'],
        ],
        [
          ["And when I've had my fill of bliss", '이 행복에 한껏 배부른 뒤에도'],
          ["I'll ask you for another kiss", '입맞춤을 한 번 더 청하리'],
          ['Whatever else the world may do', '세상이야 어찌 흘러가든'],
          ["I'll want a little more of you", '나는 그대를 조금 더 원하리'],
        ],
      ],
    },
    {
      id: 'no-particular-place',
      title: 'No Particular Place',
      artist: 'Dean Calloway',
      album: 'No Particular Place',
      year: '',
      audio: 'assets/audio/No-Particular-Place.mp3',
      cover: 'assets/images/music/No-Particular-Place.png',
      lyrics: [
        [
          ['Coffee rolling round the cup', '잔 속에서 커피가 출렁이고'],
          ['Window down and collar up', '창문은 내리고, 옷깃은 세우고'],
          ['Something rattles underneath', '차 밑에서 뭐가 달그락거리네'],
          ["I'll have a look when I get there", '도착하면 한번 들여다보지 뭐'],
        ],
        [
          ['Missed the turn a mile ago', '한참 전에 꺾을 길을 지나쳤네'],
          ["There's another down the road", '좀 더 가면 다른 길도 있겠지'],
          ['Saw a place that still serves pie', '아직 파이를 파는 가게가 보이길래'],
          ['Might pull in and give it a try', '잠깐 세워서 먹어 볼까 싶어'],
        ],
        [
          ['Roll on, take it slow', '달려가자, 느긋하게'],
          ['Let the fast ones come and go', '급한 사람들은 먼저 보내고'],
          ["I've got time and half a tank", '시간도 많고, 기름도 반은 남았어'],
          ['No particular place today', '오늘은 딱히 정해 둔 곳도 없으니'],
        ],
        [
          ['Found a station out of town', '마을 밖에서 주유소 하나를 찾았어'],
          ['Old dog sleeping on the ground', '늙은 개 한 마리가 바닥에서 졸고 있네'],
          ['Bought some oil and checked the tires', '엔진오일 좀 사고 타이어도 살펴보고'],
          ['Stayed to talk beside the pump', '주유기 옆에서 한참 수다를 떨었지'],
        ],
        [
          ['Man said rain was coming soon', '그 양반이 곧 비가 오겠다면서'],
          ['Pointed west and checked the moon', '서쪽을 가리키곤 달을 올려다봤어'],
          ['I said, “Guess I\'d better go.”', '난 말했지, “슬슬 가 봐야겠네요.”'],
          ['Sat another hour or so', '그러고도 한 시간쯤 더 앉아 있었어'],
        ],
        [
          ['Roll on, take it slow', '달려가자, 느긋하게'],
          ['Let the fast ones come and go', '급한 사람들은 먼저 보내고'],
          ["I've got time and half a tank", '시간도 많고, 기름도 반은 남았어'],
          ['No particular place today', '오늘은 딱히 정해 둔 곳도 없으니'],
        ],
        [
          ["That rattle's getting louder.", '아까 그 소리가 점점 커지네.'],
          ["Guess I'll stop.", '아무래도 좀 세워야겠다.'],
        ],
      ],
    },
    {
      id: 'paid-in-full',
      title: 'Paid in Full',
      artist: 'Vince Rourke',
      album: 'Paid in Full',
      year: '',
      audio: 'assets/audio/Paid-in-Full.mp3',
      cover: 'assets/images/music/Paid-in-Full.png',
      lyrics: (function () {
        const chorus = [
          [
            ['Paid in full', '빚은 다 갚았어'],
            ['Read the line', '거기 적힌 거 봐'],
            ['Nothing left here', '이젠 아무것도'],
            ['You can call mine', '네 몫이라 할 수 없어'],
          ],
          [
            ['Keep the receipt', '영수증은 네가 가져'],
            ['Keep your cool', '열 올리지 말고'],
            ['Take a good look', '똑똑히 봐 둬'],
            ["I've paid in full", '난 다 갚았으니까'],
          ],
        ];
        return [
          [
            ['You call me up, you call it trust', '전화해서는, 날 믿으니까 그러는 거래'],
            ['Funny how it sounds like work', '내 귀엔 일 시키는 소리인데'],
            ['Say my name like I owe you', '빚이라도 진 것처럼 내 이름을 부르지'],
            ['Something I forgot to do', '내가 뭘 해 주기로 하고 잊은 사람처럼'],
          ],
          [
            ["I gave you days I can't get back", '돌려받지도 못할 시간을 네게 쏟았어'],
            ['You keep a finger on the tab', '넌 아직도 계산서에서 손을 안 떼'],
            ['Every time I pay it down', '내가 갚아 나갈 때마다'],
            ['You find another little charge', '넌 또 뭘 하나씩 얹어 놓지'],
          ],
          ...chorus,
          [
            ['You liked me better running late', '넌 내가 허덕일 때가 더 좋았겠지'],
            ['Coming through your crooked gate', '네 비뚤어진 대문을 드나들던 때'],
            ['Always had a job for me', '넌 늘 내게 시킬 일이 있었고'],
            ['Always had somewhere to be', '난 늘 어딘가로 가야 했어'],
          ],
          [
            ["Now you're standing in my way", '이젠 네가 내 앞을 막아서서'],
            ["Asking what I'm trying to say", '무슨 뜻이냐고 묻네'],
            ["I've been saying it all night", '밤새 같은 얘길 했잖아'],
            ['Move your hand and let me by', '그 손 치우고 비켜'],
          ],
          ...chorus,
          [
            ['Count it twice', '두 번이든 세어 봐'],
            ['Count it slow', '천천히 세어 봐'],
            ["There's your money", '돈은 거기 있어'],
            ['Let me go', '이제 날 보내 줘'],
          ],
          ...chorus,
        ];
      })(),
    },
  ],
};
