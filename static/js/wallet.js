class Wallet extends React.Component {
    getParamWallet = "";

    constructor() {
        super();
        const searchParams = new URLSearchParams(window.location.search.substr(1));
        if (searchParams.get("wallet")) {
            this.getParamWallet = searchParams.get("wallet");
        }
        let localWallet = this.getParamWallet || localStorage.getItem("wallet");
        if (localWallet) {
            this.state = {wallet: localWallet};
        } else {
            this.state = {wallet: ""};
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        if (this.getParamWallet) {
            this.retrieve();
        }
    }

    handleChange(event) {
        this.setState({ wallet: event.target.value });
        if (!this.getParamWallet) {
            localStorage.setItem("wallet", event.target.value);
        }
    }

    async handleSubmit(event) {
        // commented out to allow page redirect for url with 'wallet' GET param
        // event.preventDefault();
        // await this.retrieve();
    }

    async retrieve() {
        let pricingPromise = fetch(`/pricing`);
        let pegaPromise = fetch(`/my-pegas?wallet=${this.state.wallet}`);
        let currencyPromise = fetch(`/my-currency?wallet=${this.state.wallet}`);

        let pricing = await (await pricingPromise).json();
        console.log("pricing:", pricing);

        let pegaData = await (await pegaPromise).json();
        console.log("got my pegas for " + this.state.wallet);

        let currencyData = await (await currencyPromise).json();
        console.log(currencyData);

        pegaData.forEach(p => {
            p.breedString = p.isBreedable ? `Now (${new Date(p.breedable * 1000).toLocaleString()})` : `Can breed ${new Date(p.breedable * 1000).toLocaleString()}`;
        })

        ReactDOM.render(<PegaStats pegas={pegaData} vis={currencyData.vis} usdt={currencyData.usdt}
                                   pricing={pricing}/>, $("#pegaStats")[0]);
        ReactDOM.render(<Outlook pegas={pegaData} pricing={pricing}/>, $("#pegaOutlook")[0]);
        ReactDOM.render(<PegaTable pegas={pegaData} pricing={pricing}/>, $("#pegaTable")[0]);
    }

    render() {
        return (
            <form className="ui labeled action input" onSubmit={this.handleSubmit}>
                <div className="ui label">Polygon Wallet:</div>
                <input id="wallet" name="wallet" className="ui input" style={{"width": "350px"}} onChange={this.handleChange} value={this.state.wallet}/>
                <button className="ui teal button" type="submit">Retrieve</button>
            </form>
        );
    }
}