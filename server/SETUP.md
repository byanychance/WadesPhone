# 방문자 글쓰기 서버 설정 순서

구조는 **브라우저 → Cloudflare Worker → Supabase**입니다. 둘 다 무료 요금제로 충분하고, 유료 기능은 쓰지 않습니다.

## 먼저 알아 둘 것

**비밀 값 3개**는 아래 위치에만 입력합니다. 채팅, 코드, GitHub, 메모 파일 어디에도 붙여넣지 마세요.

| 이름 | 어디서 얻나 | 어디에 넣나 |
|---|---|---|
| `SUPABASE_URL` | Supabase 프로젝트 주소 | Cloudflare Worker의 Secret |
| `SUPABASE_SECRET_KEY` | Supabase **Secret key** (`sb_secret_…`) | Cloudflare Worker의 Secret |
| `SESSION_PEPPER` | 직접 만든 무작위 문자열 | Cloudflare Worker의 Secret |

- **DB 비밀번호:** 프로젝트를 만들 때 정합니다. 이 설정에는 쓰지 않으니 비밀번호 관리자에만 보관하세요.
- **사이트에 넣는 값은 Worker 공개 주소 하나뿐입니다.** 예: `https://wphone-api.<내 서브도메인>.workers.dev`

---

## 1. Supabase

1. https://supabase.com/dashboard 에 로그인합니다.
2. **New organization**을 누릅니다. 이름은 자유이고, 플랜은 **Free**를 고릅니다.
3. **New project**를 누르고 다음과 같이 정한 뒤 만듭니다.
   - Name: `wphone` (자유)
   - Database Password: **Generate a password** → 비밀번호 관리자에 저장
   - Region: 지금 운영 중인 프로젝트는 **Southeast Asia (Singapore)** 입니다. 리전은 DB가 저장되는 나라이므로 `privacy.html`의 국외 처리 안내와 맞아야 합니다. 리전을 바꾸면 안내도 고치세요.
   - Plan: **Free**
   - 보안 옵션 중 **Data API**(또는 "Enable Data API")가 있으면 켜 둡니다. Worker가 이것으로 DB를 호출합니다.
4. 프로젝트 준비가 끝나면 왼쪽 메뉴에서 **SQL Editor** → **New query**를 엽니다.
5. 이 저장소의 `server/supabase/schema.sql` 내용을 전부 붙여넣고 **Run**을 누릅니다.
   - 마지막 결과로 `wp-cleanup` 작업 번호 한 줄이 나오면 됩니다.
   - 다시 실행해도 안전합니다. 이전 버전으로 만든 DB도 이 파일을 다시 실행하면 옮겨집니다(아래 '업데이트' 참고).
   - 파일에는 `service_role` 권한 부여(`grant usage on schema public …`, `grant select, insert, update, delete …`)가 들어 있습니다. 이것이 빠지면 Worker 호출이 `42501`(permission denied) 오류로 실패합니다.
   - 끝부분에서 **pg_cron**을 켜고 10분마다 `wp_cleanup()`을 실행하도록 등록합니다. 방문자가 없어도 만료된 데이터가 지워집니다.
     `pg_cron` 부분에서 오류가 나면 **Database → Extensions**(또는 **Integrations → Cron**)에서 pg_cron을 켠 뒤, 파일 맨 아래 두 줄만 다시 실행합니다.
6. **Table Editor**에 `wp_sessions`, `wp_posts`, `wp_rate_events`가 생겼는지 확인합니다.
   - 세 테이블 모두 RLS가 켜져 있어야 합니다.
   - "RLS enabled, no policies" 같은 안내는 정상입니다. 공개 키로는 아무것도 읽고 쓰지 못하게 일부러 정책을 두지 않았습니다.
7. Worker에 넣을 두 값을 확인합니다. 아직 복사만 해 두고 Cloudflare 단계에서 붙여넣습니다.
   - **Project URL:** 상단의 **Connect** 버튼 또는 **Project Settings → Data API**에서 `https://<영문숫자>.supabase.co`를 찾습니다.
   - **Secret key:** **Project Settings → API Keys**의 **Secret keys** 항목에서 키를 하나 만듭니다(이름 예: `cloudflare-worker`). 그다음 `sb_secret_…`를 복사합니다.
     - 화면에 Legacy 키만 있으면 `service_role` 키를 대신 써도 됩니다.
     - **`anon`이나 `publishable` 키가 아닙니다.**

## 2. Cloudflare Worker

1. https://dash.cloudflare.com 에서 무료 계정을 만들고 로그인합니다.
2. **Workers & Pages → Create → Worker**(또는 "Start with Hello World")를 고릅니다.
   - 이름을 `wphone-api`로 정하고 **Deploy**합니다.
   - Worker를 처음 만들면 `<서브도메인>.workers.dev` 주소를 정하라고 할 수 있습니다.
3. **Edit code**를 엽니다. 기존 코드를 모두 지우고 `server/worker/worker.js` 내용 전체를 붙여넣은 뒤 **Deploy**합니다.
4. Worker의 **Settings → Variables and Secrets**에서 **Add**를 눌러 네 개를 추가합니다.

   | Type | Name | Value |
   |---|---|---|
   | Text | `ALLOWED_ORIGINS` | `https://<깃허브아이디>.github.io` |
   | Secret | `SUPABASE_URL` | 1-7에서 복사한 Project URL |
   | Secret | `SUPABASE_SECRET_KEY` | 1-7에서 복사한 Secret key |
   | Secret | `SESSION_PEPPER` | 아래 방법으로 만든 무작위 문자열 |

   - **`ALLOWED_ORIGINS`:**
     - 저장소 경로(`/WPhone`)는 붙이지 않습니다.
     - 로컬에서도 시험하려면 `,http://localhost:8765`를 덧붙입니다.
   - **`SESSION_PEPPER` 만들기:** Windows PowerShell에서 아래를 실행하고, 출력값을 Cloudflare 입력칸에 바로 붙여넣습니다. 파일로 저장하지 마세요.
     ```powershell
     $b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
     ```
   - **한 번 정한 `SESSION_PEPPER`는 바꾸지 마세요.** 바꾸면 모든 방문자가 자기 글을 삭제할 권한을 잃습니다.
   - 저장 후 **Deploy**(또는 "Save and deploy")를 누릅니다.
5. **로그 설정:** Worker의 **Settings → Observability**(Workers Logs)를 확인합니다.
   - 새 Worker는 Workers Logs가 기본으로 켜져 있습니다. 무료 요금제는 3일, 유료 요금제는 7일 보관합니다.
   - 앱 코드는 오류 코드만 기록합니다(IP, 토큰, 키, 닉네임, 본문은 기록하지 않음). 하지만 요청마다 남는 **invocation log**에 무엇이 들어가는지는 Cloudflare 문서에 항목별로 나와 있지 않습니다. 끌 수 있으면 끄세요. `wrangler.toml`에는 `invocation_logs = false`로 적어 두었습니다(CLI로 배포할 때만 적용).
   - 로그가 필요 없으면 Workers Logs 전체를 꺼도 됩니다. 오류 진단이 어려워질 뿐 기능에는 영향이 없습니다.
6. 브라우저에서 `https://wphone-api.<서브도메인>.workers.dev/v1/health`를 엽니다.
   - `{"ok":true,"db":true}`가 나오면 연결된 것입니다.
   - `server_misconfigured`가 나오면 Secret 이름이나 값이 빠진 것입니다. `PEPPER`는 32자 이상이어야 합니다.
   - `"db":false`가 나오면 URL이나 키가 틀렸거나 Data API가 꺼진 것입니다.

## 3. 사이트(GitHub Pages)

1. `data/config.js`의 `api`에 Worker 공개 주소를 넣습니다. 끝에 `/v1`이나 `/health`는 붙이지 않습니다. 현재 값: `api: 'https://wphone-api.byanychanc3.workers.dev',`
2. 커밋하고 푸시합니다.
   - `.gitignore`에 `.dev.vars`, `.env` 같은 로컬 비밀 파일이 들어 있어 실수로 올라가지 않습니다.
   - `server/` 폴더는 올라가도 괜찮습니다. 코드와 변수 이름만 있고 값은 없습니다.
3. GitHub 저장소의 **Settings → Pages**에서 `main` 브랜치의 `/ (root)`를 배포합니다.

## 4. 연결 후 확인할 것 (운영 환경)

로컬에서는 테스트용 가짜 키로 모두 확인했습니다. 실제 서버에서는 아래를 한 번 확인해 주세요.

1. 휴대폰 화면의 트위터 → 오른쪽 아래 파란 버튼 → 닉네임과 내용을 입력하고 게시 → 맨 위에 나타나는지
2. 다른 브라우저(또는 시크릿 창)에서 같은 글이 보이는지
3. 기존 게시물(예: 19번)의 댓글에 답글을 달고, 그 답글에 다시 답글을 달아 "@… 님에게 보내는 답글"이 맞는지
4. 내 글의 `…`로 삭제되는지, 시크릿 창에서는 그 글에 `…` 삭제 메뉴가 없는지
5. 연달아 두 번 게시하면 두 번째가 "조금 전에 게시했어요"로 막히는지
6. `<b>굵게</b>` 같은 내용이 굵어지지 않고 글자 그대로 보이는지
7. 브라우저 개발자 도구의 Network 탭에서 요청이 `workers.dev`로만 가고 `supabase.co`로는 가지 않는지, 요청 어디에도 `sb_secret`이 없는지
8. Cloudflare Worker의 **Logs**에 키나 토큰이 찍히지 않는지. 오류 이름과 코드만 기록하도록 되어 있습니다.

## 업데이트 (이미 운영 중인 DB)

코드를 바꾼 뒤에는 **둘 다** 다시 배포해야 합니다. 순서는 DB가 먼저입니다.

1. Supabase SQL Editor에서 `server/supabase/schema.sql` 전체를 다시 실행합니다. 이 실행으로 다음이 바뀝니다.
   - `wp_sessions.ip_hash`, `wp_posts.ip_hash` 열을 지웁니다. IP 해시는 1시간만 보관하는 `wp_rate_events`로 옮깁니다.
   - 이전 버전에서 삭제 처리만 되고 닉네임·본문이 남아 있던 글의 내용을 지웁니다. 답글이 달려 있지 않으면 행까지 지웁니다.
   - 글과 세션의 연결을 `ON DELETE CASCADE`에서 `RESTRICT`로 바꿉니다. 세션 정리 때문에 글이 함께 사라지는 일을 막습니다.
   - `wp_list_posts`가 다시 만들어지므로, 2단계를 마칠 때까지 잠시 글 목록이 비어 보이거나 오류가 날 수 있습니다.
2. Cloudflare Worker 코드를 `server/worker/worker.js`로 교체하고 **Deploy**합니다.
3. 확인용 SQL (SQL Editor):
   ```sql
   -- 0이어야 함: 삭제된 글에 내용·작성자 연결이 남아 있는 행
   select count(*) from wp_posts where deleted_at is not null and (nickname is not null or body is not null or session_id is not null);
   -- 정리 작업 등록과 최근 실행 결과
   select jobid, jobname, schedule, active from cron.job where jobname = 'wp-cleanup';
   select status, start_time from cron.job_run_details order by start_time desc limit 5;
   -- 1시간보다 오래된 IP 해시 (정리 직후 0, 최대 약 70분 전까지만 있어야 함)
   select count(*) from wp_rate_events where created_at < now() - interval '1 hour';
   ```

## 운영

- **글 숨기기 (내용 보관):** Supabase **Table Editor → wp_posts**에서 해당 행의 `hidden`을 `true`로 바꿉니다. 화면에서만 사라지고 내용은 DB에 남습니다.
- **글 내용 지우기 (삭제 요청 처리):** 행을 직접 지우지 말고 SQL Editor에서 실행합니다.
  ```sql
  select public.wp_admin_erase('<글 id>');
  ```
  작성자가 삭제할 때와 같이 닉네임·본문·작성자 연결을 지웁니다. 답글이 달려 있으면 "삭제된 게시물입니다" 표시만 남고, 다른 사람의 답글은 지우지 않습니다.
  - 글 찾기: `select id, nickname, body, created_at from wp_posts where body ilike '%찾을 말%' order by created_at desc;`
  - 삭제를 요청하는 사람에게 신분증 같은 자료는 요구하지 않습니다. 글을 찾을 정보(핸들, 대략적인 시각, 내용 일부)만 있으면 됩니다.
- **세션 행은 직접 지우지 마세요.** 글이 남아 있는 세션은 `RESTRICT` 때문에 지워지지 않습니다. 글이 없는 세션은 정리 작업이 1시간 뒤 지웁니다.
- **개인정보 안내:** `privacy.html`의 "미정" 항목(운영자 연락처, 시행일, 글 보유 기간, 법적 근거)을 채워야 합니다. 삭제 요청 연락처가 정해지기 전에는 브라우저 데이터를 잃은 사람이 삭제를 요청할 방법이 없습니다.

### 보관되는 데이터와 기간

| 위치 | 내용 | 기간 |
|---|---|---|
| `wp_posts` | 닉네임, 본문, 시각, 답글 관계, 세션 id | 작성자·운영자가 삭제할 때까지. 삭제하면 내용을 지우고, 답글이 있을 때만 삭제 표시를 남김 |
| `wp_sessions` | 토큰 HMAC, 핸들 | 글이 남아 있는 동안. 글이 없으면 1시간 뒤 정리 |
| `wp_rate_events` | (UTC 날짜 + IP)의 HMAC | 1시간. 10분마다 정리하고, 글·세션을 만들 때도 정리 |
| Supabase 로그 | API 요청 경로 등 (Worker에서 보낸 요청) | 무료 요금제 1일 |
| Supabase 백업 | DB 전체 | 무료 요금제에는 자동 백업 없음. 유료로 바꾸면 7일 이상 |
| Cloudflare Workers Logs | 앱의 오류 코드와, 켜져 있다면 invocation log | 무료 3일, 유료 7일 |
| GitHub Pages | 방문자 IP (보안 목적) | GitHub 문서에 기간이 나와 있지 않음 |
- 관리자 버튼이나 관리자 비밀번호는 사이트에 없습니다. 운영은 Supabase 관리 화면에서만 합니다.

### 무료 요금제에서 주의할 점

- Supabase 무료 프로젝트는 일주일 동안 요청이 없으면 일시 중지됩니다. 대시보드에서 **Restore**를 누르면 다시 켜집니다.
- Cloudflare Workers 무료 요금제는 하루 10만 요청까지입니다.

### 선택 사항

- **IP당 요청 빈도 제한:** Wrangler CLI로 배포하면 `wrangler.toml`의 `[[ratelimits]]` 주석을 풀어 켤 수 있습니다. 이 기능을 쓰려면 Node.js가 필요합니다.
- 글쓰기 빈도 제한은 이 기능 없이도 DB에서 적용됩니다.
