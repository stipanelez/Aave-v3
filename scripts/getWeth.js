//build a script that will deposit our token for WETH token
const { ethers, getNamedAccounts, network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

const AMOUNT = ethers.utils.parseEther("0.02")

async function getWeth() {
    const { deployer } = await getNamedAccounts()
    const signer = await ethers.getSigner(deployer)

    //call the "deposit" function on the weth contract
    //abi, contract address (mainet): 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2l

    //get contract at specific address
    //get WEth contract with  ABI of IWeth at this address connected to Deployer
    const iWeth = await ethers.getContractAt(
        "IWeth",
        networkConfig[network.config.chainId].wethToken,
        signer,
    )
    const txResponse = await iWeth.deposit({
        value: AMOUNT,
    })
    await txResponse.wait(1)
    const wethBalance = await iWeth.balanceOf(deployer)
    console.log(`Got ${wethBalance.toString()} WETH`)
}
//export it,so our aaveBorrow can use this getWeth
module.exports = { getWeth, AMOUNT }
