
# Custom Renderers
Custom renderers allow to render data for which a strict format is expected.


For VAYS to know when to apply a custom renderer is typically done using pattern matching on the json schema and/or the UI schema.
In most cases, the structure of the json schema itself is enough data to decide what renderer needs to be picked when. In some cases however, the YAC admin explicitly needs to specify what type of renderer needs to be used. This may be needed e.g. because by default a different renderer would be used to render the parameter, for example.

## Categorization

- Control: These typically render primitive types such as strings, booleans, dropdowns, etc. but also ssh keys. What they have in common is that *their invocation does not cause other renderers to be invoked*. So typically, these are the 'simpler' ones.

- Combined (also: complex in JSON Form lingo): These are renderers whose invocation causes other renderers to be invoked as well. Examples are all arrays, multiple choice renderers, etc. These have a more intricate interaction with JSON forms. By the way, the complex is read like in 'building complex', meaning *pieced together*, not as in 'complicated'. The naming comes from JSON forms.

- Layout Give the structure of the form.

## How Renderers Work

Please check out [the Json Forms info](/docs/Development/Onboading/Json-Forms.md).

## Implicit Custom Renderers

Implicit custom renderers inspect the logic inside the json schema to decide whether they may be applied.


## Explicit Custom Renderers


There are a number of renderers that need to be named explicitly in the YAC configuration to make sure that they are used. Explicit custom renderers use the utility function `isCustomRenderer`.


