class Wallet extends React.Component {
    constructor() {
        super();
        let localWallet = localStorage.getItem("wallet");
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
        localStorage.setItem("wallet", event.target.value);
    }

    async handleSubmit(event) {
        event.preventDefault()

        let pricingPromise = fetch(`/pricing`);
        let pegaPromise = fetch(`/my-pegas?wallet=${this.state.wallet}`);
        let visPromise = fetch(`/my-vis?wallet=${this.state.wallet}`);

        let pricing = await (await pricingPromise).json();
        console.log("pricing:", pricing);

        let pegaData = await (await pegaPromise).json();
        console.log("got my pegas for " + this.state.wallet);

        let visData = await (await visPromise).json();
        console.log(visData);

        let pegasValue = pegaData
            .map(p=> p.breedCount===0 ? pricing.unbredFloor : pricing.bredFloor)
            .reduce((acc,v)=>acc+v,0);
        let visValue = visData.vis * pricing.visPrice;
        let value = pegasValue + visValue;
        console.log(`value: ${pegasValue} + ${visValue} = ${value}`);

        ReactDOM.render(<PegaStats pegas={pegaData} vis={visData.vis} pricing={pricing}/>, $("#pegaStats")[0]);
        ReactDOM.render(<Outlook pegas={pegaData} pricing={pricing}/>, $("#pegaOutlook")[0]);
        ReactDOM.render(<Pegas pegas={pegaData.filter(p=>p.gender==="Male")}/>, $("#males")[0]);
        ReactDOM.render(<Pegas pegas={pegaData.filter(p=>p.gender==="Female")}/>, $("#females")[0]);
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