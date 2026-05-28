# VAYS — Visual AdminInterface for YAC Servers

**VAYS** (**V**isual **A**dminInterface for **Y**AC **S**ervers) is the
official web frontend for one or more **YAC** backends. It is a single-page
React application served as a static bundle; all of its logic runs
in the user's browser, talking to YAC's REST API directly.

A single VAYS instance can connect to multiple YAC backends at once
(*backends* in the config) and lets users:

  - browse, filter and edit entities listed by each YAC instance,
  - create / copy / link / rename / delete entities,
  - run actions and inspect logs,
  - authenticate via the same OpenID Connect provider as YAC.

Forms are rendered from the JSON-Schema and UI-Schema that YAC generates
from the specs file.

For the documentation, see: https://yac-vays.github.io
