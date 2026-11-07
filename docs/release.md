# Release a version

Releases run only through the `release.yml` GitHub Actions workflow, from `main`. Never run `pnpm release`, release-it or `git tag` locally: tags are reserved to the CI deploy key.

One version covers every plugin, the icon pack and the profile.

## Before releasing

Every user-visible change has a line under `## [Unreleased]` in [`CHANGELOG.md`](../CHANGELOG.md): the release fails on an empty section.

## Publish a release

```sh
gh workflow run release.yml -f increment=<patch|minor|major>
```

Or use Actions, Release, Run workflow on GitHub.

## Publish a prerelease

To test the pipeline and the files first, add `-f prerelease=true`. The entries stay under Unreleased and the release is marked as a prerelease. Its files carry the base version: `1.0.0-next.0` ships files versioned `1.0.0`, because a four-part manifest version cannot carry the suffix. To reinstall a prerelease over the previous one, run `install.ps1` with `-Force` (see [Install a release](install.md)).

```sh
gh workflow run release.yml -f increment=<patch|minor|major> -f prerelease=true
```

## Continue a prerelease series

The next prerelease of the same version uses `increment=prerelease` (`1.0.0-next.0` becomes `1.0.0-next.1`). `patch`, `minor` and `major` start a new series.

```sh
gh workflow run release.yml -f increment=prerelease
```

## What the workflow does

1. Runs the checks.
2. Bumps the version, rolls the changelog, tags the commit and creates the GitHub release with the changelog section as its notes.
3. Builds the release tag and checks that every package carries the release version, and that the zip holds the same packages as the individual files.
4. Attaches the zip to the release.

## Set up a repository for releases

The release needs a one-time GitHub setup: the `release` environment, the deploy key and the tag ruleset. Follow [Releasing, one-time setup](https://github.com/minimalstuff/tooling/blob/main/docs/releasing.md#one-time-setup) and skip the npm parts.
