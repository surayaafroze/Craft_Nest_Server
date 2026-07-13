@echo off
git add src/controllers/home.controller.ts
git commit -m "fix: update blog preview data to return correct slugs"

git add src/services/item.service.ts
git commit -m "feat: change item search to use regex for partial matching"

git add src/controllers/item.controller.ts src/routes/item.routes.ts src/types/item.ts
git commit -m "refactor: update item controllers and types"

git add src/controllers/user.controller.ts src/routes/user.routes.ts src/services/user.service.ts src/validators/user.validator.ts
git commit -m "feat: enhance user management and validation routes"

git add .
git commit -m "chore: update remaining backend configurations and wishlist routes"
