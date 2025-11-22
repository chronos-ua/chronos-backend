# TODO:

## Features:

### AUTH

- boomer style
- google / telegram

### Weather

- 3rd party API data source
- Cache

### Calendar

#### Main

- CRUD
- Multiple calendars per user
- Customization (ui)
- - color scheme
- - calendar title
- - idk, smtn else

### Holidays

- Pre seed holidays for new users based on IP / selected country?
- - Semi-auto? User should mark some checkbox on the front-end!
- 3rd party API data source
- Add per country
- Separate calendar / layout?
- Mix to any calendar?

### Colaborations

- Invite users to calendars
- Invite r / rw perm
- Invite links
- - Link prewiew (SSR?)
- - Custom url? (premium?)

### Chat

- per calendar?!
- lookie:
- - avatar? custom / first+last name first letters
- - name
- - plain text + emoji? so UTF-8
- fetch msg while been offline. offset? date?
- extra: some encryption

### Event Categories

- CRUD
- Category specific features.. hmmm
- - reminder?
- - need to came up w smth

### Huh?

- Sync with google calendar and more
- Mass events?
- Company created events?
- Public / private / paid

---

## Notifications

- Email
- Push
- Telegram

## Performance:

### WS

- Sticky ws?
- custom WS parser?
- - plain JSON? Node v25
- - https://socket.io/docs/v4/custom-parser/
- play with compression?

### http

- Replace http with uWebSockets.js
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
