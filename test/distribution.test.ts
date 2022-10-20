import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";
import * as mocha from "mocha-steps";
import { parseEther } from '@ethersproject/units';
import { Token, Distribution } from '../typechain-types';

describe("Exchanger test", async () => {

    let token: Token, distribution: Distribution;
    let admin: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress, 
    user3: SignerWithAddress, user4: SignerWithAddress, user5: SignerWithAddress, otherUser: SignerWithAddress;
    let arrayAddresses: string[];

    const defaultETHBalance = parseEther('10000');

    type IArrEl = {
        [index: string]: BigNumber;
    };

    let arrayAmountsToken: IArrEl;
    let arrayAmountsETH: IArrEl;

    beforeEach(async () => {
        [admin, user1, user2, user3, user4, user5, otherUser] = await ethers.getSigners();
    });

    

    mocha.step("Array initializing", async function () {
        arrayAmountsToken = {
            [user1.address]: parseEther('1500'),
            [user2.address]: parseEther('2500'),
            [user3.address]: parseEther('3000'),
            [user4.address]: parseEther('1000'),
            [user5.address]: parseEther('2000'),
        }
        arrayAmountsETH = {
            [user1.address]: parseEther('15'),
            [user2.address]: parseEther('25'),
            [user3.address]: parseEther('5'),
            [user4.address]: parseEther('10'),
            [user5.address]: parseEther('15'),
        }
    });
    

    mocha.step("Deploying Test Token", async function () {
        const tokenF = await ethers.getContractFactory("Token");
        const totalSupply = parseEther('1000000');
        token = await tokenF.connect(admin).deploy("SIMPLETOKEN", "STN", totalSupply);
    });

    mocha.step("Deploying Distribution contract", async function () {
        const Distribution = await ethers.getContractFactory("Distribution");
        distribution = await Distribution.connect(admin).deploy();
    });

    mocha.step("Approve token on Distribution contract address", async function () {
        await token.connect(admin).approve(distribution.address, parseEther('100000'));
    });

    mocha.step("Check AccessControl", async function () {
        arrayAddresses = [
            user1.address,
            user2.address,
            user3.address,
            user4.address,
            user5.address
        ]; 
        const arrayAmounts = [
            arrayAmountsToken[user1.address],
            arrayAmountsToken[user2.address],
            arrayAmountsToken[user3.address],
            arrayAmountsToken[user4.address],
            arrayAmountsToken[user5.address]
        ];
        await expect(distribution.connect(otherUser).distributeERC20(admin.address, token.address, arrayAddresses, arrayAmounts)).to.be.revertedWith("You do not have access rights.");
    });

    mocha.step("Checking for empty array", async function () {
        const arrayAmounts = [
            arrayAmountsToken[user1.address],
            arrayAmountsToken[user2.address],
            arrayAmountsToken[user3.address],
            arrayAmountsToken[user4.address],
            arrayAmountsToken[user5.address]
        ];
        const emptyArray: any = [];
        await expect(distribution.connect(admin).distributeERC20(admin.address, token.address, emptyArray, arrayAmounts)).to.be.revertedWith("Empty array.");
    });

    mocha.step("Checking for length matching", async function () {
        const arrayAmounts = [
            arrayAmountsETH[user1.address],
            arrayAmountsETH[user2.address],
            arrayAmountsETH[user3.address],
            arrayAmountsETH[user4.address]
        ];
        await expect(distribution.connect(admin).distributeERC20(admin.address, token.address, arrayAddresses, arrayAmounts)).to.be.revertedWith('Array lengths do not match.');
    });

    mocha.step("Call distributeERC20", async function () {
        arrayAddresses = [
            user1.address,
            user2.address,
            user3.address,
            user4.address,
            user5.address
        ]; 
        const arrayAmounts = [
            arrayAmountsToken[user1.address],
            arrayAmountsToken[user2.address],
            arrayAmountsToken[user3.address],
            arrayAmountsToken[user4.address],
            arrayAmountsToken[user5.address]
        ];
        await distribution.connect(admin).distributeERC20(admin.address, token.address, arrayAddresses, arrayAmounts)
    });

    mocha.step("Checking balances users after distribute", async function () {
        expect(await token.balanceOf(user1.address)).to.equal(arrayAmountsToken[user1.address]);
        expect(await token.balanceOf(user2.address)).to.equal(arrayAmountsToken[user2.address]);
        expect(await token.balanceOf(user3.address)).to.equal(arrayAmountsToken[user3.address]);
        expect(await token.balanceOf(user4.address)).to.equal(arrayAmountsToken[user4.address]);
        expect(await token.balanceOf(user5.address)).to.equal(arrayAmountsToken[user5.address]);
    });

    mocha.step("Sending 0 ETH", async function () {
        const arrayAmounts = [
            arrayAmountsETH[user1.address],
            arrayAmountsETH[user2.address],
            arrayAmountsETH[user3.address],
            arrayAmountsETH[user4.address],
            arrayAmountsETH[user5.address]
        ];
        await expect(distribution.connect(admin).distributeETH(arrayAddresses, arrayAmounts, {value: 0})).to.be.revertedWith('You sent 0 ETH');
    });

    mocha.step("Checking for empty array", async function () {
        const arrayAmounts = [
            arrayAmountsETH[user1.address],
            arrayAmountsETH[user2.address],
            arrayAmountsETH[user3.address],
            arrayAmountsETH[user4.address],
            arrayAmountsETH[user5.address]
        ];
        const emptyArray: any = [];
        await expect(distribution.connect(admin).distributeETH(emptyArray, arrayAmounts, {value: parseEther('70')})).to.be.revertedWith('Empty array.');
    });

    mocha.step("Checking for length matching", async function () {
        const arrayAmounts = [
            arrayAmountsETH[user1.address],
            arrayAmountsETH[user2.address],
            arrayAmountsETH[user3.address],
            arrayAmountsETH[user4.address]
        ];
        await expect(distribution.connect(admin).distributeETH(arrayAddresses, arrayAmounts, {value: parseEther('70')})).to.be.revertedWith('Array lengths do not match.');
    });

    mocha.step("Checking of accounting for sent ether", async function () {
        const arrayAmounts = [
            arrayAmountsETH[user1.address],
            arrayAmountsETH[user2.address],
            arrayAmountsETH[user3.address],
            arrayAmountsETH[user4.address],
            arrayAmountsETH[user5.address]
        ];
        await expect(distribution.connect(admin).distributeETH(arrayAddresses, arrayAmounts, {value: parseEther('100')})).to.be.revertedWith('You have sent more ETH than needed');
    });

    mocha.step("Call distributeETH", async function () {
        const amountForDistribute = parseEther('70');
        const arrayAmounts = [
            arrayAmountsETH[user1.address],
            arrayAmountsETH[user2.address],
            arrayAmountsETH[user3.address],
            arrayAmountsETH[user4.address],
            arrayAmountsETH[user5.address]
        ];
        await distribution.connect(admin).distributeETH(arrayAddresses, arrayAmounts, {value: amountForDistribute});
    });

    mocha.step("Checking native currency balances users after distribute ETH", async function () {
        expect(await user1.getBalance()).to.equal(defaultETHBalance.add(arrayAmountsETH[user1.address]));
        expect(await user2.getBalance()).to.equal(defaultETHBalance.add(arrayAmountsETH[user2.address]));
        expect(await user3.getBalance()).to.equal(defaultETHBalance.add(arrayAmountsETH[user3.address]));
        expect(await user4.getBalance()).to.equal(defaultETHBalance.add(arrayAmountsETH[user4.address]));
        expect(await user5.getBalance()).to.equal(defaultETHBalance.add(arrayAmountsETH[user5.address]));
    });
    
});