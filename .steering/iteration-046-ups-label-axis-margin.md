# Iteration 046: UPS label and axis margin

## Purpose

- Remove redundant `IP` prefixes from UPS IP plot labels.
- Add more left margin so exponent-style Y tick labels do not overlap the Y axis label.
- Review compressed project import/export options before implementation.

## Implementation

- Changed UPS IP marker label from `IP EVBM` to `EVBM`.
- Changed UPS IP range labels from `IP VBM edge/BG` to `VBM edge/BG`.
- Increased normal plot left margin and large-label plot left margin.
- Updated plot geometry tests for the new margins.

## Completed Scope

- UPS IP plot no longer repeats the `IP` prefix on VBM marker and cursor labels.
- Plot Y axis labels have more space away from exponent-formatted tick labels.

## Simplifications / Technical Debt

- Compressed Project import/export is not implemented in this iteration.
- The recommended format is documented in the final response for a follow-up iteration.

## Tests

- `vp check`
- `vp test --coverage`
- Browser smoke:
  - Demo load shows UPS IP labels without the redundant `IP` prefix.
