import { Dimensions } from 'react-native'

const { width: windowWidth, height: windowHeight } = Dimensions.get('window')
const defaultAnimations = {
    fade: anim => ({ opacity: anim }),
    left: anim => ({
        transform: [
            {
                translateX: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-windowWidth, 0]
                })
            }
        ]
    }),
    right: anim => ({
        transform: [
            {
                translateX: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [windowWidth, 0]
                })
            }
        ]
    }),
    top: anim => ({
        transform: [
            {
                translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-windowHeight, 0]
                })
            }
        ]
    }),
    bottom: anim => ({
        transform: [
            {
                translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [windowHeight, 0]
                })
            }
        ]
    })
}

export default customAnimations => {
    const animations = { ...defaultAnimations, ...customAnimations }
    return (screen, transitionProps, reverse) => {
        if (transitionProps.animation === 'none') return Promise.resolve()

        const animation = animations[transitionProps.animation]
        const duration = transitionProps.duration
        const easing = transitionProps.easing

        return screen.transition(animation, reverse, duration, easing)
    }
}
