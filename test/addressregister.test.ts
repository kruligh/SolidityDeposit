import {assert} from 'chai';

import * as Web3 from 'web3';

import {AddressRegister, RegisterArtifacts} from 'register';

import {ContractContextDefinition} from 'truffle';
import {assertReverts, findLastLog, ZERO_ADDRESS} from './helpers';
import {all} from "truffle-compile";

declare const web3: Web3;
declare const artifacts: RegisterArtifacts;
declare const contract: ContractContextDefinition;

const AddressRegisterContract = artifacts.require('./AddressRegister.sol');

contract('AddressRegister', accounts => {
    const owner = accounts[0];
    let addressRegister: AddressRegister;

    describe('#ctor', () => {
        it('should create contract', async () => {
            addressRegister = await AddressRegisterContract.new({from: owner});
            assert.isOk(addressRegister);
        });
    });

    describe('#add addresses', () => {

        beforeEach(async () => {
            addressRegister = await AddressRegisterContract.new({from: owner});
            assert.isOk(addressRegister);
        });

        it('should emit event after adding address', async () => {
            const addingTx = await addressRegister.registerAddress(accounts[0], {from: owner});
            assert.isOk(findLastLog(addingTx, 'AddressRegistered'));
            assert.equal(findLastLog(addingTx, 'AddressRegistered').args.addr, accounts[0]);
        });

        it('should not be able to add duplicated address', async () => {
            const addingTx = await addressRegister.registerAddress(accounts[0]);
            assert.isOk(findLastLog(addingTx, 'AddressRegistered'));
            assert.equal(findLastLog(addingTx, 'AddressRegistered').args.addr, accounts[0]);

            await assertReverts(async () => {
                await addressRegister.registerAddress(accounts[0]);
            });
        });
    });

    describe('#get addresses', () => {

        const addressesToAdd = [
            ...accounts
        ];

        beforeEach(async () => {
            addressRegister = await AddressRegisterContract.new({from: owner});
            assert.isOk(addressRegister);

            addressesToAdd.forEach(address => {
                addressRegister.registerAddress(address);
            });
        });

        it('should be able to get all addresses', async () => {
            const allAddresses: Address[] = [];
            let iter = (await addressRegister.getNextAddress(0));
            while (iter != ZERO_ADDRESS) {
                allAddresses.push(iter);
                iter = await addressRegister.getNextAddress(iter);
            }
            assert.equal(allAddresses.length, addressesToAdd.length);
            addressesToAdd.forEach(addr => {
                assert.isTrue(allAddresses.includes(addr));
            });
        });

        it('should be able to check if address exists', async () => {
            const isExist = await addressRegister.isExist(addressesToAdd[0]);
            assert.isTrue(isExist);
        });

        it('should be able to check if address does not exist', async () => {
            const isExist = await addressRegister.isExist('0x2a1c7f37ff4041072cc97ba2f9c31d4e6147935e');
            assert.isFalse(isExist);
        });
    });

    describe('#edit address', () => {

        const addressesToAdd = [
            ...accounts
        ];

        beforeEach(async () => {
            addressRegister = await AddressRegisterContract.new({from: owner});
            assert.isOk(addressRegister);

            addressesToAdd.forEach(async address => {
                const addingTx = await addressRegister.registerAddress(address);
                assert.equal(findLastLog(addingTx, 'AddressRegistered').args.addr, address);
            });
        });

        const checkIfAddressExists = async (address: any) => {
            return await addressRegister.isExist(address);
        };

        it('should be able to remove address as a owner', async () => {
            await addressRegister.remove(addressesToAdd[0], {from: owner});
            assert.isFalse(await checkIfAddressExists(addressesToAdd[0]));
        });

        it('should not be able to remove address as a not owner', async () => {
            await assertReverts(async () => {
                await addressRegister.remove(
                    addressesToAdd[0],
                    {from: accounts[1]}
                );
            });
        });

        it('should be able to remove all as a owner', async () => {
            await addressRegister.removeAll({from: owner});
            assert.equal((await addressRegister.getAllAddresses()).length, 0);
        });

        it('should not be able to remove all as not owner', async () => {
            await assertReverts(async () => {
                await addressRegister.removeAll({from: accounts[1]});
            });
        });
    });

});
