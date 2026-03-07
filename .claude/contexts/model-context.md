## Data Models

**Agent** — Active instance of an Blueprint, scoped to an Organization/User.  A NPC (non-playable character)

**Blueprint** — Reusable role definition. Has a base prompt and a set of Skills.

**App** - A 3rd party integration.   An app will return what skills/actions are possible.

**Connection** - An instance of an App with credentials, scoped to an Organization/User.

**Marketplace** - A list of available Blueprints

**Skill** — Single-action capability. Examples:
- Shopify: Refund Order
- HubSpot: Get Contact Details

**User** - The current user and player of the system.

## Relationships
Bluepring → has many Skills
Agent → instantiated from Blueprint
Connection → instantiated from App

Organization
  ├── Users
  ├── Teams
  └── Worlds        ← company/org-level container ("Acme's Universe")
       └── Lands    ← individual browsable maps ("Marketing Map", "My Sandbox")
            └── LandPlacements  ← placements {landId, entityId, entityType, worldX, worldY}
