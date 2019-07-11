import { render } from './render-engine'
import { pipe } from './pipe.function'
import { merge } from './merge.function'

let actions, state, container, view, subscriptions = {}

const extractQueryString = () => {
  try {
    return window.location.search
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

const returnRouteObject = () => ({
  segments: window.location.pathname.split('/'),
  queryString: extractQueryString()
})

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
  Object.assign(state, actions({ state, undefined }))
  return render(view, state, container)
}

export const app = ($view, $actions, $container) => {
  container = $container
  view = $view
  actions = $actions
  const initState = Object.assign({}, actions({ state: {}, undefined }), {
    route: returnRouteObject()
  })
  state = Object.assign({}, actions({ state: initState, undefined }), {
    route: returnRouteObject()
  })
  window.onpopstate = () => {
    state.route = returnRouteObject()
    Object.assign(state, actions({ state, undefined }))
    return render(view, state, container)
  }
  render(view, state, container)
}
