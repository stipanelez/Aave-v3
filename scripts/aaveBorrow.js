const { ethers, getNamedAccounts, network } = require("hardhat")
const { getWeth, AMOUNT } = require("../scripts/getWeth.js")
const { networkConfig } = require("../helper-hardhat-config")

async function main() {
    // the protocol treats everything as an ERC20 token
    await getWeth()
    const { deployer } = await getNamedAccounts()
    const signer = await ethers.getSigner(deployer)
    const lendingPool = await getLendingPool(signer)
    console.log(`LendingPool Address ${lendingPool.address} `)
    //console.log(`LendingPool Address  `, lendingPool.address)

    //deposit collateral
    //safetransferfrom is going to pull out money from our wallet
    //contract address (mainet): 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

    //const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    const wethTokenAddress = networkConfig[network.config.chainId].wethToken
    const daiTokenAddress = networkConfig[network.config.chainId].daiToken

    //approve
    //to give ability for pulling money from our contract we need to approve aave contract
    //lendingPool.address because we want to give lendingPool the approval to pull our weth token from our account
    await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, signer)
    console.log("Depositing...")
    //last parametar is reffere code..for us is always 0
    //we need address so put signer.address or deployer
    await lendingPool.deposit(wethTokenAddress, AMOUNT, signer.address, 0)
    console.log("Deposited...")

    //How much we have borrowed, how much we have in collateral, how much we can borrow

    let { totalDebtBase, availableBorrowsBase } = await getBorrowUserData(
        lendingPool,
        signer.address,
    )

    const daiPrice = await getDaiPrice()

    //We have price in ETH,now we need price in DAI
    const amountDaiToBorrow = availableBorrowsBase.toString() * 0.95 * (1 / daiPrice.toNumber())
    //0.95 bcz we dont want to hit cap of maximum what we can borrow
    console.log(`You can borrow ${amountDaiToBorrow.toString()} DAI`)
    //toFixed is used for decimals
    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toFixed(18))

    //Borrow
    await borrowDai(daiTokenAddress, lendingPool, amountDaiToBorrowWei, signer.address)
    //To print info where we are
    await getBorrowUserData(lendingPool, signer.address)

    //repay
    //Give back all of DAI that we borrowed
    await repay(amountDaiToBorrowWei, daiTokenAddress, lendingPool, signer)
    await getBorrowUserData(lendingPool, signer.address)
}

//Lending Pool address Provider: 0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e
//function which get lending pool address from lending pool provider

async function getLendingPool(account) {
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        "IPoolAddressesProvider",
        //networkConfig[network.config.chainId].lendingPoolAddressesProvider,
        "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
        account,
    )

    //getPool() returns address
    const lendingPoolAddress = await lendingPoolAddressesProvider.getPool()

    //give us lending pool contract
    const lendingPool = await ethers.getContractAt("IPool", lendingPoolAddress, account)

    return lendingPool
}

async function approveErc20(erc20Address, spenderAddress, amountToSpend, account) {
    const erc20Token = await ethers.getContractAt("IERC20", erc20Address, account)
    const tx = await erc20Token.approve(spenderAddress, amountToSpend)
    await tx.wait(1)
    console.log("Approved!")
}

async function getBorrowUserData(lendingPool, account) {
    const { totalCollateralBase, totalDebtBase, availableBorrowsBase } =
        await lendingPool.getUserAccountData(account)
    console.log(`You have ${totalCollateralBase.toString()} worth of ETH deposited.`)
    console.log(`You have ${totalDebtBase.toString()} worth of ETH borrowed.`)
    console.log(`You can borrow ${availableBorrowsBase.toString()} worth of ETH.`)
    return { totalDebtBase, availableBorrowsBase }
}

async function getDaiPrice() {
    //Dont need to be connect to the deployer account bcz we are not going sending any tx,just read
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        networkConfig[network.config.chainId].daiEthPriceFeed,
    )
    const price = (await daiEthPriceFeed.latestRoundData())[1] //bcz answer in latestRoundData is on first index
    console.log(`The DAI/ETH price is ${price.toString()}`)
    return price
}

async function borrowDai(daiAddress, lendingPool, amountDaiToBorrowWei, account) {
    const borrowTx = await lendingPool.borrow(
        daiAddress,
        amountDaiToBorrowWei,
        2, //1 is Stable,2 is Variable for interestRateMode
        0,
        account,
    )

    await borrowTx.wait(1)
    console.log("You've borrowed!")
}

async function repay(amount, daiAddress, lendingPool, account) {
    await approveErc20(daiAddress, lendingPool.address, amount, account)

    const repayTx = await lendingPool.repay(daiAddress, amount, 2, account.address)

    await repayTx.wait(1)
    console.log("Repaid!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
