# ncSender machine profiles

Known machines for ncSender's **Machine Setup** wizard. Picking one fills the
wizard's pages (travel, motors, switches, homing, limits) with that machine's
settings; nothing is written to the controller until the user reviews it.

ncSender downloads `profiles.json` from the latest release of this repo when
the wizard opens (at most once a day, or on demand), keeps a copy for offline
use, and also ships the latest released copy inside every build.

## Adding a machine

1. Add an entry to `profiles.json`:

   ```json
   {
     "id": "brand-model-size", "brand": "Brand", "model": "Model", "size": "48x32",
     "boards": ["SuperLongBoard Ext"],
     "firmware": {
       "grblhal": {"100": "200.4", "130": "1230"}
     }
   }
   ```

   - `id`: lowercase words joined by dashes, unique.
   - `boards`: board names as `$I` reports them (`[BOARD:...]`). A board
     matches when its name contains one of these. Optional.
   - `firmware`: settings per firmware (`grblhal`, `grbl`, `fluidnc`), as the
     `$` number without the `$`, values as strings. A profile shows only for
     the firmware it has settings for.
   - `newCore`: optional; on grblHAL builds from `minBuild` on, `values`
     replace the profile's own (used for the SuperLongBoard ATCi core).

2. Only these settings belong in a profile, taken from a machine that is known
   to work (a `$$` dump):

   | Settings | What |
   |---|---|
   | `$3` | Direction invert |
   | `$5`, `$6` | Limit switch and probe invert |
   | `$20`, `$21`, `$40` | Soft limits, hard limits, limit jogs |
   | `$22`–`$27`, `$44`–`$46` | Homing |
   | `$100`–`$103` | Steps per mm (per degree for A) |
   | `$110`–`$113` | Max rate |
   | `$120`–`$123` | Acceleration |
   | `$130`–`$132` | Max travel |
   | `$744`, `$745` | Motor fault enable and invert |

   Network, spindle, VFD and other board settings stay out: they belong to
   the user's setup, not the machine.

3. Check it: `node scripts/validate.mjs`. Pull requests run the same check.

## Releasing

`.scripts/release.sh ["what changed"]` tags the next version; the Release
workflow publishes `profiles.json` as its asset. Users get it the next time
the wizard checks.

## Sources

- Sienci Labs machines: the defaults gSender ships
  (`src/app/src/features/Config/assets/MachineDefaults`, GPLv3).
- Onefinity Journeyman 48x32 (SLB-EXT, closed loop): a user's working
  settings, [tmuka/cnc-xy-swap](https://github.com/tmuka/cnc-xy-swap/blob/main/original/firmware-settings-2026-10-15.txt).

GPL-3.0, see `LICENSE`.
