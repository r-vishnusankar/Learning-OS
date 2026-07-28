# Career Loop — revert guide

All career-loop work lives on branch **`feature/career-loop`**.

## Revert code

```bash
# Discard this branch and go back to main (keeps other uncommitted WIP on main if you switch carefully)
git checkout main
git branch -D feature/career-loop

# Or keep the branch but reset files to main for career-loop paths only after merge:
git revert <commit-sha>
```

If career-loop commits are the tip of the branch:

```bash
git checkout feature/career-loop
git reset --hard origin/main   # only if you have not mixed other work into the same commits
```

## Revert database seed data

Removes the 49 roster users, their rule-based course assignments, notifications, promotion rows, and “Knowledge Check” course assessments:

```bash
npm run db:revert-career-loop
```

Does **not** delete `demo@nexus.local` or unrelated LMS content.

## Re-apply after revert

```bash
npm run db:setup-career-loop
```

That runs: migrate promotions → seed employees → seed course assessments → assign level courses.
