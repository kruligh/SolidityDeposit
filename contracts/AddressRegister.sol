pragma solidity 0.4.18;

/**
 * @title Account addresses register
 * @dev Allows to store addresses in hopefully optimal way
 * @author Kroliczek Dominik (https://github.com/krolis)
 */
contract AddressRegister {

    struct Entry {
        address prev;
        address next;
    }

    address private owner;

    mapping(address => Entry) private addressesQueue;

    address private head;

    address private tail;

    uint256 private addressesCount;

    event AddressRegistered(address addr);

    modifier onlyIfAddressNotExist(address addr){
        require(!isExist(addr));
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function AddressRegister() public {
        owner = msg.sender;
    }

    function registerAddress(address addressToAdd)
    public
    onlyOwner
    onlyIfAddressNotExist(addressToAdd)
    {
        if (head == 0) {
            head = addressToAdd;
            tail = addressToAdd;
        }

        addressesQueue[addressToAdd].prev = tail;
        addressesQueue[tail].next = addressToAdd;
        tail = addressToAdd;

        addressesCount++;

        AddressRegistered(addressToAdd);
    }

    function isExist(address addressToCheck) public view returns (bool){
        return addressToCheck == tail || addressesQueue[addressToCheck].next != address(0);
    }

    function getAllAddresses() public view returns (address[]){
        address[] memory result = new address[](addressesCount);

        address iterator = head;

        for (uint i = 0; i < addressesCount; i++) {
            result[i] = iterator;
            iterator = addressesQueue[iterator].next;
        }
        return result;
    }

    function remove(address addressToRemove) public onlyOwner {
        Entry entry = addressesQueue[addressToRemove];

        addressesQueue[entry.prev].next = entry.next;
        addressesQueue[entry.next].prev = entry.prev;

        delete entry.next;
        delete entry.prev;

        addressesCount--;
    }

    function removeAll() public onlyOwner {
        address iterator = head;

        for (uint i = 0; i < addressesCount; i++) {
            address toDelete = iterator;
            iterator = addressesQueue[iterator].next;
            delete addressesQueue[toDelete];
        }

        delete head;
        delete tail;
        delete addressesCount;
    }
}
