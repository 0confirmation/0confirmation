import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../components/ui/button'
import Snackbar from '../../../components/ui/snackbar'
import MetaFoxLogo from '../../../components/ui/metafox-logo'
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes'
import { returnToOnboardingInitiator } from '../onboarding-initiator-util'

export default class EndOfFlowScreen extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
    history: PropTypes.object,
    completeOnboarding: PropTypes.func,
    completionMetaMetricsName: PropTypes.string,
    onboardingInitiator: PropTypes.exact({
      location: PropTypes.string,
      tabId: PropTypes.number,
    }),
  }

  onComplete = async () => {
    const { history, completeOnboarding, completionMetaMetricsName, onboardingInitiator } = this.props

    await completeOnboarding()
    this.context.metricsEvent({
      eventOpts: {
        category: 'Onboarding',
        action: 'Onboarding Complete',
        name: completionMetaMetricsName,
      },
    })

    if (onboardingInitiator) {
      await returnToOnboardingInitiator(onboardingInitiator)
    }
    history.push(DEFAULT_ROUTE)
  }

  render () {
    const { t } = this.context
    const { onboardingInitiator } = this.props

    return (
      <div className="end-of-flow" style={{width: "700px", marginLeft: "auto", marginRight: "auto"}}>
        <img 
            style={ { width: '120px', height: '120px' } }
            src = "images/logo/0cf-mascot-replacement.svg"
        />
        <div className="first-time-flow__header">
               Welcome to 0confirmation
        </div>
        <div className="first-time-flow__text-block end-of-flow__text-1">
           0confirmation allows you to liquidate btc with minimal slippage 
        </div>
        <div className="first-time-flow__text-block end-of-flow__text-1">
          on the Ethereum protocol  in as little as 20 seconds 
        </div>
        <div className="first-time-flow__text-block end-of-flow__text-1">
          using a borrow proxy contract
        </div>
        <Button
          type="default"
          className="first-time-flow__button"
          onClick={this.onComplete}
        >
          Get Started
        </Button>
        {
          onboardingInitiator ? (
            <Snackbar
              content={t('onboardingReturnNotice', [t('endOfFlowMessage10'), onboardingInitiator.location])}
            />
          ) : null
        }
      </div>
    )
  }
}
