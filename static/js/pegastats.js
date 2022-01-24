
class PegaStats extends React.Component {
    render() {
        const requirements = getRequirements(this.props.pegas, this.props.pricing);
        const vis = requirements.reduce((acc, r)=>acc+r.vis,0);
        const breedsRemaining = requirements.reduce((acc, r)=>acc+r.breeds.length,0);


        let pegasValue = this.props.pegas
            .map(p=> p.breedCount===0 ? this.props.pricing.unbredFloor : this.props.pricing.bredFloor)
            .reduce((acc,v)=>acc+v,0);
        let visValue = this.props.vis * this.props.pricing.visPrice;
        let netWorth = pegasValue + visValue;
        console.log(`net worth: ${pegasValue} + ${visValue} = ${netWorth}`);


        return (
            <div className="ui six statistics">
                <div className="ui small statistic">
                    <div className="value">{this.props.pegas.length}</div>
                    <div className="label">Pegas</div>
                </div>
                <div className="ui small statistic">
                    <div className="value">{this.props.pegas.filter(p=>p.gender==="Male").length}</div>
                    <div className="label">Males</div>
                </div>
                <div className="ui small statistic">
                    <div className="value">{this.props.pegas.filter(p=>p.gender==="Female").length}</div>
                    <div className="label">Females</div>
                </div>
                <div className="ui small statistic">
                    <div className="value">{breedsRemaining}</div>
                    <div className="label">More Breeds</div>
                </div>
                <div className="ui small statistic">
                    <div className="value">{Math.ceil(vis/1000)}k</div>
                    <div className="label">VIS Breed Cost</div>
                </div>
                <div className="ui small statistic">
                    <div className="value">${Math.round(netWorth/100)/10}k</div>
                    <div className="label">Net Worth</div>
                </div>
            </div>
        );
    }
}