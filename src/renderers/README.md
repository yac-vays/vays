# Renderers

This directory holds the JSON-Forms renderer/tester pairs registered in
[`./index.tsx`](./index.tsx). Each renderer is paired with a *tester*
that returns a numeric rank when it can render a given field; the
highest-ranking match wins.

A renderer typically returns two pieces stacked vertically: a title
(whose error button shows validation errors) and the input element,
wrapped in a red ring while it has errors. The input elements themselves
live under [`../view/thirdparty/components/ifc/`](../view/thirdparty/components/ifc/)
(input form components), so renderers can stay focused on layout and
JSON-Forms wiring while the input components are pure UI primitives.

## Layout of this directory

  - [`control/`](./control/) — single-field renderers (text, number,
    boolean, date, enum, ...).
  - [`control/special/`](./control/special/) — renderers selected
    explicitly via `vays_options.renderer: <name>` (password, ssh_key,
    age_secret, ...). Exceptions: `unavailable` lives in `control/`,
    `multi_checkbox` in `combined/`.
  - [`combined/`](./combined/) — renderers for arrays and arrays of
    objects (flat array, nested-object array, multi-checkbox).
  - [`layout/`](./layout/) — top-level layout renderers
    (categorization tabs, groups and rows).
  - [`utils/`](./utils/) — helpers shared by the testers
    (`isCustomRenderer`, `isUntypedStringInput`) and a few common HOC
    wrappers.

## See Also

  - End-user reference for every bundled renderer, its selection rules
    and options: <https://yac-vays.github.io/vays/renderers/>.
  - Adding a new renderer:
    <https://yac-vays.github.io/vays/devel/add-renderer/>.
  - Background on the JSON-Forms renderer/tester model:
    <https://yac-vays.github.io/vays/devel/json-forms/>.
