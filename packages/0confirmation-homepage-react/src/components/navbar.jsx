import React from 'react';
import { Navbar, Nav, NavLink, NavItem, NavbarBrand, NavbarToggler } from 'reactstrap';
import '../App.css';
import { IoIosMenu } from 'react-icons/io';
import Drawer from '@material-ui/core/Drawer';
export default class Navigation extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isopen: false,
			isScroll: false,
			position: null
		};

		// this.initchecking = this.checking.bind(this);
		this.checking = this.checking.bind(this);
	}
	async checking() {
		if (window.pageYOffset === 0) {
			await this.setState({ isScroll: false });
		} else {
			await this.setState({ isScroll: true });
		}
	}

	async componentDidMount() {
		var baseurl = window.location.pathname.split('/')[1];
		var id = window.location.pathname.split('/')[2];
		if (baseurl === 'trade') {
			await this.setState({ position: id });
		}
		// this.initchecking()
		window.addEventListener('scroll', this.checking);
	}

	componentWillUnmount() {
		window.removeEventListener('scroll', this.checking);
	}
	render() {
		return (
			<>
				<div>
					{this.props.ismobile ? (
						<Navbar
							style={{ border: '1px solid #008F11', borderRadius: '10px' }}
							fixed="top"
							className={
								this.state.isScroll ? 'px-5 py-3 shadow-sm bgs mx-5 my-3' : 'px-5 py-3 bgs mx-5 my-3'
							}
						>
							<NavbarBrand href="/">
								<img src={require('../images/ZeroDAO-logo-notext.svg')} alt="zeroDAO" />
							</NavbarBrand>
							<NavLink
								className="ml-auto"
								onClick={async e => {
									e.preventDefault();
									await this.setState({ isopen: !this.state.isopen });
								}}
							>
								<IoIosMenu size={25} color="#ffffff" />
							</NavLink>
							<Drawer
								anchor="right"
								open={this.state.isopen}
								onOpen={async () => {
									await this.setState({ isopen: true });
								}}
								onClose={async () => await this.setState({ isopen: false })}
							>
								<div
									style={{ width: '250px' }}
									className="justify-content-start bgs min-vh-100 py-5"
									role="presentation"
									onClick={async () => {
										await this.setState({ isopen: false });
									}}
									onKeyDown={async () => {
										await this.setState({ isopen: false });
									}}
								>
									<Nav vertical className="d-flex align-content-center">
										<NavItem>
											<button
												className="main-0cf-button w-100 mb-3"
												onClick={() => {
													window.open('https://mainnet.0confirmation.com/trade/swap');
												}}
											>
												Swap
											</button>
										</NavItem>
										<NavItem>
											<button
												className="main-0cf-button w-100 my-3"
												onClick={() => {
													window.open('https://mainnet.0confirmation.com/trade/earn');
												}}
											>
												Earn
											</button>
										</NavItem>
										<NavItem>
											<button
												className="main-0cf-button w-100 my-3"
												onClick={() => {
													window.open('https://docs.0confirmation.com/');
												}}
											>
												Docs
											</button>
										</NavItem>
									</Nav>
								</div>
							</Drawer>
						</Navbar>
					) : (
						<Navbar
							style={{ border: '1px solid #008F11', borderRadius: '10px' }}
							fixed="top"
							className={
								this.state.isScroll ? 'px-5 py-3 shadow-sm bgs mx-5 my-3' : 'px-5 py-3 bgs mx-5 my-3'
							}
						>
							<NavbarBrand href="/">
								<img src={require('../images/ZeroDAO-logo-notext.svg')} alt="zeroDAO" />
							</NavbarBrand>
							<NavbarToggler onClick={async () => await this.setState({ isopen: !this.state.isopen })} />
							<Nav className="ml-auto">
								<NavItem style={{ marginRight: '1em' }}>
									<button
										className="nav-0cf-button"
										onClick={() => {
											window.open('https://mainnet.0confirmation.com/trade/swap');
										}}
									>
										Swap
									</button>
								</NavItem>
								<NavItem style={{ marginRight: '1em' }}>
									<button
										className="nav-0cf-button"
										onClick={() => {
											window.open('https://mainnet.0confirmation.com/trade/earn');
										}}
									>
										Earn
									</button>
								</NavItem>
								<NavItem>
									<button
										className="nav-0cf-button"
										onClick={() => {
											window.open('https://docs.0confirmation.com/');
										}}
									>
										Docs
									</button>
								</NavItem>
							</Nav>
						</Navbar>
					)}
				</div>
			</>
		);
	}
}
