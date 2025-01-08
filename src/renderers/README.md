# Renderers

Renderers are responsible for handling the input provided by JSON Forms (including subschema, uischema, default value, etc.) and typically return a component with three subcomponents: a title, the input element, and the error element (displaying any errors). Input elements are found in the _ifc_ (input form components) subdirectory of the component directory.

This approach aligns with the _separation of concerns principle_, where the renderer is responsible for the overall layout and behavior of the form control, while the input component focuses solely on the input element itself.

## Types of Renderers

### 1. Control Renderers

Handle individual form controls such as text inputs, number inputs, date pickers, etc. They are responsible for rendering a single input element and its associated label and error message.

### 2. Combined Renderers

Manage combinations of multiple form controls. They are used when a single form element needs to handle multiple inputs, such as an array.

### 3. Layout Renderers

Handle the overall layout of the form. They are responsible for arranging multiple form controls or elements in a specific layout, e.g. categories or a group of fields.

### List of Control Renderers

The following control renderers are available in the control subdirectory and are exported in the index file:

#### Ordinary Control Renderers

- **TextControl**: Renders a single-line text input field.
- **BooleanControlRenderer**: Renders a checkbox input.
- **OneOfEnumControl**: Renders a dropdown menu for selecting one option from a list.
- **EnumControl**: Similar to OneOfEnumControl, but used for different enum types.
- **DateControl**: Renders a date picker input.
- **NumberControl**: Renders a numeric input field.
- **VoidControl**: Renders a placeholder or empty control, handling some edge cases of the json schema spec.

#### Special Control Renderers

These can be specified explicitly in the YAC spec using `vays_renderer`.

- **BigStringArray**: Renders string array more efficiently.
- **InfoBoxRenderer**: Renders an informational box with text.
- **ListAsStringRenderer**: Renders a string input as list of items.
- **PasswordRenderer**: Renders a password input field with masked characters and optionally sending it in a specified format.
- **SSHKeyRenderer**: Renders a text area specifically for SSH key inputs.

### Combined Renderers

The following combined renderers are available in the combined subdirectory and are exported in the index file:

- **ArrayControlRenderer**: Renders a list of items, as a list with options to add or remove items.
- **NestedObjectRenderer**: Renders objects with their elements.
- **MultipleChoiceRenderer**: Renders a set of options which can be selected in a renderer similar to BigStringList.
- **MultiCheckboxRenderer**: Similar to MultipleChoiceRenderer, but it renders multiple checkboxes for a list of options.

### Layout Renderers

The following layout renderers are available in the layout subdirectory and are exported in the index file:

- **CategorizationLayout**: Organizes form controls into categories, displayed as tabs. Each category can contain multiple form controls or groups of controls.
- **GroupLayoutRenderer**: Arranges form controls into groups, displayed as panels. Each group can have a title and contains multiple form controls.

## Reference

As there is hardly any guidance on how to write custom renderers, those default renderers provided by json forms have been studied to write these custom renderers, particularly for the layout renderers. CategorizationLayout and GroupLayout are based on their react renderers and the license has been added in these files.
