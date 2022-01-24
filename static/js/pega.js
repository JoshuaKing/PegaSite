class Pega extends React.Component {
    render() {
        let colourClass = this.props.pega.gender === "Male" ? "blue" : "pink";
        let cardClasses = `ui ${colourClass} card`;
        let ribbonClasses = `ui small ${colourClass} left ribbon label`;
        let breedClasses = `heart ${this.props.pega.isBreedable ? '' : 'outline'} icon`;
        let energy = this.props.pega.energy;
        let energyClasses = energy === 25 ? "red" : energy >= 20 ? "orange" : energy >= 12 ? "yellow" : energy >= 4 ? "olive" : "green"
        energyClasses = `ui ${energyClasses} label`;

        let renterIcon = "ui user circle outline icon";
        if (this.props.pega.renterAddress) {
            renterIcon = "ui user circle icon";
            if (!this.props.pega.lastRenterIsDirect) {
                renterIcon = "ui users icon";
            }
        }
        let renterDom = <i className={renterIcon}/>

        return (
            <div className={cardClasses}>
                <div className="ui content">
                    <a className={ribbonClasses}>{this.props.pega.breedCount} / 7</a>
                    <span><i className="horse head icon"/> #{this.props.pega.id} {this.props.pega.name}</span>
                    <p><i className={breedClasses}/> {this.props.pega.breedString}</p>
                    <a className={energyClasses}><i className="ui bolt icon"/>{energy} {renterDom}</a>
                </div>
            </div>
        );
    }
}

class Pegas extends React.Component {
    render() {
        return (
            this.props.pegas.map(p => <Pega key={p.id} pega={p}/>)
        );
    }
}