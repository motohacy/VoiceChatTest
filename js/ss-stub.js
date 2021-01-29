// SSのStub

function getCredential() {

    // 当処理はSS側で実装し、API経由でクレデンシャルを生成する

    const secretKey = 'nekUoG9BNnQke94L3trTIkKWdXdscPzZ';
    const credentialTtl = 3600;

    // 現在のUNIXタイムスタンプ（秒）
    const unixTimestamp = Math.floor(Date.now() / 1000) - 10;

    // 本実装する際はuser_tokenか、tenantId,sessionId,roomSessionId等を使って重複しない値を設定する
    const peerId = unixTimestamp.toString();
    //var peerId = 'TestPeerID';
    const authToken = generateAuthToken(peerId, unixTimestamp, credentialTtl, secretKey);

    const credential = {
      peerId: peerId,
      timestamp: unixTimestamp,
      ttl: credentialTtl,
      authToken: authToken
    };
    return credential;
}

function generateAuthToken(peerId, unixTimestamp, credentialTtl, secretKey) {
    const hash = CryptoJS.HmacSHA256(`${unixTimestamp}:${credentialTtl}:${peerId}`, secretKey);
    return CryptoJS.enc.Base64.stringify(hash);
}