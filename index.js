import express from "express";
const app = express();
import got from "got";
import web3 from "web3"
import {__express} from "pug";

const port = 3700;
const POLY_API_KEY = "37WD3AS1WC3VQJ5DY4UM7H6TVT94HEYIYT";
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36";
const breedCds = {
    Hoz: 24*60*60,
    Campona: 48*60*60,
    Klin: 72*60*60,
    Zan: 96*60*60,
};

let visPrice = 0;

let unbredPromise;  // unbred
let bredPromise;    // bred
let visPromise;     // vis

function updateVisPrice() {
    visPromise = got({
        method: 'get',
        url: `https://aggregator-api.kyberswap.com/polygon/route?tokenIn=0xc2132d05d31c914a87c6611c10748aeb04b58e8f&tokenOut=0xcc1b9517460d8ae86fe576f614d091fca65a28fc&amountIn=100000000000000000000&saveGas=0&gasInclude=1&r=${Math.random()}`
    });
    return visPromise;
}

async function updatePrices() {
    console.debug("Updating Prices " + new Date().toLocaleTimeString())
    unbredPromise = got({
        method: 'get',
        url: `https://api.pegaxy.io/market/pegasListing/0?bloodLine=Hoz&sortType=ASC&sortBy=price&isAuction=false&breedTime%5B0%5D=0`,
        headers: {
            'user-agent': userAgent
        }
    }).json();

    bredPromise = got({
        method: 'get',
        url: `https://api.pegaxy.io/market/pegasListing/0?bloodLine=Hoz&sortType=ASC&sortBy=price&isAuction=false`,
        headers: {
            'user-agent': userAgent
        }
    }).json();

    let v = await updateVisPrice();
    let token = JSON.parse(v.body).tokens["0xcc1b9517460d8ae86fe576f614d091fca65a28fc"];
    for (let i = 0; i < 10 && typeof token === "undefined"; i++) {
        console.log("Retrying VIS Price")
        v = await updateVisPrice();
        token = JSON.parse(v.body).tokens["0xcc1b9517460d8ae86fe576f614d091fca65a28fc"];
    }
}

app.get("/my-pegas", async (req,res) => {
    let wallet = req.query.wallet;
    wallet = web3.utils.toChecksumAddress(wallet);

    let data = await got({
        method: "get",
        url: `https://api-apollo.pegaxy.io/v1/pegas/owner/user/${wallet}`,
        headers: {
            'user-agent': userAgent
        }
    });

    let pegas = JSON.parse(data.body).map((pega) => {
        // console.log(pega);
        let lb = pega.lastBreedTime > 0 ? pega.lastBreedTime : pega.bornTime;
        let nb = lb + (pega.lastBreedTime > 0 ? breedCds[pega.bloodLine] : 96*60*60);
        let breedable = nb * 1000 < Date.now();
        let breedString = breedable ? `Now (${new Date(nb * 1000).toLocaleString()})` : `Can breed ${new Date(nb * 1000).toLocaleString()}`;
        // console.log(pega);
        // console.log(pega.id + " is rented = ", !!pega.renterAddress || pega.service === "RENT_SERVICE")
        return {
            id: pega.id,
            name: pega.name,
            earned: pega.ownerPegaRewards || 0,
            energy: pega.energy,
            gender: pega.gender,
            bloodLine: pega.bloodLine,
            breedType: pega.breedType,
            breedCount: pega.breedCount,
            sire: pega.fatherId,
            matron: pega.motherId,
            service: pega.service,
            isRented: !!pega.renterAddress || !!pega.renterId || pega.service === "RENT_SERVICE",
            isRentable: pega.bornTime + 24*60*60 < Date.now() / 1000,
            renterAddress: pega.renterAddress,
            lastRenterIsDirect: pega.lastRenterIsDirect,
            bornTime: pega.bornTime,
            isBreedable: breedable,
            breedString: breedString,
            breedable: nb
        };
    }).sort((a,b) => a.breedable - b.breedable);

    pegas.forEach(p => {
        if (p.service === "RENT_SERVICE" && p.lastRenterRentAt < Date.now() / 1000 - 60 * 60 && p.energy >= 20) {
            p.takeBackAlert = true;
        } else if (p.energy >= 20 && p.bornTime < Date.now() / 1000 - 60 * 60 * 24) {
            p.rentOutAlert = true;
        }
    });

    res.send(pegas);
})
app.get("/my-vis", async (req,res) => {
    let wallet = req.query.wallet;
    wallet = web3.utils.toChecksumAddress(wallet);

    const VIS_TOKEN_CONTRACT = `0xcc1b9517460d8ae86fe576f614d091fca65a28fc`;
    let data = await got({
        method: "get",
        url: `https://api.polygonscan.com/api?module=account&action=tokenbalance&tag=latest&contractaddress=${VIS_TOKEN_CONTRACT}&address=${wallet}&apikey=${POLY_API_KEY}`,
        headers: {
            'user-agent': userAgent
        }
    });

    const scale = 1000000000000000000;
    let vis = JSON.parse(data.body).result / scale;

    res.send({
        vis: vis
    });
})

app.get("/pricing", async (req,res) => {
    let bredFloor = Number.MAX_SAFE_INTEGER;
    let unbredFloor = Number.MAX_SAFE_INTEGER;

    // bred
    let r = await bredPromise;
    for (let a of r.market) {
        if (a.isAuction) {
            continue;
        }
        bredFloor = Math.min(bredFloor, a.price / 1000000);
        // console.log("pricing: ", bredFloor, unbredFloor);
    }

    // unbred
    r = await unbredPromise;
    for (let a of r.market) {
        if (a.isAuction) {
            continue;
        }
            unbredFloor = Math.min(unbredFloor, a.price / 1000000);
            // console.log("pricing: ", bredFloor, unbredFloor);
    }

    let v = await visPromise;
    let token = JSON.parse(v.body).tokens["0xcc1b9517460d8ae86fe576f614d091fca65a28fc"];
    visPrice = token ? token.price : visPrice;
    console.log(token, visPrice);

    res.send({
        bredFloor: bredFloor,
        unbredFloor: unbredFloor,
        visPrice: visPrice
    });
})


app.get("/", (req,res) => {
    res.render("page");
});

updatePrices();
setInterval(updatePrices, 300000);

app.set('views', 'views');
app.set('view engine', "pug");
app.engine('pug', __express);

app.use(express.static("static"));

app.listen(port);