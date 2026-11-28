/* Photos — image paths only.
   recent: 일반 사진 (아직 받은 사진이 없어 비워 둠)
   hidden: 가려진 항목 (암호를 넣어야만 보임. 최근 항목·미리보기에는 나오지 않음)
   hiddenCode: 가려진 항목 4자리 암호 (화면에는 표시하지 않음) */
window.WP_DATA = window.WP_DATA || {};
WP_DATA.photos = {
  recent: [],
  hidden: ['assets/images/photo/Secret1.webp'],
  hiddenCode: '1119', // Wade's birthday
};
