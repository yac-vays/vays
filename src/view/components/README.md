# Component Directory


This directory contains most of the elements you actually see on the webapp.
Note that there are two kinds of components here.

- The conventional components. These are for the main webpage.

- The input form controls - ifc for short. They are deployed by the renderers and live in `../thirdparty/components/ifc/`. For separation of concerns, renderers have been separated into a directory of their own.


## Index

### ActionDropdown [Overview/EntityList]
The dropdown for the actions/operations that have not been marked as favourite.

### ActionButton [Overview/EntityList]
The button representation for favourite actions/operations.

### AddButton [Layout/Sidebar]
The button for adding a new entity.

### InformationButton [EditView/Label]
The information button which triggers a information window to pop open.

### InfoPanel [EditView/Label]
An information panel to display descriptions.

### EntityList [Overview]
The entity list in the overview view.

### Modal [App]
Confirmation and editing modal.

### ToastNotification [App]
The notifications appearing at the bottom of the window.

### Accordion [EditView]
A collapsible section.

### AvailabilityBanner [App]
The banner shown while a backend is unavailable.

### DiffViewer [EditView]
The coloured view of a unified diff (the changes to commit).

### Form [EditView]
Helpers for the form (error ring, read-only state).

### FormComponentTitle [EditView]
The title of a form element.

### LimitChips [EditView]
The chips showing the usage of limits.

### Logs [Overview/EntityList]
The log symbols, panels and windows (log renderers).

### Markdown [App]
Renders (sanitized) Markdown.

### NoDataIndicator [Overview/EditView]
The placeholder shown when there is no data (with an optional Retry button).

### NoticeFooter [Layout/Sidebar]
The sidebar footer with the VAYS version.

### Popover [App]
A generic popover.

### RichInfoPanel [Overview/EntityList]
A click-toggled panel for rich content (e.g. the log panels).

### SchemaWarningMessage [Layout/Header]
An entry of the Schema Warnings notification.

### SSHKeyInput [EditView]
The input of the `ssh_key` renderer.

### Tabs [EditView]
The tab bar (categories of the form).







