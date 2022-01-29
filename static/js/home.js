function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function getMaxBreeds(pricing) {
    const breedCosts = {
        "1": 4000,
        "2": 8000,
        "3": 12000,
        "4": 20000
    }

    let maxBreeds = 0;
    const PgxCost = 15;
    for (let i = 0; i < 4; i++) {
        if (breedCosts[maxBreeds + 1] * pricing.visPrice + PgxCost < pricing.unbredFloor) {
            maxBreeds++;
        }
    }
    console.log("Max Breeds = " + maxBreeds);
    return maxBreeds;
}

function getRequirements(pegas, pricing) {
    pegas = JSON.parse(JSON.stringify(pegas))
        .filter(p => p.service !== "MARKET_SERVICE");
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
    let MAX_BREEDS = getMaxBreeds(pricing);

    let midnight = new Date();
    midnight.setHours(23, 59, 59, 999);
    let requirements = [];
    while (requirements.length < 16) {
        let vis = 0;
        let breeds = [];
        let cutoff = midnight.getTime();
        let males = pegas.filter(p=>p.gender === "Male" && p.breedCount < MAX_BREEDS && p.breedable * 1000 < cutoff);
        if (!males.length) {
            requirements.push({
                date: midnight.toLocaleDateString(),
                vis: vis,
                breeds: breeds
            });
            midnight = new Date(midnight.getTime() + 24 * 60 * 60 * 1000);
            continue;
        }
        let male = males.shift();
        while (male) {
            let female = pegas
                .filter(p=>p.gender === "Female")
                .find(p=>p.breedCount === male.breedCount && p.bloodLine === male.bloodLine && p.breedable * 1000 < cutoff);
            if (!female) {
                male = males.shift();
                continue;
            }
            male.breedCount++;
            female.breedCount++;
            let breedTime = Math.max(male.breedable, female.breedable);
            male.breedable = breedTime + breedCds[male.bloodLine];
            female.breedable = breedTime + breedCds[female.bloodLine];
            vis += breedCosts[male.breedCount];
            breeds.push({
                sire: male,
                matron: female
            });

            male = males.shift();
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