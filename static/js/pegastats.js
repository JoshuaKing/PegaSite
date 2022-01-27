
class PegaStats extends React.Component {
    render() {
        const requirements = getRequirements(this.props.pegas, this.props.pricing);
        const vis = requirements.reduce((acc, r)=>acc+r.vis,0);
        const breedsRemaining = requirements.reduce((acc, r)=>acc+r.breeds.length,0);


        let pegasValue = this.props.pegas
            .map(p=> p.breedCount===0 ? this.props.pricing.unbredFloor : this.props.pricing.bredFloor)
            .reduce((acc,v)=>acc+v,0);
        let visValue = this.props.vis * this.props.pricing.visPrice;
        let usdtValue = this.props.usdt;
        let netWorth = pegasValue + visValue + usdtValue;
        console.log(`net worth: ${pegasValue}(Pega) + ${visValue}(VIS) + ${usdtValue}(USDT) = ${netWorth}`);


        return (
            <div>
                <div className="ui five statistics">
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
                        <div className="value">{breedsRemaining}</div>
                        <div className="label">More Breeds</div>
                    </div>
                    <div className="ui small statistic">
                        <div className="value">{Math.ceil(vis/1000)}k</div>
                        <div className="label">VIS Breed Cost</div>
                    </div>
                </div>
                <div className="ui hidden divider"/>
                <div className="ui five statistics">
                    <div className="ui small statistic">
                        <div className="value">${this.props.pricing.bredFloor}</div>
                        <div className="label">Bred Floor</div>
                    </div>
                    <div className="ui small statistic">
                        <div className="value">${this.props.pricing.unbredFloor}</div>
                        <div className="label">Unbred Floor</div>
                    </div>
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
                </div>
                <div className="ui hidden divider"/>
                <div className="ui one statistics">
                    <div className="ui large statistic">
                        <div className="value">${Math.round(netWorth/100)/10}k</div>
                        <div className="label">Net Worth</div>
                    </div>
                </div>
            </div>
        );
    }
}