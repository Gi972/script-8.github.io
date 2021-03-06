import React, { Component } from 'react'
import { connect } from 'react-redux'
import actions from '../actions/actions.js'
import bios from '../utils/bios.js'
import screenTypes from '../utils/screenTypes.js'
import { getLintErrors } from '../utils/setupLinter.js'

const mapStateToProps = ({ screen, game, songs, chains, phrases }) => ({
  songs,
  chains,
  phrases,
  game: screen === screenTypes.BOOT ? bios : game,
  focus: screen === screenTypes.RUN,
  run: [screenTypes.BOOT, screenTypes.RUN].includes(screen),
  screen
})

const mapDispatchToProps = dispatch => ({
  finishBoot: () => dispatch(actions.finishBoot())
})

class Output extends Component {
  constructor (props) {
    super(props)

    this.handleBlur = this.props.focus ? this.handleBlur.bind(this) : this.noop
  }

  noop () {}

  handleBlur (e) {
    e.currentTarget.focus()
  }

  shouldComponentUpdate () {
    return false
  }

  componentDidMount () {
    this._iframe.focus()
  }

  componentWillReceiveProps (nextProps) {
    if (this.isLoaded) {
      const { game } = nextProps
      if (game !== this.props.game) {
        this.evaluate(nextProps)
      }
    }
  }

  evaluate ({ game, finishBoot, run, songs, chains, phrases, screen }) {
    // Get the iframe.
    const iframe = window.frames[0]

    // Validate code before drawing:

    // get the iframe's validateToken function,
    const validateToken =
      screen === screenTypes.BOOT ? () => true : iframe.__script8.validateToken

    // and use it to get any linting errors.
    const errors = getLintErrors({ text: game, validateToken })

    // No errors = we're good!
    const isValid = !errors.length

    if (isValid) {
      // Send iframe the game code.
      iframe._script8.callCode({
        game,
        songs,
        chains,
        phrases,
        run,
        endCallback: finishBoot
      })
    } else {
      // If we had errors, print them to console.
      console.warn(errors[0].message)
    }
  }

  render () {
    return (
      <div className='Output'>
        <iframe
          src='iframe.html'
          sandbox='allow-scripts allow-same-origin'
          title='SCRIPT-8'
          onBlur={this.handleBlur}
          ref={_iframe => {
            this._iframe = _iframe
          }}
          onLoad={() => {
            this.isLoaded = true
            this.evaluate(this.props)
          }}
        />
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Output)
