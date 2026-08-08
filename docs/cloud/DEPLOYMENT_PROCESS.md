# 📚 배포 및 클라우드 인프라 구축 프로세스 가이드 (Vercel & Aiven MySQL)

## 📌 1. 개요 및 목적 (Executive Summary)

본 문서는 **Vercel(프론트엔드 및 서빙)과 Aiven(클라우드 MySQL DB)을 연동하고 GitHub 자동 배포 파이프라인(CI/CD)을 구축**하여, 개발팀 소스코드가 `develop` 및 `main` 브랜치에 머지되는 즉시 **무상 HTTPS 적용, PR 단위 사전 테스트(Preview), 인프라 관리 공수 제로(0)화가 보장되는 고가용성 무중단 배포 환경**을 수립한 전체 과정과 협업 지침을 기록한 기술 문서입니다.

---

## 👤 2. 기본 정보

* **작성자:** 배포 담당자
* **대상 서비스:** Web Client (Vite/React), Express Backend, MySQL Database
* **주요 인프라 스택:** 
  * **Frontend & Edge Hosting:** Vercel (Global Edge Network, Auto SSL)
  * **Database Infrastructure:** Aiven for MySQL 8.0 (Cloud Native Managed Database, SSL/TLS Encrypted)
  * **CI/CD & Version Control:** GitHub Private Repository (`develop` & `main` 3중 브랜치 전략), Vercel GitHub Bot
  * **Security & Env Management:** Vercel Environment Variables, `.env.example` 템플릿 관리

---

## 🏗️ 3. 전체 시스템 배포 아키텍처 (System Architecture)

```text
[사용자 브라우저 (Client)]
       │
       │ (1) HTTPS (443) / Global Edge CDN (Auto SSL)
       ▼
[Vercel Cloud Platform]
   ├── [Vite/React Static Web App (client/)]
   │       │
   │       └── (2) Static Assets Serving (index.html)
   │
   └── [Serverless Functions / API Layer]
           │
           └── (3) Encrypted MySQL Connection (SSL/TLS, Port: 11338)
                   ▼
     [Aiven Cloud Platform (SaaS)]
           └── [MySQL 8.0 Database (defaultdb)] ── (Volume: Cloud Storage)
```

---

## 🔄 4. 단계별 구축 작업 프로세스 (Phase 1 ~ Phase 5)

### Phase 1. 클라우드 MySQL DB 개설 및 스택 호환성 검증
* **작업 내용**: 24시간 무상 가동되는 클라우드 MySQL DB 인스턴스를 확보하고 접속 자격 증명 획득.
* **진행 과정**:
  1. Supabase(PostgreSQL 전용) 검토 결과, DB 담당자의 MySQL DDL(`AUTO_INCREMENT`)을 무단 변경하는 것은 직무 침범이라는 결론을 내리고, 팀의 MySQL 스택을 100% 보존하는 **Aiven for MySQL** 서비스로 전격 선택.
  2. Aiven Cloud에서 무료 MySQL 8.0 인스턴스(`mysql-sandbox`) 생성 및 5가지 접속 자격 증명(Host, Port: `11338`, User: `avnadmin`, Password, Database: `defaultdb`) 확보.
* **결과**: DB 담당자가 작성한 `db/schema.sql`과 백엔드 `mysql2` 라이브러리 수정 없이 그대로 수용 가능한 클라우드 DB 확보.

### Phase 2. 배포 파이프라인 대응을 위한 파일 수정
* **작업 내용**: 백엔드 및 프론트엔드가 클라우드 배포 환경에서 작동할 수 있도록 최소한의 보조 설정 파일 정비.
* **수정 및 생성된 파일 상세**:
  1. **`server/db.js` 수정 (SSL 및 외부 포트 허용)**:
     - Aiven 클라우드 DB 전용 포트(`11338`)와 SSL 암호화 통신을 처리할 수 있도록 `port: process.env.DB_PORT || 3306` 및 `ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined` 옵션 추가.
     - 백엔드 담당자의 로컬 PC 개발 환경(`localhost:3306`)에는 영향을 주지 않도록 환경 변수 기반 폴백(Fallback) 구조로 작성.
  2. **`client/vercel.json` 파일 신규 생성 (SPA 404 라우팅 방지)**:
     - Vite/React 배포 후 주소창 직접 접근이나 새로고침 시 404 에러가 나는 문제를 예방하기 위해 `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` 구문 작성.
  3. **`.env.example` 템플릿 최신화**:
     - 팀 공유용 템플릿에 백엔드 추가 변수인 `DB_PORT=3306`, `DB_SSL=false` 키 명시. 개인 접속 정보가 담긴 `.env` 파일은 `.gitignore`로 보호.
* **결과**: 백엔드 담당자의 기존 개발 방식을 해치지 않으면서 클라우드 배포 조건만 완벽 수용.

### Phase 3. Vercel 모노레포 연동 및 대시보드 환경 변수(Environment Variables) 주입
* **작업 내용**: Vercel 호스팅 서비스를 GitHub 레포지토리와 연동하고 보안 키 주입.
* **진행 과정**:
  1. Vercel 프로젝트 생성 시 모노레포 구조에 맞춰 Root Directory를 **`client`**로 지정하고 Production Branch를 팀의 기본 브랜치인 `develop`으로 세팅.
  2. Vercel 대시보드 `Environment Variables` 메뉴에 Aiven 접속 정보(`DB_HOST`, `DB_PORT=11338`, `DB_USER=avnadmin`, `DB_PASSWORD`, `DB_NAME=defaultdb`, `DB_SSL=true`) 등록.
  3. Vite 번들러가 Vercel 환경 변수를 감지하도록 `client/vite.config.js`에 `define` 주입 설정 추가.
* **결과**: 소스코드 유출 없이 빌드 타임에 보안 키가 자동 결합하는 보안 호스팅 레이어 구축.

### Phase 4. PR 생성 및 Vercel Preview 시각적 검수
* **작업 내용**: 배포 세팅 코드를 PR로 제출하고 Vercel이 자동 생성해 주는 독립된 시각적 배포 화면을 사전 검수.
* **진행 과정**:
  1. 작업 브랜치(`feature/deploy-setup`)에서 팀의 통합 브랜치(`develop`) 방향으로 PR(Pull Request) 오픈.
  2. Vercel Bot이 PR 댓글로 즉시 달아주는 **독립된 임시 Preview URL**에 접속하여 화면 UI 및 라이브 동작 사전 검수.
  3. 검수 완료 후, PR 승인 및 Merge 절차를 거쳐 `develop`으로 최종 통합.
* **보안 및 외부 비공개 정책 (Security & Privacy)**:
  - **검색 엔진 차단**: Vercel이 `X-Robots-Tag: noindex`를 자동 설정하여 `develop` 및 Preview 사이트는 절대 노출되지 않음.
  - **주소 난수화**: 추측 불가능한 무작위 해시 URL로 생성되어 외부인의 주소 접근 차단.
  - **Private 저장소 보호**: Private 저장소 환경에서는 PR 댓글의 Preview 링크 자체를 오직 팀 내 인원만 조회 가능.
* **결과**: 배포 담당자 수준에서 미리 동작을 완전히 검증한 안전한 PR 제출 체계 확립.

### Phase 5. 향후 기능 확장 및 개발 지속성에 대한 무중단 대응 체계 정립
* **작업 내용**: 선제 구축된 인프라 위에서 향후 기능 구현, DB 마이그레이션, 신규 환경 변수 추가 작업이 마찰 없이 수용되는 지속적 확장 구조 정립.
* **진행 과정**:
  1. **직무별 독립적인 개발 환경 보장**: 직무 관계없이 기존과 동일하게 개인 브랜치(`feature/*`)에서 로컬 코드를 자유롭게 작성 및 테스트 가능.
  2. **환경 변수 및 신규 API 주입 확장성**: 향후 외부 API 키나 신규 기능 키가 필요할 경우, Vercel 대시보드에 환경 변수만 추가 등록해 두면 소스코드 및 클라우드 DB 연동이 자동으로 100% 유지됨.
  3. **자동화된 무중단 릴리즈(CD)**: `develop` 브랜치에 코드가 머지되는 순간 Vercel이 1분 이내에 라이브 배포 사이트를 최신 상태로 자발적 갱신하여 릴리즈 공수를 제로화.
* **결과**: 향후 모든 기능 개발이 지속적으로 라이브 서버에 반영되는 완성형 배포 기반 확립.


---


## 🚨 실전 배포 세팅 중 발생한 유의사항 및 이슈 해결 이력 (Troubleshooting & Q&A Log)

### 문제 1. 백엔드 `db.js` 및 `.env` 파일 수정 시 역할 침범 경계 명확화
* **상황**: 스켈레톤 단계에서 배포 담당자가 `db.js`나 `.env`를 수정할 때 백엔드/DB 담당자의 직무 권한을 침범하는 것 아닌가 하는 우려 발생.
* **원인**: 배포 환경 구성을 위해 백엔드의 커넥션 주소 및 스키마 로직을 직접 변경한다고 오해함.
* **해결 방법 및 확실한 직무 경계 구증**:
  - **허용 영역 (배포 담당자가 수정 가능)**: 클라우드 배포용 환경 변수 수신 구문(`process.env.DB_PORT || 3306`, `process.env.DB_SSL`), 배포 전용 설정 파일(`client/vercel.json`), 공유 템플릿(`.env.example`), Vercel 대시보드 환경 변수 등록.
  - **금지 영역 (배포 담당자가 절대 수정 금지)**: 백엔드의 비즈니스 로직, 라우터, SQL 쿼리문, DB 담당자의 스키마 DDL(`schema.sql`), 백엔드 개발자 개인의 로컬 `.env` 내부 설정값.
  - 이를 통해 백엔드 담당자의 로컬 PC 개발 환경(`localhost:3306`)에 영향을 주지 않는 유연한 폴백(Fallback) 통로만 마련함.
* **배운 점**: DevOps 담당자는 개발팀의 비즈니스 코드를 수정하는 것이 아니라, 애플리케이션이 다양한 환경(로컬 vs 클라우드)에서 안전하게 구동되도록 환경 변수 통로만 제어해야 함을 명확히 정립함.

### 문제 2. `.env` 파일 미업로드 시 배포 작동 원리와 환경 변수 이원화 구조
* **상황**: `.env` 파일이 Git 커밋에서 제외되었는데 어떻게 Vercel 배포가 성공하고, BE 담당자와 배포 담당자의 `.env` 파일 내용이 서로 달라도 괜찮은지 의문 발생.
* **원인**: `.env` 파일 자체가 클라우드 배포 서버로 전송되어 읽힌다고 오해함.
* **해결 방법**: 로컬 PC는 로컬 `.env` 파일을 통해 로컬 DB로 접근하고, Vercel 클라우드 서버는 Vercel 대시보드 웹에 등록된 환경 변수를 통해 Aiven DB로 접근하는 이원화 구조를 파악함.
* **배운 점**: 핵심 보안 정보인 `.env` 파일은 Git 저장소에 올리지 않으면서도 대시보드 환경 변수 주입을 통해 보안과 배포 성공을 동시에 챙기는 표준 DevOps 메커니즘을 이해함.