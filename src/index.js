import { BackHandler, StyleSheet } from 'react-native'
import { createInitialStack, createScreen } from './screen'
import createRunTransition from './transition'
import React from 'react'
import AnimView from './AnimView'

class NavigatorScreen extends React.Component {
    shouldComponentUpdate = () => {
        return false
    }

    render = () => {
        const { navigator, passedProps, screen: Screen } = this.props
        return <Screen navigator={navigator} {...passedProps} />
    }
}

class Navigator extends React.Component {
    state = { stack: createInitialStack(this.props.initialStack, this.props.screens) }
    renderedScreens = {}
    runTransition = createRunTransition(this.props.animations)
    inTransition = false
    backHandlers = {}

    updateStack = stack => {
        const { stack: previousStack } = this.state
        return new Promise(resolve =>
            this.setState({ stack }, () => {
                const { onStackUpdate } = this.props
                if (onStackUpdate) onStackUpdate(stack, previousStack)
                resolve()
            })
        )
    }

    navigatorAction = action =>
        new Promise((resolve, reject) => {
            if (this.inTransition) {
                const inTransitionError =
                    "Can't process action when navigator is in transition state"
                return reject(inTransitionError)
            }

            this.inTransition = true
            action(
                () => {
                    this.inTransition = false
                    resolve()
                },
                error => {
                    this.inTransition = false
                    reject(error)
                }
            )
        })
    navigator = {
        pop: transitionProps => {
            const { stack } = this.state

            if (stack.length === 1) return

            return this.navigatorAction(async onFinish => {
                const screen = stack[stack.length - 1]
                await this.runTransition(
                    this.renderedScreens[screen.id],
                    !!transitionProps
                        ? { ...screen.transitionProps, ...transitionProps }
                        : screen.transitionProps,
                    true
                )
                await this.updateStack(stack.slice(0, -1))
                onFinish()
            })
        },
        popTo: (screenId, transitionProps) => {
            const { stack } = this.state

            const screenIndex = stack.findIndex(({ id }) => id === screenId)
            if (screenIndex < 0) throw new Error(`No screen with id "${screenId}" found`)
            if (screenIndex === stack.length - 1) throw new Error(`Can't pop to current screen`)

            return this.navigatorAction(async (onFinish, onFail) => {
                const { stack } = this.state

                if (stack.length === 1)
                    return onFail("Can't pop if there's only one screen in the stack")

                const screen = stack[stack.length - 1]
                await this.runTransition(
                    this.renderedScreens[screen.id],
                    !!transitionProps
                        ? { ...screen.transitionProps, ...transitionProps }
                        : screen.transitionProps,
                    true
                )
                await this.updateStack(stack.slice(0, screenIndex + 1))
                onFinish()
            })
        },
        push: (screenName, props, transitionProps) => {
            if (!this.props.screens.hasOwnProperty(screenName))
                throw new Error(`Screen ${screenName} doesn't exist`)

            return this.navigatorAction(async onFinish => {
                const { stack } = this.state

                const screen = createScreen({ screen: screenName, props, transitionProps })
                await this.updateStack([...stack, screen])
                await this.runTransition(
                    this.renderedScreens[screen.id],
                    screen.transitionProps,
                    false
                )
                onFinish()
            })
        },
        reset: (screenName, props, transitionProps) => {
            if (!this.props.screens.hasOwnProperty(screenName))
                throw new Error(`Screen ${screenName} doesn't exist`)

            return this.navigatorAction(async onFinish => {
                const { stack } = this.state
                const screen = createScreen({ screen: screenName, props, transitionProps })
                await this.updateStack([...stack, screen])
                await this.runTransition(
                    this.renderedScreens[screen.id],
                    screen.transitionProps,
                    false
                )
                await this.updateStack([screen])
                onFinish()
            })
        },
        resetFrom: (screenId, screenName, props, transitionProps) => {
            if (!this.props.screens.hasOwnProperty(screenName))
                throw new Error(`Screen ${screenName} doesn't exist`)
            const { stack } = this.state
            const screenIndex = stack.findIndex(({ id }) => id === screenId)
            if (screenIndex < 0) throw new Error(`No screen with id "${screenId}" found`)

            return this.navigatorAction(async onFinish => {
                const { stack } = this.state
                const screen = createScreen({ screen: screenName, props, transitionProps })
                await this.updateStack([...stack, screen])
                await this.runTransition(
                    this.renderedScreens[screen.id],
                    screen.transitionProps,
                    false
                )

                await this.updateStack([...stack.slice(0, screenIndex + 1), screen])
                onFinish()
            })
        },
        stack() {
            const { stack } = this.state
            return [...stack]
        }
    }

    onBackPress = () => {
        const { stack } = this.state
        const lastStackItemId = stack[stack.length - 1].id
        if (this.backHandlers.hasOwnProperty(lastStackItemId)) {
            return this.backHandlers[lastStackItemId](this.navigator) || stack.length > 1
        }

        const { backHandler } = this.props
        if (backHandler) {
            return backHandler(this.navigator) || stack.length > 1
        }

        return stack.length > 1
    }

    componentDidMount = () => {
        this.androidBackHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            this.onBackPress
        )

        Object.defineProperty(this.navigator, 'stack', { get: () => this.state.stack })

        const { navigatorRef } = this.props
        if (!!navigatorRef) navigatorRef(this.navigator)
    }

    componentWillUnmount = () => {
        this.androidBackHandler.remove()

        const { navigatorRef } = this.props
        if (!!navigatorRef) navigatorRef(undefined)
    }

    renderScreen = (stackItem, index) => {
        const { screens } = this.props
        const { stack } = this.state
        const Screen = screens[stackItem.screen]

        return (
            <AnimView
                key={stackItem.id}
                pointerEvents={index < stack.length - 1 ? 'none' : undefined}
                style={index < stack.length - 2 ? styles.hidenScreen : StyleSheet.absoluteFill}
                ref={ref => (this.renderedScreens[stackItem.id] = ref)}
                useNativeDriver={true}>
                <NavigatorScreen
                    navigator={this.navigator}
                    passedProps={stackItem.props}
                    screen={Screen}
                />
            </AnimView>
        )
    }

    render = () => this.state.stack.map(this.renderScreen)
}

Navigator.defaultProps = {
    backHandler: navigator => navigator.pop()
}

const styles = StyleSheet.create({
    hidenScreen: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0
    }
})

export default Navigator
