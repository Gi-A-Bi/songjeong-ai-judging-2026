# 송정 AI 작품마을 이미지 생성 프롬프트

GPT(ChatGPT 이미지 생성)에 넣을 프롬프트입니다. 결과물을 받으면 현재 코드로 그린 화면과 비교해 결정합니다.
공통 규칙: 글자는 넣지 않습니다(라벨은 코드가 그림). 워터마크 없음. 빛은 왼쪽 위에서. 색은 파스텔톤 픽셀 아트.

## 공통 스타일 (모든 프롬프트 맨 앞에 붙이기)

```
Style: cozy 2D top-down pixel art game asset in the style of Stardew Valley and ZEP metaverse maps,
slight 3/4 bird's-eye view, clean readable pixels, soft pastel palette
(grass #79c26b, sand path #e4d1a0, sky blue #bfe6ff, cream #fff6e6, orange #e8743b, purple #5c4bb3, brown #9a6b2c),
light from the top-left, no text, no letters, no watermark, no blur, no photo realism.
```

## 1. 마을 전체 배경 (가장 효과 큼)

크기 1536×1024 (3:2). 지금 지도 비율(44×30칸)과 거의 같습니다.

```
A complete top-down village map for a children's online art exhibition, 1536x1024, landscape.
Layout (keep these positions): three single-story buildings in a row across the upper third —
left building with an ORANGE shingled roof, middle building with a PURPLE roof, right building with a BROWN roof,
each with a front door at the bottom center, windows with flower boxes, and a blank hanging sign board above the door.
A sand path runs horizontally across the middle of the map and short paths connect it to each door.
Below the horizontal path: a stone-paved plaza in the center with a round fountain, two wooden benches and lamp posts.
A small pond with lily pads and a wooden fence in the lower-left corner, two picnic tables in the lower-right.
Grass everywhere else with scattered trees (round and pine), bushes, small flowers, and a row of trees along all four edges.
Colorful triangular bunting flags strung between lamp posts. Nothing in the image should contain text.
```

## 2. 건물 3동 (투명 배경, 각각 따로)

크기 1024×1024, 투명 배경 PNG. 세 번 생성하며 지붕색·장식만 바꿉니다.

```
A single cute pixel-art building for a village map, front view from slightly above, transparent background, 1024x1024.
Wide one-story cottage, 9 tiles wide and 6 tiles tall proportion (about 3:2), ORANGE shingled roof with a small chimney,
cream brick walls, four windows with red flower boxes, an arched window above a wooden double door at the bottom center,
a blank wooden sign board hanging under the eaves (no text), soft drop shadow at the base. Nothing else around it.
```

- 두 번째: `ORANGE` → `PURPLE`, 장식 "art gallery feel: picture frames beside the door"
- 세 번째: `ORANGE` → `BROWN`, 장식 "library feel: a small bookshelf visible through the window"

## 3. 소품 세트 (투명 배경)

크기 1024×1024, 투명 배경. 한 장에 모아 받되 간격을 두고 배치해 달라고 합니다. 잘 안 되면 개별 생성.

```
A sprite sheet of pixel-art outdoor props on a transparent background, 1024x1024, items spaced apart on a grid with clear gaps,
each item facing front from slightly above: round leafy tree, pine tree, small bush, three flower clumps (pink, yellow, white),
grey rock, wooden bench, wooden picnic table, street lamp with a warm yellow light, wooden fence segment, round stone fountain with water,
wooden signpost with a blank board, flower bed box, clay pot with a plant, information desk with a small monitor. No text.
```

## 4. 전시관 바닥·벽 텍스처 (이어 붙는 타일)

각 1024×1024, 반복(seamless) 패턴. 관마다 바닥 1장 + 벽 1장.

```
A seamless tileable pixel-art texture, 1024x1024, top-down: warm ORANGE-CREAM woven carpet with a subtle diamond pattern. No text.
```
```
A seamless tileable pixel-art texture, 1024x1024, top-down: light LAVENDER gallery floor tiles with thin grout lines. No text.
```
```
A seamless tileable pixel-art texture, 1024x1024, top-down: honey-colored wooden plank floor with visible grain. No text.
```
```
A seamless horizontally-tileable pixel-art wall strip, 1024x256, front view: cream plaster wall with a lower wainscot panel
and a thin picture rail near the top; the top 1/4 is a darker roof edge. Variant colors: orange trim / purple trim / brown trim. No text.
```

## 5. 캐릭터 (선택 화면·걷기용)

일관된 4방향 걷기 시트는 생성 모델이 자주 틀립니다. 먼저 한 장짜리 정면 그림으로 시험하고, 잘 나오면 시트를 시도합니다.

```
A tiny chibi pixel-art character, front view, standing, transparent background, 256x256, 12 pixels wide proportion scaled up,
big head, two-dot eyes, simple body: a friendly ROBOT with a red antenna, blue-grey head, navy body. Clean pixels, no text.
```

캐릭터 8종: 로봇(빨간 안테나), 고양이(주황), 토끼(흰색·분홍 귀), 곰(갈색·빨간 옷), 외계인(연두·안테나 둘), 공룡(초록·노란 등가시), 여우(주황·흰 가슴), 펭귄(남색·노란 부리).

걷기 시트를 시도할 때:

```
Pixel-art character sprite sheet, transparent background, 4 rows x 3 columns on a strict grid, each cell 64x64:
row 1 facing down, row 2 facing up, row 3 facing left, row 4 facing right; column 1 standing, columns 2-3 walking frames.
Same character in every cell: (캐릭터 설명). Clean pixels, no text, no labels.
```

## 6. 액자·장식 (투명 배경)

```
Three pixel-art picture frames on a transparent background, 1024x512, front view, landscape 4:3 openings that are fully transparent:
one warm wooden frame, one purple museum frame, one dark brown library frame; a small spotlight lamp above each. No text.
```

## 7. 타이틀 로고 (글자가 들어가는 유일한 항목)

글자가 깨지면 버리고 코드 글꼴을 씁니다.

```
A playful pixel-art game title logo on a transparent background, 1024x512, Korean text "송정 AI 작품마을" in chunky rounded pixel letters,
green and yellow with a dark outline and a small house icon on the left. Only this text, spelled exactly.
```

## 받은 뒤

- 파일은 PNG(투명 필요 시)로, 이름은 항목 번호로 저장해 전달합니다(예: 01-village.png, 02-building-orange.png).
- 마을 배경은 지도의 걷는 영역·건물 위치에 맞춰 코드의 충돌 영역을 조정해서 넣습니다.
- 비교는 같은 화면(광장 입장 직후, 포스터관 입구)에서 나란히 봅니다.

## 1차 결과 (2026-11-05)

- 받은 것: 로봇 정면(1), 주황 카펫(2), 소품 시트(3), 주황 건물 2장(4·5), 마을 배경(6).
- 반영: 마을 배경 → 그림 모드의 광장 전체. 소품 시트 → 전시관 화분·벤치·안내 데스크. 카펫 → 캐릭터관 바닥.
- 보류: 건물 단독 이미지(마을 배경에 건물이 이미 있음), 로봇(걷기 시트 필요).
- 다음에 받으면 좋은 것: 포스터관·글짓기관 바닥 텍스처(4번 프롬프트의 라벤더 타일·나무 바닥), 전시관 벽 띠(4번 벽 프롬프트), 캐릭터 4방향 시트(5번).

## 2차 결과 (2026-11-05)

- 받은 것: 포스터관 바닥, 글짓기관 바닥, 벽 띠(주황), 로봇 걷기 시트, 액자 3종.
- 반영: 모두 그림 모드에 반영. 벽 띠 보라·갈색은 주황 원본의 갓돌 색을 바꿔 만들었다. 로봇 시트는 격자가 잘 맞아 걷기 애니메이션에 연결했다.
- 다음: 나머지 캐릭터 7종 시트(5번 프롬프트의 캐릭터 줄만 바꿔 생성).

## 3차 결과 (2026-11-05)

- 받은 것: 고니·고양이·거북이·다람쥐 걷기 시트 4장. 모두 격자와 방향이 정확해 그대로 연결했다.
- 캐릭터 선택을 로봇·다람쥐·거북이·고니·고양이 5종으로 줄였다. 마을·전시관 NPC도 이 5종을 쓴다.

## 결정 (2026-11-05)

- 생성 그림으로 확정. 전환 버튼과 모드 설정을 제거하고 생성 이미지만 사용한다. 코드로 그린 타일은 이미지 로딩 실패 시 예비용으로만 남겼다.
- 미사용 파일 삭제: building-orange.png, robot.png.
