const Peer = window.Peer;

(async function main() {
  const localVideo = document.getElementById('local-stream-video');
  const localVideoTrigger = document.getElementById('check-video');
  const localAudioTrigger = document.getElementById('check-audio');
  const joinTrigger = document.getElementById('join-button');
  const leaveTrigger = document.getElementById('leave-button');
  const remoteVideos = document.getElementById('remote-streams');
  const roomId = document.getElementById('room-id');
  const localText = document.getElementById('js-local-text');
  const sendTrigger = document.getElementById('js-send-trigger');
  const messages = document.getElementById('js-messages');

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);

  localVideo.muted = false;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

  const peer = (window.peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  }));

  localVideoTrigger.addEventListener('click', () => {
    localStream.getVideoTracks()[0].enabled = localVideoTrigger.checked
  });

  localAudioTrigger.addEventListener('click', () => {
    localStream.getAudioTracks()[0].enabled = localAudioTrigger.checked
  });

  joinTrigger.addEventListener('click', () => {
    if (!peer.open) {
      return;
    }

    const room = peer.joinRoom(roomId.value, {
      mode: 'sfu',
      stream: localStream,
    });

    room.once('open', () => {
      messages.textContent += '=== You joined ===\n';
    });
    room.on('peerJoin', peerId => {
      messages.textContent += `=== ${peerId} joined ===\n`;
    });

    room.on('stream', async stream => {
      const newVideoContainer = document.createElement('div');
      newVideoContainer.className = 'video-container';
      const newVideo = document.createElement('video');
      newVideo.className = 'stream-video';
      newVideo.srcObject = stream;
      newVideo.playsInline = true;
      newVideo.setAttribute('data-peer-id', stream.peerId);
      newVideoContainer.append(newVideo);
      remoteVideos.append(newVideoContainer);

      await newVideo.play().catch(console.error);
    });

    room.on('data', ({ data, src }) => {
      messages.textContent += `${src}: ${data}\n`;
    });

    room.on('peerLeave', peerId => {
      const remoteVideo = remoteVideos.querySelector(
        `[data-peer-id="${peerId}"]`
      );
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();

      messages.textContent += `=== ${peerId} left ===\n`;
    });

    room.once('close', () => {
      sendTrigger.removeEventListener('click', onClickSend);
      messages.textContent += '== You left ===\n';
      Array.from(remoteVideos.children).forEach(remoteVideo => {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
        remoteVideo.remove();
      });
    });

    sendTrigger.addEventListener('click', onClickSend);
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });

    function onClickSend() {
      room.send(localText.value);
      messages.textContent += `${peer.id}: ${localText.value}\n`;
      localText.value = '';
    }
  });

  peer.on('error', console.error);
})();