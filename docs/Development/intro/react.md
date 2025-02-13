# React

## Getting Started
First, you will need to install npm (and node). To do so, I personally recommend using [`nvm`](https://github.com/nvm-sh/nvm).

To get started with React, the best way is getting hands-on. So get the react seed app,
clone it and play around by adding your own components. (Note: npx is just a shortcut for npm run)

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


### React - Common Errors
Make sure that your components are always returning a single element. In case you have a collection of HTML elements
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

Also, make sure to use hooks only inside of components, not inside  of other javascript/typescriüpt functions.

#### Functional vs. Class components
You may stuble on code where a component is defined as a class, rather than a function.
Generally, React allows both. Class is typically considered legacy.

Functional elements are newer standard and are typically more performant. They also use some different
mechansims, such as hooks instead of a traditional state that is used inside class based components.
The downside there is that a functional component cannot have methods, unlike class based ones. For this reason, a very few components in the GUI use this, namely the modal. It is a singleton and upon invoking `show(...)` the modal is displayed.


#### Performance
https://react.dev/reference/react/memo
