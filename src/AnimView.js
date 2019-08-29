import { BackHandler, Animated } from 'react-native'
import { createInitialStack, createScreen } from './screen'
import createRunTransition from './transition'
import React from 'react'

export default class AnimView extends React.PureComponent {
    state = { anim: new Animated.Value(0), animStyle: {} }

    transition = (animation, reverse, duration, easing) => {
        const { anim } = this.state
        anim.setValue(reverse ? 1 : 0)
        this.setState({ animStyle: animation(anim) })
        return new Promise(resolve => {
            Animated.timing(anim, {
                toValue: reverse ? 0 : 1,
                duration,
                easing,
                useNativeDriver: true
            }).start(() => resolve())
        })
    }

    render = () => {
        const { children, style } = this.props
        const { animStyle } = this.state
        return <Animated.View style={[style, animStyle]}>{children}</Animated.View>
    }
}
