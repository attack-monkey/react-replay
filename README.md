# react-replay

react-replay is a light wrapper around React that provides:

- auto-rerender
- routing
- redux-like state management

Replay is an event-loop driven application.  
When an action is dispatched the whole application state is re-calculated.  
When state changes from the previous state, React's diffing algorithm is utilised.  
Only the parts of the DOM that change are updated - resulting in an efficient re-render.

As a result, the entire application can be made from Functional / Stateless Components.

## Install

**The fastest way to get a project going is to install from seed using douglas. douglas installs the project and downloads all the dependencies.**

Install from seed project:

```

npx douglas get react-replay-seed

```

> Note that the seed project uses [parcel](https://parceljs.org/) for it's javascript bundling. 
> To install parcel globally - `npm i -g parcel-bundler`
> Once installed - `npm start` to start the dev server.

Install from typescript seed project: 

```

npx douglas get react-replay-seed-for-ts

```

Just the package:

```

npm i react-replay

```

## Basics

react-replay is a lightweight frontend similar to React + Redux, but with only the functional parts.

There are 3 main parts to React-Replay:

- State
- Components
- Reducers

**Components** are almost always just functional / stateless components, and take in **State** to render a view.  
Events such as `onClick` trigger **Actions** to be dispatched to the Root **Reducer**' which update **State**.  
Whenever the **State** is updated, the view is rerendered.

### Components

This means much of React can be left behind in favour of simple functional components.

eg.

```jsx

// jsx

export const MyComponent = ({ state }) => (
  <div>
    <h1>{ state.greeting }</h1>
    <ChildComponent state={ state }></ChildComponent>
  </div>
) 

```

The above is a stateless / functional component. It's essentially just a function that takes in props;  
in this case `state`; and returns the component. Notice how we've also got a child component that we're also passing state into.

## Dispatching Actions

Use `dispatch` to dispatch one or more actions.
An action is just a simple object that gets passed into your 'masterReducer' function to re-create state.

After each dispatch the view is rerendered automatically unless:

- You dispatch an action with the rerender field set to false eg. `{ type: 'MY_ACTION', rerender: false }`
- Or you dispatch multiple actions in the one dispatch. All actions except the last will have `rerender: false` applied to them automatically, so that only the last action results in a rerender. 

For example in the below snippet, the rerender will wait for ACTION_2 

```javascript

dispatch(
  { type: 'ACTION_1' },
  { type: 'ACTION_2' }
)

```

Example of dispatch applied to an `onClick`

```jsx

import { dispatch } from '../node_modules/react-replay/src'

export const MyComponent = ({ state }) => (
  <div>
    <h1>{ state.greeting }</h1>
    <ChildComponent state={ state }></ChildComponent>
    <button onClick={ 
      () => dispatch({ type: 'CHANGE_GREETING', to: 'Hello World'}) 
    }>push me</button>
  </div>
) 

```

Based on the above component expecting `state.greeting` and the action being of type 'CHANGE_GREETING',
let's take a look at the corresponding Reducer.

## Reducers

Your master or root reducer is a function that resolves to a state object.

It accepts an action, along with the current state and produces a new state object

In it's simplist terms it looks like...

```javascript

export const reducer = ({ state, action }) => ({
  greeting: 'hello world'
})

```

This however would always produce a new state of 

```javascript

{
  greeting: 'hello world'
}

```

To make it so that it takes in an action to produce a new state, we create smaller reducer functions that do the heavy lifting...

```javascript

import { greetingReducer } from '...'

export const reducer = ({ state, action }) => ({
  greeting: greetingReducer(action, state.greeting))
})

```

```javascript

/* greetingReducer
 * ---------------
 * Accepts actions such as { type: 'CHANGE_GREETING', to: '...' }
 *
 */

export const greetingReducer = (action, greetingState = 'Hello World') =>
  action.type === 'CHANGE_GREETING'
    ? action.to
    : greetingState

```

When the `greetingReducer` gets an action that it cares about, it computes a new state, otherwise it just returns the current state.  
Note that it also has a default state set to 'Hello World'.

### Goto

The last part to React-Replay is the routing...

To change routes just use `goto`

```jsx

import { goto } from '../node_modules/react-replay/src'

export const MyComponent = ({ state }) => (
  <div>
    <h1>{ state.greeting }</h1>
    <ChildComponent state={ state }></ChildComponent>
    <button onClick={ 
      () => goto('/animals/cats?cat=charlie') 
    }>push me</button>
  </div>
) 

```

Clicking on the button will change the route (and url) and also change `state.route` to 

```javascript

{
  segments: [
    '',
    'animals',
    'cats'
  ],
  queryString: {
    cat: 'charlie'
  }
}

```

> Note that hashes can also be used in routes and simply form part of the segments (as though the hash didn't exist).

## Putting it altogether

To bootstrap the application we wrap the First (outer most) Component, along with the root reducer and a mount (The DOM node the app should go into).

```javascript

import { app } from '../node_modules/react-replay/src'
import { FirstComponent } from '...'
import { reducer } from '...'

const mount = document.getElementById('app')
app(FirstComponent, reducer, mount)

```

Optionally you can also add an initial state object at this app bootstrapping stage...

```javascript

import { app } from '../node_modules/react-replay/src'
import { FirstComponent } from '...'
import { reducer } from '...'

const initState = { greeting: 'Yo Sup' }
const mount = document.getElementById('app')
app(FirstComponent, reducer, mount, initState)

```

## How State Change and Rerender work tldr;

Whenever an action is dispatched, the current application state is retrieved, and both the state and the action are passed through the main reducer (Redux pattern). Even if an asynchronous activity triggered a separate process, once dispatch is called, the **current application state** is retrieved. At the end of the new state recalculation, this new state becomes the  **current application state**. Even if `{ rerender: false }` is used in the action - the current application state is still updated. This keeps the application in sync - even across asynchronous activity.

The rerender process only kicks in if the new state is different from the old state AND if `{ rerender: false }` was not passed into the action. Only then will the diffing algorithm kick in to update only the DOM nodes that require change.
