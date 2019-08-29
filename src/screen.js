import { Easing } from 'react-native'

// https://gist.github.com/gordonbrander/2230317
function ID() {
    return (
        '_' +
        Math.random()
            .toString(36)
            .substr(2, 9)
    )
}

const defaultTransitionProps = {
    animation: 'right',
    duration: 250,
    easing: Easing.bezier(0.42, 0, 0.58, 1)
}

const isDefinedByString = screen => typeof screen === 'string'

export const createScreen = screen => {
    const normilized = isDefinedByString(screen)
        ? { props: {}, screen, transitionProps: defaultTransitionProps }
        : {
              props: screen.props || {},
              screen: screen.screen,
              transitionProps: !!screen.transitionProps
                  ? { ...defaultTransitionProps, ...screen.transitionProps }
                  : defaultTransitionProps
          }
    return { id: ID(), ...normilized }
}

export const createInitialStack = (initialStack, screens) => {
    return isDefinedByString(initialStack)
        ? [createScreen(initialStack)]
        : initialStack.map(createScreen)
}
