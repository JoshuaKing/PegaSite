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

const VIS_TOKEN_CONTRACT = `0xcc1b9517460d8ae86fe576f614d091fca65a28fc`;
const USDT_TOKEN_CONTRACT = `0xc2132d05d31c914a87c6611c10748aeb04b58e8f`;
const PGX_TOKEN_CONTRACT = `0xc1c93D475dc82Fe72DBC7074d55f5a734F8cEEAE`;

let visPrice = 0;
let pgxPrice = 0;

let unbredPromise;  // unbred
let bredPromise;    // bred
let visPromise;     // vis
let pgxPromise;     // pgx

function updateVisPrice() {
    visPromise = got({
        method: 'get',
        url: `https://aggregator-api.kyberswap.com/polygon/route?tokenIn=${USDT_TOKEN_CONTRACT}&tokenOut=${VIS_TOKEN_CONTRACT}&amountIn=100000000000000000000&saveGas=0&gasInclude=1&r=${Math.random()}`
    });
    return visPromise;
}

function updatePgxPrice() {
    pgxPromise = got({
        method: 'get',
        url: `https://aggregator-api.kyberswap.com/polygon/route?tokenIn=${USDT_TOKEN_CONTRACT}&tokenOut=${PGX_TOKEN_CONTRACT}&amountIn=100000000000000000000&saveGas=0&gasInclude=1&r=${Math.random()}`
    });
    return pgxPromise;
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
    let visToken = Object.values(JSON.parse(v.body).tokens).find(t=>t.symbol==='VIS');
    for (let i = 0; i < 10 && typeof visToken === "undefined"; i++) {
        console.log("Retrying VIS Price")
        v = await updateVisPrice();
        visToken = Object.values(JSON.parse(v.body).tokens).find(t=>t.symbol==='VIS');
    }

    let p = await updatePgxPrice();
    let pgxToken = Object.values(JSON.parse(p.body).tokens).find(t=>t.symbol==='PGX');
    for (let i = 0; i < 10 && typeof pgxToken === "undefined"; i++) {
        console.log("Retrying PGX Price")
        p = await updatePgxPrice();
        pgxToken = Object.values(JSON.parse(p.body).tokens).find(t=>t.symbol==='PGX');
        console.log(pgxToken ? pgxToken.price : pgxToken);
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
        let lb = pega.lastBreedTime > 0 ? pega.lastBreedTime : pega.bornTime;
        let nb = lb + (pega.lastBreedTime > 0 ? breedCds[pega.bloodLine] : 96*60*60);
        let breedable = nb * 1000 < Date.now();

        let isRentable = pega.bornTime + 24*60*60 < Date.now() / 1000;
        return {
            id: pega.id,
            name: pega.name,
            earned: pega.ownerPegaRewards || 0,
            energy: isRentable ? pega.energy : 0,
            gender: pega.gender,
            bloodLine: pega.bloodLine,
            breedType: pega.breedType,
            breedCount: pega.breedCount,
            sire: pega.fatherId,
            matron: pega.motherId,
            service: pega.service,
            isRented: !!pega.renterAddress || !!pega.renterId || pega.service === "RENT_SERVICE",
            isRentable: isRentable,
            renterAddress: pega.renterAddress,
            lastRenterIsDirect: pega.lastRenterIsDirect,
            bornTime: pega.bornTime,
            isBreedable: breedable,
            breedable: nb
        };
    }).sort((a,b) => a.breedable - b.breedable);

    res.send(pegas);
})
app.get("/my-currency", async (req,res) => {
    let wallet = req.query.wallet;
    wallet = web3.utils.toChecksumAddress(wallet);
    let data = await got({
        method: "get",
        url: `https://api.polygonscan.com/api?module=account&action=tokenbalance&tag=latest&contractaddress=${VIS_TOKEN_CONTRACT}&address=${wallet}&apikey=${POLY_API_KEY}`,
        headers: {
            'user-agent': userAgent
        }
    });

    let usdtData = await got({
        method: "get",
        url: `https://api.polygonscan.com/api?module=account&action=tokenbalance&tag=latest&contractaddress=${USDT_TOKEN_CONTRACT}&address=${wallet}&apikey=${POLY_API_KEY}`,
        headers: {
            'user-agent': userAgent
        }
    });

    let pgxData = await got({
        method: "get",
        url: `https://api.polygonscan.com/api?module=account&action=tokenbalance&tag=latest&contractaddress=${PGX_TOKEN_CONTRACT}&address=${wallet}&apikey=${POLY_API_KEY}`,
        headers: {
            'user-agent': userAgent
        }
    });

    const scale = 1000000000000000000;
    let vis = JSON.parse(data.body).result / scale;
    let usdt = JSON.parse(usdtData.body).result / 1000000;
    let pgx = JSON.parse(pgxData.body).result / scale;

    res.send({
        vis: vis,
        usdt: usdt,
        pgx: pgx
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
    }

    // unbred
    r = await unbredPromise;
    for (let a of r.market) {
        if (a.isAuction) {
            continue;
        }
        unbredFloor = Math.min(unbredFloor, a.price / 1000000)
    }

    // vis
    let v = await visPromise;
    let visToken = Object.values(JSON.parse(v.body).tokens).find(t=>t.symbol==='VIS');
    visPrice = visToken ? visToken.price : visPrice;
    console.log(visToken, visPrice);

    // pgx
    let p = await pgxPromise;
    let pgxToken = Object.values(JSON.parse(p.body).tokens).find(t=>t.symbol==='PGX');
    pgxPrice = pgxToken ? pgxToken.price : pgxPrice;
    console.log(pgxToken, pgxPrice);

    res.send({
        bredFloor: bredFloor,
        unbredFloor: unbredFloor,
        visPrice: visPrice,
        pgxPrice: pgxPrice
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