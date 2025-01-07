# React Guide and VAYS Wiki

## Preparation
To get started with React, the best way is getting hands-on. So get the react seed app,
clone it and play around by adding your own components.

```sh
npx create-react-app my-app --template typescript
```

This may take a few minutes. Then 

```sh
cd my-app
```

Further resources that you may enjoy are

**Master React in 5 days** (downloadable free of charge within the ETH Network)
https://link.springer.com/book/10.1007/978-1-4842-9855-8


### Common Errors
Beginner's mistake: Make sure that your components are always returning a single element. In case you have a collection of HTML elements
to return, rather than a single one, you need to wrap them into a JSX element like this:

```jsx
const Component = () => {
    return (
        <>
            <div id="div1"></div>
            <div id="div2"></div>
        </>
    )
}
```

### Functional vs. Class components
You may stuble on code where a component is defined as a class, rather than a function.
Generally, React allows both. Class is typically considered legacy.

Functional elements are newer standard and are typically more performant. They also use some different
mechansims, such as hooks instead of a traditional state that is used inside class based components.
The downside there is that a functional component cannot have methods, unlike class based ones. For this
reason, a very few components in the GUI use this, namely the modal. It is a singleton and upon invoking 
`show(...)` the modal is displayed.

### Global accessibility of hooks
Note that hooks typically need to be applied *inside of the component which defines them*.


### Performance
https://react.dev/reference/react/memo


## Json Forms
JSON Forms is the library that renders the different parameters that are declared and described
inside the JSON schema that the YAC server transmits when reaching out to the /validate endpoint.

The library is compatible with React, among other frameworks. This means that it provides a 
component for the input form.

```jsx
<JsonForms
    schema={jsonSchema}
    uischema={uiSchema}
    data={data}
    renderers={renderers}
    cells={materialCells}
    onChange={({ errors, data }) => { ... }}
/>
```

You can see the following items:
- schema: The JSON schema as it is returned by the backend server
- uischema: The UI schema as it is returned by the backend server
- data: The object that assigns values to the parameters defined in the JSON schema. Note that not all parameters may be contained.
- renderers: A list of {renderer, tester} objects
- cells: Smaller renderers, [TBD]
- onChange: The callback called when the data changes. Note that the renderers have some control over when
    exactly this happens. This is very important for performance. (See also section about debouncing).

### Other resources you may find interesting
- The JSON Forms documentation for custom renderers at https://jsonforms.io/docs/tutorial/custom-renderers
- The following discussions
    - For passing custom props https://jsonforms.discourse.group/t/how-do-i-pass-custom-props/2110/7
    - For performance issues, and the purpose of the debounce mechanism
        https://jsonforms.discourse.group/t/custom-renderer-tester-docs-are-lacking/204
- Internal Documentation for JSON Forms
    https://jsonforms.io/api/core/interfaces/

### Introduction
The JSON Forms library allows, as you see above, custom renderers, passed as a registery. Generally, renderers
consist of two elements: A control element (confusingly, JSON forms also calls these renderers) 
and a tester. The renderer, as you may have guessed, takes the props and returns a HTML element.
The tester is a function that gets the JSON Schema subtree that is currently being rendered and
returns, whether or not this renderer can actually be applied in this setting. If so, the tester
also returns a number that signals the priority of said renderer. If multiple renderers are applicable,
the renderer with the highest priority does the rendering.


### Basic Tester

```jsx
export const TextControlTester: RankedTester = rankWith(
  2,
  isStringControl
);
```

### Basic Renderer
In the following, there is a basic TextControl, which displays the text boxes.
```jsx
export const TextControl = (props: ControlProps) => {
    console.log(props.handleChange)
    const eventToValue = (ev: any) =>
        ev.target.value === '' ? undefined : ev.target.value;
    const [_, onChange, onClear] = useDebouncedChange(
        props.handleChange,
        '',
        props.data,
        props.path,
        eventToValue
      );
    
    return <TextInput {...(props)} onChange={onChange} onClear={onClear} />;
}
```



### Common errors

#### Unboxed import of controls
Make sure, that when you import a control, to do it like this:

```jsx
import TextControl, { TextControlTester } from './TextControlRenderer';
```

The controller, that is exported with 
```jsx
export default withJsonFormsControlProps(TextControl);
```
must be imported without unboxing, to make sure that the wrapper is applied.
Otherwhise, the control will be missing a number of important props, such as
`description`.

#### Hooks in renderers

Beware to not use `useState` and corresponding setter hooks inside custom control components.
Calling a setter causes a rerender to be queued. This can sometimes interfere with the JSON forms library
which manages rerendering of the custom control itself.


#### Performance trap tight validation: Use Debouncing for text input

To make sure that the GUI runs smooth, validates should only be performed rarely.
Note that validates usually happen when the onchange callback is called too.

[TBD]
Note that the entire form is validated at once. Thus, you need to make sure this happens rarely,
or the user will eventually no longer be able to type, once the json schema reaches a certain size.
(This is reached quickly.)


#### Other performance tips
Using memo... [TBD]

