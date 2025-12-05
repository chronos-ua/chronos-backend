# TODO:

## Features:

### AUTH

- [x] boomer style
- [x] google / telegram

### Weather

- [x] 3rd party API data source
- [x] Cache

### Calendar

#### Main

- CRUD
- [x] Multiple calendars per user
- [x] Customization (ui)
- - [x] color scheme
- - [x] calendar title
- - [x] idk, smtn else

### Holidays

- Pre seed holidays for new users based on IP / selected country?
- - Semi-auto? User should mark some checkbox on the front-end!
- 3rd party API data source
- Add per country
- Separate calendar / layout?
- Mix to any calendar?

### Colaborations

- [x] Invite users to calendars
- [x] Invite r / rw perm
- [x] Invite links
- - Link prewiew (SSR?)
- - [x] Custom url? (premium?)

### Chat

- [x] per calendar?!
- lookie:
- - [x] avatar? custom / first+last name first letters
- - [x] name
- - [x] plain text + emoji? so UTF-8
- [x] fetch msg while been offline. offset? date?

### Event Categories

- [x] CRUD
- [x] Category specific features.. hmmm
- - reminder?

### Huh?

- Sync with google calendar and more
- [x] Mass events?
- Company created events?
- [x] Public / private / paid

---

## Notifications

- Email
- Push
- Telegram

## Performance:

### WS

- [x] Sticky ws?
- custom WS parser?
- - plain JSON? Node v25
- - https://socket.io/docs/v4/custom-parser/
- play with compression?

### http

- Replace http with uWebSockets.js # failed
- play with compression?

### Common

- Stay under MTU limit.
- Don't parse body automatically
- Minimize JSON de/serializtion.
- replace mongo w some drop-in

---

## Extra

- Dockerize
- monorepo
- microservices
- API gateway
- load balancing
