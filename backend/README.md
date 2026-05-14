# TravelAI Backend

Express + TypeScript API module for the local Mock MVP.

## Run

```bash
npm install
npm run dev
```

Default URL: <http://localhost:3000>.

## Environment

```bash
BACKEND_MODE=mock
PROVIDER_MODE=mock
PERSISTENCE_MODE=memory
PORT=3000
```

## API

```bash
curl http://localhost:3000/api/health

curl -i -c /tmp/travelai.cookies http://localhost:3000/api/session

curl -b /tmp/travelai.cookies -c /tmp/travelai.cookies \
  -H 'content-type: application/json' \
  -d '{"title":"上海到东京机票"}' \
  http://localhost:3000/api/conversations

curl -b /tmp/travelai.cookies \
  -H 'content-type: application/json' \
  -d '{"conversationId":"<conversationId>","content":"我想 6 月底从上海去东京玩 5 天，两个人，预算别太贵"}' \
  http://localhost:3000/api/chat
```

This phase intentionally uses in-memory persistence only. Data is lost when the process restarts.
