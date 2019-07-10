import * as ReactDOM from 'react-dom';

export const render = (view, state, container) => ReactDOM.render(
    view({ state }),
    container
);