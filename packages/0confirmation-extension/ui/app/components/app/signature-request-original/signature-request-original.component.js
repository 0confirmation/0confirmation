import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ethUtil from 'ethereumjs-util'
import classnames from 'classnames'
import { ObjectInspector } from 'react-inspector'

import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../../app/scripts/lib/enums'
import { getEnvironmentType } from '../../../../../app/scripts/lib/util'
import Identicon from '../../ui/identicon'
import AccountListItem from '../../../pages/send/account-list-item/account-list-item.component'
import { conversionUtil } from '../../../helpers/utils/conversion-util'
import Button from '../../ui/button'
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes'

export default class SignatureRequestOriginal extends Component {
  static contextTypes = {
    t: PropTypes.func.isRequired,
    metricsEvent: PropTypes.func.isRequired,
  }

  static propTypes = {
    fromAccount: PropTypes.shape({
      address: PropTypes.string.isRequired,
      balance: PropTypes.string,
      name: PropTypes.string,
    }).isRequired,
    cancel: PropTypes.func.isRequired,
    clearConfirmTransaction: PropTypes.func.isRequired,
    conversionRate: PropTypes.number,
    history: PropTypes.object.isRequired,
    requesterAddress: PropTypes.string,
    sign: PropTypes.func.isRequired,
    txData: PropTypes.object.isRequired,
  }

  state = {
    fromAccount: this.props.fromAccount,
  }

  componentDidMount = () => {
    if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION) {
      window.addEventListener('beforeunload', this._beforeUnload)
    }
  }

  componentWillUnmount = () => {
    this._removeBeforeUnload()
  }

  _beforeUnload = (event) => {
    const { clearConfirmTransaction, cancel } = this.props
    const { metricsEvent } = this.context
    metricsEvent({
      eventOpts: {
        category: 'Transactions',
        action: 'Sign Request',
        name: 'Cancel Sig Request Via Notification Close',
      },
    })
    clearConfirmTransaction()
    cancel(event)
  }

  _removeBeforeUnload = () => {
    if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION) {
      window.removeEventListener('beforeunload', this._beforeUnload)
    }
  }

  renderHeader = () => {
    return (
      <div className="request-signature__header">
        <div className="request-signature__header-background" />

        <div className="request-signature__header__text">
          { this.context.t('sigRequest') }
        </div>

        <div className="request-signature__header__tip-container">
          <div className="request-signature__header__tip" />
        </div>
      </div>
    )
  }

  renderAccount = () => {
    const { fromAccount } = this.state

    return (
      <div className="request-signature__account">
        <div className="request-signature__account-text">
          { `${this.context.t('account')}:` }
        </div>

        <div className="request-signature__account-item">
          <AccountListItem
            account={fromAccount}
            displayBalance={false}
          />
        </div>
      </div>
    )
  }

  renderBalance = () => {
    const { conversionRate } = this.props
    const { fromAccount: { balance } } = this.state

    const balanceInEther = conversionUtil(balance, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      fromDenomination: 'WEI',
      numberOfDecimals: 6,
      conversionRate,
    })

    return (
      <div className="request-signature__balance">
        <div className="request-signature__balance-text">
          { `${this.context.t('balance')}:` }
        </div>
        <div className="request-signature__balance-value">
          { `${balanceInEther} ETH` }
        </div>
      </div>
    )
  }

  renderRequestIcon = () => {
    const { requesterAddress } = this.props

    return (
      <div className="request-signature__request-icon">
        <Identicon
          diameter={40}
          address={requesterAddress}
        />
      </div>
    )
  }

  renderAccountInfo = () => {
    return (
      <div className="request-signature__account-info">
        { this.renderAccount() }
        { this.renderRequestIcon() }
        { this.renderBalance() }
      </div>
    )
  }

  renderRequestInfo = () => {
    return (
      <div className="request-signature__request-info">
        <div className="request-signature__headline">
          { this.context.t('yourSigRequested') }
        </div>
      </div>
    )
  }

  msgHexToText = (hex) => {
    try {
      const stripped = ethUtil.stripHexPrefix(hex)
      const buff = Buffer.from(stripped, 'hex')
      return buff.length === 32 ? hex : buff.toString('utf8')
    } catch (e) {
      return hex
    }
  }

  renderTypedData = (data) => {
    const { domain, message } = JSON.parse(data)
    return (
      <div className="request-signature__typed-container">
        {
          domain
            ? (
              <div>
                <h1>
                  Domain
                </h1>
                <ObjectInspector data={domain} expandLevel={1} name="domain" />
              </div>
            )
            : ''
        }
        {
          message
            ? (
              <div>
                <h1>
                  Message
                </h1>
                <ObjectInspector data={message} expandLevel={1} name="message" />
              </div>
            )
            : ''
        }
      </div>
    )
  }

  renderBody = () => {
    let rows
    let notice = `${this.context.t('youSign')}:`

    const { txData } = this.props
    const { type, msgParams: { data } } = txData

    if (type === 'personal_sign') {
      rows = [{ name: this.context.t('message'), value: this.msgHexToText(data) }]
    } else if (type === 'eth_signTypedData') {
      rows = data
    } else if (type === 'eth_sign') {
      rows = [{ name: this.context.t('message'), value: data }]
      notice = this.context.t('signNotice')
    }

    return (
      <div className="request-signature__body">
        { this.renderAccountInfo() }
        { this.renderRequestInfo() }
        <div
          className={classnames('request-signature__notice', {
            'request-signature__warning': type === 'eth_sign',
          })}
        >
          { notice }
          {
            type === 'eth_sign'
              ? (
                <span
                  className="request-signature__help-link"
                  onClick={() => {
                    global.platform.openWindow({
                      url: 'https://metamask.zendesk.com/hc/en-us/articles/360015488751',
                    })
                  }}
                >
                  { this.context.t('learnMore') }
                </span>
              )
              : null
          }
        </div>
        <div className="request-signature__rows">
          {
            rows.map(({ name, value }, index) => {
              if (typeof value === 'boolean') {
                value = value.toString()
              }
              return (
                <div className="request-signature__row" key={`request-signature-row-${index}`}>
                  <div className="request-signature__row-title">
                    { `${name}:` }
                  </div>
                  <div className="request-signature__row-value">
                    { value }
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>
    )
  }

  renderFooter = () => {
    const { cancel, sign } = this.props

    return (
      <div className="request-signature__footer">
        <Button
          type="default"
          large
          className="request-signature__footer__cancel-button"
          onClick={async (event) => {
            this._removeBeforeUnload()
            await cancel(event)
            this.context.metricsEvent({
              eventOpts: {
                category: 'Transactions',
                action: 'Sign Request',
                name: 'Cancel',
              },
            })
            this.props.clearConfirmTransaction()
            this.props.history.push(DEFAULT_ROUTE)
          }}
        >
          { this.context.t('cancel') }
        </Button>
        <Button
          type="secondary"
          large
          className="request-signature__footer__sign-button"
          onClick={async (event) => {
            this._removeBeforeUnload()
            await sign(event)
            this.context.metricsEvent({
              eventOpts: {
                category: 'Transactions',
                action: 'Sign Request',
                name: 'Confirm',
              },
            })
            this.props.clearConfirmTransaction()
            this.props.history.push(DEFAULT_ROUTE)
          }}
        >
          { this.context.t('sign') }
        </Button>
      </div>
    )
  }

  render = () => {
    return (
      <div className="request-signature__container">
        { this.renderHeader() }
        { this.renderBody() }
        { this.renderFooter() }
      </div>
    )
  }
}
