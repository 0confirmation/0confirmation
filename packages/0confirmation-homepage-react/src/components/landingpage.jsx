import React from 'react';
import { Row, Card, CardBody, Col, Tooltip } from 'reactstrap';
import '../App.css';
import { FaTelegramPlane, FaMedium, FaTwitter } from 'react-icons/fa';

export default class LandingPage extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			tooltip1: false,
			tooltip2: false,
			tooltip3: false,
			tooltip4: false,
			sfTooltip: false
		};
	}
	render() {
		document.body.className += ' App';
		return (
			<>
				<div className="justify-content-center align-content-center overflow-hidden">
					<Row
						className={
							this.props.ismobile
								? 'justify-content-center align-content-center px-3 mt-5'
								: 'justify-content-center align-content-center landing mt-3 pb-5 px-3'
						}
					>
						<Col
							lg="10"
							md="12"
							sm="12"
							className="justify-content-center mx-auto align-content-center mt-4 pt-5 pb-5"
						>
							<Row>
								<Card className="mt-5 py-5 d-flex hero-card">
									<CardBody className="">
										<div className="d-flex flex-row flex-wrap px-4 justify-content-center align-items-center">
											<div className="flex-column d-flex" style={{ flexBasis: '40%' }}>
												<img
													className="img-fluid"
													src={require('../images/0cflogo.svg')}
													alt="0CF"
												/>
												<p className="card-hero-text text-center">
													Interoperability, Optimized
												</p>
											</div>
											<div
												className="flex-column d-flex flex-wrap"
												style={{ flexBasis: '60%', alignContent: 'center' }}
											>
												<div
													className="d-flex flex-row space-even-row flex-wrap just-center-0cf"
													style={{ maxWidth: '760px' }}
												>
													<div className="d-flex flex-column flex-wrap thirds px-md">
														<img
															className="img-fluid pb-4"
															src={require('../images/speed.svg')}
															alt="Smart Finality"
														/>
														<p className="card-header-text small-margin">Smart Finality</p>
														<p className="card-sub-text small-margin">
															Bitcoin on Ethereum in 2 confirmations or less. Your assets,
															when you want them.
														</p>
														<Tooltip
															placement="left"
															isOpen={this.state.sfTooltip}
															target="sf-bridge"
															toggle={async e =>
																await this.setState({
																	sfTooltip: !this.state.sfTooltip
																})
															}
														>
															Coming Soon!
														</Tooltip>
														<button id="sf-bridge" className="main-0cf-button">
															Smart Finality
														</button>
													</div>
													<div className="d-flex flex-column flex-wrap thirds px-md">
														<img
															className="img-fluid pb-4"
															src={require('../images/noslippage.svg')}
															alt="Swap"
														/>
														<p className="card-header-text small-margin">Swap</p>
														<p className="card-sub-text small-margin">
															DEX trading directly with Bitcoin. Trade at the price you
															see now, not in an hour.
														</p>
														<button
															className="main-0cf-button"
															onClick={() => {
																window.open(
																	'https://mainnet.0confirmation.com/trade/swap'
																);
															}}
														>
															Zero Swap
														</button>
													</div>
													<div className="d-flex flex-column flex-wrap thirds px-md">
														<img
															className="img-fluid pb-4"
															src={require('../images/income.svg')}
															alt="Earn"
														/>
														<p className="card-header-text small-margin">Earn</p>
														<p className="card-sub-text small-margin">
															Add liquidity to the Zero Swap pool. Earn income from Zero
															"confirmation as a service" fees.
														</p>
														<button
															className="main-0cf-button"
															onClick={() => {
																window.open(
																	'https://mainnet.0confirmation.com/trade/earn'
																);
															}}
														>
															Zero Swap Earn
														</button>
													</div>
													<div className="d-flex flex-column flex-wrap thirds justify-content-center px-md">
														<p className="card-header-text">Integrate</p>
														<button
															className="main-0cf-button"
															onClick={() => {
																window.open(
																	'https://github.com/0confirmation/0confirmation/tree/master/packages/0confirmation-sdk'
																);
															}}
														>
															SDK
														</button>
													</div>
													<div className="d-flex flex-column flex-wrap thirds justify-content-center px-md">
														<p className="card-header-text">Learn</p>
														<button
															className="main-0cf-button"
															onClick={() => {
																window.open('https://docs.0confirmation.com/');
															}}
														>
															Docs
														</button>
													</div>
													<div className="d-flex flex-column flex-wrap thirds justify-content-center px-md">
														<p className="card-header-text">Contact</p>
														<Row className=" justify-content-center">
															<FaMedium
																size={25}
																style={{ cursor: 'pointer' }}
																onClick={() => {
																	window.open('https://medium.com/0confirmation');
																}}
																color="#008F11"
																className="mr-2"
															/>
															{/* <FaRedditAlien size={25} style={{cursor:"pointer"}} onClick={()=>{ window.open("https://www.reddit.com/r/RenProject");}} color="#008F11" className="mr-2"/> */}
															<FaTelegramPlane
																size={25}
																style={{ cursor: 'pointer' }}
																onClick={() => {
																	window.open('https://t.me/zeroconfirmation');
																}}
																color="#008F11"
																className="mr-2"
															/>
															<FaTwitter
																size={25}
																style={{ cursor: 'pointer' }}
																onClick={() => {
																	window.open('https://twitter.com/0confirmation');
																}}
																color="#008F11"
																className="mr-2"
															/>
														</Row>
													</div>
												</div>
											</div>
										</div>
									</CardBody>
								</Card>
							</Row>
						</Col>
						<Col
							lg="12"
							md="12"
							sm="12"
							className="justify-content-center align-content-center text-center pt-5"
						>
							<Row className="justify-content-center align-content-center text-center py-4 mt-4">
								<Col
									lg="8"
									md="10"
									sm="10"
									className="py-5 text-light mx-3"
									style={{
										backgroundColor: '#0D0208',
										border: '1px solid #008F11',
										fontFamily: 'PT Sans',
										borderRadius: '20px'
									}}
								>
									<p>
										<h4>Integrated Modules</h4>
									</p>
									<Row>
										<Col lg="12" md="12" sm="12" className="my-3">
											<img
												className="img-fluid"
												alt="UNISWAP"
												width="250em"
												src={require('../images/uniswap.svg')}
											/>
										</Col>
										<Col lg="4" md="4" sm="4" className="mx-auto mt-5">
											<button
												className="main-0cf-button"
												onClick={() => {
													window.open(
														'https://github.com/0confirmation/0confirmation/tree/master/packages/0confirmation-sdk'
													);
												}}
											>
												Integrate Zero
											</button>
										</Col>
									</Row>
								</Col>
							</Row>
						</Col>
						<Col lg="12" md="12" sm="12">
							<Row className="justify-content-center align-content-center text-center py-5 px-3 text-light">
								<Col
									lg="12"
									md="12"
									sm="12"
									className="justify-content-center align-content-center text-center"
								>
									<Row className="justify-content-center align-content-center text-center py-4">
										<Col
											lg="2"
											md="12"
											sm="12"
											className="align-content-center justify-content-center mx-3 my-2"
										>
											<Row className="justify-content-center align-content-center mx-auto">
												<Card
													className="card-shadow py-4"
													style={{
														backgroundColor: '#0D0208',
														minWidth: '14em',
														border: '1px solid #008F11',
														fontFamily: 'PT Sans',
														borderRadius: '20px'
													}}
												>
													<CardBody>
														<Row className="justify-content-center align-content-center">
															<Col
																lg="14"
																md="14"
																sm="14"
																className="justify-content-center align-content-center"
															>
																<Row className="justify-content-center align-content-center">
																	<Col
																		lg="14"
																		md="14"
																		sm="14"
																		className="text-center"
																	>
																		<p className="header-text">
																			Total Liquidity
																			<span>
																				<i id="liquidity">
																					<img
																						alt="i"
																						width="12px"
																						className="img-fluid mb-3 ml-2"
																						src={require('../images/info.svg')}
																					/>
																				</i>
																				<Tooltip
																					placement="top"
																					isOpen={this.state.tooltip1}
																					target="liquidity"
																					toggle={async e =>
																						await this.setState({
																							tooltip1: !this.state
																								.tooltip1
																						})
																					}
																				>
																					Total liquidity available in the
																					Zero Swap renBTC Pool
																				</Tooltip>
																			</span>
																		</p>
																	</Col>
																</Row>
																<Col lg="14" md="14" sm="14">
																	<b className="pb-3 sub-header-text">COMING SOON</b>
																</Col>
															</Col>
														</Row>
													</CardBody>
												</Card>
											</Row>
										</Col>
										<Col
											lg="2"
											mm="12"
											sm="12"
											className="align-content-center justify-content-center mx-3 my-2"
										>
											<Row className="justify-content-center align-content-center mx-auto">
												<Card
													className="card-shadow py-4"
													style={{
														minWidth: '14em',
														backgroundColor: '#0D0208',
														border: '1px solid #008F11',
														fontFamily: 'PT Sans',
														borderRadius: '20px'
													}}
												>
													<CardBody>
														<Row className="justify-content-center align-content-center">
															<Col
																lg="14"
																md="14"
																sm="14"
																className="justify-content-center align-content-center"
															>
																<Row className="justify-content-center align-content-center">
																	<Col
																		lg="14"
																		md="14"
																		sm="14"
																		className="text-center"
																	>
																		<p className="header-text">
																			Bitcoin On Loan
																			<span>
																				<i id="loan">
																					<img
																						alt="i"
																						width="12px"
																						className="img-fluid mb-3 ml-2"
																						src={require('../images/info.svg')}
																					/>
																				</i>
																				<Tooltip
																					placement="top"
																					isOpen={this.state.tooltip2}
																					target="loan"
																					toggle={async e =>
																						await this.setState({
																							tooltip2: !this.state
																								.tooltip2
																						})
																					}
																				>
																					Amount of renBTC loaned to users for
																					use in the Zero Swap system.
																				</Tooltip>
																			</span>
																		</p>
																	</Col>
																</Row>
																<Col lg="14" md="14" sm="14">
																	<b className="pb-3 sub-header-text">COMING SOON</b>
																</Col>
															</Col>
														</Row>
													</CardBody>
												</Card>
											</Row>
										</Col>
										<Col
											lg="2"
											mm="12"
											sm="12"
											className="align-content-center justify-content-center mx-3 my-2"
										>
											<Row className="justify-content-center align-content-center mx-auto">
												<Card
													className="card-shadow py-4"
													style={{
														minWidth: '14em',
														backgroundColor: '#0D0208',
														border: '1px solid #008F11',
														fontFamily: 'PT Sans',
														borderRadius: '20px'
													}}
												>
													<CardBody>
														<Row className="justify-content-center align-content-center">
															<Col
																lg="14"
																md="14"
																sm="14"
																className="justify-content-center align-content-center"
															>
																<Row className="justify-content-center align-content-center">
																	<Col
																		lg="14"
																		md="14"
																		sm="14"
																		className="text-center"
																	>
																		<p className="header-text">
																			Idle Bitcoin
																			<span>
																				<i id="idle-btc">
																					<img
																						alt="i"
																						width="12px"
																						className="img-fluid mb-3 ml-2"
																						src={require('../images/info.svg')}
																					/>
																				</i>
																				<Tooltip
																					placement="top"
																					isOpen={this.state.tooltip3}
																					target="idle-btc"
																					toggle={async e =>
																						await this.setState({
																							tooltip3: !this.state
																								.tooltip3
																						})
																					}
																				>
																					Amount of renBTC available to be
																					used for loans in the Zero Swap
																					system.
																				</Tooltip>
																			</span>
																		</p>
																	</Col>
																</Row>
																<Col lg="14" md="14" sm="14">
																	<b className="pb-3 sub-header-text">COMING SOON</b>
																</Col>
															</Col>
														</Row>
													</CardBody>
												</Card>
											</Row>
										</Col>
										<Col
											lg="2"
											md="10"
											sm="10"
											className="align-content-center justify-content-center mx-3 my-2"
										>
											<Row className="justify-content-center align-content-center mx-auto">
												<Card
													className="card-shadow py-4"
													style={{
														minWidth: '14em',
														backgroundColor: '#0D0208',
														border: '1px solid #008F11',
														fontFamily: 'PT Sans',
														borderRadius: '20px'
													}}
												>
													<CardBody>
														<Row className="justify-content-center align-content-center">
															<Col
																lg="14"
																md="14"
																sm="14"
																className="justify-content-center align-content-center"
															>
																<Row className="justify-content-center align-content-center">
																	<Col
																		lg="14"
																		md="14"
																		sm="14"
																		className="text-center"
																	>
																		<p className="header-text">
																			Total Returns
																			<span>
																				<i id="returns">
																					<img
																						alt="i"
																						width="12px"
																						className="img-fluid mb-3 ml-2"
																						src={require('../images/info.svg')}
																					/>
																				</i>
																				<Tooltip
																					placement="top"
																					isOpen={this.state.tooltip4}
																					target="returns"
																					toggle={async e =>
																						await this.setState({
																							tooltip4: !this.state
																								.tooltip4
																						})
																					}
																				>
																					Total amount of yield generated by
																					the Zero Swap system.
																				</Tooltip>
																			</span>
																		</p>
																	</Col>
																</Row>
																<Col lg="14" md="14" sm="14">
																	<b className="pb-3 sub-header-text">COMING SOON</b>
																</Col>
															</Col>
														</Row>
													</CardBody>
												</Card>
											</Row>
										</Col>
									</Row>
								</Col>
							</Row>
						</Col>
						<div className="w-75">
							<div
								style={{
									backgroundColor: '#0D0208',
									border: '1px solid #008F11',
									borderRadius: '10px',
									paddingLeft: '1rem',
									paddingRight: '1rem'
								}}
								className="py-2"
							>
								<Row>
									<div style={{ paddingLeft: '20px', flex: '1' }}>
										<img
											style={{ width: '100px' }}
											alt="Powered By"
											src={require('../images/foot.svg')}
										/>
									</div>
									<div
										style={{
											paddingRight: '25px',
											alignSelf: 'center',
											display: 'flex',
											justifyContent: 'end'
										}}
									>
										<Row className="">
											<FaMedium
												size={25}
												style={{ cursor: 'pointer' }}
												onClick={() => {
													window.open('https://medium.com/0confirmation');
												}}
												color="#008F11"
												className="mr-2"
											/>
											{/* <FaRedditAlien size={25} style={{cursor:"pointer"}} onClick={()=>{ window.open("https://www.reddit.com/r/RenProject");}} color="#008F11" className="mr-2"/> */}
											<FaTelegramPlane
												size={25}
												style={{ cursor: 'pointer' }}
												onClick={() => {
													window.open('https://t.me/zeroconfirmation');
												}}
												color="#008F11"
												className="mr-2"
											/>
											<FaTwitter
												size={25}
												style={{ cursor: 'pointer' }}
												onClick={() => {
													window.open('https://twitter.com/0confirmation');
												}}
												color="#008F11"
												className="mr-2"
											/>
										</Row>
									</div>
								</Row>
								<Row>
									<div
										style={{
											paddingLeft: '22px',
											paddingTop: '0.2rem',
											color: 'white',
											fontSize: '.75rem'
										}}
									>
										Deployed by{' '}
										<a
											href="https://netlify.com/"
											target="_blank"
											style={{ color: '#008F11', textDecoration: 'none' }}
										>
											Netlify
										</a>
									</div>
								</Row>
							</div>
						</div>
					</Row>
				</div>
			</>
		);
	}
}
