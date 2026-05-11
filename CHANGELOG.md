# spotdiff

## 1.0.0

### Major Changes

- acb5eb7: ## What

  spotdiff is now stable. Compare two JavaScript objects, find what changed, and get human-readable descriptions of those changes. You can also apply those changes back to recreate the original object.

  ## Why

  I've tested the API and fixed edge cases. It's zero-dependency, works in strict TypeScript, and handles tricky cases like Dates, Maps, and Sets. Ready for production.

  ## How

  ```ts
  import { spotdiff, patch, humanize } from "spotdiff";

  const v1 = { user: { name: "Juan", age: 30 } };
  const v2 = { user: { name: "Juan", age: 31 } };

  const changes = spotdiff(v1, v2);
  patch(v1, changes); // → v2
  humanize(changes); // → ["user.age changed from 30 to 31"]
  ```
