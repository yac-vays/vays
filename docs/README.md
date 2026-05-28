# VAYS Developer Notes

User, admin and developer documentation lives at
<https://yac-vays.github.io/vays/>. In particular:

  - Setup, dev server, build, tests, releases: the
    [Development page](https://yac-vays.github.io/vays/devel/).
  - Adding a new renderer: the *Adding a Renderer* section of that
    same page; the bundled renderers are listed under
    [Renderers](https://yac-vays.github.io/vays/renderers/).

This in-tree `docs/` folder keeps only material that doesn't belong in
the user-facing site:

  - [`Development/software_arch.md`](Development/software_arch.md) —
    MVC architecture diagram of this codebase.
  - [`Development/intro/json-forms.md`](Development/intro/json-forms.md) —
    JSON Forms primer for new maintainers (renderer/tester model,
    common pitfalls, debouncing).
  - [`Development/intro/react.md`](Development/intro/react.md) —
    React primer for new maintainers.
  - [`Development/thoughts_on_initial_for_arrays.md`](Development/thoughts_on_initial_for_arrays.md) —
    design memo about supporting `vays_options.initial` on arrays.
