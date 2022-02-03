
class PegaStats extends React.Component {
    render() {
        const pricing = this.props.pricing;
        const currency = this.props.currency;

        const requirements = getRequirements(this.props.pegas, pricing);
        const breedVis = requirements.reduce((acc, r)=>acc+r.vis,0);

        let pegasValue = this.props.pegas
            .map(p=> p.breedCount===0 ? pricing.unbredFloor : pricing.bredFloor)
            .reduce((acc,v)=>acc+v,0);
        let visValue = currency.vis * pricing.visPrice;
        let usdtValue = currency.usdt;
        let pgxValue = currency.pgx * pricing.pgxPrice;
        let netWorth = pegasValue + visValue + pgxValue + usdtValue;
        console.log(`net worth: ${pegasValue}(Pega) + ${visValue}(VIS) + ${pgxValue}(PGX) + ${usdtValue}(USDT) = ${netWorth}`);


        return (
            <div>
                <div className="ui six statistics">
                    <div className="ui small statistic">
                        <div className="value">{this.props.pegas.length}</div>
                        <div className="label">Pegas</div>
                    </div>
                    <div className="ui small statistic">
                        <div className="value">{this.props.pegas.filter(p=> p.breedCount>0).length}</div>
                        <div className="label">Bred Pegas</div>
                    </div>
                    <div className="ui small statistic">
                        <div className="value">{this.props.pegas.filter(p=> p.breedCount===0).length}</div>
                        <div className="label">Unbred Pegas</div>
                    </div>
                    <div className="ui small statistic">
                        <div className="value">{Math.ceil(breedVis/1000)}k</div>
                        <div className="label">VIS Breed Cost</div>
                    </div>
                    <div className="ui small statistic">
                        <div className="value">${Math.round(pricing.bredFloor)}</div>
                        <div className="label">Bred Floor</div>
                    </div>
                    <div className="ui small statistic">
                        <div className="value">${Math.round(pricing.unbredFloor)}</div>
                        <div className="label">Unbred Floor</div>
                    </div>
                </div>
                <div className="ui hidden divider"/>
                <div className="ui six statistics">
                    <div className="ui small statistic">
                        <div className="value">${Math.round(pegasValue/100)/10}k</div>
                        <div className="label">Pega Value</div>
                    </div>
                    <div className="ui small statistic">
                        <div className="value">${Math.round(visValue/100)/10}k</div>
                        <div className="label">VIS Value</div>
                    </div>
                    <div className="ui small statistic">
                        <div className="value">${Math.round(usdtValue/100)/10}k</div>
                        <div className="label">USDT</div>
                    </div>
                    <div className="ui small statistic">
                        <div className="value">${Math.round(pgxValue/100)/10}k</div>
                        <div className="label">PGX Value</div>
                    </div>
                    <div className="ui small statistic">
                        <div className="value">=</div>
                    </div>
                    <div className="ui small statistic">
                        <div className="value">${Math.round(netWorth/100)/10}k</div>
                        <div className="label">Net Worth</div>
                    </div>
                </div>
            </div>
        );
    }
}