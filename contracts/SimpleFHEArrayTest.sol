// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, euint16, ebool } from "@fhevm/solidity/lib/FHE.sol";

contract SimpleFHEArray {
    euint8[] private encryptedArray;
    euint16 private sum;
    ebool private isEven;
    
    constructor() {
        // Initialize with empty array
        encryptedArray = new euint8[](0);
        sum = FHE.asEuint16(0);
        isEven = FHE.asEbool(true);
    }
    
    // Add encrypted value to array
    function addToArray(uint8 value) external {
        euint8 encryptedValue = FHE.asEuint8(value);
        encryptedArray.push(encryptedValue);
    }
    
    // Calculate sum of all array elements
    function calculateSum() external {
        euint16 currentSum = FHE.asEuint16(0);
        
        for (uint i = 0; i < encryptedArray.length; i++) {
            currentSum = FHE.add(currentSum, FHE.asEuint16(encryptedArray[i]));
        }
        
        sum = currentSum;
    }
    
    // Check if sum is even
    function checkIfEven() external {
        // For FHE, we'll use a different approach to check if even
        // We'll check if the last bit is 0 (even) or 1 (odd)
        euint16 one = FHE.asEuint16(1);
        euint16 bitwiseAnd = FHE.and(sum, one);
        euint16 zero = FHE.asEuint16(0);
        
        isEven = FHE.eq(bitwiseAnd, zero);
    }
    
    // Find maximum value in array
    function findMax() external returns (euint8) {
        if (encryptedArray.length == 0) {
            return FHE.asEuint8(0);
        }
        
        euint8 maxValue = encryptedArray[0];
        
        for (uint i = 1; i < encryptedArray.length; i++) {
            ebool isGreater = FHE.gt(encryptedArray[i], maxValue);
            maxValue = FHE.select(isGreater, encryptedArray[i], maxValue);
        }
        
        return maxValue;
    }
    
    // Count elements greater than threshold
    function countGreaterThan(uint8 threshold) external returns (euint8) {
        euint8 count = FHE.asEuint8(0);
        euint8 encryptedThreshold = FHE.asEuint8(threshold);
        euint8 one = FHE.asEuint8(1);
        
        for (uint i = 0; i < encryptedArray.length; i++) {
            ebool isGreater = FHE.gt(encryptedArray[i], encryptedThreshold);
            count = FHE.add(count, FHE.select(isGreater, one, FHE.asEuint8(0)));
        }
        
        return count;
    }
    
    // Get array length
    function getArrayLength() external view returns (uint256) {
        return encryptedArray.length;
    }
    
    // Get sum (encrypted)
    function getSum() external view returns (euint16) {
        return sum;
    }
    
    // Get isEven flag (encrypted)
    function getIsEven() external view returns (ebool) {
        return isEven;
    }
    
    // Clear array
    function clearArray() external {
        delete encryptedArray;
        sum = FHE.asEuint16(0);
        isEven = FHE.asEbool(true);
    }
    
    // Batch operations - add multiple values at once
    function batchAdd(uint8[] calldata values) external {
        for (uint i = 0; i < values.length; i++) {
            euint8 encryptedValue = FHE.asEuint8(values[i]);
            encryptedArray.push(encryptedValue);
        }
    }
    
    // Check if array contains specific value
    function contains(uint8 value) external returns (ebool) {
        euint8 encryptedValue = FHE.asEuint8(value);
        ebool found = FHE.asEbool(false);
        
        for (uint i = 0; i < encryptedArray.length; i++) {
            ebool isEqual = FHE.eq(encryptedArray[i], encryptedValue);
            found = FHE.or(found, isEqual);
        }
        
        return found;
    }
}
