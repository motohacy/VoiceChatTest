const Peer = window.Peer;

(async function main() {
  const localVideo = document.getElementById('local-stream-video');
  const localVideoTrigger = document.getElementById('check-video');
  const localAudioTrigger = document.getElementById('check-audio');
  const joinTrigger = document.getElementById('join-button');
  const leaveTrigger = document.getElementById('leave-button');
  const remoteVideos = document.getElementById('remote-streams');
  const roomId = document.getElementById('room-id');
  const displayName = document.getElementById('display-name');
  const localText = document.getElementById('local-text');
  const sendTrigger = document.getElementById('send-button');
  const messages = document.getElementById('messages');

  var hasWebCam;
  await navigator.mediaDevices.enumerateDevices().then(devices => {
    hasWebCam = devices.some(device => 'videoinput' === device.kind);
    console.log("hasWebCam", hasWebCam);
  });

  if(!hasWebCam) {
    localVideoTrigger.enabled = false;
    localVideoTrigger.disabled = true;
  }

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: hasWebCam,
    })
    .catch(console.error);

  localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

  var credential = getCredential();
  console.log("credential",credential);

  const peer = (window.peer = new Peer(credential.peerId, {
    key: window.__SKYWAY_KEY__,
    debug: 3,
    credential: credential,
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
      room.send(new Message(MessageType.notify_name, displayName.value).toJson());
      roomId.disabled = true;
      displayName.disabled = true;
      joinTrigger.disabled = true;
      leaveTrigger.disabled = false;
    });

    room.on('peerJoin', peerId => {
      messages.textContent += `=== ${peerId} joined ===\n`;
    });

    room.on('stream', async stream => {
      room.send(new Message(MessageType.notify_name, displayName.value).toJson());

      const newVideoContainer = document.createElement('div');
      newVideoContainer.className = 'video-container';
      const newVideoInfo = document.createElement('div');
      newVideoInfo.className = 'video-info';
      const newVideoInfoSpan = document.createElement('span');
      newVideoInfoSpan.className = 'video-info-span';
      newVideoInfoSpan.id = 'info-peer-id-' + stream.peerId;
      newVideoInfo.append(newVideoInfoSpan);
      const newVideo = document.createElement('video');
      newVideo.className = 'stream-video';
      newVideo.srcObject = stream;
      newVideo.playsInline = true;
      newVideo.setAttribute('data-peer-id', stream.peerId);
      newVideoContainer.append(newVideo);
      newVideoContainer.append(newVideoInfo);
      remoteVideos.append(newVideoContainer);

      await newVideo.play().catch(console.error);
    });

    room.on('data', ({ data, src }) => {

      try{
        var message = JSON.parse(data);

        switch (message.type) {
          case MessageType.notify_name:
            console.log('onMessageType.notify_name');
            setTimeout(() => {
              var name = document.getElementById('info-peer-id-' + src);
              name.textContent = message.data + '　';
            }, 3000);
          break;

          case MessageType.chat:
            messages.textContent += `${src}: ${message.data}\n`;
          break;

          default:
            messages.textContent += `${src}: Unknown message type.\n`;
       }
      }catch(e){
        messages.textContent += `${src}: An error occurred while decrypting the message.\n`;
        messages.textContent += `${src}: ${data}\n`;
      }
    });

    room.on('peerLeave', peerId => {
      const remoteVideo = remoteVideos.querySelector(
        `[data-peer-id="${peerId}"]`
      );
      const remoteVideoContainer = remoteVideo.parentNode;
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();
      remoteVideoContainer.remove();

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
    leaveTrigger.addEventListener('click', leaveRoom , { once: true });

    function onClickSend() {
      room.send(new Message(MessageType.chat, localText.value).toJson());
      messages.textContent += `${peer.id}: ${localText.value}\n`;
      localText.value = '';
    }

    function leaveRoom() {
      console.log("leaveRoom called.");
      room.close();
      roomId.disabled = false;
      displayName.disabled = false;
      joinTrigger.disabled = false;
      leaveTrigger.disabled = true;
      sendTrigger.disabled = true;
      messages.textContent = "";
      while( remoteVideos.firstChild ){
        remoteVideos.removeChild(remoteVideos.firstChild);
      }
    }
  });

  roomId.addEventListener('focusout', switchJoinTrigger);
  roomId.addEventListener('input', switchJoinTrigger);
  displayName.addEventListener('focusout', switchJoinTrigger);
  displayName.addEventListener('input', switchJoinTrigger);
  function switchJoinTrigger() {
      if((roomId.value) && (displayName.value)) {
        joinTrigger.disabled = false;
      } else {
        joinTrigger.disabled = true;
      }
  }

  peer.on('error', console.error);
})();