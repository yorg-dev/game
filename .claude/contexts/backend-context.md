## Backend — Rails API

All endpoints return JSON. Nested resources follow Rails conventions.
Authentication via Bearer token (`Authorization: Bearer <token>`).

---

### Authentication

| Method | Path                        | Description                                                          |
|--------|-----------------------------|----------------------------------------------------------------------|
| POST   | /sessions                   | Sign in — returns `{ token, user }` with `guest: false`              |
| DELETE | /sessions                   | Sign out                                                             |
| POST   | /guest                      | Create guest session — returns `{ token, user }` with `guest: true`  |
| POST   | /registration               | Register new account — returns `{ token, user }` with `guest: false` |

All auth responses return `{ token: string, user: { id, email, role, guest } }`.
All users have a token — guests get one automatically on first visit via `POST /guest`.
When a guest registers or signs in, the server migrates their guest data and returns a new token with `guest: false`.

---

### Organizations

| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /organizations              | List organizations       |
| GET    | /organizations/:id          | Show organization        |
| POST   | /organizations              | Create organization      |
| PATCH  | /organizations/:id          | Update organization      |
| DELETE | /organizations/:id          | Delete organization      |

---

### Worlds

Scoped to an organization.

| Method | Path                                          | Description   |
|--------|-----------------------------------------------|---------------|
| GET    | /organizations/:organization_id/worlds                 | List worlds   |
| GET    | /organizations/:organization_id/worlds/:id             | Show world    |
| POST   | /organizations/:organization_id/worlds                 | Create world  |
| PATCH  | /organizations/:organization_id/worlds/:id             | Update world  |
| DELETE | /organizations/:organization_id/worlds/:id             | Delete world  |

---

### Lands

Scoped to a world.

| Method | Path                                                  | Description   |
|--------|-------------------------------------------------------|---------------|
| GET    | /worlds/:world_id/lands                               | List lands    |
| GET    | /worlds/:world_id/lands/:id                           | Show land     |
| POST   | /worlds/:world_id/lands                               | Create land   |
| PATCH  | /worlds/:world_id/lands/:id                           | Update land   |
| DELETE | /worlds/:world_id/lands/:id                           | Delete land   |

---

### LandPlacements

Scoped to a land. `entity_type` is one of: `connection`, `agent`, `sign`, `chest`.

| Method | Path                                          | Description               |
|--------|-----------------------------------------------|---------------------------|
| GET    | /lands/:land_id/placements                    | List placements (initial load) |
| POST   | /lands/:land_id/placements                    | Place a connection        |
| PATCH  | /lands/:land_id/placements/:id                | Reposition placement      |
| DELETE | /lands/:land_id/placements/:id                | Remove placement          |

---

### Apps

Read-only catalog of available 3rd-party integrations.

| Method | Path        | Description          |
|--------|-------------|----------------------|
| GET    | /apps       | List all apps        |
| GET    | /apps/:id   | Show app             |

---

### Connections

A workspace's authenticated link to an App.

| Method | Path                    | Description              |
|--------|-------------------------|--------------------------|
| GET    | /connections            | List connections         |
| GET    | /connections/:id        | Show connection          |
| POST   | /connections            | Create connection        |
| PATCH  | /connections/:id        | Update connection        |
| DELETE | /connections/:id        | Delete / disconnect      |

---

### Blueprints

Reusable blueprints. `author_type` is one of: `agent`, `community`, `owner`.

| Method | Path                        | Description               |
|--------|-----------------------------|---------------------------|
| GET    | /blueprints                 | List templates            |
| GET    | /blueprints/:id             | Show template             |
| POST   | /blueprints                 | Create template           |
| PATCH  | /blueprints/:id             | Update template           |
| DELETE | /blueprints/:id             | Delete template           |

---

### Skills

Atomic capabilities. `integration` matches `App.id`.

| Method | Path              | Description      |
|--------|-------------------|------------------|
| GET    | /skills           | List skills      |
| GET    | /skills/:id       | Show skill       |
| POST   | /skills           | Create skill     |
| PATCH  | /skills/:id       | Update skill     |
| DELETE | /skills/:id       | Delete skill     |

---

### Invitations

Invitations can be scoped to an Organization, World, or Land.

| Method | Path                                        | Description                  |
|--------|---------------------------------------------|------------------------------|
| POST   | /organizations/:organization_id/invitations | Invite by email to an Org    |
| POST   | /worlds/:world_id/invitations               | Invite by email to a World   |
| POST   | /lands/:land_id/invitations                 | Invite by email to a Land    |

Request body: `{ email: string }`
Requires authenticated (non-guest) user.

---

### Quests

Per-user onboarding quests. Steps are nested objects on the quest.

| Method | Path                                   | Description          |
|--------|----------------------------------------|----------------------|
| GET    | /quests                                | List quests          |
| GET    | /quests/:id                            | Show quest           |
| PATCH  | /quests/:id                            | Update quest status  |
| PATCH  | /quests/:quest_id/steps/:id            | Mark step complete   |

---

### Notifications

| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /notifications              | List notifications       |
| PATCH  | /notifications/:id          | Mark read / update       |
| PATCH  | /notifications/mark_all_read| Mark all read            |
| DELETE | /notifications/:id          | Delete notification      |

---

### Conventions

- IDs are strings (UUIDs or prefixed slugs, e.g. `org_acme_01`)
- Timestamps are ISO-8601
- Errors follow `{ error: string, details?: object }`
- Pagination via `?page=&per_page=` (default 25)
- JSON key format: `snake_case`
