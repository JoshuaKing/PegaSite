function getRequirements(pegas, pricing) {
    pegas = JSON.parse(JSON.stringify(pegas));
    const breedCds = {
        Hoz: 24*60*60,
        Campona: 48*60*60,
        Klin: 72*60*60,
        Zan: 96*60*60,
    };
    const breedCosts = {
        "1": 4000,
        "2": 8000,
        "3": 12000,
        "4": 20000
    }
    let MAX_BREEDS = 0;
    const PgxCost = 15;
    for (let i = 0; i < 4; i++) {
        if (breedCosts[MAX_BREEDS + 1] * pricing.visPrice + PgxCost < pricing.unbredFloor) {
            MAX_BREEDS++;
        }
    }
    console.log("Max Breeds = " + MAX_BREEDS);

    let midnight = new Date();
    midnight.setHours(23, 59, 59, 999);
    let requirements = [];
    while (requirements.length < 16) {
        let vis = 0;
        let breeds = [];
        let cutoff = midnight.getTime();
        let male = pegas
            .filter(p=>p.gender === "Male")
            .find(p=>p.breedCount < MAX_BREEDS && p.breedable * 1000 < cutoff);
        if (!male) {
            requirements.push({
                date: midnight.toLocaleDateString(),
                vis: vis,
                breeds: breeds
            });
            midnight = new Date(midnight.getTime() + 24 * 60 * 60 * 1000);
            continue;
        }
        let female = pegas
            .filter(p=>p.gender === "Female")
            .find(p=>p.breedCount === male.breedCount && p.bloodLine === male.bloodLine && p.breedable * 1000 < cutoff);

        while (male && female) {
            male.breedCount++;
            female.breedCount++;
            male.breedable += breedCds[male.bloodLine];
            female.breedable += breedCds[female.bloodLine];
            vis += breedCosts[male.breedCount];
            breeds.push({
                sire: male,
                matron: female
            });

            male = pegas
                .filter(p=>p.gender === "Male")
                .find(p=>p.breedCount < MAX_BREEDS && p.breedable * 1000 < cutoff);
            if (!male) {
                break;
            }
            female = pegas
                .filter(p=>p.gender === "Female")
                .find(p=>p.breedCount === male.breedCount && p.bloodLine === male.bloodLine && p.breedable * 1000 < cutoff);
        }
        requirements.push({
            date: midnight.toLocaleDateString(),
            vis: vis,
            breeds: breeds
        });
        midnight = new Date(midnight.getTime() + 24 * 60 * 60 * 1000);
    }
    return requirements;
}

$(document).ready(() => {
    ReactDOM.render(<Wallet/>, $("#polygonWallet")[0]);
})