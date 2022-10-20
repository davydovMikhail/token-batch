// SPDX-License-Identifier: MIT
pragma solidity =0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Address.sol";


contract Distribution is AccessControl {
    using SafeERC20 for IERC20Metadata;  
    using Address for address payable;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Function for the distribution of ERC20 standard tokens
     *
     * @param _maecenas Tokens will be debited from this address during the distribution process. Previously, the address must call approve to the address of this contract
     * @param _token The address of the token to be distributed
     * @param _recipients Array with recipient addresses
     * @param _amounts Array with amounts that will receive addresses from the array _recipients
     */
    function distributeERC20(address _maecenas, address _token, address[] calldata _recipients, uint256[] calldata _amounts) external {
        require(hasRole(ADMIN_ROLE, msg.sender), "You do not have access rights.");
        uint256 length = _recipients.length;
        require(length > 0, "Empty array.");
        require(length == _amounts.length, "Array lengths do not match.");
        for (uint i = 0; i < length; i++) {
            IERC20Metadata(_token).safeTransferFrom(_maecenas, _recipients[i], _amounts[i]);
        }
    }

    /**
     * @dev Function for native currency distribution
     *
     * @param _recipients Array with recipient addresses
     * @param _amounts Array with amounts that will receive addresses from the array _recipients
     */
    function distributeETH(address[] calldata _recipients, uint256[] calldata _amounts) external payable {
        uint256 msgValue = msg.value;
        require(msgValue > 0, "You sent 0 ETH");
        uint256 length = _recipients.length;
        require(length > 0, "Empty array.");
        require(length == _amounts.length, "Array lengths do not match.");
        uint alreadySent;
        for (uint i = 0; i < length; i++) {
            address payable recipient = payable(_recipients[i]);
            recipient.sendValue(_amounts[i]);
            alreadySent += _amounts[i];
        }
        require(alreadySent == msgValue, "You have sent more ETH than needed");
    }
}