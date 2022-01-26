class PegaRow extends React.Component {
    render() {
        const p = this.props.pega;
        return (
            <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.breedCount}</td>
                <td>{p.energy}</td>
                <td>{p.renterAddress ? "Rented" : ""}</td>
                <td>{p.breedString}</td>
                <td>{p.name}</td>
            </tr>
        )
    }
}

class PegaTable extends React.Component {
    state = {
        sortField: 'breedable',
        sortAsc: true
    }

    constructor() {
        super();
    }

    componentDidMount() {
        $('.ui.dropdown').dropdown();
        $('.rented.ui.dropdown').dropdown({
            onChange: (value, text, $item) => this.filter(value, 'rented')
        });
    }

    sort(field) {
        console.log("sorting table by " + field);
        if (this.state.sortField === field) {
            this.setState({ sortAsc: !this.state.sortAsc});
        } else {
            this.setState({
                sortField: field,
                sortAsc: true,
                searchString: "",
                rented: 0,
                filterRentable: false,
                filterBreedable: false,
                filterProfitable: false
            });
        }
    }

    filter(value, field) {
        console.log(field + " filtering: " + value);
        this.setState({ [field]: value});
    }

    render() {
        console.log("Rendering Pega Table");
        let maxBreeds = getMaxBreeds(this.props.pricing);
        const pegas = this.props.pegas
            .filter(p => {
                const s = this.state;
                if (s.rented === "1" && !p.isRented) {
                    return false;
                } else if (s.rented === "2" && p.isRented) {
                    return false;
                }

                if (s.filterRentable && !p.isRentable) {
                    return false;
                }
                if (s.filterBreedable && !p.isBreedable) {
                    return false;
                }
                if (s.filterProfitable && p.breedCount >= maxBreeds) {
                    return false;
                }
                if (s.searchString) {
                    if (s.searchString.startsWith("0x") && p.renterAddress === s.searchString) {
                        return true;
                    } else if (isNumeric(s.searchString) && parseInt(s.searchString) === p.id) {
                        return true;
                    } else if (p.name.includes(s.searchString)) {
                        return true;
                    }
                    return false;
                }
                return true;
            }).sort((a,b) => {
                if (this.state.sortAsc) {
                    return b[this.state.sortField] - a[this.state.sortField];
                }
                return a[this.state.sortField] - b[this.state.sortField];
            }).map(p => <PegaRow pega={p}/>);

        return (
            <div>
                <div className="tableFilters ui form">
                    <div className="ui five fields">
                        <div className="ui action input field">
                            <input placeholder="Search ID's/names" onChange={(e)=>this.filter(e.target.value, 'searchString')}/>
                            <button className="ui icon button">
                                <i className="ui search icon"/>
                            </button>
                        </div>
                        <div className="rented ui selection dropdown">
                            <input type="hidden" name="rented"/>
                            <i className="ui dropdown icon"/>
                            <div className="default text">Rent status</div>
                            <div className="scrollhint menu">
                                <div className="item" data-value="0">No Preference</div>
                                <div className="item" data-value="1">Rented</div>
                                <div className="item" data-value="2">Available</div>
                            </div>
                        </div>
                        <div className="ui toggle checkbox field">
                            <input type="checkbox" onChange={(e)=>this.filter(e.target.checked,'filterRentable')}/>
                            <label>Filter Unrentable</label>
                        </div>
                        <div className="ui toggle checkbox field">
                            <input type="checkbox" onChange={(e)=>this.filter(e.target.checked,'filterBreedable')}/>
                            <label>Filter Breedable</label>
                        </div>
                        <div className="ui toggle checkbox field">
                            <input type="checkbox" onChange={(e)=>this.filter(e.target.checked,'filterProfitable')}/>
                            <label>Filter Profitable</label>
                        </div>
                    </div>
                </div>
                <table className="ui compact striped table pegalist">
                    <thead>
                    <tr>
                        <th onClick={()=>this.sort('id')}>ID</th>
                        <th onClick={()=>this.sort('breedCount')}>BC</th>
                        <th onClick={()=>this.sort('energy')}>Energy</th>
                        <th onClick={()=>this.sort('renterAddress')}>Rented</th>
                        <th onClick={()=>this.sort('breedCount')}>Breedable</th>
                        <th onClick={()=>this.sort('name')}>Name</th>
                    </tr>
                    </thead>
                    <tbody>
                    {pegas}
                    </tbody>
                </table>
            </div>
        )
    }
}