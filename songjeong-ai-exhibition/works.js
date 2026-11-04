// 송정 AI 작품마을 전시 데이터
//
// 작품 한 편의 형식
//   id       : 고유한 문자열 (중복 금지)
//   category : 'character' | 'poster' | 'writing'
//   title    : 작품 제목
//   zone     : 전시관 안의 구역 이름 (선택). 비우면 8편씩 '1구역, 2구역…'으로 자동 묶임
//   note     : 카드에 보이는 한 줄 소개 (선택)
//   pages    : 쪽 배열. 각 항목은 {text:'…'} 또는 {image:'images/…', alt:'대체 텍스트'}
//              - 캐릭터·포스터는 보통 이미지 1쪽
//              - 글짓기는 학년·반·이름을 가린 사본을 쪽마다 이미지로 넣고, 필요하면 {text}로 타이핑 원고를 넣어도 됨
//
// 이미지 경로는 이 폴더(songjeong-ai-exhibition) 기준 상대 경로입니다.
// 심사 시스템의 파일 주소, 점수, 심사위원 정보, 계정 키는 절대 넣지 않습니다.
// 아래는 감상 기능을 확인하기 위한 예시이며, 학교에서 전시용 사본을 받으면 실제 작품으로 교체합니다.

const WORKS = [
  // ── 캐릭터관 ──────────────────────────────────────────────
  {id:'demo-c1', category:'character', zone:'자연을 지키는 친구들', title:'새싹봇',
   note:'물을 아껴 쓰도록 알려 주는 작은 정원 로봇',
   pages:[{image:'images/samples/character-1.svg', alt:'초록색 둥근 몸에 새싹 잎이 달린 정원 로봇 캐릭터'},
          {text:'물을 아껴 쓰도록 알려 주는 작은 정원 로봇이에요. 화분이 마르면 잎을 흔들어 알려 줘요.'}]},
  {id:'demo-c2', category:'character', zone:'자연을 지키는 친구들', title:'구름 요정',
   note:'하늘의 변화를 관찰하고 날씨 소식을 전해요',
   pages:[{image:'images/samples/character-3.svg', alt:'하늘색 구름 모양 몸에 웃는 얼굴을 가진 요정 캐릭터'},
          {text:'하늘의 변화를 관찰하고 날씨 소식을 전해요.'}]},
  {id:'demo-c3', category:'character', zone:'일상을 돕는 친구들', title:'별빛 친구',
   note:'밤길을 비추며 집까지 함께 걸어가요',
   pages:[{image:'images/samples/character-2.svg', alt:'파란 별빛 색의 둥근 로봇 캐릭터'},
          {text:'밤길을 비추며 집까지 함께 걸어가요.'}]},
  {id:'demo-c4', category:'character', zone:'일상을 돕는 친구들', title:'책갈피 토끼',
   note:'읽다 만 책의 쪽을 기억해 주는 토끼',
   pages:[{text:'읽다 만 책의 쪽을 기억해 주고, 다음에 읽을 책도 추천해 줘요.'}]},
  {id:'demo-c5', category:'character', zone:'일상을 돕는 친구들', title:'급식 도우미 냠냠',
   note:'오늘의 급식과 영양을 알려 줘요',
   pages:[{text:'오늘의 급식 메뉴와 들어 있는 영양소를 재미있게 설명해 줘요.'}]},

  // ── 포스터관 ──────────────────────────────────────────────
  {id:'demo-p1', category:'poster', zone:'스스로 생각하기', title:'생각은 내가 먼저',
   pages:[{image:'images/samples/poster-1.svg', alt:'주황색 테두리 포스터. 전구 그림과 "생각은 내가 먼저, AI에 묻기 전 나의 생각부터 적어 봐요" 문구'}]},
  {id:'demo-p2', category:'poster', zone:'스스로 생각하기', title:'함께 쓰는 AI',
   pages:[{image:'images/samples/poster-3.svg', alt:'보라색 테두리 포스터. "함께 쓰는 AI, 친구와 아이디어를 나누고 서로의 생각을 존중해요" 문구'}]},
  {id:'demo-p3', category:'poster', zone:'바르게 확인하기', title:'출처를 확인해요',
   pages:[{image:'images/samples/poster-2.svg', alt:'초록색 테두리 포스터. "출처를 확인해요, 처음 보는 정보는 어디에서 왔는지 살펴봐요" 문구'}]},
  {id:'demo-p4', category:'poster', zone:'바르게 확인하기', title:'개인정보는 소중해',
   pages:[{text:'🖼️\n이름, 주소, 사진은 AI에게도 함부로 알려 주지 않아요.'}]},

  // ── 글짓기관 ──────────────────────────────────────────────
  {id:'demo-w1', category:'writing', zone:'미래 이야기', title:'미래의 도서관',
   note:'원고 사본 2쪽',
   pages:[{image:'images/samples/writing-1-p1.svg', alt:'미래의 도서관 원고 1쪽. 책을 찾아 주는 로봇이 있는 도서관 이야기의 시작'},
          {image:'images/samples/writing-1-p2.svg', alt:'미래의 도서관 원고 2쪽. 로봇이 찾아 준 책을 친구와 함께 읽는 장면'}]},
  {id:'demo-w2', category:'writing', zone:'미래 이야기', title:'친구와 만든 로봇',
   pages:[{text:'우리는 서로 잘하는 일을 나누어 작은 로봇을 만들었다. 나는 몸통을 그리고, 친구는 로봇이 할 일을 정했다.'},
          {text:'로봇이 처음으로 움직였을 때 우리는 손뼉을 쳤다. 혼자였다면 만들지 못했을 것이다.'},
          {text:'다음에는 로봇에게 노래를 가르쳐 주고 싶다.'}]},
  {id:'demo-w3', category:'writing', zone:'나의 이야기', title:'나의 작은 정원',
   pages:[{text:'나는 식물이 자라는 모습을 매일 기록하고 싶다. 사진을 찍고 키를 재고 잎의 수를 센다.'},
          {text:'AI에게 기록을 보여 주면 물을 더 줘야 할지 알려 준다. 하지만 마지막 결정은 내가 한다.'}]}
];
