import { render } from './render-engine'
import { pipe } from './pipe.function'
import { merge } from './merge.function'

let actions, state, container, view, subscriptions = {}

const getSearchFromHash = hash => {
  const hashMatchArray = hash.match(/\?[^]*/)
  return hashMatchArray && Array.isArray(hashMatchArray) ? hashMatchArray[0] : undefined
}

const extractQueryString = string => {
  try {
    return string
      .match(/(&|\?)[^&]*|(&|\?)[^\n]/g)
      .map(qs => qs.replace(/\?|&/g, ''))
      .reduce(
        (ac, qs) =>
          Object.assign({}, ac, { [qs.split('=')[0]]: qs.split('=')[1] }),
        {}
      )
  } catch (e) {
    return undefined
  }
}

const extractQueryStringFromSearch = () => extractQueryString(window.location.search)
const extractQueryStringFromHash = () => extractQueryString(getSearchFromHash(window.location.hash))
const queryString = () => extractQueryStringFromSearch() || extractQueryStringFromHash()

const returnRouteObject = () => {
  console.log(`path ${window.location.pathname}`)
  console.log(`hash ${window.location.hash}`)
  console.log(`search ${window.location.search}`)
  console.log(`magic search ${JSON.stringify(queryString())}`)
  const pathArrayStep1 = window.location.pathname.split('/')
  const lastKey = pathArrayStep1.length -1
  // if last path array item is '' then remove it
  const pathArrayStep2 = pathArrayStep1[lastKey] === '' ? pathArrayStep1.slice(0, lastKey) : pathArrayStep1
  const hashArrayStep1 = window.location.hash
  .replace(/\?[^]*/, '')
  .replace('#/', '')
  .split('/')
  console.log(`hash** ${hashArrayStep1}`)
  const hashArrayStep2 =
    hashArrayStep1.length === 1 && hashArrayStep1[0] === ""
      ? []
      : hashArrayStep1
  const segments = pathArrayStep2.concat(hashArrayStep2)
  return {
    segments,
    queryString: extractQueryString()
  }
}


export const dispatchOnce = action => {
  const updateState = args => {
    const { state, action } = args
    state.route = returnRouteObject()
    const newState = Object.assign({}, actions({ state, action }))
    const stateChanged = JSON.stringify(newState) !== JSON.stringify(state)
    stateChanged
      ? /* state mutation */ Object.assign(state, newState)
      : undefined
    return merge(args, { stateChanged })
  }

  const returnRerenderedView = ({
    action,
    stateChanged,
    view,
    state,
    container
  }) =>
    action.rerender !== false && stateChanged
      ? render(view, state, container)
      : undefined

  return pipe(
    {
      state,
      action,
      actions,
      view,
      container
    },
    updateState,
    returnRerenderedView
  )()
}

export const dispatch = (...actionsArray) => {
  const newActionsArray = actionsArray.map((action, i) => {
    const lastItemKey = actionsArray.length - 1
    return i === lastItemKey
      ? action
      : Object.assign({}, action, { rerender: false })
  })
  return newActionsArray.forEach(action => dispatchOnce(action))
}

export const addSubscription = (key, subscription) => subscriptions[key] = subscription
export const removeSubscription = key => delete subscriptions[key]
export const getSubscription = key => subscriptions[key]

export const goto = path => {
  history.pushState(undefined, '', path)
  state.route = returnRouteObject()
  Object.assign(state, actions({ state, action: { type: 'ROUTE_CHANGE' } }))
  return render(view, state, container)
}

export const app = ($view, $actions, $container) => {
  container = $container
  view = $view
  actions = $actions
  const initState = Object.assign({}, actions({ state: {}, action: { type: 'LOADING_APP' } }), {
    route: returnRouteObject()
  })
  state = Object.assign({}, actions({ state: initState, action: { type: 'INITIALISING_STATE' } }), {
    route: returnRouteObject()
  })
  window.onpopstate = () => {
    state.route = returnRouteObject()
    Object.assign(state, actions({ state, action: { type: 'ROUTE_CHANGE' } }))
    return render(view, state, container)
  }
  window.onhashchange = () => {
    state.route = returnRouteObject()
    Object.assign(state, actions({ state, action: { type: 'ROUTE_CHANGE' } }))
    return render(view, state, container)
  }
  render(view, state, container)
}
