import express from "express";
const app = express();
import got from "got";
import web3 from "web3"
import {__express} from "pug";
import {getClientIp} from 'request-ip';
import geoip from 'geoip-lite';
import SimpleLogger from 'simple-node-logger';
const log = SimpleLogger.createSimpleLogger({
    logFilePath:'wallet-ips.log',
    timestampFormat:'YYYY-MM-DD'
});


const port = 3700;
const POLY_API_KEY = "37WD3AS1WC3VQJ5DY4UM7H6TVT94HEYIYT";
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.81 Safari/537.36";
const breedCds = {
    Hoz: 24*60*60,
    Campona: 48*60*60,
    Klin: 72*60*60,
    Zan: 96*60*60,
};

const VIS_TOKEN_CONTRACT = `0xcc1b9517460d8ae86fe576f614d091fca65a28fc`;
const VIS_TOKEN = `0xecf185d8114664e42dae0701eaff1a50a3613a05`;
const USDT_TOKEN_CONTRACT = `0xc2132d05d31c914a87c6611c10748aeb04b58e8f`;
const PGX_TOKEN_CONTRACT = `0xc1c93D475dc82Fe72DBC7074d55f5a734F8cEEAE`;
const PGX_TOKEN = `0x3f1f398887525d2d9acd154ec5e4a3979adffae6`;

let visPrice = 0;
let pgxPrice = 0;

let unbredPromise;  // unbred
let bredPromise;    // bred
let visPromise;     // vis
let pgxPromise;     // pgx

function updateVisPrice() {
    visPromise = got({
        method: 'post',
        url: `https://api.thegraph.com/subgraphs/name/dynamic-amm/dmm-exchange-matic`,
        json: {"query":"fragment PoolFields on Pool {\n  id\n  txCount\n  token0 {\n    id\n    symbol\n    name\n    totalLiquidity\n    derivedETH\n    __typename\n  }\n  token1 {\n    id\n    symbol\n    name\n    totalLiquidity\n    derivedETH\n    __typename\n  }\n  amp\n  reserve0\n  reserve1\n  vReserve0\n  vReserve1\n  reserveUSD\n  totalSupply\n  trackedReserveETH\n  reserveETH\n  volumeUSD\n  feeUSD\n  untrackedVolumeUSD\n  untrackedFeeUSD\n  token0Price\n  token1Price\n  token0PriceMin\n  token0PriceMax\n  token1PriceMin\n  token1PriceMax\n  createdAtTimestamp\n  __typename\n}\n\nquery pools($allPools: [Bytes]!) {\n  pools(where: {id_in: $allPools}, orderBy: trackedReserveETH, orderDirection: desc) {\n    ...PoolFields\n    __typename\n  }\n}\n","variables":{"allPools":[VIS_TOKEN]},"operationName":"pools"},
    });
    return visPromise;
}

function updatePgxPrice() {
    pgxPromise = got({
        method: 'post',
        url: `https://api.thegraph.com/subgraphs/name/dynamic-amm/dmm-exchange-matic`,
        json: {"query":"fragment PoolFields on Pool {\n  id\n  txCount\n  token0 {\n    id\n    symbol\n    name\n    totalLiquidity\n    derivedETH\n    __typename\n  }\n  token1 {\n    id\n    symbol\n    name\n    totalLiquidity\n    derivedETH\n    __typename\n  }\n  amp\n  reserve0\n  reserve1\n  vReserve0\n  vReserve1\n  reserveUSD\n  totalSupply\n  trackedReserveETH\n  reserveETH\n  volumeUSD\n  feeUSD\n  untrackedVolumeUSD\n  untrackedFeeUSD\n  token0Price\n  token1Price\n  token0PriceMin\n  token0PriceMax\n  token1PriceMin\n  token1PriceMax\n  createdAtTimestamp\n  __typename\n}\n\nquery pools($allPools: [Bytes]!) {\n  pools(where: {id_in: $allPools}, orderBy: trackedReserveETH, orderDirection: desc) {\n    ...PoolFields\n    __typename\n  }\n}\n","variables":{"allPools":[PGX_TOKEN]},"operationName":"pools"},
    });
    return pgxPromise;
}

async function updateUnbredPrice() {
    try {
        return await got({
            method: 'get',
            url: `https://api.pegaxy.io/market/pegasListing/0?bloodLine=Hoz&sortType=ASC&sortBy=price&isAuction=false&breedTime%5B0%5D=0`,
            headers: {
                'user-agent': userAgent
            }
        }).json();
    } catch(e) {
        console.error("Error getting Unbred pricing data: ", e.message);
        return {
            market: []
        };
    }
}

async function updateBredPricing() {
    try {
        return await got({
            method: 'get',
            url: `https://api.pegaxy.io/market/pegasListing/0?bloodLine=Hoz&sortType=ASC&sortBy=price&isAuction=false`,
            headers: {
                'user-agent': userAgent
            }
        }).json();
    } catch(e) {
        console.error("Error getting Bred pricing data: ", e.message);
        return {
            market: []
        };
    }
}

async function updatePrices() {
    console.debug("Updating Prices " + new Date().toLocaleTimeString())
    unbredPromise = updateUnbredPrice();

    bredPromise = updateBredPricing();

    updateVisPrice();

    updatePgxPrice();
}

function checkGeo(req, wallet = "none") {
    const clientIp = getClientIp(req);
    let geo = geoip.lookup(clientIp);
    console.log(`Wallet: ${wallet} IP: ${clientIp}, Geo:`, geo);
    if (clientIp === "::1") {
        return true;
    } else if (!geo) {
        return false;
    }
    log.info(`Wallet: ${wallet} IP: ${clientIp} Country: ${geo.country} City: ${geo.city}`);
    return ["UK", "GB", "US", "JP", "AU", "CA"].includes(geo.country) || parseInt(geo.eu) === 1;
}

app.get("/my-pegas", async (req,res) => {
    let wallet = req.query.wallet;
    wallet = web3.utils.toChecksumAddress(wallet);
    if (!checkGeo(req, wallet)) {
        res.status(403).json({});
        return;
    }


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
            breedable: nb,
            winRate: pega.winRate
        };
    }).sort((a,b) => a.breedable - b.breedable);

    res.send(pegas);
})
app.get("/my-currency", async (req,res) => {
    let wallet = req.query.wallet;
    wallet = web3.utils.toChecksumAddress(wallet);
    if (!checkGeo(req, wallet)) {
        res.status(403).json({ 'error': 'forbidden' });
        return;
    }

    let visData = got({
        method: "get",
        url: `https://api.polygonscan.com/api?module=account&action=tokenbalance&tag=latest&contractaddress=${VIS_TOKEN_CONTRACT}&address=${wallet}&apikey=${POLY_API_KEY}`,
        headers: {
            'user-agent': userAgent
        }
    });

    let usdtData = got({
        method: "get",
        url: `https://api.polygonscan.com/api?module=account&action=tokenbalance&tag=latest&contractaddress=${USDT_TOKEN_CONTRACT}&address=${wallet}&apikey=${POLY_API_KEY}`,
        headers: {
            'user-agent': userAgent
        }
    });

    let pgxData = got({
        method: "get",
        url: `https://api.polygonscan.com/api?module=account&action=tokenbalance&tag=latest&contractaddress=${PGX_TOKEN_CONTRACT}&address=${wallet}&apikey=${POLY_API_KEY}`,
        headers: {
            'user-agent': userAgent
        }
    });

    let unclaimedVisData = got({
        method: "get",
        url: `https://api-apollo.pegaxy.io/v1/assets/count/user/${wallet}`,
        headers: {
            'user-agent': userAgent
        }
    });

    const scale = 1000000000000000000;
    let vis = JSON.parse((await visData).body).result / scale;
    let usdt = JSON.parse((await usdtData).body).result / 1000000;
    let pgx = JSON.parse((await pgxData).body).result / scale;
    let unclaimedVis = JSON.parse((await unclaimedVisData).body).lockedVis;

    res.send({
        vis: vis,
        usdt: usdt,
        pgx: pgx,
        unclaimedVis: unclaimedVis
    });
})

app.get("/pricing", async (req,res) => {
    let bredFloor = Number.MAX_SAFE_INTEGER;
    let unbredFloor = Number.MAX_SAFE_INTEGER;
    if (!checkGeo(req)) {
        res.status(403).json({ 'error': 'forbidden' });
        return;
    }

    // bred
    let r = await bredPromise;
    for (let a of r.market) {
        if (a.isAuction) {
            continue;
        }
        bredFloor = Math.min(bredFloor, a.price / 1000000);
    }
    if (r.market.length === 0) {
        bredFloor = 0;
    }

    // unbred
    r = await unbredPromise;
    for (let a of r.market) {
        if (a.isAuction) {
            continue;
        }
        unbredFloor = Math.min(unbredFloor, a.price / 1000000)
    }
    if (r.market.length === 0) {
        unbredFloor = 0;
    }

    // vis
    let v = await visPromise;
    let visToken = JSON.parse(v.body).data.pools[0];
    visPrice = visToken ? parseFloat(visToken.token0Price) : visPrice;
    console.log("VIS: ", visPrice);

    // pgx
    let p = await pgxPromise;
    let pgxToken = JSON.parse(p.body).data.pools[0];
    pgxPrice = pgxToken ? parseFloat(pgxToken.token1Price) : pgxPrice;
    console.log("PGX: ", pgxPrice);

    res.send({
        bredFloor: bredFloor,
        unbredFloor: unbredFloor,
        visPrice: visPrice,
        pgxPrice: pgxPrice
    });
})


app.get("/", (req,res) => {
    if (!checkGeo(req)) {
        // res.status(403).json({});
        // return;
    }
    res.render("page");
});

updatePrices();
setInterval(updatePrices, 300000);

app.set('views', 'views');
app.set('view engine', "pug");
app.engine('pug', __express);

app.use(express.static("static"));

app.listen(port);