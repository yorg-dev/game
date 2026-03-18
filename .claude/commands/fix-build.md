---
description: Run npm run build and incrementally fix every type error until the build is clean
---

## Goal

Fix all build errors in this project by running `npm run build`, reading each error, fixing it, then re-running to confirm no regressions before moving on.

## Process

### 1. Initial build

Run `npm run build` and capture the full output.

- If the build **succeeds with no errors**, report "Build is already clean." and stop.
- If the build **fails**, collect all errors and proceed.

### 2. Parse errors

From the build output, extract every unique error in the form:

```
src/some/file.ts(line,col): error TSxxxx: message
```

Group errors by file. Print a summary table:

```
File                          | Errors
------------------------------|-------
src/foo/Bar.tsx               | 3
src/providers/something.ts    | 1
```

Report the total count before starting fixes.

### 3. Fix errors incrementally — one file at a time

For each file with errors (work through files in the order they appear in the build output):

1. **Read the file** in full so you have complete context.
2. **Fix all errors in that file** in a single Edit — do not make one edit per error if multiple errors are in the same file.
3. **Re-run `npm run build`** after each file is fixed.
   - If new errors appeared in other files that weren't there before, note them and add them to the queue.
   - If the error you just fixed is still present, diagnose further before moving on.
4. Report: `✓ Fixed N errors in src/foo/Bar.tsx — X errors remaining`

### 4. Rules for fixing errors

- **Fix the actual type error** — do not suppress it with `// @ts-ignore` or `as any` unless the type truly cannot be resolved (e.g. a third-party library with no types). If you must use `as unknown as T`, leave a comment explaining why.
- **Prefer the minimal correct fix**: add a missing type annotation, narrow a union, add a null check, correct an import — whichever is smallest and safest.
- **Do not refactor** surrounding code that isn't part of the error. Fix only what the compiler is complaining about.
- **Do not add new `eslint-disable` comments** to silence errors that should be fixed.
- If an error requires understanding a type that lives in another file, read that file before fixing.

### 5. Completion

Once `npm run build` exits with code 0 and zero errors:

- Print a summary of every file changed and the error types fixed.
- If any errors were intentionally skipped (e.g. errors in generated files or third-party code), list them with the reason.
