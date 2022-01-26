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
    }

    handleChange(event) {
        this.setState({ wallet: event.target.value });
        if (!this.getParamWallet) {
            localStorage.setItem("wallet", event.target.value);
        }
    }

    async handleSubmit(event) {
        event.preventDefault()

        let pricingPromise = fetch(`/pricing`);
        let pegaPromise = fetch(`/my-pegas?wallet=${this.state.wallet}`);
        let currencyPromise = fetch(`/my-currency?wallet=${this.state.wallet}`);

        let pricing = await (await pricingPromise).json();
        console.log("pricing:", pricing);

        let pegaData = await (await pegaPromise).json();
        console.log("got my pegas for " + this.state.wallet);

        let currencyData = await (await currencyPromise).json();
        console.log(currencyData);

        let pegasValue = pegaData
            .map(p=> p.breedCount===0 ? pricing.unbredFloor : pricing.bredFloor)
            .reduce((acc,v)=>acc+v,0);
        let visValue = currencyData.vis * pricing.visPrice;
        let usdtValue = currencyData.usdt;
        let value = pegasValue + visValue + usdtValue;
        console.log(`value: ${pegasValue}(Pega) + ${visValue}(VIS) + ${usdtValue}(USDT) = ${value}`);

        ReactDOM.render(<PegaStats pegas={pegaData} vis={currencyData.vis} usdt={currencyData.usdt} pricing={pricing}/>, $("#pegaStats")[0]);
        ReactDOM.render(<Outlook pegas={pegaData} pricing={pricing}/>, $("#pegaOutlook")[0]);
        ReactDOM.render(<PegaTable pegas={pegaData} pricing={pricing}/>, $("#pegaTable")[0]);
        // ReactDOM.render(<Pegas pegas={pegaData.filter(p=>p.gender==="Male")}/>, $("#males")[0]);
        // ReactDOM.render(<Pegas pegas={pegaData.filter(p=>p.gender==="Female")}/>, $("#females")[0]);
    }

    render() {
        return (
            <form className="ui labeled action input" onSubmit={this.handleSubmit}>
                <div className="ui label">Polygon Wallet:</div>
                <input id="wallet" className="ui input" style={{"width": "350px"}} onChange={this.handleChange} value={this.state.wallet}/>
                <button className="ui teal button" type="submit">Retrieve</button>
            </form>
        );
    }
}