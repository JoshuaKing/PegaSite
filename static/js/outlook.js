class OutlookBreed extends React.Component {
    render() {
        return (
            <div className="ui item">
                <div className="ui content">
                    <span className="ui small text">
                        {this.props.breed.sire.name}
                        <i className="ui heart outline icon"/>
                        {this.props.breed.matron.name}
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
    render() {
        return (
            <div className="ui four wide column">
                <div className="ui tiny header">{this.props.date}
                    <div className="ui tiny label">{this.props.vis}<span className="ui detail">VIS</span></div>
                    <div className="ui tiny label">{this.props.breeds.length}<span className="ui detail">Breeds</span></div>
                </div>
                <OutlookBreeds breeds={this.props.breeds}/>
            </div>
        )
    }
}

class Outlook extends React.Component {
    render() {
        let requirements = getRequirements(this.props.pegas, this.props.pricing).slice(0, 12);

        return (
            requirements.map(r => <OutlookDate key={r.date} date={r.date} vis={r.vis} breeds={r.breeds}/>)
        );
    }
}