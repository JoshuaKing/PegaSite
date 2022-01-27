class OutlookBreed extends React.Component {
    render() {
        return (
            <div className="ui item">
                <div className="ui content">
                    <span className="ui small text">
                        <a href={`https://https://play.pegaxy.io/my-assets/pega/${this.props.breed.sire.id}`}>{this.props.breed.sire.id}</a>
                        <i className="ui heart outline icon"/>
                        <a href={`https://https://play.pegaxy.io/my-assets/pega/${this.props.breed.matron.id}`}>{this.props.breed.matron.id}</a>
                    </span>
                </div>
            </div>
        )
    }
}

class OutlookBreeds extends React.Component {
    render() {
        let content = this.props.breeds.map(b => <OutlookBreed breed={b}/>);
        return (
            <div className="ui list">
                {content}
            </div>
        )
    }
}

class OutlookDate extends React.Component {
    numberWithCommas(x) {
        return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
    }

    render() {
        return (
            <div className="ui four wide column">
                <div className="ui tiny header">{this.props.date}
                    <div className="ui tiny label">{this.numberWithCommas(this.props.vis/1000)}k<span className="ui detail">VIS</span></div>
                    <div className="ui tiny label">{this.props.breeds.length}<span className="ui detail">Breeds</span></div>
                </div>
                <OutlookBreeds breeds={this.props.breeds}/>
            </div>
        )
    }
}

class Outlook extends React.Component {
    render() {
        let requirements = getRequirements(this.props.pegas, this.props.pricing).slice(0, 8);

        let outlookDates = requirements.map(r => <OutlookDate key={r.date} date={r.date} vis={r.vis} breeds={r.breeds}/>);
        return outlookDates;
    }
}